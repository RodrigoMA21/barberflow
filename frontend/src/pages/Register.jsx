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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={fazerCadastro} className="bg-white p-8 rounded shadow w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">{t("auth.registerTitle")}</h1>

        <div className="mb-4">
          <label className="block mb-1">{t("auth.name")}</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

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
          {t("auth.register")}
        </button>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full mt-3 text-sm text-gray-600 hover:text-black"
        >
          {t("auth.hasAccount")}
        </button>
      </form>
    </div>
  );
}

export default Register;
