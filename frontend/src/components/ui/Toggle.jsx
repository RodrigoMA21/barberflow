import { useId } from "react";

export default function Toggle({ checked, onChange, label, id }) {
  const generatedId = useId();
  const toggleId = id || generatedId;

  return (
    <label htmlFor={toggleId} className="relative inline-flex items-center gap-3 cursor-pointer">
      <input
        id={toggleId}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div className="w-9 h-5 bg-surface-tertiary rounded-full peer peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-primary transition-all after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
      {label && <span className="text-sm text-text">{label}</span>}
    </label>
  );
}
