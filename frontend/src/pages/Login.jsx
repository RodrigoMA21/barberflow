import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { useNotify } from "../components/Notification";
import ThemeToggle from "../components/ui/ThemeToggle";
import LanguageSwitcher from "../components/ui/LanguageSwitcher";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const { t } = useTranslation();
  const navigate = useNavigate();
  const notify = useNotify();

  async function fazerLogin(e) {
    e.preventDefault();
    try {
      const response = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, senha }),
      });
      const data = await response.json();
      if (!response.ok) {
        notify(data.error || t("auth.loginError"));
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      navigate("/");
    } catch (error) {
      console.error(error);
      notify(t("auth.loginError"));
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-secondary p-4">
      <div className="card-static p-8 w-full max-w-md animate-fade-in-up">
        <div className="flex items-center justify-end gap-2 mb-6">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center mx-auto mb-5">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text tracking-tight">{t("app.name")}</h1>
          <p className="text-sm text-text-secondary mt-1.5">{t("auth.loginTitle")}</p>
          <p className="text-xs text-text-tertiary mt-2 max-w-xs mx-auto leading-relaxed">{t("app.tagline")}</p>
        </div>

        <form onSubmit={fazerLogin} className="space-y-4">
          <div>
            <label className="input-label">{t("auth.email")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="seu@email.com" />
          </div>

          <div>
            <label className="input-label">{t("auth.password")}</label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} className="input" placeholder="••••••••" />
          </div>

          <button type="submit" className="btn-primary w-full justify-center py-2.5">
            {t("auth.login")}
          </button>
        </form>

        <button type="button" onClick={() => navigate("/cadastro")} className="btn-ghost w-full mt-4 text-sm py-1">
          {t("auth.noAccount")}
        </button>

        <div className="mt-8 pt-5 border-t border-border text-center">
          <p className="text-xs text-text-tertiary">{t("footer.copyright")}</p>
          <a
            href="https://rodrigomayer.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1.5 text-xs text-primary hover:text-primary-hover font-medium transition-colors"
          >
            {t("footer.portfolio")}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;
