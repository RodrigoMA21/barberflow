import { createContext, useCallback, useContext, useState } from "react";

const NotificationContext = createContext(null);

let nextId = 0;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const notify = useCallback((message, type = "error") => {
    const id = ++nextId;
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  function remove(id) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <NotificationContext.Provider value={notify}>
      {children}

      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
        {notifications.map((n) => (
          <div
            key={n.id}
            role="alert"
            className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
              n.type === "error"
                ? "bg-red-600 text-white"
                : n.type === "success"
                  ? "bg-green-600 text-white"
                  : "bg-gray-800 text-white"
            }`}
          >
            <span>{n.message}</span>

            <button
              type="button"
              onClick={() => remove(n.id)}
              className="text-white/80 hover:text-white leading-none text-lg"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotify must be used within NotificationProvider");
  return ctx;
}
