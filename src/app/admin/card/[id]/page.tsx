"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Pencil, Trash2, X } from "lucide-react";
import { getSupabase, STORAGE_BUCKET } from "@/lib/supabase";
import {
  getCardPorId,
  getIteracoesPorCard,
  getAnexosPorCard,
  atualizarCard,
  excluirCard,
  criarIteracao,
  atualizarIteracao,
  criarAnexo,
  excluirAnexo,
} from "@/lib/kanban";
import { STATUS_LABEL, TIPO_LABEL, TIPO_CLASSES } from "@/lib/status";
import type { Anexo, Card, Iteracao, Status } from "@/lib/supabase-types";

const STATUS_OPCOES: Status[] = ["em-aberto", "parado", "em-desenvolvimento", "em-teste", "finalizado"];

export default function AdminCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [card, setCard] = useState<Card | null>(null);
  const [iteracoes, setIteracoes] = useState<Iteracao[]>([]);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState<Status>("em-aberto");
  const [novaIteracao, setNovaIteracao] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editCorpo, setEditCorpo] = useState("");
  const [editArquivos, setEditArquivos] = useState<File[]>([]);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const anexosDoCard = anexos.filter((a) => a.iteracao_id === null);

  async function carregar() {
    const c = await getCardPorId(id);
    if (!c) return;
    setCard(c);
    setTitulo(c.titulo);
    setDescricao(c.descricao ?? "");
    setStatus(c.status);
    setIteracoes(await getIteracoesPorCard(id));
    setAnexos(await getAnexosPorCard(id));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSalvarCard(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      await atualizarCard(id, { titulo, descricao: descricao || null, status });
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar card.");
    }
  }

  async function handleExcluirCard() {
    if (!confirm("Excluir este card e todo o histórico? Esta ação não pode ser desfeita.")) return;
    try {
      await excluirCard(id);
      window.location.href = "/admin";
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao excluir card.");
    }
  }

  async function handleAdicionarIteracao(e: React.FormEvent) {
    e.preventDefault();
    if (!novaIteracao.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      const iteracao = await criarIteracao(id, novaIteracao.trim());
      for (const arquivo of arquivos) {
        const caminho = `${id}/${Date.now()}-${arquivo.name}`;
        const { error: uploadError } = await getSupabase()
          .storage.from(STORAGE_BUCKET)
          .upload(caminho, arquivo);
        if (uploadError) throw uploadError;
        const { data: pub } = getSupabase().storage.from(STORAGE_BUCKET).getPublicUrl(caminho);
        await criarAnexo({ cardId: id, iteracaoId: iteracao.id, url: pub.publicUrl, nome: arquivo.name });
      }
      setNovaIteracao("");
      setArquivos([]);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao adicionar iteração.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluirAnexo(anexoId: string) {
    try {
      await excluirAnexo(anexoId);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao excluir anexo.");
    }
  }

  function handleIniciarEdicao(it: Iteracao) {
    setEditandoId(it.id);
    setEditCorpo(it.corpo);
    setEditArquivos([]);
    setErro(null);
  }

  function handleCancelarEdicao() {
    setEditandoId(null);
    setEditCorpo("");
    setEditArquivos([]);
  }

  function handleVoltar() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/admin");
    }
  }

  function handleRemoverArquivoSelecionado(index: number) {
    setArquivos((prev) => prev.filter((_, i) => i !== index));
  }

  function handleRemoverEditArquivoSelecionado(index: number) {
    setEditArquivos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSalvarEdicaoIteracao(iteracaoId: string) {
    setSalvandoEdicao(true);
    setErro(null);
    try {
      await atualizarIteracao(iteracaoId, editCorpo.trim());
      for (const editArquivo of editArquivos) {
        const caminho = `${id}/${Date.now()}-${editArquivo.name}`;
        const { error: uploadError } = await getSupabase()
          .storage.from(STORAGE_BUCKET)
          .upload(caminho, editArquivo);
        if (uploadError) throw uploadError;
        const { data: pub } = getSupabase().storage.from(STORAGE_BUCKET).getPublicUrl(caminho);
        await criarAnexo({ cardId: id, iteracaoId, url: pub.publicUrl, nome: editArquivo.name });
      }
      handleCancelarEdicao();
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar edição.");
    } finally {
      setSalvandoEdicao(false);
    }
  }

  if (!card) return <p className="text-sm text-slate-400">Carregando...</p>;

  return (
    <div>
      <button
        type="button"
        onClick={handleVoltar}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#2c98b0] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-semibold text-slate-800">Card #{card.numero_demanda}</h1>
          {card.tipo && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TIPO_CLASSES[card.tipo]}`}>
              {TIPO_LABEL[card.tipo]}
            </span>
          )}
          {card.autor_nome && (
            <span className="text-xs text-slate-400">
              reportado por <span className="font-medium text-slate-500">{card.autor_nome}</span>
            </span>
          )}
        </div>
        <button onClick={handleExcluirCard} className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:underline">
          <Trash2 className="w-3.5 h-3.5" />
          Excluir card
        </button>
      </div>

      <form onSubmit={handleSalvarCard} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4 mb-8">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Título</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Descrição</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className="w-full text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="w-full text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
          >
            {STATUS_OPCOES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        {erro && <p className="text-xs text-red-500">{erro}</p>}
        <button
          type="submit"
          className="bg-[#2c98b0] hover:bg-[#2c98b0]/90 text-white font-medium text-sm px-3 py-2 rounded-md transition-colors"
        >
          Salvar
        </button>
      </form>

      {anexosDoCard.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Anexos do relato</h2>
          <div className="grid grid-cols-2 gap-2">
            {anexosDoCard.map((anexo) => (
              <div key={anexo.id} className="relative rounded-lg overflow-hidden border border-gray-100">
                <Image src={anexo.url} alt={anexo.nome ?? ""} width={400} height={225} className="w-full h-auto" />
                <button
                  onClick={() => handleExcluirAnexo(anexo.id)}
                  className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-red-500 hover:bg-white"
                  title="Excluir anexo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-sm font-semibold text-slate-700 mb-3">Adicionar iteração (histórico)</h2>
      <form onSubmit={handleAdicionarIteracao} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3 mb-8">
        <textarea
          value={novaIteracao}
          onChange={(e) => setNovaIteracao(e.target.value)}
          rows={3}
          placeholder="O que foi feito..."
          className="w-full text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
        />
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setArquivos((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
          className="text-xs"
        />
        {erro && <p className="text-xs text-red-500">{erro}</p>}
        {arquivos.length > 0 && (
          <ul className="space-y-1">
            {arquivos.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 text-xs text-slate-600 bg-gray-50 rounded px-2 py-1">
                <span className="truncate">
                  {f.name} <span className="text-slate-400">({(f.size / 1024).toFixed(0)} KB)</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoverArquivoSelecionado(i)}
                  className="text-red-500 hover:text-red-600 shrink-0"
                  title="Remover"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="submit"
          disabled={salvando}
          className="bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white font-medium text-sm px-3 py-2 rounded-md transition-colors"
        >
          {salvando ? "Enviando..." : "Adicionar"}
        </button>
      </form>

      <h2 className="text-sm font-semibold text-slate-700 mb-3">Histórico</h2>
      <div className="space-y-4">
        {iteracoes.map((it) => {
          const anexosIteracao = anexos.filter((a) => a.iteracao_id === it.id);
          const emEdicao = editandoId === it.id;
          return (
            <div key={it.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-xs text-slate-400">
                  {new Date(it.data + "T00:00:00").toLocaleDateString("pt-BR")}
                </p>
                {!emEdicao && (
                  <button
                    onClick={() => handleIniciarEdicao(it)}
                    className="inline-flex items-center gap-1 text-xs text-[#2c98b0] hover:underline shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </button>
                )}
              </div>

              {emEdicao ? (
                <div className="space-y-3">
                  <textarea
                    value={editCorpo}
                    onChange={(e) => setEditCorpo(e.target.value)}
                    rows={3}
                    className="w-full text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setEditArquivos((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
                    className="text-xs"
                  />
                  {editArquivos.length > 0 && (
                    <ul className="space-y-1">
                      {editArquivos.map((f, i) => (
                        <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 text-xs text-slate-600 bg-gray-50 rounded px-2 py-1">
                          <span className="truncate">
                            {f.name} <span className="text-slate-400">({(f.size / 1024).toFixed(0)} KB)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoverEditArquivoSelecionado(i)}
                            className="text-red-500 hover:text-red-600 shrink-0"
                            title="Remover"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {anexosIteracao.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {anexosIteracao.map((anexo) => (
                        <div key={anexo.id} className="relative rounded-lg overflow-hidden border border-gray-100">
                          <Image src={anexo.url} alt={anexo.nome ?? ""} width={400} height={225} className="w-full h-auto" />
                          <button
                            onClick={() => handleExcluirAnexo(anexo.id)}
                            className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-red-500 hover:bg-white"
                            title="Excluir anexo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSalvarEdicaoIteracao(it.id)}
                      disabled={salvandoEdicao}
                      className="inline-flex items-center gap-1.5 bg-[#2c98b0] hover:bg-[#2c98b0]/90 disabled:opacity-60 text-white font-medium text-sm px-3 py-2 rounded-md transition-colors"
                    >
                      {salvandoEdicao ? "Salvando..." : "Salvar"}
                    </button>
                    <button
                      onClick={handleCancelarEdicao}
                      className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm px-3 py-2 rounded-md transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-600 whitespace-pre-line">{it.corpo}</p>
                  {anexosIteracao.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {anexosIteracao.map((anexo) => (
                        <div key={anexo.id} className="relative rounded-lg overflow-hidden border border-gray-100">
                          <Image src={anexo.url} alt={anexo.nome ?? ""} width={400} height={225} className="w-full h-auto" />
                          <button
                            onClick={() => handleExcluirAnexo(anexo.id)}
                            className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-red-500 hover:bg-white"
                            title="Excluir anexo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
