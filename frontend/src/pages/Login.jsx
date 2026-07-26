import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { useNotify } from "../components/Notification";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={fazerLogin} className="bg-white p-8 rounded shadow w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">{t("app.name")}</h1>

        <div className="mb-4">
          <label className="block mb-1">{t("auth.email")}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-1">{t("auth.password")}</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <button type="submit" className="w-full bg-black text-white py-2 rounded">
          {t("auth.login")}
        </button>

        <button
          type="button"
          onClick={() => navigate("/cadastro")}
          className="w-full mt-3 text-sm text-gray-600 hover:text-black"
        >
          {t("auth.noAccount")}
        </button>
      </form>
    </div>
  );
}

export default Login;
