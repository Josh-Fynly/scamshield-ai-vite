import React from 'react';
import type { RiskLevel } from '../../types';
import { getRiskBadgeColor } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'risk';
  riskLevel?: RiskLevel;
  className?: string;
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'default', riskLevel, className = '', size = 'sm' }: BadgeProps) {
  const base = 'inline-flex items-center font-medium rounded-full';

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  const variants: Record<string, string> = {
    default: 'bg-white/10 text-text-secondary',
    success: 'bg-success-emerald/20 text-success-emerald',
    warning: 'bg-warning-amber/20 text-warning-amber',
    danger: 'bg-danger-red/20 text-danger-red',
    info: 'bg-accent-blue/20 text-accent-blue',
  };

  const riskStyles = riskLevel ? getRiskBadgeColor(riskLevel) : '';

  return (
    <span className={`${base} ${riskLevel ? riskStyles : variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}

interface RiskBadgeProps {
  score: number;
  level: RiskLevel;
  size?: 'sm' | 'md';
}

export function RiskBadge({ score, level, size = 'sm' }: RiskBadgeProps) {
  return (
    <Badge riskLevel={level} size={size}>
      <span className="mr-1">{score}</span>
      <span className="opacity-75">·</span>
      <span className="ml-1 capitalize">{level.replace('_', ' ')}</span>
    </Badge>
  );
}
