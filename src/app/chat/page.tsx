"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { Loading, Skeleton } from "@/components/ui/Loading";
import { api, type OllamaModel, type ChatMessage } from "@/lib/api";

export default function ChatPage() {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [params, setParams] = useState({
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    repeat_penalty: 1.1,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].name);
    }
  }, [models, selectedModel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  async function handleSend() {
    if (!input.trim() || !selectedModel || sending) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const response = await api.chat.completions(
        selectedModel,
        [...messages, userMessage],
        params
      );
      setMessages((prev) => [...prev, response.message]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: Failed to get response" },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

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
          <h1 className="text-2xl font-bold text-[#fafafa]">Chat</h1>
          <p className="text-sm text-[#a1a1a1]">Test your models</p>
        </div>
        <Select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          options={models.map((m) => ({ value: m.name, label: m.name }))}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <Card className="lg:col-span-2 flex flex-col">
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#737373]">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8c2.12 0 4.117.783 5.646 2.072M12 7V1m0 0L8.5 4.5M12 7l3.5-3.5M8 7L4.5 3.5" />
                  </svg>
                  <p>Select a model and send a message</p>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-[#3b82f6] text-white"
                        : "bg-[#262626] text-[#fafafa]"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-[#262626] rounded-lg px-4 py-2">
                  <Loading size="sm" text="Thinking..." />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-[#262626]">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 min-h-[44px] max-h-32"
                disabled={sending || !selectedModel}
              />
              <Button onClick={handleSend} disabled={sending || !input.trim() || !selectedModel}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <h3 className="font-medium text-[#fafafa] mb-4">Parameters</h3>
            <div className="space-y-4">
              <Slider
                label="Temperature"
                min={0}
                max={2}
                step={0.1}
                value={params.temperature}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setParams({ ...params, temperature: parseFloat(e.target.value) })}
              />
              <Slider
                label="Top P"
                min={0}
                max={1}
                step={0.05}
                value={params.top_p}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setParams({ ...params, top_p: parseFloat(e.target.value) })}
              />
              <Slider
                label="Top K"
                min={1}
                max={100}
                step={1}
                value={params.top_k}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setParams({ ...params, top_k: parseInt(e.target.value) })}
              />
              <Slider
                label="Repeat Penalty"
                min={0}
                max={2}
                step={0.1}
                value={params.repeat_penalty}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setParams({ ...params, repeat_penalty: parseFloat(e.target.value) })}
              />
            </div>
            <Button
              variant="ghost"
              className="w-full mt-6"
              onClick={() =>
                setParams({
                  temperature: 0.7,
                  top_p: 0.9,
                  top_k: 40,
                  repeat_penalty: 1.1,
                })
              }
            >
              Reset to defaults
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}