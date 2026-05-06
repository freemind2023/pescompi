'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FullAnalysisResponse, ChatMessage, DateRange } from '@/types';

interface AuthStore {
  token: string | null;
  sessionId: string | null;
  setAuth: (token: string, sessionId: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      sessionId: null,
      setAuth: (token, sessionId) => set({ token, sessionId }),
      clearAuth: () => set({ token: null, sessionId: null }),
      isAuthenticated: () => {
        const { token } = get();
        if (!token) return false;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.exp * 1000 > Date.now();
        } catch {
          return false;
        }
      },
    }),
    { name: 'pes-auth' }
  )
);

interface AnalysisStore {
  analysis: FullAnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
  dateRange: DateRange;
  lastUpdated: string | null;
  setAnalysis: (analysis: FullAnalysisResponse) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDateRange: (range: DateRange) => void;
  clearAnalysis: () => void;
}

export const useAnalysisStore = create<AnalysisStore>()((set) => ({
  analysis: null,
  isLoading: false,
  error: null,
  dateRange: 'today',
  lastUpdated: null,
  setAnalysis: (analysis) => set({ analysis, lastUpdated: new Date().toISOString(), error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  setDateRange: (dateRange) => set({ dateRange }),
  clearAnalysis: () => set({ analysis: null, lastUpdated: null, error: null }),
}));

interface ChatStore {
  messages: ChatMessage[];
  isStreaming: boolean;
  addMessage: (message: ChatMessage) => void;
  appendToLastMessage: (chunk: string) => void;
  setStreaming: (streaming: boolean) => void;
  clearMessages: () => void;
  startAssistantMessage: () => void;
}

export const useChatStore = create<ChatStore>()((set) => ({
  messages: [],
  isStreaming: false,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  appendToLastMessage: (chunk) =>
    set((state) => {
      const msgs = [...state.messages];
      if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
        msgs[msgs.length - 1] = {
          ...msgs[msgs.length - 1],
          content: msgs[msgs.length - 1].content + chunk,
        };
      }
      return { messages: msgs };
    }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  clearMessages: () => set({ messages: [] }),
  startAssistantMessage: () =>
    set((state) => ({
      messages: [
        ...state.messages,
        { role: 'assistant', content: '', timestamp: new Date().toISOString() },
      ],
    })),
}));

interface AlertStore {
  alerts: unknown[];
  unreadCount: number;
  setAlerts: (alerts: unknown[]) => void;
  markAllRead: () => void;
}

export const useAlertStore = create<AlertStore>()((set) => ({
  alerts: [],
  unreadCount: 0,
  setAlerts: (alerts) => set({ alerts, unreadCount: alerts.length }),
  markAllRead: () => set({ unreadCount: 0 }),
}));
