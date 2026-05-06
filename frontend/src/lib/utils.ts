import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number | undefined | null): string {
  if (n == null) return 'N/A';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('en-IN');
}

export function scoreColor(score: number): string {
  if (score >= 75) return '#00ff88';
  if (score >= 50) return '#ffd60a';
  if (score >= 25) return '#ff9500';
  return '#ff3b3b';
}

export function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#ff3b3b';
    case 'warning': return '#ffd60a';
    default: return '#00d4ff';
  }
}

export function priorityColor(priority: string): string {
  switch (priority) {
    case 'high': return '#ff3b3b';
    case 'medium': return '#ffd60a';
    default: return '#00ff88';
  }
}

export function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    instagram: '📸',
    youtube: '▶️',
    linkedin: '💼',
    facebook: '📘',
    website: '🌐',
  };
  return icons[platform.toLowerCase()] || '📱';
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) return true;
  return Date.now() / 1000 > (payload.exp as number);
}

export function scoreLabel(score: number): string {
  if (score >= 80) return 'Dominant';
  if (score >= 65) return 'Strong';
  if (score >= 50) return 'Average';
  if (score >= 35) return 'Weak';
  return 'Critical';
}
