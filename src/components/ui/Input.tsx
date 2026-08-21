import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary
            placeholder:text-text-muted/50
            focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-150
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-danger-red/50 focus:border-danger-red/50 focus:ring-danger-red/20' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger-red">{error}</p>}
    </div>
  );
        }
