import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getModulos, getAtualizacoesPorModulo } from "@/lib/content";
import { STATUS_LABEL, STATUS_CLASSES, STATUS_DOT } from "@/lib/status";

export function generateStaticParams() {
  return getModulos().map((m) => ({ slug: m.slug }));
}

export default async function ModuloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const modulo = getModulos().find((m) => m.slug === slug);
  if (!modulo) notFound();

  const atualizacoes = getAtualizacoesPorModulo(slug);

  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#2c98b0] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar aos módulos
      </Link>

      <h1 className="text-xl font-semibold text-slate-800 mb-6">{modulo.nome}</h1>

      {atualizacoes.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma atualização registrada ainda.</p>
      ) : (
        <div className="space-y-4">
          {atualizacoes.map((a) => (
            <div
              key={a.slug}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <p className="text-xs text-slate-400">
                  {new Date(a.data + "T00:00:00").toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CLASSES[a.status]}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[a.status]}`} />
                  {STATUS_LABEL[a.status]}
                </span>
              </div>

              <h2 className="font-semibold text-slate-800 mb-2">{a.titulo}</h2>
              <p className="text-sm text-slate-600 whitespace-pre-line">{a.corpo}</p>

              {a.imagens.length > 0 && (
                <div
                  className={`mt-4 grid gap-3 ${a.imagens.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
                >
                  {a.imagens.map((src, i) => (
                    <div key={src + i} className="rounded-lg overflow-hidden border border-gray-100">
                      <Image
                        src={src}
                        alt={`${a.titulo} — imagem ${i + 1}`}
                        width={1200}
                        height={675}
                        className="w-full h-auto"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
