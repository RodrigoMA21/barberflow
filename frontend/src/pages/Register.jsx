import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { useNotify } from "../components/Notification";

function Register() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const { t } = useTranslation();
  const navigate = useNavigate();
  const notify = useNotify();

  async function fazerCadastro(e) {
    e.preventDefault();
    try {
      const response = await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({ nome, email, senha }),
      });
      const data = await response.json();
      if (!response.ok) {
        notify(data.error || t("auth.registerError"));
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      navigate("/");
    } catch (error) {
      console.error(error);
      notify(t("auth.registerError"));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-4">
      <div className="card-static p-8 w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center mx-auto mb-5">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text tracking-tight">{t("app.name")}</h1>
          <p className="text-sm text-text-secondary mt-1.5">{t("auth.registerTitle")}</p>
        </div>

        <form onSubmit={fazerCadastro} className="space-y-4">
          <div>
            <label className="input-label">{t("auth.name")}</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="input" placeholder={t("auth.name")} />
          </div>

          <div>
            <label className="input-label">{t("auth.email")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="seu@email.com" />
          </div>

          <div>
            <label className="input-label">{t("auth.password")}</label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} className="input" placeholder="••••••••" />
          </div>

          <button type="submit" className="btn-primary w-full justify-center py-2.5">
            {t("auth.register")}
          </button>
        </form>

        <button type="button" onClick={() => navigate("/login")} className="btn-ghost w-full mt-4 text-sm py-1">
          {t("auth.hasAccount")}
        </button>
      </div>
    </div>
  );
}

export default Register;
