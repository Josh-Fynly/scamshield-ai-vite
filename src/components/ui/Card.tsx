import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', glass = true, hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        ${glass ? 'glass' : 'bg-bg-secondary border border-border-subtle rounded-2xl'}
        ${hover ? 'cursor-pointer hover:bg-white/[0.07] transition-all duration-200' : ''}
        flex flex-col min-h-0
        ${className}
      `}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-4 border-b border-border-subtle ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-4 border-t border-border-subtle ${className}`}>{children}</div>;
}
