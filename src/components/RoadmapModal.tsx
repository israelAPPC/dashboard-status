"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, Settings2, X } from "lucide-react";
import { getRoadmapPorProjeto } from "@/lib/roadmap";
import { getUserRole } from "@/lib/auth-role";
import type { RoadmapItem } from "@/lib/supabase-types";

/**
 * Botão "Próximas versões" + modal com a lista simples do roadmap do projeto.
 * Leitura pública (RLS); mesmo padrão visual do ChangelogModal, sem a
 * estrutura de funcionalidades/imagens (é só título + descrição, em ordem).
 */
export default function RoadmapModal({ projetoId, projetoSlug }: { projetoId: string; projetoSlug: string }) {
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [itens, setItens] = useState<RoadmapItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    getUserRole().then((r) => setIsAdmin(r === "admin"));
  }, []);

  async function abrir() {
    setAberto(true);
    setCarregando(true);
    setErro(null);
    try {
      const its = await getRoadmapPorProjeto(projetoId);
      setItens(its);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar roadmap.");
    } finally {
      setCarregando(false);
    }
  }

  function fechar() {
    setAberto(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-[#2c98b0]/40 hover:text-[#2c98b0] transition-colors"
      >
        <Compass className="w-3.5 h-3.5" />
        Próximas versões
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={fechar}
        >
          <div
            className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-lg max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#2c98b0]" />
                Próximas versões
              </h2>
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link
                    href={`/admin/projeto/${projetoSlug}/roadmap`}
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

            <div className="overflow-y-auto px-6 py-5">
              {carregando && <p className="text-sm text-slate-400">Carregando...</p>}
              {erro && <p className="text-sm text-red-500">{erro}</p>}
              {!carregando && !erro && itens.length === 0 && (
                <p className="text-sm text-slate-400">Nenhum item de roadmap cadastrado ainda.</p>
              )}

              {!carregando && itens.length > 0 && (
                <ol className="relative border-l border-gray-100 pl-5 space-y-5">
                  {itens.map((item, index) => (
                    <li key={item.id} className="relative">
                      <span className="absolute -left-[26px] top-0.5 w-3 h-3 rounded-full bg-[#2c98b0]/15 ring-2 ring-[#2c98b0]/40" />
                      <p className="text-xs font-medium text-slate-400 mb-0.5">Item {index + 1}</p>
                      <p className="text-sm font-semibold text-slate-800">{item.titulo}</p>
                      {item.descricao && (
                        <p className="text-sm text-slate-600 whitespace-pre-line mt-1">{item.descricao}</p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
