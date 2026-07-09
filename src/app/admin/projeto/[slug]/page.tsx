"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import {
  criarCategoria,
  criarCard,
  atualizarCard,
} from "@/lib/kanban";
import { STATUS_LABEL, STATUS_DOT, TIPO_LABEL, TIPO_CLASSES } from "@/lib/status";
import type { Card, Categoria, Projeto, Status } from "@/lib/supabase-types";

const COLUNAS: Status[] = ["em-aberto", "parado", "em-desenvolvimento", "em-teste", "finalizado"];

function CardChip({ card }: { card: Card }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white rounded-lg border border-gray-100 shadow-sm p-3 cursor-grab active:cursor-grabbing ${isDragging ? "opacity-60" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-800 line-clamp-2">{card.titulo}</p>
        <span className="shrink-0 text-[10px] font-mono text-slate-400">#{card.numero_demanda}</span>
      </div>
      {card.tipo && (
        <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${TIPO_CLASSES[card.tipo]}`}>
          {TIPO_LABEL[card.tipo]}
        </span>
      )}
      {card.autor_nome && (
        <p className="mt-1 text-[10px] text-slate-400 truncate">por {card.autor_nome}</p>
      )}
      <Link
        href={`/admin/card/${card.id}`}
        onPointerDown={(e) => e.stopPropagation()}
        className="text-xs text-[#2c98b0] hover:underline mt-1 inline-block"
      >
        editar / iterações
      </Link>
    </div>
  );
}

function Coluna({ id, status, cards }: { id: string; status: Status; cards: Card[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border p-3 min-h-[80px] transition-colors ${isOver ? "bg-[#2c98b0]/5 border-[#2c98b0]/30" : "bg-gray-50 border-gray-100"}`}
    >
      <div className="flex items-center gap-1.5 mb-3 px-1">
        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
        <span className="text-xs font-medium text-slate-500">
          {STATUS_LABEL[status]} · {cards.length}
        </span>
      </div>
      <div className="space-y-2">
        {cards.map((card) => (
          <CardChip key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}

export default function AdminProjetoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [novoCard, setNovoCard] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    const sb = getSupabase();
    const { data: p } = await sb.from("projetos").select("*").eq("slug", slug).maybeSingle();
    if (!p) return;
    setProjeto(p);
    const { data: cats } = await sb.from("categorias").select("*").eq("projeto_id", p.id).order("ordem");
    setCategorias(cats ?? []);
    const catIds = (cats ?? []).map((c) => c.id);
    if (catIds.length > 0) {
      const { data: cds } = await sb.from("cards").select("*").in("categoria_id", catIds).order("ordem");
      setCards(cds ?? []);
    } else {
      setCards([]);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  function slugify(texto: string) {
    return texto.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function handleCriarCategoria(e: React.FormEvent) {
    e.preventDefault();
    if (!projeto || !novaCategoria.trim()) return;
    try {
      await criarCategoria(projeto.id, novaCategoria.trim(), slugify(novaCategoria), categorias.length);
      setNovaCategoria("");
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao criar categoria.");
    }
  }

  async function handleCriarCard(categoriaId: string) {
    const titulo = novoCard[categoriaId]?.trim();
    if (!titulo) return;
    try {
      await criarCard(categoriaId, titulo, "em-aberto");
      setNovoCard((s) => ({ ...s, [categoriaId]: "" }));
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao criar card.");
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const cardId = String(active.id);
    const [categoriaId, status] = String(over.id).split("::");
    const card = cards.find((c) => c.id === cardId);
    if (!card || (card.categoria_id === categoriaId && card.status === status)) return;

    const novaOrdem = cards.filter((c) => c.categoria_id === categoriaId && c.status === status).length;
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, categoria_id: categoriaId, status: status as Status, ordem: novaOrdem } : c))
    );
    try {
      await atualizarCard(cardId, { categoria_id: categoriaId, status: status as Status, ordem: novaOrdem });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao mover card.");
      await carregar();
    }
  }

  if (!projeto) return <p className="text-sm text-slate-400">Carregando...</p>;

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-800 mb-6">{projeto.nome} — Kanban</h1>

      <form onSubmit={handleCriarCategoria} className="flex gap-2 mb-8">
        <input
          value={novaCategoria}
          onChange={(e) => setNovaCategoria(e.target.value)}
          placeholder="Nova categoria/módulo"
          className="flex-1 text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 bg-[#2c98b0] hover:bg-[#2c98b0]/90 text-white font-medium text-sm px-3 py-2 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Criar categoria
        </button>
      </form>

      {erro && <p className="text-xs text-red-500 mb-4">{erro}</p>}

      <DndContext onDragEnd={handleDragEnd}>
        <div className="space-y-10">
          {categorias.map((categoria) => {
            const cardsCategoria = cards.filter((c) => c.categoria_id === categoria.id);
            return (
              <section key={categoria.id}>
                <h2 className="font-semibold text-slate-700 mb-3">{categoria.nome}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                  {COLUNAS.map((status) => (
                    <Coluna
                      key={status}
                      id={`${categoria.id}::${status}`}
                      status={status}
                      cards={cardsCategoria.filter((c) => c.status === status).sort((a, b) => a.ordem - b.ordem)}
                    />
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <input
                    value={novoCard[categoria.id] ?? ""}
                    onChange={(e) => setNovoCard((s) => ({ ...s, [categoria.id]: e.target.value }))}
                    placeholder="Novo card (entra em Aberto/análise)"
                    className="flex-1 text-sm p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2c98b0]"
                  />
                  <button
                    onClick={() => handleCriarCard(categoria.id)}
                    className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white font-medium text-sm px-3 py-2 rounded-md transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Card
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}
