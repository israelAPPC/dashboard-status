"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, GripVertical, Pencil, Plus, Trash2, X } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import {
  getRoadmapPorProjeto,
  criarRoadmapItem,
  atualizarRoadmapItem,
  excluirRoadmapItem,
} from "@/lib/roadmap";
import type { Projeto, RoadmapItem } from "@/lib/supabase-types";

export default function AdminRoadmapPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [itens, setItens] = useState<RoadmapItem[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [salvandoNovo, setSalvandoNovo] = useState(false);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  async function carregar() {
    const sb = getSupabase();
    const { data: p } = await sb.from("projetos").select("*").eq("slug", slug).maybeSingle();
    if (!p) return;
    setProjeto(p);
    const its = await getRoadmapPorProjeto(p.id);
    setItens(its);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    if (!projeto || !novoTitulo.trim()) return;
    setSalvandoNovo(true);
    setErro(null);
    try {
      await criarRoadmapItem(projeto.id, novoTitulo.trim(), novaDescricao.trim() || undefined, itens.length);
      setNovoTitulo("");
      setNovaDescricao("");
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao criar item.");
    } finally {
      setSalvandoNovo(false);
    }
  }

  function iniciarEdicao(item: RoadmapItem) {
    setEditandoId(item.id);
    setEditTitulo(item.titulo);
    setEditDescricao(item.descricao ?? "");
    setErro(null);
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setEditTitulo("");
    setEditDescricao("");
  }

  async function salvarEdicao(id: string) {
    if (!editTitulo.trim()) return;
    setSalvandoEdicao(true);
    setErro(null);
    try {
      await atualizarRoadmapItem(id, { titulo: editTitulo.trim(), descricao: editDescricao.trim() || null });
      cancelarEdicao();
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar item.");
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este item do roadmap?")) return;
    try {
      await excluirRoadmapItem(id);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao excluir item.");
    }
  }

  async function mover(id: string, direcao: "up" | "down") {
    const index = itens.findIndex((i) => i.id === id);
    const alvo = direcao === "up" ? index - 1 : index + 1;
    if (index < 0 || alvo < 0 || alvo >= itens.length) return;
    const atual = itens[index];
    const vizinho = itens[alvo];
    try {
      await Promise.all([
        atualizarRoadmapItem(atual.id, { ordem: vizinho.ordem }),
        atualizarRoadmapItem(vizinho.id, { ordem: atual.ordem }),
      ]);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao reordenar itens.");
    }
  }

  if (!projeto) return <p className="text-sm text-slate-400">Carregando...</p>;

  return (
    <div>
      <Link
        href={`/admin/projeto/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#2c98b0] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao projeto
      </Link>

      <h1 className="text-xl font-semibold text-slate-800 mb-1">Próximas versões (Roadmap) — {projeto.nome}</h1>
      <p className="text-sm text-slate-400 mb-6">
        Cadastre os próximos itens planejados, exibidos no botão &quot;Próximas versões&quot; da página pública do projeto.
      </p>

      {erro && <p className="text-sm text-red-500 mb-4">{erro}</p>}

      <form onSubmit={handleCriar} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3 mb-8">
        <h2 className="text-sm font-semibold text-slate-700">Novo item</h2>
        <input
          value={novoTitulo}
          onChange={(e) => setNovoTitulo(e.target.value)}
          placeholder="Título (ex.: Integração com módulo X)"
          className="w-full text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
        />
        <textarea
          value={novaDescricao}
          onChange={(e) => setNovaDescricao(e.target.value)}
          rows={2}
          placeholder="Descrição do que está planejado (opcional)"
          className="w-full text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
        />
        <button
          type="submit"
          disabled={salvandoNovo}
          className="inline-flex items-center gap-1.5 bg-[#2c98b0] hover:bg-[#2c98b0]/90 disabled:opacity-60 text-white font-medium text-sm px-3 py-2 rounded-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {salvandoNovo ? "Adicionando..." : "Adicionar item"}
        </button>
      </form>

      <div className="space-y-3">
        {itens.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum item cadastrado ainda.</p>
        ) : (
          itens.map((item, index) => {
            const editando = editandoId === item.id;
            return (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                {editando ? (
                  <div className="space-y-3">
                    <input
                      value={editTitulo}
                      onChange={(e) => setEditTitulo(e.target.value)}
                      placeholder="Título"
                      className="w-full text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
                    />
                    <textarea
                      value={editDescricao}
                      onChange={(e) => setEditDescricao(e.target.value)}
                      rows={2}
                      placeholder="Descrição (opcional)"
                      className="w-full text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => salvarEdicao(item.id)}
                        disabled={salvandoEdicao}
                        className="inline-flex items-center gap-1.5 bg-[#2c98b0] hover:bg-[#2c98b0]/90 disabled:opacity-60 text-white font-medium text-xs px-3 py-1.5 rounded-md transition-colors"
                      >
                        {salvandoEdicao ? "Salvando..." : "Salvar"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelarEdicao}
                        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-xs px-3 py-1.5 rounded-md transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1 pt-0.5 text-slate-300">
                        <button
                          type="button"
                          onClick={() => mover(item.id, "up")}
                          disabled={index === 0}
                          className="disabled:opacity-30 hover:text-[#2c98b0] transition-colors"
                          title="Mover para cima"
                        >
                          <GripVertical className="w-3.5 h-3.5 rotate-90" />
                        </button>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.titulo}</p>
                        {item.descricao && (
                          <p className="text-sm text-slate-600 whitespace-pre-line mt-1">{item.descricao}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => mover(item.id, "down")}
                        disabled={index === itens.length - 1}
                        className="disabled:opacity-30 text-slate-400 hover:text-[#2c98b0] transition-colors"
                        title="Mover para baixo"
                      >
                        <GripVertical className="w-3.5 h-3.5 -rotate-90" />
                      </button>
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(item)}
                        className="inline-flex items-center gap-1 text-xs text-[#2c98b0] hover:underline"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => excluir(item.id)}
                        className="text-red-500 hover:text-red-600"
                        title="Excluir item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
