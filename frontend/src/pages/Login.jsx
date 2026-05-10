import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const navigate = useNavigate();

  async function fazerLogin(e) {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:3000/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            senha,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error);

        return;
      }

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "usuario",
        JSON.stringify(data.usuario)
      );

      navigate("/");
    } catch (error) {
      console.error(error);

      alert("Erro ao fazer login");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={fazerLogin}
        className="bg-white p-8 rounded shadow w-full max-w-md"
      >
        <h1 className="text-3xl font-bold mb-6 text-center">
          BarberFlow
        </h1>

        <div className="mb-4">
          <label className="block mb-1">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-1">
            Senha
          </label>

          <input
            type="password"
            value={senha}
            onChange={(e) =>
              setSenha(e.target.value)
            }
            className="w-full border p-2 rounded"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded"
        >
          Entrar
        </button>

        <button
          type="button"
          onClick={() => navigate("/cadastro")}
          className="w-full mt-3 text-sm text-gray-600 hover:text-black"
        >
          Criar conta
        </button>
      </form>
    </div>
  );
}

export default Login;
