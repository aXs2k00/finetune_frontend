"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Loading, Skeleton } from "@/components/ui/Loading";
import { api, type OllamaModel, type SystemStats, type FineTuneJob } from "@/lib/api";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function Dashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [jobs, setJobs] = useState<FineTuneJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, modelsData, jobsData] = await Promise.all([
          api.system.stats().catch(() => null),
          api.models.list().catch(() => []),
          api.finetune.jobs.list().catch(() => []),
        ]);
        setStats(statsData);
        setModels(modelsData);
        setJobs(jobsData);
      } catch (err) {
        setError("Failed to connect to backend");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#ef4444]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#fafafa] mb-2">Connection Error</h3>
              <p className="text-sm text-[#a1a1a1] mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalModelSize = models.reduce((acc, m) => acc + m.size, 0);
  const activeJobs = jobs.filter((j) => j.status === "running").length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#fafafa]">Dashboard</h1>
        <p className="text-sm text-[#a1a1a1]">Overview of your Ollama models and system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#a1a1a1]">Installed Models</p>
                <p className="text-2xl font-bold text-[#fafafa] mt-1">{models.length}</p>
              </div>
              <div className="w-10 h-10 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#a1a1a1]">Total Size</p>
                <p className="text-2xl font-bold text-[#fafafa] mt-1">{formatBytes(totalModelSize)}</p>
              </div>
              <div className="w-10 h-10 bg-[#22c55e]/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#a1a1a1]">CPU Usage</p>
                <p className="text-2xl font-bold text-[#fafafa] mt-1">
                  {stats?.cpu_percent ? `${stats.cpu_percent.toFixed(1)}%` : "—"}
                </p>
              </div>
              <div className="w-10 h-10 bg-[#f59e0b]/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#a1a1a1]">Memory</p>
                <p className="text-2xl font-bold text-[#fafafa] mt-1">
                  {stats?.memory_total && stats?.memory_used
                    ? `${formatBytes(stats.memory_used)} / ${formatBytes(stats.memory_total)}`
                    : "—"}
                </p>
              </div>
              <div className="w-10 h-10 bg-[#8b5cf6]/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Models</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {models.length === 0 ? (
              <div className="p-5 text-center text-sm text-[#737373]">
                No models installed
              </div>
            ) : (
              <div className="divide-y divide-[#262626]">
                {models.slice(0, 5).map((model) => (
                  <div key={model.name} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#262626] rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#a1a1a1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#fafafa]">{model.name}</p>
                        <p className="text-xs text-[#737373]">{formatBytes(model.size)}</p>
                      </div>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fine-tuning Jobs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {jobs.length === 0 ? (
              <div className="p-5 text-center text-sm text-[#737373]">
                No fine-tuning jobs
              </div>
            ) : (
              <div className="divide-y divide-[#262626]">
                {jobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#fafafa]">{job.name}</p>
                      <p className="text-xs text-[#737373]">{job.base_model}</p>
                    </div>
                    <div className="text-right">
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
                        <p className="text-xs text-[#737373] mt-1">{job.progress.toFixed(0)}%</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}