"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loading, Skeleton } from "@/components/ui/Loading";
import { api, type OllamaModel } from "@/lib/api";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function ModelsPage() {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [pulling, setPulling] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pullModelName, setPullModelName] = useState("");
  const [showPullModal, setShowPullModal] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

  async function fetchModels() {
    try {
      const data = await api.models.list();
      setModels(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePullModel() {
    if (!pullModelName.trim()) return;
    setPulling(pullModelName);
    setShowPullModal(false);
    try {
      await api.models.pull(pullModelName);
      await fetchModels();
    } catch (err) {
      console.error("Failed to pull model:", err);
    } finally {
      setPulling(null);
      setPullModelName("");
    }
  }

  async function handleDeleteModel(name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.models.delete(name);
      await fetchModels();
    } catch (err) {
      console.error("Failed to delete model:", err);
    }
  }

  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#fafafa]">Models</h1>
          <p className="text-sm text-[#a1a1a1]">Manage installed Ollama models</p>
        </div>
        <Button onClick={() => setShowPullModal(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Pull Model
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {pulling && (
        <Card className="mb-4 border-[#3b82f6]">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <Loading size="sm" />
              <span className="text-sm text-[#a1a1a1]">Pulling {pulling}...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredModels.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-[#a1a1a1]">No models found</p>
            <Button className="mt-4" onClick={() => setShowPullModal(true)}>
              Pull your first model
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map((model) => (
            <Card key={model.name}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#262626] rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#a1a1a1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-[#fafafa]">{model.name}</p>
                      <p className="text-sm text-[#737373]">{formatBytes(model.size)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#737373]">
                  {model.modified_at && (
                    <span>Modified: {new Date(model.modified_at).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-[#ef4444]"
                    onClick={() => handleDeleteModel(model.name)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showPullModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-[#fafafa] mb-4">Pull Model</h3>
              <Input
                label="Model name"
                placeholder="e.g., llama2, codellama, mistral"
                value={pullModelName}
                onChange={(e) => setPullModelName(e.target.value)}
              />
              <p className="text-xs text-[#737373] mt-2">
                Enter the model name from the Ollama library
              </p>
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" className="flex-1" onClick={() => setShowPullModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handlePullModel} disabled={!pullModelName.trim()}>
                  Pull
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}