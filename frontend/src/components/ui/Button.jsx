import { forwardRef } from "react";

const variants = {
  primary:
    "bg-primary text-surface shadow-button hover:bg-primary-hover hover:translate-y-[-1px] hover:shadow-card-hover active:translate-y-0 active:shadow-button",
  secondary:
    "bg-surface text-text border border-border shadow-button hover:bg-surface-hover hover:border-border-hover hover:translate-y-[-1px] active:translate-y-0",
  outline:
    "bg-transparent text-primary border-2 border-primary hover:bg-primary-light active:bg-primary/10",
  ghost:
    "bg-transparent text-text-secondary hover:bg-surface-tertiary hover:text-text active:bg-border",
  success:
    "bg-success text-surface shadow-button hover:bg-success-hover hover:translate-y-[-1px] active:translate-y-0",
  warning:
    "bg-warning text-surface shadow-button hover:bg-warning-hover hover:translate-y-[-1px] active:translate-y-0",
  danger:
    "bg-error text-surface shadow-button hover:bg-error-hover hover:translate-y-[-1px] active:translate-y-0",
};

const sizes = {
  xs: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  sm: "px-4 py-2 text-sm rounded-xl gap-2",
  md: "px-5 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2.5",
  xl: "px-8 py-3.5 text-base rounded-xl gap-2.5",
  icon: "p-2.5 rounded-xl",
};

const Button = forwardRef(function Button(
  { variant = "primary", size = "md", loading, disabled, children, className = "", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold cursor-pointer select-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none ${variants[variant]} ${sizes[size]} ${className}`}
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
