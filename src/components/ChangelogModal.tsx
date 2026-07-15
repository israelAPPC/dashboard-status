"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, History, Settings2, Sparkles, X } from "lucide-react";
import {
  getVersoesPorProjeto,
  getFuncionalidadesPorVersoes,
  getImagensPorFuncionalidades,
} from "@/lib/changelog";
import { getUserRole } from "@/lib/auth-role";
import type { Funcionalidade, FuncionalidadeImagem, Versao } from "@/lib/supabase-types";

/**
 * Botão "Versões" + modal de changelog visual do projeto.
 * Leitura pública (RLS); navegação entre funcionalidades via abas dinâmicas
 * dentro da versão selecionada (accordion, mais recente aberta por padrão).
 */
export default function ChangelogModal({ projetoId, projetoSlug }: { projetoId: string; projetoSlug: string }) {
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [versoes, setVersoes] = useState<Versao[]>([]);
  const [funcionalidades, setFuncionalidades] = useState<Funcionalidade[]>([]);
  const [imagens, setImagens] = useState<FuncionalidadeImagem[]>([]);
  const [versaoAbertaId, setVersaoAbertaId] = useState<string | null>(null);
  const [funcionalidadeAtivaId, setFuncionalidadeAtivaId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    getUserRole().then((r) => setIsAdmin(r === "admin"));
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i === null ? i : i + 1));
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i === null ? i : i - 1));
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex]);

  async function abrir() {
    setAberto(true);
    setCarregando(true);
    setErro(null);
    try {
      const vs = await getVersoesPorProjeto(projetoId);
      const fs = await getFuncionalidadesPorVersoes(vs.map((v) => v.id));
      const ims = await getImagensPorFuncionalidades(fs.map((f) => f.id));
      setVersoes(vs);
      setFuncionalidades(fs);
      setImagens(ims);
      const primeira = vs[0] ?? null;
      setVersaoAbertaId(primeira?.id ?? null);
      const primeiraFuncionalidade = primeira ? fs.find((f) => f.versao_id === primeira.id) : null;
      setFuncionalidadeAtivaId(primeiraFuncionalidade?.id ?? null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar changelog.");
    } finally {
      setCarregando(false);
    }
  }

  function fechar() {
    setAberto(false);
  }

  function abrirVersao(versaoId: string) {
    if (versaoAbertaId === versaoId) {
      setVersaoAbertaId(null);
      return;
    }
    setVersaoAbertaId(versaoId);
    const primeiraFuncionalidade = funcionalidades.find((f) => f.versao_id === versaoId);
    setFuncionalidadeAtivaId(primeiraFuncionalidade?.id ?? null);
  }

  const funcionalidadeAtiva = useMemo(
    () => funcionalidades.find((f) => f.id === funcionalidadeAtivaId) ?? null,
    [funcionalidades, funcionalidadeAtivaId]
  );
  const imagensDaFuncionalidade = useMemo(
    () => (funcionalidadeAtiva ? imagens.filter((i) => i.funcionalidade_id === funcionalidadeAtiva.id) : []),
    [imagens, funcionalidadeAtiva]
  );

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-[#2c98b0]/40 hover:text-[#2c98b0] transition-colors"
      >
        <History className="w-3.5 h-3.5" />
        Versões
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={fechar}
        >
          <div
            className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-3xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-[#2c98b0]" />
                Versões / Changelog
              </h2>
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link
                    href={`/admin/projeto/${projetoSlug}/changelog`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2c98b0] hover:underline"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    Gerenciar
                  </Link>
                )}
                <button onClick={fechar} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-3">
              {carregando && <p className="text-sm text-slate-400">Carregando...</p>}
              {erro && <p className="text-sm text-red-500">{erro}</p>}
              {!carregando && !erro && versoes.length === 0 && (
                <p className="text-sm text-slate-400">Nenhuma versão cadastrada ainda.</p>
              )}

              {!carregando &&
                versoes.map((versao) => {
                  const funcionalidadesVersao = funcionalidades
                    .filter((f) => f.versao_id === versao.id)
                    .sort((a, b) => a.ordem - b.ordem);
                  const expandido = versaoAbertaId === versao.id;
                  return (
                    <div key={versao.id} className="rounded-lg border border-gray-100 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => abrirVersao(versao.id)}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                          expandido ? "bg-[#2c98b0]/5" : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <div>
                          <span className="text-sm font-semibold text-slate-800">Versão {versao.numero}</span>
                          {versao.descricao && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{versao.descricao}</p>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">
                          {funcionalidadesVersao.length} funcionalidade{funcionalidadesVersao.length === 1 ? "" : "s"}
                        </span>
                      </button>

                      {expandido && (
                        <div className="p-4 border-t border-gray-100">
                          {funcionalidadesVersao.length === 0 ? (
                            <p className="text-xs text-slate-400">Nenhuma funcionalidade cadastrada nesta versão.</p>
                          ) : (
                            <>
                              <div className="flex flex-wrap gap-2 mb-4">
                                {funcionalidadesVersao.map((func) => (
                                  <button
                                    key={func.id}
                                    type="button"
                                    onClick={() => setFuncionalidadeAtivaId(func.id)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                      funcionalidadeAtivaId === func.id
                                        ? "bg-[#2c98b0] text-white"
                                        : "bg-gray-100 text-slate-600 hover:bg-gray-200"
                                    }`}
                                  >
                                    {func.nome}
                                    {func.novidade && (
                                      <Sparkles
                                        className={`w-3 h-3 ${
                                          funcionalidadeAtivaId === func.id ? "text-white" : "text-amber-500"
                                        }`}
                                      />
                                    )}
                                  </button>
                                ))}
                              </div>

                              {funcionalidadeAtiva && funcionalidadeAtiva.versao_id === versao.id && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-sm font-semibold text-slate-800">{funcionalidadeAtiva.nome}</h3>
                                    {funcionalidadeAtiva.novidade && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-600 bg-amber-50 ring-1 ring-amber-100 px-2 py-0.5 rounded-full">
                                        <Sparkles className="w-3 h-3" />
                                        Novidade
                                      </span>
                                    )}
                                  </div>
                                  {funcionalidadeAtiva.descricao && (
                                    <p className="text-sm text-slate-600 whitespace-pre-line mb-3">
                                      {funcionalidadeAtiva.descricao}
                                    </p>
                                  )}
                                  {imagensDaFuncionalidade.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2">
                                      {imagensDaFuncionalidade.map((img, index) => (
                                        <button
                                          key={img.id}
                                          type="button"
                                          onClick={() => setLightboxIndex(index)}
                                          className="rounded-lg overflow-hidden border border-gray-100 cursor-zoom-in hover:opacity-90 transition-opacity"
                                        >
                                          <Image
                                            src={img.url}
                                            alt={img.nome ?? funcionalidadeAtiva.nome}
                                            width={500}
                                            height={300}
                                            className="w-full h-auto"
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {lightboxIndex !== null && imagensDaFuncionalidade.length > 0 && (
            <LightboxOverlay
              imagens={imagensDaFuncionalidade}
              indice={((lightboxIndex % imagensDaFuncionalidade.length) + imagensDaFuncionalidade.length) % imagensDaFuncionalidade.length}
              alt={funcionalidadeAtiva?.nome ?? ""}
              onFechar={() => setLightboxIndex(null)}
              onAnterior={() => setLightboxIndex((i) => (i === null ? i : i - 1))}
              onProxima={() => setLightboxIndex((i) => (i === null ? i : i + 1))}
            />
          )}
        </div>
      )}
    </>
  );
}

function LightboxOverlay({
  imagens,
  indice,
  alt,
  onFechar,
  onAnterior,
  onProxima,
}: {
  imagens: FuncionalidadeImagem[];
  indice: number;
  alt: string;
  onFechar: () => void;
  onAnterior: () => void;
  onProxima: () => void;
}) {
  const imagem = imagens[indice];
  const temNavegacao = imagens.length > 1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
      onClick={(e) => {
        e.stopPropagation();
        onFechar();
      }}
    >
      <button
        type="button"
        onClick={onFechar}
        className="absolute top-4 right-4 text-white/80 hover:text-white"
        title="Fechar (Esc)"
      >
        <X className="w-7 h-7" />
      </button>

      {temNavegacao && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAnterior();
          }}
          className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors"
          title="Imagem anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      <div
        className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          key={imagem.id}
          src={imagem.url}
          alt={imagem.nome ?? alt}
          width={1600}
          height={1000}
          className="max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain rounded-lg"
        />
      </div>

      {temNavegacao && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onProxima();
          }}
          className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors"
          title="Próxima imagem"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {temNavegacao && (
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/70">
          {indice + 1} / {imagens.length}
        </span>
      )}
    </div>
  );
}
