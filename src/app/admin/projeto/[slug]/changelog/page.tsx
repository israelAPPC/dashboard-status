"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Plus, Sparkles, Trash2, X } from "lucide-react";
import { getSupabase, STORAGE_BUCKET } from "@/lib/supabase";
import {
  getVersoesPorProjeto,
  getFuncionalidadesPorVersoes,
  getImagensPorFuncionalidades,
  criarVersao,
  excluirVersao,
  criarFuncionalidade,
  atualizarFuncionalidade,
  excluirFuncionalidade,
  criarFuncionalidadeImagem,
  excluirFuncionalidadeImagem,
} from "@/lib/changelog";
import type { Funcionalidade, FuncionalidadeImagem, Projeto, Versao } from "@/lib/supabase-types";

export default function AdminChangelogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [versoes, setVersoes] = useState<Versao[]>([]);
  const [funcionalidades, setFuncionalidades] = useState<Funcionalidade[]>([]);
  const [imagens, setImagens] = useState<FuncionalidadeImagem[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const [novoNumero, setNovoNumero] = useState("");
  const [novaDescricaoVersao, setNovaDescricaoVersao] = useState("");

  const [novoFuncNomeVersaoId, setNovoFuncNomeVersaoId] = useState<Record<string, string>>({});
  const [novoFuncDescVersaoId, setNovoFuncDescVersaoId] = useState<Record<string, string>>({});
  const [novoFuncNovidadeVersaoId, setNovoFuncNovidadeVersaoId] = useState<Record<string, boolean>>({});

  const [arquivosPorFuncionalidade, setArquivosPorFuncionalidade] = useState<Record<string, File[]>>({});
  const [enviandoPorFuncionalidade, setEnviandoPorFuncionalidade] = useState<Record<string, boolean>>({});

  async function carregar() {
    const sb = getSupabase();
    const { data: p } = await sb.from("projetos").select("*").eq("slug", slug).maybeSingle();
    if (!p) return;
    setProjeto(p);
    const vs = await getVersoesPorProjeto(p.id);
    setVersoes(vs);
    const fs = await getFuncionalidadesPorVersoes(vs.map((v) => v.id));
    setFuncionalidades(fs);
    const ims = await getImagensPorFuncionalidades(fs.map((f) => f.id));
    setImagens(ims);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function handleCriarVersao(e: React.FormEvent) {
    e.preventDefault();
    if (!projeto || !novoNumero.trim()) return;
    try {
      await criarVersao(projeto.id, novoNumero.trim(), novaDescricaoVersao.trim() || undefined, versoes.length);
      setNovoNumero("");
      setNovaDescricaoVersao("");
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao criar versão.");
    }
  }

  async function handleExcluirVersao(id: string) {
    if (!confirm("Excluir esta versão e todas as funcionalidades/imagens dentro dela?")) return;
    try {
      await excluirVersao(id);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao excluir versão.");
    }
  }

  async function handleCriarFuncionalidade(versaoId: string) {
    const nome = novoFuncNomeVersaoId[versaoId]?.trim();
    if (!nome) return;
    try {
      const qtd = funcionalidades.filter((f) => f.versao_id === versaoId).length;
      await criarFuncionalidade(
        versaoId,
        nome,
        novoFuncDescVersaoId[versaoId]?.trim() || undefined,
        novoFuncNovidadeVersaoId[versaoId] ?? false,
        qtd
      );
      setNovoFuncNomeVersaoId((s) => ({ ...s, [versaoId]: "" }));
      setNovoFuncDescVersaoId((s) => ({ ...s, [versaoId]: "" }));
      setNovoFuncNovidadeVersaoId((s) => ({ ...s, [versaoId]: false }));
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao criar funcionalidade.");
    }
  }

  async function handleToggleNovidade(func: Funcionalidade) {
    try {
      await atualizarFuncionalidade(func.id, { novidade: !func.novidade });
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao atualizar funcionalidade.");
    }
  }

  async function handleExcluirFuncionalidade(id: string) {
    if (!confirm("Excluir esta funcionalidade e suas imagens?")) return;
    try {
      await excluirFuncionalidade(id);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao excluir funcionalidade.");
    }
  }

  async function handleEnviarImagens(funcionalidadeId: string) {
    const arquivos = arquivosPorFuncionalidade[funcionalidadeId] ?? [];
    if (arquivos.length === 0) return;
    setEnviandoPorFuncionalidade((s) => ({ ...s, [funcionalidadeId]: true }));
    setErro(null);
    try {
      const qtdAtual = imagens.filter((i) => i.funcionalidade_id === funcionalidadeId).length;
      for (let idx = 0; idx < arquivos.length; idx++) {
        const arquivo = arquivos[idx];
        const caminho = `changelog/${funcionalidadeId}/${Date.now()}-${arquivo.name}`;
        const { error: uploadError } = await getSupabase().storage.from(STORAGE_BUCKET).upload(caminho, arquivo);
        if (uploadError) throw uploadError;
        const { data: pub } = getSupabase().storage.from(STORAGE_BUCKET).getPublicUrl(caminho);
        await criarFuncionalidadeImagem({
          funcionalidadeId,
          url: pub.publicUrl,
          nome: arquivo.name,
          ordem: qtdAtual + idx,
        });
      }
      setArquivosPorFuncionalidade((s) => ({ ...s, [funcionalidadeId]: [] }));
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao enviar imagens.");
    } finally {
      setEnviandoPorFuncionalidade((s) => ({ ...s, [funcionalidadeId]: false }));
    }
  }

  async function handleExcluirImagem(id: string) {
    try {
      await excluirFuncionalidadeImagem(id);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao excluir imagem.");
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

      <h1 className="text-xl font-semibold text-slate-800 mb-1">Versões / Changelog — {projeto.nome}</h1>
      <p className="text-sm text-slate-400 mb-6">
        Cadastre versões, funcionalidades e prints exibidos no botão &quot;Versões&quot; da página pública do projeto.
      </p>

      {erro && <p className="text-sm text-red-500 mb-4">{erro}</p>}

      <form
        onSubmit={handleCriarVersao}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3 mb-8"
      >
        <h2 className="text-sm font-semibold text-slate-700">Nova versão</h2>
        <div className="flex gap-3 flex-wrap">
          <input
            value={novoNumero}
            onChange={(e) => setNovoNumero(e.target.value)}
            placeholder="Número (ex.: 1.0)"
            className="w-40 text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
          />
          <input
            value={novaDescricaoVersao}
            onChange={(e) => setNovaDescricaoVersao(e.target.value)}
            placeholder="Descrição do que essa versão contempla"
            className="flex-1 min-w-[240px] text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 bg-[#2c98b0] hover:bg-[#2c98b0]/90 text-white font-medium text-sm px-3 py-2 rounded-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Criar versão
        </button>
      </form>

      <div className="space-y-6">
        {versoes.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma versão cadastrada ainda.</p>
        ) : (
          versoes.map((versao) => {
            const funcionalidadesVersao = funcionalidades
              .filter((f) => f.versao_id === versao.id)
              .sort((a, b) => a.ordem - b.ordem);
            return (
              <div key={versao.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <h3 className="text-base font-semibold text-slate-800">Versão {versao.numero}</h3>
                  <button
                    onClick={() => handleExcluirVersao(versao.id)}
                    className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir versão
                  </button>
                </div>
                {versao.descricao && <p className="text-sm text-slate-500 mb-4">{versao.descricao}</p>}

                <div className="space-y-3 mb-4">
                  {funcionalidadesVersao.map((func) => {
                    const imagensFunc = imagens.filter((i) => i.funcionalidade_id === func.id);
                    const arquivos = arquivosPorFuncionalidade[func.id] ?? [];
                    const enviando = enviandoPorFuncionalidade[func.id] ?? false;
                    return (
                      <div key={func.id} className="rounded-lg border border-gray-100 p-4 bg-gray-50">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-800">{func.nome}</p>
                            <button
                              type="button"
                              onClick={() => handleToggleNovidade(func)}
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full transition-colors ${
                                func.novidade
                                  ? "text-amber-600 bg-amber-50 ring-1 ring-amber-100"
                                  : "text-slate-400 bg-white ring-1 ring-gray-200 hover:text-amber-500"
                              }`}
                              title="Marcar/desmarcar como Novidade"
                            >
                              <Sparkles className="w-3 h-3" />
                              Novidade
                            </button>
                          </div>
                          <button
                            onClick={() => handleExcluirFuncionalidade(func.id)}
                            className="text-red-500 hover:text-red-600"
                            title="Excluir funcionalidade"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {func.descricao && <p className="text-sm text-slate-600 whitespace-pre-line mb-3">{func.descricao}</p>}

                        {imagensFunc.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {imagensFunc.map((img) => (
                              <div key={img.id} className="relative rounded-lg overflow-hidden border border-gray-100">
                                <Image src={img.url} alt={img.nome ?? func.nome} width={300} height={180} className="w-full h-auto" />
                                <button
                                  onClick={() => handleExcluirImagem(img.id)}
                                  className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-red-500 hover:bg-white"
                                  title="Excluir imagem"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) =>
                              setArquivosPorFuncionalidade((s) => ({
                                ...s,
                                [func.id]: [...(s[func.id] ?? []), ...Array.from(e.target.files ?? [])],
                              }))
                            }
                            className="text-xs"
                          />
                          {arquivos.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleEnviarImagens(func.id)}
                              disabled={enviando}
                              className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white font-medium text-xs px-3 py-1.5 rounded-md transition-colors"
                            >
                              {enviando ? "Enviando..." : `Enviar ${arquivos.length} imagem(ns)`}
                            </button>
                          )}
                        </div>
                        {arquivos.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {arquivos.map((f, i) => (
                              <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 text-xs text-slate-600 bg-white rounded px-2 py-1">
                                <span className="truncate">{f.name}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setArquivosPorFuncionalidade((s) => ({
                                      ...s,
                                      [func.id]: (s[func.id] ?? []).filter((_, idx) => idx !== i),
                                    }))
                                  }
                                  className="text-red-500 hover:text-red-600 shrink-0"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-lg border border-dashed border-gray-200 p-4 space-y-2">
                  <p className="text-xs font-medium text-slate-500">Nova funcionalidade nesta versão</p>
                  <input
                    value={novoFuncNomeVersaoId[versao.id] ?? ""}
                    onChange={(e) => setNovoFuncNomeVersaoId((s) => ({ ...s, [versao.id]: e.target.value }))}
                    placeholder="Nome (ex.: Vendas)"
                    className="w-full text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
                  />
                  <textarea
                    value={novoFuncDescVersaoId[versao.id] ?? ""}
                    onChange={(e) => setNovoFuncDescVersaoId((s) => ({ ...s, [versao.id]: e.target.value }))}
                    rows={2}
                    placeholder="O que essa funcionalidade faz..."
                    className="w-full text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={novoFuncNovidadeVersaoId[versao.id] ?? false}
                      onChange={(e) => setNovoFuncNovidadeVersaoId((s) => ({ ...s, [versao.id]: e.target.checked }))}
                    />
                    Marcar como Novidade
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCriarFuncionalidade(versao.id)}
                    className="inline-flex items-center gap-1.5 bg-[#2c98b0] hover:bg-[#2c98b0]/90 text-white font-medium text-xs px-3 py-1.5 rounded-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar funcionalidade
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
