import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary
          placeholder:text-text-muted/50
          focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-150 resize-none
          ${error ? 'border-danger-red/50' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-danger-red">{error}</p>}
    </div>
  );
}
