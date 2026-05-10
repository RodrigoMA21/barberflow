import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const navigate = useNavigate();

  async function fazerCadastro(e) {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:3000/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome,
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

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "usuario",
        JSON.stringify(data.usuario)
      );

      navigate("/");
    } catch (error) {
      console.error(error);
      alert("Erro ao criar conta");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={fazerCadastro}
        className="bg-white p-8 rounded shadow w-full max-w-md"
      >
        <h1 className="text-3xl font-bold mb-6 text-center">
          Criar conta
        </h1>

        <div className="mb-4">
          <label className="block mb-1">Nome</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-1">Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded"
        >
          Criar conta
        </button>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full mt-3 text-sm text-gray-600 hover:text-black"
        >
          Já tenho conta
        </button>
      </form>
    </div>
  );
}

export default Register;
