import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getProjetoPorSlug, getCategoriasPorProjeto, getCardsPorCategorias } from "@/lib/kanban";
import { STATUS_LABEL, STATUS_CLASSES, STATUS_DOT } from "@/lib/status";
import type { Status } from "@/lib/supabase-types";

export const revalidate = 0;

const COLUNAS: Status[] = ["parado", "em-desenvolvimento", "finalizado"];

export default async function ProjetoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const projeto = await getProjetoPorSlug(slug);
  if (!projeto) notFound();

  const categorias = await getCategoriasPorProjeto(projeto.id);
  const cards = await getCardsPorCategorias(categorias.map((c) => c.id));

  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#2c98b0] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar aos projetos
      </Link>

      <h1 className="text-xl font-semibold text-slate-800 mb-6">{projeto.nome}</h1>

      {categorias.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma categoria cadastrada ainda.</p>
      ) : (
        <div className="space-y-8">
          {categorias.map((categoria) => {
            const cardsCategoria = cards.filter((c) => c.categoria_id === categoria.id);
            return (
              <section key={categoria.id}>
                <h2 className="font-semibold text-slate-700 mb-3">{categoria.nome}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {COLUNAS.map((status) => {
                    const cardsColuna = cardsCategoria
                      .filter((c) => c.status === status)
                      .sort((a, b) => a.ordem - b.ordem);
                    return (
                      <div key={status} className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                        <div className="flex items-center gap-1.5 mb-3 px-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
                          <span className="text-xs font-medium text-slate-500">
                            {STATUS_LABEL[status]} · {cardsColuna.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {cardsColuna.length === 0 ? (
                            <p className="text-xs text-slate-400 px-1">Nenhum card</p>
                          ) : (
                            cardsColuna.map((card) => (
                              <Link
                                key={card.id}
                                href={`/card/${card.id}`}
                                className="block bg-white rounded-lg border border-gray-100 shadow-sm p-3 hover:border-[#2c98b0]/30 hover:shadow-md transition-all"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-medium text-slate-800 line-clamp-2">
                                    {card.titulo}
                                  </p>
                                  <span
                                    className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded ${STATUS_CLASSES[status]}`}
                                  >
                                    #{card.numero_demanda}
                                  </span>
                                </div>
                              </Link>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
