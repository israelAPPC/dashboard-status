import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getProjetos } from "@/lib/kanban";

export const revalidate = 0;

export default async function Home() {
  const projetos = await getProjetos();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-slate-800">Projetos</h1>
        <p className="text-sm text-slate-500 mt-1">
          Selecione um projeto para ver o Kanban de acompanhamento.
        </p>
      </div>

      {projetos.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum projeto cadastrado ainda.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projetos.map((projeto) => (
            <Link
              key={projeto.id}
              href={`/projeto/${projeto.slug}`}
              className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-2 hover:border-[#2c98b0]/30 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">{projeto.nome}</h2>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#2c98b0] transition-colors" />
              </div>
              {projeto.descricao && (
                <p className="text-sm text-slate-500 line-clamp-2">{projeto.descricao}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
