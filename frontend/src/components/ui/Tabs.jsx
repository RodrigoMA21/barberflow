export function Tabs({ children, className = "" }) {
  return (
    <div className={`flex gap-1 border-b border-border ${className}`} role="tablist">
      {children}
    </div>
  );
}

export function Tab({ active, value, onClick, children }) {
  const isActive = active === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => onClick(value)}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
        isActive
          ? "border-primary text-text"
          : "border-transparent text-text-secondary hover:text-text hover:border-border"
      }`}
    >
      {children}
    </button>
  );
}
