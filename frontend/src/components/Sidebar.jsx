import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api";

const navItems = [
  { to: "/", labelKey: "nav.dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { to: "/clientes", labelKey: "nav.clientes", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { to: "/servicos", labelKey: "nav.servicos", icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" },
  { to: "/barbeiros", labelKey: "nav.barbeiros", icon: "M12 5a7 7 0 1 1 0 14a7 7 0 1 1 0-14M3 7q9 3 18 0M8 6V1h8v5" },
  { to: "/agenda", labelKey: "nav.agenda", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { to: "/agendamentos", labelKey: "nav.agendamentos", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { to: "/historico", labelKey: "nav.historico", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
];

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem("usuario");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { }
    }
  }, []);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    onClose();
  }, [location.pathname]);

  function isActive(path) {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  }

  async function handleSaveName() {
    const trimmed = editName.trim();
    if (!trimmed || !user) return;
    try {
      const response = await api("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ nome: trimmed }),
      });
      if (!response.ok) return;
      const data = await response.json();
      const updated = { ...user, nome: data.usuario.nome };
      setUser(updated);
      localStorage.setItem("usuario", JSON.stringify(updated));
    } catch { }
    setEditing(false);
  }

  function handleCancelEdit() {
    setEditName(user?.nome || "");
    setEditing(false);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = "/login";
  }

  const displayName = user?.nome || user?.email || t("header.admin");

  return (
    <>
      {/* Backdrop - visible only on mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40
          w-64 min-h-screen bg-sidebar border-r border-border
          flex flex-col shrink-0
          transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-text">{t("sidebar.title")}</h2>
            <button
              onClick={onClose}
              className="lg:hidden btn-ghost btn-icon text-lg"
            >
              ×
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-primary-light text-primary"
                    : "text-text-secondary hover:bg-surface-tertiary hover:text-text"
                }`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                >
                  <path d={item.icon} />
                </svg>
                <span>{t(item.labelKey)}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-tertiary">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  onBlur={handleSaveName}
                  className="w-full text-xs bg-surface-tertiary text-text rounded px-1.5 py-0.5 outline-none border border-border"
                />
              ) : (
                <p className="text-xs font-medium text-text-secondary truncate">{displayName}</p>
              )}
            </div>
            {!editing && (
              <button
                onClick={() => { setEditName(user?.nome || ""); setEditing(true); }}
                className="shrink-0 text-text-tertiary hover:text-text transition-colors"
                title={t("common.edit")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-text-tertiary hover:text-error hover:bg-error-light transition-all duration-150"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            {t("auth.logout")}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
