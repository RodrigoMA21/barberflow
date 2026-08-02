import { forwardRef } from "react";

const variants = {
  primary:
    "btn-glass-primary backdrop-blur-sm border-2 shadow-button text-primary hover:shadow-card-hover hover:translate-y-[-1px] active:scale-[0.97] active:translate-y-0 focus-visible:ring-2 focus-visible:ring-primary-ring focus-visible:outline-none",
  secondary:
    "btn-glass-secondary backdrop-blur-sm border shadow-button text-text hover:shadow-card-hover hover:translate-y-[-1px] active:scale-[0.97] active:translate-y-0 focus-visible:ring-2 focus-visible:ring-primary-ring focus-visible:outline-none",
  outline:
    "bg-transparent backdrop-blur-sm border-2 border-primary text-primary hover:bg-primary/10 hover:border-primary-hover active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-primary-ring focus-visible:outline-none",
  ghost:
    "bg-transparent backdrop-blur-sm text-text-secondary hover:bg-surface-tertiary/70 hover:text-text hover:shadow-button active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-primary-ring focus-visible:outline-none",
  success:
    "btn-glass-success backdrop-blur-sm border-2 shadow-button text-success hover:shadow-card-hover hover:translate-y-[-1px] active:scale-[0.97] active:translate-y-0 focus-visible:ring-2 focus-visible:ring-primary-ring focus-visible:outline-none",
  warning:
    "btn-glass-warning backdrop-blur-sm border-2 shadow-button text-warning hover:shadow-card-hover hover:translate-y-[-1px] active:scale-[0.97] active:translate-y-0 focus-visible:ring-2 focus-visible:ring-primary-ring focus-visible:outline-none",
  danger:
    "btn-glass-danger backdrop-blur-sm border-2 shadow-button text-error hover:shadow-card-hover hover:translate-y-[-1px] active:scale-[0.97] active:translate-y-0 focus-visible:ring-2 focus-visible:ring-primary-ring focus-visible:outline-none",
  info:
    "btn-glass-info backdrop-blur-sm border-2 shadow-button text-info hover:shadow-card-hover hover:translate-y-[-1px] active:scale-[0.97] active:translate-y-0 focus-visible:ring-2 focus-visible:ring-primary-ring focus-visible:outline-none",
  accent:
    "btn-glass-accent backdrop-blur-sm border-2 shadow-button text-accent hover:shadow-card-hover hover:translate-y-[-1px] active:scale-[0.97] active:translate-y-0 focus-visible:ring-2 focus-visible:ring-primary-ring focus-visible:outline-none",
};

const sizes = {
  xs: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  sm: "px-4 py-2 text-sm rounded-lg gap-2",
  md: "px-5 py-2.5 text-sm rounded-lg gap-2",
  lg: "px-6 py-3 text-base rounded-lg gap-2.5",
  xl: "px-8 py-3.5 text-base rounded-lg gap-2.5",
  icon: "p-2.5 rounded-lg",
};

const Button = forwardRef(function Button(
  { variant = "primary", size = "md", loading, disabled, children, className = "", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold cursor-pointer select-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:translate-y-0 disabled:scale-100 disabled:shadow-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin shrink-0" />
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
});

export default Button;
