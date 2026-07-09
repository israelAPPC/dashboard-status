"use client";

import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import BackLink from "@/components/BackLink";
import { getSupabase } from "@/lib/supabase";
import { getUserRole } from "@/lib/auth-role";

type UsuarioExterno = {
  id: string;
  email: string | null;
  nome: string | null;
  created_at: string;
};

async function chamarApi(path: string, options: RequestInit = {}) {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão inválida. Faça login novamente.");

  const resposta = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(corpo.error ?? "Erro na requisição.");
  }
  return corpo;
}

export default function AdminUsuariosPage() {
  const [verificando, setVerificando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  const [usuarios, setUsuarios] = useState<UsuarioExterno[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  async function carregarUsuarios() {
    setCarregando(true);
    try {
      const { usuarios } = await chamarApi("/api/admin/usuarios");
      setUsuarios(usuarios);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar usuários.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    let ativo = true;
    getUserRole().then(async (role) => {
      if (!ativo) return;
      if (role !== "admin") {
        setAutorizado(false);
        setVerificando(false);
        return;
      }
      setAutorizado(true);
      setVerificando(false);
      await carregarUsuarios();
    });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!email.trim() || !senha || !nome.trim()) {
      setErro("Preencha email, senha e nome.");
      return;
    }

    setEnviando(true);
    try {
      await chamarApi("/api/admin/usuarios", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), senha, nome: nome.trim() }),
      });
      setSucesso(`Usuário externo "${nome.trim()}" criado com sucesso.`);
      setEmail("");
      setSenha("");
      setNome("");
      await carregarUsuarios();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao criar usuário.");
    } finally {
      setEnviando(false);
    }
  }

  if (verificando) return <p className="text-sm text-slate-400">Verificando acesso...</p>;

  if (!autorizado) {
    return (
      <div>
        <BackLink fallbackHref="/admin" label="Voltar" />
        <p className="text-sm text-slate-500">Esta página é exclusiva para administradores.</p>
      </div>
    );
  }

  return (
    <div>
      <BackLink fallbackHref="/admin" label="Voltar" />
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Usuários externos</h1>

      <form
        onSubmit={handleCriar}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4 mb-8 max-w-lg"
      >
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-[#2c98b0]" />
          Novo usuário externo
        </h2>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Nome</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Senha</label>
          <input
            type="text"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="w-full text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
          />
        </div>

        {erro && <p className="text-xs text-red-500">{erro}</p>}
        {sucesso && <p className="text-xs text-emerald-600">{sucesso}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="inline-flex items-center gap-1.5 bg-[#2c98b0] hover:bg-[#2c98b0]/90 disabled:opacity-60 text-white font-medium text-sm px-3 py-2 rounded-md transition-colors"
        >
          {enviando ? "Criando..." : "Criar usuário"}
        </button>
      </form>

      <h2 className="font-semibold text-slate-800 mb-3">Usuários já criados</h2>
      {carregando ? (
        <p className="text-sm text-slate-400">Carregando...</p>
      ) : usuarios.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum usuário externo criado ainda.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-slate-500">
                <th className="p-3 font-medium">Nome</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-t border-gray-100">
                  <td className="p-3 text-slate-700">{u.nome ?? "—"}</td>
                  <td className="p-3 text-slate-700">{u.email ?? "—"}</td>
                  <td className="p-3 text-slate-500">
                    {new Date(u.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
