"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import BackLink from "@/components/BackLink";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const { error } = await getSupabase().auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) {
      setErro("Login ou senha inválidos.");
      return;
    }
    router.push("/demandas/nova");
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <BackLink fallbackHref="/" label="Voltar" />
      <h1 className="text-lg font-semibold text-slate-800 mb-1">Login</h1>
      <p className="text-sm text-slate-500 mb-6">
        Acesso para usuários externos reportarem erros ou melhorias.
      </p>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Senha</label>
          <input
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
          />
        </div>
        {erro && <p className="text-xs text-red-500">{erro}</p>}
        <button
          type="submit"
          disabled={carregando}
          className="w-full bg-[#2c98b0] hover:bg-[#2c98b0]/90 disabled:opacity-60 text-white font-medium text-sm px-3 py-2 rounded-md transition-colors"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
