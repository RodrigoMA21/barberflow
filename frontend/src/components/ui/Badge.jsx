const variants = {
  success: "badge-success",
  warning: "badge-warning",
  error: "badge-error",
  info: "badge-info",
  neutral: "badge-neutral",
};

export default function Badge({ variant = "neutral", children, className = "" }) {
  return (
    <span className={`${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
