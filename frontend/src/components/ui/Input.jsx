import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { label, error, hint, id, className = "", ...props },
  ref,
) {
  const inputId = id || props.name;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {props.required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}

      <input
        ref={ref}
        id={inputId}
        className={`input ${error ? "input-error" : ""} ${className}`}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />

      {error && (
        <p id={`${inputId}-error`} className="text-xs text-error mt-1" role="alert">
          {error}
        </p>
      )}

      {hint && !error && (
        <p className="text-xs text-text-tertiary mt-1">{hint}</p>
      )}
    </div>
  );
});

export default Input;
