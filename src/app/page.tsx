import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getModulos, getAtualizacoesPorModulo } from "@/lib/content";
import { STATUS_LABEL, STATUS_CLASSES, STATUS_DOT } from "@/lib/status";

export default function Home() {
  const modulos = getModulos();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-slate-800">Módulos do Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Selecione um módulo para ver o histórico de atualizações.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {modulos.map((modulo) => {
          const atualizacoes = getAtualizacoesPorModulo(modulo.slug);
          const ultima = atualizacoes[0];

          return (
            <Link
              key={modulo.slug}
              href={`/modulo/${modulo.slug}`}
              className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-3 hover:border-[#2c98b0]/30 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">{modulo.nome}</h2>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#2c98b0] transition-colors" />
              </div>

              {ultima ? (
                <>
                  <span
                    className={`inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CLASSES[ultima.status]}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[ultima.status]}`} />
                    {STATUS_LABEL[ultima.status]}
                  </span>
                  <p className="text-sm text-slate-600 line-clamp-2">{ultima.titulo}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(ultima.data + "T00:00:00").toLocaleDateString("pt-BR")} · {atualizacoes.length} atualização{atualizacoes.length !== 1 ? "ões" : ""}
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-400">Nenhuma atualização ainda</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
