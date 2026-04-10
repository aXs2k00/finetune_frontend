"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Loading, Skeleton } from "@/components/ui/Loading";
import { api, type Modelfile } from "@/lib/api";

export default function ConfigPage() {
  const [modelfiles, setModelfiles] = useState<Modelfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedModelfile, setSelectedModelfile] = useState<Modelfile | null>(null);

  const [form, setForm] = useState({
    name: "",
    content: `FROM llama2

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40

SYSTEM """You are a helpful assistant."""`,
  });

  useEffect(() => {
    fetchModelfiles();
  }, []);

  async function fetchModelfiles() {
    try {
      const data = await api.modelfiles.list();
      setModelfiles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateModelfile() {
    if (!form.name || !form.content) return;
    try {
      await api.modelfiles.create({
        name: form.name,
        content: form.content,
      });
      await fetchModelfiles();
      setShowCreateModal(false);
      setForm({
        name: "",
        content: `FROM llama2

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40

SYSTEM """You are a helpful assistant."""`,
      });
    } catch (err) {
      console.error("Failed to create modelfile:", err);
    }
  }

  async function handleBuildModelfile(name: string) {
    try {
      await api.modelfiles.build(name);
      alert(`Model ${name} built successfully!`);
    } catch (err) {
      console.error("Failed to build modelfile:", err);
    }
  }

  async function handleDeleteModelfile(name: string) {
    if (!confirm(`Delete modelfile "${name}"?`)) return;
    try {
      await api.modelfiles.update(name, { name: "", content: "" } as any);
      await fetchModelfiles();
      setSelectedModelfile(null);
    } catch (err) {
      console.error("Failed to delete modelfile:", err);
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
          <h1 className="text-2xl font-bold text-[#fafafa]">Configuration</h1>
          <p className="text-sm text-[#a1a1a1]">Manage Modelfiles</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Modelfile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Modelfiles</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {modelfiles.length === 0 ? (
                <div className="p-5 text-center text-[#737373]">
                  No modelfiles created
                </div>
              ) : (
                <div className="divide-y divide-[#262626]">
                  {modelfiles.map((mf) => (
                    <div
                      key={mf.id}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#1a1a1a]"
                      onClick={() => setSelectedModelfile(mf)}
                    >
                      <div>
                        <p className="font-medium text-[#fafafa]">{mf.name}</p>
                        <p className="text-sm text-[#737373]">{mf.model_name || "llama2"}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuildModelfile(mf.name);
                        }}
                      >
                        Build
                      </Button>
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
              <CardTitle>Editor</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedModelfile ? (
                <div className="space-y-4">
                  <p className="font-medium text-[#fafafa]">{selectedModelfile.name}</p>
                  <Textarea
                    value={selectedModelfile.content}
                    onChange={(e) =>
                      setSelectedModelfile({
                        ...selectedModelfile,
                        content: e.target.value,
                      })
                    }
                    className="font-mono text-sm min-h-[300px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleBuildModelfile(selectedModelfile.name)}
                    >
                      Build Model
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteModelfile(selectedModelfile.name)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#737373]">Select a modelfile to edit</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>Create Modelfile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  label="Name"
                  placeholder="my-custom-model"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Textarea
                  label="Content"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="font-mono text-sm min-h-[200px]"
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
                  onClick={handleCreateModelfile}
                  disabled={!form.name || !form.content}
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