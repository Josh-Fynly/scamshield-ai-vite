import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <select
        className={`
          w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary
          focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20
          transition-all duration-150
          ${className}
        `}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-bg-secondary">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
