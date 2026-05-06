'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  LayoutDashboard, Zap, MessageSquare, Download, Bell, Shield,
  ChevronLeft, ChevronRight, Activity, BarChart3, Globe,
  TrendingUp, Target, LogOut,
} from 'lucide-react';
import { useAuthStore, useAlertStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  glow?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview',    label: 'War Room',       icon: LayoutDashboard, glow: 'neon-green' },
  { id: 'ads',         label: 'Ad Intelligence', icon: Zap,             glow: 'neon-yellow' },
  { id: 'social',      label: 'Social Intel',    icon: Activity,        glow: 'neon-blue' },
  { id: 'website',     label: 'Website Intel',   icon: Globe,           glow: 'neon-purple' },
  { id: 'funnel',      label: 'Funnel Map',      icon: Target,          glow: 'neon-green' },
  { id: 'scores',      label: 'Competitor Scores', icon: BarChart3,     glow: 'neon-blue' },
  { id: 'strategy',    label: 'Strategy Engine', icon: TrendingUp,      glow: 'neon-purple' },
  { id: 'alerts',      label: 'AI Alerts',       icon: Bell,            glow: 'neon-red' },
  { id: 'jarvis',      label: 'Jarvis AI',       icon: MessageSquare,   glow: 'neon-green' },
  { id: 'export',      label: 'Export Reports',  icon: Download,        glow: 'neon-blue' },
];

interface SidebarProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
}

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { clearAuth } = useAuthStore();
  const { unreadCount } = useAlertStore();

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen bg-dark-900 border-r border-white/5 overflow-hidden flex-shrink-0"
    >
      {/* Top logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-green/20 to-neon-blue/20 border border-neon-green/30 flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-neon-green" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-xs font-bold text-neon-green leading-tight">PES WAR ROOM</p>
              <p className="text-[10px] text-white/30 leading-tight">Intelligence Dashboard</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          const badgeCount = item.id === 'alerts' ? unreadCount : undefined;
          return (
            <motion.button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              whileHover={{ x: collapsed ? 0 : 4 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200',
                isActive
                  ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent'
              )}
            >
              <item.icon
                className={cn('w-4 h-4 flex-shrink-0', isActive && 'drop-shadow-[0_0_6px_rgba(0,255,136,0.8)]')}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {badgeCount ? (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-neon-red text-white text-[10px] flex items-center justify-center font-bold">
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              ) : null}
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-neon-green rounded-r-full"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom logout */}
      <div className="p-2 border-t border-white/5">
        <button
          onClick={() => { clearAuth(); window.location.href = '/'; }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/30 hover:text-neon-red hover:bg-neon-red/5 transition-all text-xs"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-dark-700 border border-white/10 flex items-center justify-center text-white/40 hover:text-white z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
}
