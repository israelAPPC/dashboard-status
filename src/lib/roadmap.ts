import { getSupabase } from "@/lib/supabase";
import type { RoadmapItem } from "@/lib/supabase-types";

// ---------- Leitura (pública) ----------

export async function getRoadmapPorProjeto(projetoId: string): Promise<RoadmapItem[]> {
  const { data, error } = await getSupabase()
    .from("roadmap_itens")
    .select("*")
    .eq("projeto_id", projetoId)
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ---------- Escrita (admin autenticado) ----------

export async function criarRoadmapItem(projetoId: string, titulo: string, descricao?: string, ordem = 0) {
  const { data, error } = await getSupabase()
    .from("roadmap_itens")
    .insert({ projeto_id: projetoId, titulo, descricao: descricao ?? null, ordem })
    .select()
    .single();
  if (error) throw error;
  return data as RoadmapItem;
}

export async function atualizarRoadmapItem(
  id: string,
  patch: Partial<Pick<RoadmapItem, "titulo" | "descricao" | "ordem">>
) {
  const { data, error } = await getSupabase()
    .from("roadmap_itens")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as RoadmapItem;
}

export async function excluirRoadmapItem(id: string) {
  const { error } = await getSupabase().from("roadmap_itens").delete().eq("id", id);
  if (error) throw error;
}
