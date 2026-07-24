import Link from "next/link";
import { ChevronRight, FolderKanban, LayoutGrid } from "lucide-react";
import { getProjetos, getCategoriasPorProjeto, getCardsPorCategorias } from "@/lib/kanban";
import { STATUS_LABEL, STATUS_DOT } from "@/lib/status";
import ReportarDemandaLink from "@/components/ReportarDemandaLink";
import type { Status } from "@/lib/supabase-types";

export const revalidate = 0;

const COLUNAS: Status[] = ["em-aberto", "parado", "em-desenvolvimento", "em-teste", "finalizado"];

export default async function Home() {
  const projetos = await getProjetos();

  const resumos = await Promise.all(
    projetos.map(async (projeto) => {
      const categorias = await getCategoriasPorProjeto(projeto.id);
      const cards = await getCardsPorCategorias(categorias.map((c) => c.id));
      const totalPorStatus = COLUNAS.map((status) => ({
        status,
        total: cards.filter((c) => c.status === status).length,
      })).filter((s) => s.total > 0);
      return { projeto, totalCards: cards.length, totalPorStatus };
    })
  );

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#2c98b0]/10 flex items-center justify-center shrink-0">
            <LayoutGrid className="w-5 h-5 text-[#2c98b0]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Projetos</h1>
            <p className="text-sm text-slate-500 mt-1">
              Acompanhe o progresso de cada módulo, veja o changelog de versões e o que vem a seguir.
            </p>
          </div>
        </div>
        <ReportarDemandaLink />
      </div>

      {resumos.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
          <FolderKanban className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Nenhum projeto cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {resumos.map(({ projeto, totalCards, totalPorStatus }) => (
            <Link
              key={projeto.id}
              href={`/projeto/${projeto.slug}`}
              className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-3 hover:border-[#2c98b0]/30 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-slate-800">{projeto.nome}</h2>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#2c98b0] group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {projeto.descricao && (
                <p className="text-sm text-slate-500 line-clamp-2">{projeto.descricao}</p>
              )}

              {totalCards > 0 ? (
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  {totalPorStatus.map((s) => (
                    <span
                      key={s.status}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-gray-50 ring-1 ring-gray-100 px-2 py-1 rounded-full"
                      title={STATUS_LABEL[s.status]}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s.status]}`} />
                      {s.total}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-300 mt-1">Sem cards cadastrados ainda</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
