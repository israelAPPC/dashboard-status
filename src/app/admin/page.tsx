"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { getProjetos, criarProjeto } from "@/lib/kanban";
import type { Projeto } from "@/lib/supabase-types";

function slugify(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminHomePage() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [nome, setNome] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    try {
      setProjetos(await getProjetos());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar projetos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, []);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setErro(null);
    try {
      await criarProjeto(nome.trim(), slugify(nome));
      setNome("");
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao criar projeto.");
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Administração — Projetos</h1>

      <form onSubmit={handleCriar} className="flex gap-2 mb-6">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do novo projeto"
          className="flex-1 text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 bg-[#2c98b0] hover:bg-[#2c98b0]/90 text-white font-medium text-sm px-3 py-2 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Criar
        </button>
      </form>

      {erro && <p className="text-xs text-red-500 mb-4">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projetos.map((projeto) => (
            <Link
              key={projeto.id}
              href={`/admin/projeto/${projeto.slug}`}
              className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between hover:border-[#2c98b0]/30 hover:shadow-md transition-all"
            >
              <h2 className="font-semibold text-slate-800">{projeto.nome}</h2>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#2c98b0] transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
