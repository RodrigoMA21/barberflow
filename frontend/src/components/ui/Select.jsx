import { forwardRef } from "react";

const Select = forwardRef(function Select(
  { label, error, hint, id, children, className = "", ...props },
  ref,
) {
  const selectId = id || props.name;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="input-label">
          {label}
          {props.required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={`input appearance-none pr-10 ${error ? "input-error" : ""} ${className}`}
          aria-invalid={error ? "true" : undefined}
          {...props}
        >
          {children}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none"
          viewBox="0 0 16 16" fill="none"
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {error && (
        <p className="text-xs text-error mt-1" role="alert">{error}</p>
      )}

      {hint && !error && (
        <p className="text-xs text-text-tertiary mt-1">{hint}</p>
      )}
    </div>
  );
});

export default Select;
