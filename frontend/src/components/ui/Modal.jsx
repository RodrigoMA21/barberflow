import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

export function Modal({ open, onClose, title, description, children, size = "md" }) {
  const overlayRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={`w-full ${sizes[size]} bg-surface rounded-2xl shadow-modal animate-scale-in max-h-[90vh] overflow-y-auto`}>
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-text">{title}</h2>
              {description && <p className="text-sm text-text-secondary mt-0.5">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost btn-icon shrink-0 mt-0.5"
              aria-label={t("common.close")}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function ModalBody({ children, className = "" }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function ModalFooter({ children, className = "" }) {
  return (
    <div className={`flex items-center justify-end gap-3 border-t border-border px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}
