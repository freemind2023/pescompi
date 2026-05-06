'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Square, Trash2, Zap, Bot, User, Sparkles } from 'lucide-react';
import { useJarvis } from '@/hooks/useJarvis';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

const QUICK_PROMPTS = [
  { label: 'Why is Nilaya ahead?', icon: '🎯' },
  { label: 'What ads are performing?', icon: '📊' },
  { label: 'Give me 5 viral reel ideas', icon: '🎬' },
  { label: 'Generate a counter campaign', icon: '⚔️' },
  { label: 'What are their weaknesses?', icon: '🔍' },
  { label: 'What should we launch next?', icon: '🚀' },
  { label: 'Analyze our positioning', icon: '📍' },
  { label: 'Predict next campaign', icon: '🔮' },
];

export default function JarvisChat() {
  const { messages, isStreaming, sendMessage, stopStreaming, clearChat } = useJarvis();
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const msg = input.trim();
    if (!msg || isStreaming) return;
    setInput('');
    await sendMessage(msg);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="glass-card rounded-xl border border-white/5 flex flex-col h-[700px]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-green/20 to-neon-blue/20 border border-neon-green/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-neon-green" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Jarvis</p>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-neon-yellow animate-pulse' : 'bg-neon-green'}`} />
              <p className="text-[10px] text-white/40">
                {isStreaming ? 'Thinking...' : 'Strategic AI Advisor · Ready'}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 rounded-lg text-white/30 hover:text-neon-red hover:bg-neon-red/5 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-green/10 to-neon-blue/10 border border-neon-green/20 flex items-center justify-center mb-4"
            >
              <Sparkles className="w-7 h-7 text-neon-green" />
            </motion.div>
            <p className="text-sm font-bold text-white mb-1">Jarvis is ready</p>
            <p className="text-[11px] text-white/40 max-w-xs">
              Your strategic war room AI. Ask me anything about competitors, campaigns, or growth tactics.
            </p>
            <p className="text-[10px] text-white/25 mt-3">↓ Try a quick prompt below</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn('flex gap-2.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-md bg-neon-green/10 border border-neon-green/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3 h-3 text-neon-green" />
                  </div>
                )}
                <div
                  className={cn(
                    'rounded-xl px-3.5 py-2.5 max-w-[82%] text-[12px] leading-relaxed',
                    msg.role === 'user'
                      ? 'chat-user rounded-tr-sm text-white/90'
                      : 'chat-jarvis rounded-tl-sm text-white/80'
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 text-[12px] text-white/80">{children}</p>,
                          li: ({ children }) => <li className="text-[12px] text-white/70">{children}</li>,
                          strong: ({ children }) => <strong className="text-neon-green font-semibold">{children}</strong>,
                          code: ({ children }) => (
                            <code className="bg-dark-800 text-neon-blue px-1 py-0.5 rounded text-[11px]">{children}</code>
                          ),
                          h1: ({ children }) => <h1 className="text-sm font-bold text-white mb-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-[12px] font-bold text-neon-green mb-1.5">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-[12px] font-semibold text-neon-blue mb-1">{children}</h3>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                      {isStreaming && i === messages.length - 1 && (
                        <span className="typing-cursor" />
                      )}
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-md bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-3 h-3 text-neon-blue" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick prompts */}
      {messages.length === 0 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => sendMessage(p.label)}
                disabled={isStreaming}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-dark-700 border border-white/8 text-[10px] text-white/60 hover:text-white hover:border-neon-green/20 hover:bg-neon-green/5 transition-all"
              >
                <span>{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-end gap-2 bg-dark-800 rounded-xl border border-white/8 focus-within:border-neon-green/30 transition-colors p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Jarvis anything about your competitors..."
            disabled={isStreaming}
            rows={1}
            className="flex-1 bg-transparent text-[12px] text-white/80 placeholder-white/25 resize-none outline-none min-h-[24px] max-h-24 leading-6 px-1"
            style={{ scrollbarWidth: 'none' }}
          />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isStreaming ? (
              <button
                onClick={stopStreaming}
                className="p-2 rounded-lg bg-neon-red/10 border border-neon-red/20 text-neon-red hover:bg-neon-red/20 transition-all"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            ) : (
              <motion.button
                onClick={handleSend}
                disabled={!input.trim()}
                whileTap={{ scale: 0.93 }}
                className="p-2 rounded-lg bg-neon-green/10 border border-neon-green/20 text-neon-green hover:bg-neon-green/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>
        </div>
        <p className="text-[9px] text-white/20 text-center mt-1.5">
          Shift+Enter for new line · Enter to send · Session memory only
        </p>
      </div>
    </div>
  );
}
