"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Loading, Skeleton } from "@/components/ui/Loading";
import { api, type MetasploitSession, type MetasploitModule, type TaskStep } from "@/lib/api";

interface FeedItem {
  type: string;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

type TabType = "sessions" | "modules" | "mission";

export default function OpsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("sessions");
  const [msfConnected, setMsfConnected] = useState(false);
  const [sessions, setSessions] = useState<MetasploitSession[]>([]);
  const [modules, setModules] = useState<MetasploitModule[]>([]);
  const [moduleSearch, setModuleSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [missionObjective, setMissionObjective] = useState("");
  const [missionTarget, setMissionTarget] = useState("");
  const [missionPlan, setMissionPlan] = useState<TaskStep[]>([]);
  const [missionLoading, setMissionLoading] = useState(false);
  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStatus();
    const ws = new WebSocket(`ws://${typeof window !== "undefined" ? window.location.host : "localhost:3000"}/api/msf/ws/feed`);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setFeed((prev) => [...prev.slice(-99), {
          type: data.type || "info",
          message: data.message || JSON.stringify(data),
          timestamp: data.timestamp || Date.now() / 1000,
        }]);
      } catch {
        setFeed((prev) => [...prev.slice(-99), {
          type: "info",
          message: event.data,
          timestamp: Date.now() / 1000,
        }]);
      }
    };
    
    return () => ws.close();
  }, []);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [feed]);

  async function fetchStatus() {
    try {
      const status = await api.msf.status();
      setMsfConnected(status.connected);
      if (status.connected) {
        const [sessData, modData] = await Promise.all([
          api.msf.sessions.list(),
          api.msf.modules.list("exploit"),
        ]);
        setSessions(sessData);
        setModules(modData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    try {
      await api.msf.connect();
      setMsfConnected(true);
      fetchStatus();
      setFeed((prev) => [...prev, {
        type: "connected",
        message: "Connected to Metasploit",
        timestamp: Date.now() / 1000,
      }]);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRunModule(moduleName: string, target: string) {
    setFeed((prev) => [...prev, {
      type: "module_start",
      message: `Running ${moduleName} on ${target}`,
      timestamp: Date.now() / 1000,
    }]);
    try {
      await api.msf.modules.run(moduleName, target, {});
      setFeed((prev) => [...prev, {
        type: "module_complete",
        message: `Module ${moduleName} executed`,
        timestamp: Date.now() / 1000,
      }]);
    } catch (err) {
      setFeed((prev) => [...prev, {
        type: "error",
        message: `Failed: ${err}`,
        timestamp: Date.now() / 1000,
      }]);
    }
  }

  async function handleMissionPlan() {
    if (!missionObjective || !missionTarget) return;
    setMissionLoading(true);
    try {
      const plan = await api.mission.plan(missionObjective, missionTarget);
      setMissionPlan(plan.phases);
      setFeed((prev) => [...prev, {
        type: "mission_created",
        message: `Mission plan created for ${missionObjective}`,
        timestamp: Date.now() / 1000,
      }]);
    } catch (err) {
      console.error(err);
    } finally {
      setMissionLoading(false);
    }
  }

  async function handleExecuteTask(task: TaskStep, index: number) {
    if (!task.module || !missionTarget) return;
    setFeed((prev) => [...prev, {
      type: "task_start",
      message: `Step ${index + 1}: ${task.description}`,
      timestamp: Date.now() / 1000,
    }]);
    try {
      await api.msf.modules.run(task.module, missionTarget, task.parameters);
      setFeed((prev) => [...prev, {
        type: "task_complete",
        message: `Step ${index + 1} completed`,
        timestamp: Date.now() / 1000,
      }]);
    } catch (err) {
      setFeed((prev) => [...prev, {
        type: "error",
        message: `Step ${index + 1} failed: ${err}`,
        timestamp: Date.now() / 1000,
      }]);
    }
  }

  const filteredModules = moduleSearch
    ? modules.filter((m) => 
        m.name.toLowerCase().includes(moduleSearch.toLowerCase()) ||
        m.description.toLowerCase().includes(moduleSearch.toLowerCase())
      )
    : modules.slice(0, 50);

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#fafafa]">GasTown Ops</h1>
          <p className="text-sm text-[#a1a1a1]">Unified operator dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${msfConnected ? "bg-[#22c55e]" : "bg-[#ef4444]"}`} />
          <span className="text-sm text-[#a1a1a1]">
            {msfConnected ? "Metasploit Connected" : "Metasploit Offline"}
          </span>
          {!msfConnected && (
            <Button onClick={handleConnect} size="sm">
              Connect
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          <div className="flex gap-2 border-b border-[#262626]">
            {(["sessions", "modules", "mission"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? "text-[#3b82f6] border-b-2 border-[#3b82f6]"
                    : "text-[#a1a1a1] hover:text-[#fafafa]"
                }`}
              >
                {tab === "mission" ? "Mission Launcher" : tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto">
            {activeTab === "sessions" && (
              <Card>
                <CardContent className="pt-5">
                  <h3 className="font-medium text-[#fafafa] mb-4">Active Sessions</h3>
                  {sessions.length === 0 ? (
                    <p className="text-sm text-[#737373]">No active sessions</p>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map((sess) => (
                        <div key={sess.id} className="p-3 bg-[#1a1a1a] rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-[#fafafa]">
                                Session {sess.id} - {sess.type}
                              </p>
                              <p className="text-xs text-[#737373]">
                                {sess.target} | {sess.exploit}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => api.msf.sessions.kill(sess.id)}
                            >
                              Kill
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "modules" && (
              <Card className="flex flex-col">
                <CardContent className="pt-5 flex-1">
                  <div className="mb-4">
                    <Input
                      placeholder="Search modules..."
                      value={moduleSearch}
                      onChange={(e) => setModuleSearch(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 overflow-auto max-h-[400px]">
                    {filteredModules.map((mod) => (
                      <div key={mod.name} className="p-3 bg-[#1a1a1a] rounded-lg flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#fafafa] truncate">{mod.name}</p>
                          <p className="text-xs text-[#737373] truncate">{mod.description}</p>
                        </div>
                        <Button
                          size="sm"
                          className="ml-2 shrink-0"
                          onClick={() => handleRunModule(mod.name, missionTarget || "localhost")}
                        >
                          Exploit
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "mission" && (
              <Card>
                <CardContent className="pt-5">
                  <h3 className="font-medium text-[#fafafa] mb-4">Mission Launcher</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-[#a1a1a1] block mb-2">Pentest Objective</label>
                      <Textarea
                        placeholder="e.g., Assess the security of the web server..."
                        value={missionObjective}
                        onChange={(e) => setMissionObjective(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[#a1a1a1] block mb-2">Target</label>
                      <Input
                        placeholder="e.g., 192.168.1.100"
                        value={missionTarget}
                        onChange={(e) => setMissionTarget(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleMissionPlan}
                      disabled={!missionObjective || !missionTarget || missionLoading}
                    >
                      {missionLoading ? "Decomposing..." : "Generate Plan"}
                    </Button>

                    {missionPlan.length > 0 && (
                      <div className="mt-6 space-y-2">
                        <h4 className="text-sm font-medium text-[#fafafa]">Mission Plan</h4>
                        {missionPlan.map((task, i) => (
                          <div
                            key={i}
                            className="p-3 bg-[#1a1a1a] rounded-lg flex items-center justify-between"
                          >
                            <div>
                              <p className="text-sm text-[#fafafa]">
                                Step {task.step}: {task.description}
                              </p>
                              {task.module && (
                                <p className="text-xs text-[#737373]">{task.module}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={task.safety_level === "low" ? "success" : "warning"}>
                                {task.safety_level}
                              </Badge>
                              <Button
                                size="sm"
                                onClick={() => handleExecuteTask(task, i)}
                              >
                                Run
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Card className="flex flex-col min-h-0">
          <CardHeader>
            <CardTitle className="text-base">Agent Feed</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden pt-0">
            <div className="h-full overflow-auto space-y-2 font-mono text-xs">
              {feed.length === 0 ? (
                <p className="text-[#737373]">Waiting for activity...</p>
              ) : (
                feed.map((item, i) => (
                  <div key={i} className="p-2 bg-[#1a1a1a] rounded">
                    <span className="text-[#737373]">
                      [{new Date(item.timestamp * 1000).toLocaleTimeString()}]
                    </span>{" "}
                    <span
                      className={
                        item.type === "error"
                          ? "text-[#ef4444]"
                          : item.type === "connected"
                          ? "text-[#22c55e]"
                          : item.type === "module_complete" || item.type === "task_complete"
                          ? "text-[#3b82f6]"
                          : "text-[#a1a1a1]"
                      }
                    >
                      {item.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={feedEndRef} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}