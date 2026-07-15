"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ImagePlus, X } from "lucide-react";
import { getSupabase, STORAGE_BUCKET } from "@/lib/supabase";
import { buildStorageUploadPath } from "@/lib/storage-path";
import { getUserRole, getUserId, getUserNome } from "@/lib/auth-role";
import { getProjetos, criarDemanda, criarAnexo } from "@/lib/kanban";
import BackLink from "@/components/BackLink";
import type { Projeto, TipoDemanda } from "@/lib/supabase-types";

const MAX_IMAGENS = 5;
const MAX_TAMANHO_MB = 5;

function NovaDemandaForm() {
  const searchParams = useSearchParams();
  const projetoPreSelecionado = searchParams.get("projeto");

  const [verificando, setVerificando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [projetoId, setProjetoId] = useState("");
  const [tipo, setTipo] = useState<TipoDemanda>("erro");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imagens, setImagens] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let ativo = true;
    getUserRole().then(async (role) => {
      if (!ativo) return;
      if (role !== "externo") {
        setAutorizado(false);
        setVerificando(false);
        return;
      }
      setAutorizado(true);
      const lista = await getProjetos();
      if (!ativo) return;
      setProjetos(lista);
      if (projetoPreSelecionado) {
        const encontrado = lista.find((p) => p.slug === projetoPreSelecionado);
        if (encontrado) setProjetoId(encontrado.id);
      } else if (lista.length > 0) {
        setProjetoId(lista[0].id);
      }
      setVerificando(false);
    });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelecionarArquivos(e: React.ChangeEvent<HTMLInputElement>) {
    const novos = Array.from(e.target.files ?? []);
    setErro(null);
    const combinados = [...imagens, ...novos];
    if (combinados.length > MAX_IMAGENS) {
      setErro(`Máximo de ${MAX_IMAGENS} imagens.`);
      return;
    }
    const grandeDemais = novos.find((f) => f.size > MAX_TAMANHO_MB * 1024 * 1024);
    if (grandeDemais) {
      setErro(`"${grandeDemais.name}" excede ${MAX_TAMANHO_MB}MB.`);
      return;
    }
    setImagens(combinados);
    e.target.value = "";
  }

  function handleRemoverImagem(index: number) {
    setImagens((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!projetoId) {
      setErro("Selecione um projeto.");
      return;
    }
    if (!titulo.trim() || !descricao.trim()) {
      setErro("Preencha título e descrição.");
      return;
    }
    if (imagens.length === 0) {
      setErro("Anexe pelo menos 1 imagem.");
      return;
    }

    setEnviando(true);
    try {
      const autorId = await getUserId();
      if (!autorId) throw new Error("Sessão inválida. Faça login novamente.");
      const autorNome = await getUserNome();

      const card = await criarDemanda({
        projetoId,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        tipo,
        autorId,
        autorNome,
      });

      for (const arquivo of imagens) {
        const caminho = buildStorageUploadPath(card.id, arquivo);
        const { error: uploadError } = await getSupabase()
          .storage.from(STORAGE_BUCKET)
          .upload(caminho, arquivo);
        if (uploadError) throw uploadError;
        const { data: pub } = getSupabase().storage.from(STORAGE_BUCKET).getPublicUrl(caminho);
        await criarAnexo({ cardId: card.id, url: pub.publicUrl, nome: arquivo.name });
      }

      setSucesso(card.numero_demanda);
      setTitulo("");
      setDescricao("");
      setImagens([]);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao enviar demanda.");
    } finally {
      setEnviando(false);
    }
  }

  if (verificando) return <p className="text-sm text-slate-400">Verificando acesso...</p>;

  if (!autorizado) {
    return (
      <div>
        <BackLink fallbackHref="/" label="Voltar" />
        <p className="text-sm text-slate-500">
          Esta página é exclusiva para usuários externos autorizados a reportar demandas.
        </p>
      </div>
    );
  }

  if (sucesso !== null) {
    return (
      <div>
        <BackLink fallbackHref="/" label="Voltar" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-lg font-semibold text-slate-800 mb-2">Demanda enviada!</h1>
          <p className="text-sm text-slate-600">
            Sua demanda foi registrada como card <span className="font-mono">#{sucesso}</span> e já aparece no
            board do projeto, na coluna &quot;Em aberto/análise&quot;.
          </p>
          <button
            onClick={() => setSucesso(null)}
            className="mt-4 bg-[#2c98b0] hover:bg-[#2c98b0]/90 text-white font-medium text-sm px-3 py-2 rounded-md transition-colors"
          >
            Reportar outra demanda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BackLink fallbackHref="/" label="Voltar" />
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Reportar erro ou melhoria</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Projeto</label>
          <select
            value={projetoId}
            onChange={(e) => setProjetoId(e.target.value)}
            className="w-full text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
          >
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
          <div className="flex gap-2">
            {(["erro", "melhoria"] as TipoDemanda[]).map((opcao) => (
              <button
                key={opcao}
                type="button"
                onClick={() => setTipo(opcao)}
                className={`flex-1 text-sm font-medium rounded-md px-3 py-2 border transition-colors ${
                  tipo === opcao
                    ? "bg-[#2c98b0] text-white border-[#2c98b0]"
                    : "bg-white text-slate-600 border-gray-200 hover:border-[#2c98b0]/40"
                }`}
              >
                {opcao === "erro" ? "Erro" : "Melhoria"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Título</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            className="w-full text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Descrição</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
            rows={4}
            className="w-full text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Imagens (obrigatório, até {MAX_IMAGENS}, {MAX_TAMANHO_MB}MB cada)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleSelecionarArquivos}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={imagens.length >= MAX_IMAGENS}
            className="inline-flex items-center gap-1.5 bg-[#2c98b0] hover:bg-[#2c98b0]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm px-3 py-2 rounded-md transition-colors"
          >
            <ImagePlus className="w-4 h-4" />
            Selecionar imagens
          </button>
          {imagens.length > 0 && (
            <ul className="space-y-1 mt-2">
              {imagens.map((f, i) => {
                const previewUrl = URL.createObjectURL(f);
                return (
                  <li
                    key={`${f.name}-${i}`}
                    className="flex items-center justify-between gap-2 text-xs text-slate-600 bg-gray-50 rounded px-2 py-1"
                  >
                    <span className="flex items-center gap-2 truncate">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt={f.name}
                        className="w-8 h-8 rounded object-cover shrink-0 border border-gray-200"
                        onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                      />
                      <span className="truncate">
                        {f.name} <span className="text-slate-400">({(f.size / 1024).toFixed(0)} KB)</span>
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoverImagem(i)}
                      className="text-red-500 hover:text-red-600 shrink-0"
                      title="Remover"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {erro && <p className="text-xs text-red-500">{erro}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="bg-[#2c98b0] hover:bg-[#2c98b0]/90 disabled:opacity-60 text-white font-medium text-sm px-3 py-2 rounded-md transition-colors"
        >
          {enviando ? "Enviando..." : "Enviar demanda"}
        </button>
      </form>
    </div>
  );
}

export default function NovaDemandaPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Carregando...</p>}>
      <NovaDemandaForm />
    </Suspense>
  );
}
