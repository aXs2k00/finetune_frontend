const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string | null;
  digest: string | null;
}

export interface OllamaModelDetails {
  modelfile: string | null;
  parameters: string | null;
  template: string | null;
}

export interface ModelParams {
  temperature: number;
  top_p: number;
  top_k: number;
  repeat_penalty: number;
  context_length: number;
  stop: string[] | null;
}

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ChatCompletionResponse {
  model: string;
  message: ChatMessage;
  done: boolean;
}

export interface Modelfile {
  id: number;
  name: string;
  content: string;
  model_name: string | null;
  parameters: Record<string, unknown> | null;
  system_prompt: string | null;
  template: string | null;
  license: string | null;
  created_at: string;
  updated_at: string;
}

export interface FineTuneJob {
  id: number;
  name: string;
  base_model: string;
  dataset_name: string | null;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  epochs: number;
  learning_rate: number;
  batch_size: number;
  validation_split: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface Conversation {
  id: number;
  model_name: string;
  messages: ChatMessage[];
  title: string | null;
  created_at: string;
}

export interface SystemStats {
  ollama_connected: boolean;
  cpu_percent: number | null;
  memory_total: number | null;
  memory_used: number | null;
  gpu_available: boolean;
  gpu_info: unknown[] | null;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  
  return response.json();
}

export const api = {
  models: {
    list: () => fetchApi<OllamaModel[]>("/api/models"),
    get: (name: string) => fetchApi<OllamaModelDetails>(`/api/models/${name}`),
    pull: (name: string) => fetchApi<{ status: string; model: string }>("/api/models/pull", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
    delete: (name: string) => fetchApi<{ status: string; model: string }>(`/api/models/${name}`, {
      method: "DELETE",
    }),
  },

  modelfiles: {
    list: () => fetchApi<Modelfile[]>("/api/modelfiles"),
    get: (name: string) => fetchApi<Modelfile>(`/api/modelfiles/${name}`),
    create: (data: Partial<Modelfile>) => fetchApi<Modelfile>("/api/modelfiles/create", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    update: (name: string, data: Partial<Modelfile>) => fetchApi<Modelfile>(`/api/modelfiles/${name}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
    build: (name: string) => fetchApi<{ status: string; model: string }>(`/api/modelfiles/build`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  },

  chat: {
    completions: (model: string, messages: ChatMessage[], params?: Partial<ModelParams>) =>
      fetchApi<ChatCompletionResponse>("/api/chat/completions", {
        method: "POST",
        body: JSON.stringify({ model, messages, ...params }),
      }),
    conversations: {
      list: () => fetchApi<Conversation[]>("/api/chat/conversations"),
      get: (id: number) => fetchApi<Conversation>(`/api/chat/conversations/${id}`),
      create: (model_name: string, messages: ChatMessage[], title?: string) =>
        fetchApi<Conversation>("/api/chat/conversations", {
          method: "POST",
          body: JSON.stringify({ model_name, messages, title }),
        }),
      delete: (id: number) => fetchApi<{ status: string }>(`/api/chat/conversations/${id}`, {
        method: "DELETE",
      }),
    },
  },

  finetune: {
    jobs: {
      list: () => fetchApi<FineTuneJob[]>("/api/finetune/jobs"),
      get: (id: number) => fetchApi<FineTuneJob>(`/api/finetune/jobs/${id}`),
      create: (data: Partial<FineTuneJob>) => fetchApi<FineTuneJob>("/api/finetune/jobs", {
        method: "POST",
        body: JSON.stringify(data),
      }),
      start: (id: number) => fetchApi<{ status: string }>(`/api/finetune/jobs/${id}/start`, {
        method: "POST",
      }),
      cancel: (id: number) => fetchApi<{ status: string }>(`/api/finetune/jobs/${id}`, {
        method: "DELETE",
      }),
      logs: (id: number) => fetchApi<{ logs: string }>(`/api/finetune/jobs/${id}/logs`),
    },
  },

  system: {
    stats: () => fetchApi<SystemStats>("/api/system/stats"),
  },

  msf: {
    sessions: {
      list: () => fetchApi<MetasploitSession[]>("/api/msf/sessions"),
      get: (id: number) => fetchApi<MetasploitSession>(`/api/msf/sessions/${id}`),
      interact: (id: number, command: string) =>
        fetchApi<{ status: string }>(`/api/msf/sessions/${id}/interact`, {
          method: "POST",
          body: JSON.stringify({ session_id: id, command }),
        }),
      kill: (id: number) => fetchApi<{ status: string }>(`/api/msf/sessions/${id}`, {
        method: "DELETE",
      }),
    },
    modules: {
      list: (type: string = "exploit") =>
        fetchApi<MetasploitModule[]>(`/api/msf/modules?mtype=${type}`),
      search: (query: string, type: string = "exploit") =>
        fetchApi<MetasploitModule[]>(`/api/msf/modules/search?query=${query}&mtype=${type}`),
      run: (module: string, target: string, options: Record<string, string> = {}) =>
        fetchApi<{ status: string }>("/api/msf/modules/run", {
          method: "POST",
          body: JSON.stringify({ module, target, options }),
        }),
    },
    status: () => fetchApi<{ connected: boolean; host: string; port: number }>("/api/msf/status"),
    connect: () => fetchApi<{ status: string }>("/api/msf/connect", { method: "POST" }),
    disconnect: () => fetchApi<{ status: string }>("/api/msf/disconnect", { method: "POST" }),
  },

  mission: {
    plan: (objective: string, target: string) =>
      fetchApi<MissionPlan>("/api/mission/plan", {
        method: "POST",
        body: JSON.stringify({ objective, target }),
      }),
    templates: () =>
      fetchApi<{ templates: string[]; details: Record<string, { phases: number; estimated_duration: string }> }>(
        "/api/mission/templates"
      ),
    getTemplate: (name: string) =>
      fetchApi<MissionPlan>(`/api/mission/templates/${name}`),
  },
};

export interface MetasploitSession {
  id: number;
  type: string;
  target: string;
  exploit: string;
  payload: string;
  launched_at: number;
  last_seen: number;
}

export interface MetasploitModule {
  name: string;
  full_name: string;
  type: string;
  description: string;
}

export interface MissionPlan {
  mission_id: string;
  objective: string;
  target: string;
  phases: TaskStep[];
  estimated_duration: string;
  risk_assessment: string;
}

export interface TaskStep {
  step: number;
  phase: string;
  description: string;
  module?: string;
  parameters: Record<string, string>;
  expected_result?: string;
  safety_level: string;
}