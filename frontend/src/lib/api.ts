import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { AnalysisRequest, FullAnalysisResponse, ChatMessage } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pes_token');
}

function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pes_session_id');
}

const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pes_token');
      localStorage.removeItem('pes_session_id');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(password: string): Promise<{ access_token: string; expires_in: number }> {
  const { data } = await api.post('/auth/login', { password });
  return data;
}

// ── Analysis ──────────────────────────────────────────────────────────────────

export async function runAnalysis(request: AnalysisRequest): Promise<FullAnalysisResponse> {
  const { data } = await api.post('/analysis/run', request);
  return data;
}

export async function getCachedAnalysis(): Promise<FullAnalysisResponse | null> {
  try {
    const { data } = await api.get('/analysis/result');
    return data;
  } catch {
    return null;
  }
}

export async function getAnalysisStatus(sessionId: string): Promise<{ status: string; has_analysis: boolean }> {
  const { data } = await api.get(`/analysis/status/${sessionId}`);
  return data;
}

export async function clearAnalysis(): Promise<void> {
  await api.delete('/analysis/clear');
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export function streamChatMessage(
  sessionId: string,
  message: string,
  token: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: string) => void
): () => void {
  const controller = new AbortController();

  fetch(`${BASE_URL}/api/v1/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ session_id: sessionId, message }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const payload = line.slice(6);
            if (payload === '[DONE]') {
              onDone();
              return;
            }
            if (payload.startsWith('[ERROR]')) {
              onError(payload.slice(7));
              return;
            }
            onChunk(payload);
          }
        }
      }
      onDone();
    })
    .catch((err) => {
      if (err.name !== 'AbortError') onError(err.message);
    });

  return () => controller.abort();
}

export async function getChatHistory(): Promise<ChatMessage[]> {
  const { data } = await api.get('/chat/history');
  return data.messages || [];
}

export async function clearChatHistory(): Promise<void> {
  await api.delete('/chat/history');
}

export async function getQuickInsight(topic: string): Promise<string> {
  const { data } = await api.post(`/chat/quick-insight?topic=${topic}`);
  return data.insight;
}

// ── Alerts ────────────────────────────────────────────────────────────────────

export async function getAlerts(severity?: string): Promise<unknown[]> {
  const params = severity ? `?severity=${severity}` : '';
  const { data } = await api.get(`/alerts/${params}`);
  return data;
}

export async function detectNewAlerts(): Promise<{ alerts: unknown[]; count: number }> {
  const { data } = await api.post('/alerts/detect');
  return data;
}

export async function getAlertCount(): Promise<Record<string, number>> {
  const { data } = await api.get('/alerts/count');
  return data;
}

// ── Export ────────────────────────────────────────────────────────────────────

export async function exportPDF(sessionId: string): Promise<void> {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/api/v1/export/pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ session_id: sessionId, format: 'pdf' }),
  });
  if (!response.ok) throw new Error('PDF export failed');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pes_intel_${new Date().toISOString().slice(0, 10)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportExcel(sessionId: string): Promise<void> {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/api/v1/export/excel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ session_id: sessionId, format: 'excel' }),
  });
  if (!response.ok) throw new Error('Excel export failed');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pes_intel_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
