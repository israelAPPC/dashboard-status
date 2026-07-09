import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getCardPorId,
  getIteracoesPorCard,
  getAnexosPorCard,
  getCategoriaPorId,
  getProjetoPorId,
} from "@/lib/kanban";
import { STATUS_LABEL, STATUS_CLASSES, STATUS_DOT, TIPO_LABEL, TIPO_CLASSES } from "@/lib/status";
import BackLink from "@/components/BackLink";

export const revalidate = 0;

export default async function CardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = await getCardPorId(id);
  if (!card) notFound();

  const categoria = await getCategoriaPorId(card.categoria_id);
  const projeto = categoria ? await getProjetoPorId(categoria.projeto_id) : null;
  const fallbackHref = projeto ? `/projeto/${projeto.slug}` : "/";

  const [iteracoes, anexos] = await Promise.all([
    getIteracoesPorCard(card.id),
    getAnexosPorCard(card.id),
  ]);

  return (
    <div>
      <BackLink fallbackHref={fallbackHref} label="Voltar" />

      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <h1 className="text-xl font-semibold text-slate-800">{card.titulo}</h1>
        <span className="text-xs font-mono text-slate-400">#{card.numero_demanda}</span>
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span
          className={`inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CLASSES[card.status]}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[card.status]}`} />
          {STATUS_LABEL[card.status]}
        </span>
        {card.tipo && (
          <span className={`inline-flex w-fit items-center px-2.5 py-1 rounded-full text-xs font-medium ${TIPO_CLASSES[card.tipo]}`}>
            {TIPO_LABEL[card.tipo]}
          </span>
        )}
        {card.autor_nome && (
          <span className="text-xs text-slate-400">
            reportado por <span className="font-medium text-slate-500">{card.autor_nome}</span>
          </span>
        )}
      </div>

      {card.descricao && <p className="text-sm text-slate-600 mb-6 whitespace-pre-line">{card.descricao}</p>}

      <h2 className="text-sm font-semibold text-slate-700 mb-3">Histórico</h2>

      {iteracoes.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma iteração registrada ainda.</p>
      ) : (
        <div className="space-y-4">
          {iteracoes.map((it) => {
            const anexosIteracao = anexos.filter((a) => a.iteracao_id === it.id);
            return (
              <div key={it.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <p className="text-xs text-slate-400 mb-3">
                  {new Date(it.data + "T00:00:00").toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="text-sm text-slate-600 whitespace-pre-line">{it.corpo}</p>

                {anexosIteracao.length > 0 && (
                  <div
                    className={`mt-4 grid gap-3 ${anexosIteracao.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
                  >
                    {anexosIteracao.map((anexo) => (
                      <div key={anexo.id} className="rounded-lg overflow-hidden border border-gray-100">
                        <Image
                          src={anexo.url}
                          alt={anexo.nome ?? it.corpo.slice(0, 40)}
                          width={1200}
                          height={675}
                          className="w-full h-auto"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
