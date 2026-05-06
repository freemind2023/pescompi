'use client';
import { useCallback, useRef } from 'react';
import { useChatStore, useAuthStore } from '@/lib/store';
import { streamChatMessage, clearChatHistory } from '@/lib/api';
import toast from 'react-hot-toast';

export function useJarvis() {
  const { messages, isStreaming, addMessage, appendToLastMessage, setStreaming, clearMessages, startAssistantMessage } = useChatStore();
  const { token, sessionId } = useAuthStore();
  const abortRef = useRef<(() => void) | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!token || !sessionId || isStreaming) return;

      addMessage({ role: 'user', content, timestamp: new Date().toISOString() });
      startAssistantMessage();
      setStreaming(true);

      const abort = streamChatMessage(
        sessionId,
        content,
        token,
        (chunk) => appendToLastMessage(chunk),
        () => setStreaming(false),
        (err) => {
          setStreaming(false);
          toast.error(`Jarvis error: ${err}`, {
            style: { background: '#0d0d1e', color: '#ff3b3b' },
          });
        }
      );
      abortRef.current = abort;
    },
    [token, sessionId, isStreaming, addMessage, startAssistantMessage, appendToLastMessage, setStreaming]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.();
    setStreaming(false);
  }, [setStreaming]);

  const clearChat = useCallback(async () => {
    try {
      await clearChatHistory();
    } catch {}
    clearMessages();
  }, [clearMessages]);

  return { messages, isStreaming, sendMessage, stopStreaming, clearChat };
}
