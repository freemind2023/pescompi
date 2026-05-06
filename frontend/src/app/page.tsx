'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { login } from '@/lib/api';
import { decodeJwt } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    try {
      const { access_token } = await login(password);
      const payload = decodeJwt(access_token);
      const sessionId = payload?.session_id as string || '';
      setAuth(access_token, sessionId);
      toast.success('Access granted. Welcome, Founder.', {
        style: { background: '#0d0d1e', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)' },
      });
      router.push('/dashboard');
    } catch {
      toast.error('Access denied. Invalid credentials.', {
        style: { background: '#0d0d1e', color: '#ff3b3b' },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen cyber-grid flex items-center justify-center bg-dark-950 relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-green/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm mx-4"
      >
        {/* Logo area */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-green/20 to-neon-blue/20 border border-neon-green/30 flex items-center justify-center mx-auto mb-4 glow-green"
          >
            <Shield className="w-8 h-8 text-neon-green" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white text-glow-green">PES WAR ROOM</h1>
          <p className="text-sm text-white/40 mt-1">Competitor Intelligence Dashboard</p>
          <p className="text-xs text-white/25 mt-0.5">Founder Access Only</p>
        </div>

        {/* Login card */}
        <div className="glass-card rounded-2xl p-6 border border-neon-green/10">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] text-white/50 mb-1.5 font-medium">
                FOUNDER ACCESS CODE
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your access code"
                  className="w-full bg-dark-800 border border-white/10 focus:border-neon-green/40 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading || !password.trim()}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl bg-neon-green/10 border border-neon-green/30 text-neon-green font-bold text-sm hover:bg-neon-green/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Initiate War Room
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-[10px] text-white/25">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
              Secure · Session-based · No permanent storage
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-white/20 mt-6">
          Practical EduSkills · Competitor Intelligence System v1.0
        </p>
      </motion.div>
    </div>
  );
}
