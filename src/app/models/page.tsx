"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loading, Skeleton } from "@/components/ui/Loading";
import { api, type OllamaModel } from "@/lib/api";

interface LibraryModel {
  name: string;
  size: number;
  pulls: number;
  description?: string;
}

interface LibraryResponse {
  models: LibraryModel[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function ModelsPage() {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [libraryModels, setLibraryModels] = useState<LibraryModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [pulling, setPulling] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [confirmDownload, setConfirmDownload] = useState<string | null>(null);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchModels();
    fetchLibraryModels();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  async function fetchLibraryModels() {
    try {
      const response = await fetch("https://ollama.com/api/library.json");
      if (response.ok) {
        const data: LibraryResponse = await response.json();
        setLibraryModels(data.models || []);
      }
    } catch (err) {
      console.error("Failed to fetch library models:", err);
    }
  }

  async function handlePullModel(name: string) {
    setPulling(name);
    setShowDropdown(false);
    setSearchQuery("");
    setConfirmDownload(null);
    try {
      await api.models.pull(name);
      await fetchModels();
    } catch (err) {
      console.error("Failed to pull model:", err);
    } finally {
      setPulling(null);
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

  const installedModelNames = new Set(models.map((m) => m.name));

  const localMatches = models.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const libraryMatches = libraryModels
    .filter(
      (m) =>
        !installedModelNames.has(m.name) &&
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 10);

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
      </div>

      <div className="mb-4 relative" ref={dropdownRef}>
        <Input
          placeholder="Search installed models or search library..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          className="max-w-md"
        />

        {showDropdown && searchQuery && (
          <div className="absolute z-50 w-full max-w-md mt-1 bg-[#1a1a1a] border border-[#333333] rounded-lg shadow-lg max-h-80 overflow-auto">
            {localMatches.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs text-[#737373] border-b border-[#262626]">
                  INSTALLED
                </div>
                {localMatches.map((model) => (
                  <div
                    key={model.name}
                    className="px-3 py-2 hover:bg-[#262626] cursor-pointer flex items-center justify-between"
                    onClick={() => {
                      setSearchQuery(model.name);
                      setShowDropdown(false);
                    }}
                  >
                    <span className="text-sm text-[#fafafa]">{model.name}</span>
                    <Badge variant="success">Installed</Badge>
                  </div>
                ))}
              </>
            )}
            {libraryMatches.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs text-[#737373] border-b border-[#262626]">
                  AVAILABLE FOR DOWNLOAD
                </div>
                {libraryMatches.map((model) => (
                  <div
                    key={model.name}
                    className="px-3 py-2 hover:bg-[#262626] cursor-pointer flex items-center justify-between"
                    onClick={() => setConfirmDownload(model.name)}
                  >
                    <div>
                      <span className="text-sm text-[#fafafa]">{model.name}</span>
                      <span className="text-xs text-[#737373] ml-2">{formatBytes(model.size)}</span>
                    </div>
                    <Button size="sm" variant="ghost">
                      Download
                    </Button>
                  </div>
                ))}
              </>
            )}
            {localMatches.length === 0 && libraryMatches.length === 0 && searchQuery && (
              <div className="px-3 py-4 text-sm text-[#737373] text-center">
                No models found
              </div>
            )}
          </div>
        )}
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

      {localMatches.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-[#a1a1a1]">No models installed</p>
            <p className="text-sm text-[#737373] mt-2">Type to search for models to download</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {localMatches.map((model) => (
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

      {confirmDownload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm mx-4">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-[#fafafa] mb-2">Download Model</h3>
              <p className="text-sm text-[#a1a1a1] mb-4">
                Are you sure you want to download "{confirmDownload}"?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setConfirmDownload(null)}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={() => handlePullModel(confirmDownload)}>
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}