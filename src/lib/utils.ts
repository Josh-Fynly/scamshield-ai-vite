import type { RiskLevel } from '../types';

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 30) return 'safe';
  if (score <= 60) return 'suspicious';
  return 'high_risk';
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'safe':
      return 'text-success';
    case 'suspicious':
      return 'text-warning';
    case 'high_risk':
      return 'text-danger';
  }
}

export function getRiskBgColor(level: RiskLevel): string {
  switch (level) {
    case 'safe':
      return 'bg-success/12 border-success/25';
    case 'suspicious':
      return 'bg-warning/12 border-warning/25';
    case 'high_risk':
      return 'bg-danger/12 border-danger/25';
  }
}

export function getRiskBadgeColor(level: RiskLevel): string {
  switch (level) {
    case 'safe':
      return 'bg-success/12 text-success border-success/25';
    case 'suspicious':
      return 'bg-warning/12 text-warning border-warning/25';
    case 'high_risk':
      return 'bg-danger/12 text-danger border-danger/25';
  }
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const now = Date.now();
  const d = new Date(date).getTime();
  const diff = now - d;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 15);
    }

