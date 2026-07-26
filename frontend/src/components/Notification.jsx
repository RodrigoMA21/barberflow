import { createContext, useCallback, useContext, useState } from "react";

const NotificationContext = createContext(null);

let nextId = 0;

const TYPE_STYLES = {
  error: { bg: "bg-error", icon: "!" },
  success: { bg: "bg-success", icon: "✓" },
  info: { bg: "bg-primary", icon: "i" },
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
              className={`pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-dropdown ${
                style.bg
              } ${n.leaving ? "animate-toast-out" : "animate-toast-in"}`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold leading-none">
                {style.icon}
              </span>
              <span className="flex-1 pt-0.5">{n.message}</span>
              <button
                type="button"
                onClick={() => remove(n.id)}
                className="shrink-0 text-white/60 hover:text-white leading-none text-lg pt-0.5 transition-colors"
                aria-label="Fechar notificação"
              >
                &times;
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
