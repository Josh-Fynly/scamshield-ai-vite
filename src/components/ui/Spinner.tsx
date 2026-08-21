export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="h-6 w-6 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
    </div>
  );
}
