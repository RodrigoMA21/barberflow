import { createContext, useCallback, useContext, useState } from "react";

const NotificationContext = createContext(null);

let nextId = 0;

const TYPE_STYLES = {
  error: { bg: "bg-error", icon: "!" },
  success: { bg: "bg-success", icon: "✓" },
  info: { bg: "bg-primary", icon: "i" },
};

const TYPE_ICONS = {
  error: (
    <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
  ),
  success: (
    <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  info: (
    <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  ),
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const notify = useCallback((message, type = "error") => {
    const id = ++nextId;
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leaving: true } : n)),
      );
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 250);
    }, 4000);
  }, []);

  function remove(id) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leaving: true } : n)),
    );
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 250);
  }

  return (
    <NotificationContext.Provider value={notify}>
      {children}

      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
        aria-label="Notificações"
      >
        {notifications.map((n) => {
          const style = TYPE_STYLES[n.type] || TYPE_STYLES.info;
          return (
            <div
              key={n.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-white shadow-dropdown border border-white/10 ${
                style.bg
              } ${n.leaving ? "animate-toast-out" : "animate-toast-in"}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 mt-0.5">
                {TYPE_ICONS[n.type] || TYPE_ICONS.info}
              </svg>
              <span className="flex-1 pt-0.5">{n.message}</span>
              <button
                type="button"
                onClick={() => remove(n.id)}
                className="btn-icon shrink-0 text-white/60 hover:text-white"
                aria-label="Fechar notificação"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotify() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotify must be used within NotificationProvider");
  return ctx;
}
