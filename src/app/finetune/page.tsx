"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { Loading, Skeleton } from "@/components/ui/Loading";
import { api, type OllamaModel, type FineTuneJob } from "@/lib/api";

export default function FineTunePage() {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [jobs, setJobs] = useState<FineTuneJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<FineTuneJob | null>(null);
  const [logs, setLogs] = useState("");

  const [form, setForm] = useState({
    name: "",
    baseModel: "",
    epochs: 3,
    learningRate: 0.001,
    batchSize: 16,
    validationSplit: 0.1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedJob || selectedJob.status !== "running") return;
    
    const jobId = selectedJob.id;
    const interval = setInterval(async () => {
      try {
        const updatedJob = await api.finetune.jobs.get(jobId);
        const logsData = await api.finetune.jobs.logs(jobId);
        setJobs((prev) =>
          prev.map((j) => (j.id === updatedJob.id ? updatedJob : j))
        );
        setSelectedJob(updatedJob);
        setLogs(logsData.logs);
      } catch (err) {
        console.error(err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedJob]);

  async function fetchData() {
    try {
      const [modelsData, jobsData] = await Promise.all([
        api.models.list(),
        api.finetune.jobs.list(),
      ]);
      setModels(modelsData);
      setJobs(jobsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateJob() {
    if (!form.name || !form.baseModel) return;
    try {
      await api.finetune.jobs.create({
        name: form.name,
        base_model: form.baseModel,
        epochs: form.epochs,
        learning_rate: form.learningRate,
        batch_size: form.batchSize,
        validation_split: form.validationSplit,
      });
      await fetchData();
      setShowCreateModal(false);
      setForm({
        name: "",
        baseModel: "",
        epochs: 3,
        learningRate: 0.001,
        batchSize: 16,
        validationSplit: 0.1,
      });
    } catch (err) {
      console.error("Failed to create job:", err);
    }
  }

  async function handleStartJob(id: number) {
    try {
      await api.finetune.jobs.start(id);
      await fetchData();
    } catch (err) {
      console.error("Failed to start job:", err);
    }
  }

  async function handleCancelJob(id: number) {
    try {
      await api.finetune.jobs.cancel(id);
      await fetchData();
    } catch (err) {
      console.error("Failed to cancel job:", err);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#fafafa]">Fine-tuning</h1>
          <p className="text-sm text-[#a1a1a1]">Train custom models</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Job
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Jobs</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {jobs.length === 0 ? (
                <div className="p-5 text-center text-[#737373]">
                  No fine-tuning jobs
                </div>
              ) : (
                <div className="divide-y divide-[#262626]">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#1a1a1a]"
                      onClick={() => {
                        setSelectedJob(job);
                        api.finetune.jobs.logs(job.id).then((data) => setLogs(data.logs)).catch(() => setLogs(""));
                      }}
                    >
                      <div>
                        <p className="font-medium text-[#fafafa]">{job.name}</p>
                        <p className="text-sm text-[#737373]">{job.base_model}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            job.status === "completed"
                              ? "success"
                              : job.status === "running"
                              ? "info"
                              : job.status === "failed"
                              ? "error"
                              : "warning"
                          }
                        >
                          {job.status}
                        </Badge>
                        {job.status === "running" && (
                          <span className="text-sm text-[#737373]">
                            {job.progress.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedJob ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-[#737373]">Status</p>
                    <Badge
                      variant={
                        selectedJob.status === "completed"
                          ? "success"
                          : selectedJob.status === "running"
                          ? "info"
                          : selectedJob.status === "failed"
                          ? "error"
                          : "warning"
                      }
                    >
                      {selectedJob.status}
                    </Badge>
                  </div>
                  {selectedJob.status === "running" && (
                    <div>
                      <p className="text-sm text-[#737373] mb-2">Progress</p>
                      <div className="h-2 bg-[#262626] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#3b82f6] rounded-full transition-all"
                          style={{ width: `${selectedJob.progress}%` }}
                        />
                      </div>
                      <p className="text-sm text-[#a1a1a1] mt-1">
                        {selectedJob.progress.toFixed(1)}%
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-[#737373]">Base Model</p>
                    <p className="text-[#fafafa]">{selectedJob.base_model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#737373]">Epochs</p>
                    <p className="text-[#fafafa]">{selectedJob.epochs}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#737373]">Learning Rate</p>
                    <p className="text-[#fafafa]">{selectedJob.learning_rate}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    {selectedJob.status === "pending" && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleStartJob(selectedJob.id)}
                      >
                        Start
                      </Button>
                    )}
                    {selectedJob.status === "running" && (
                      <Button
                        variant="danger"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleCancelJob(selectedJob.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#737373]">Select a job to view details</p>
              )}
            </CardContent>
          </Card>

          {selectedJob && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-[#a1a1a1] whitespace-pre-wrap font-mono max-h-64 overflow-auto">
                  {logs || "No logs available"}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>Create Fine-tuning Job</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  label="Job Name"
                  placeholder="My fine-tuned model"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Select
                  label="Base Model"
                  value={form.baseModel}
                  onChange={(e) => setForm({ ...form, baseModel: e.target.value })}
                  options={models.map((m) => ({ value: m.name, label: m.name }))}
                />
                <Slider
                  label="Epochs"
                  min={1}
                  max={100}
                  step={1}
                  value={form.epochs}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, epochs: parseInt(e.target.value) })
                  }
                />
                <Slider
                  label="Learning Rate"
                  min={0.0001}
                  max={0.1}
                  step={0.0001}
                  value={form.learningRate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, learningRate: parseFloat(e.target.value) })
                  }
                />
                <Slider
                  label="Batch Size"
                  min={1}
                  max={512}
                  step={1}
                  value={form.batchSize}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, batchSize: parseInt(e.target.value) })
                  }
                />
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreateJob}
                  disabled={!form.name || !form.baseModel}
                >
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}