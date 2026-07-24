-- Roadmap (Próximas versões) por projeto — lista simples, sem funcionalidades/imagens.
-- Colar este arquivo inteiro no SQL Editor do projeto Supabase.

create table if not exists roadmap_itens (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos(id) on delete cascade,
  titulo text not null,
  descricao text,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_roadmap_itens_projeto on roadmap_itens(projeto_id);

-- =========================================================
-- RLS — leitura pública, escrita só admin (mesmo padrão de versoes)
-- =========================================================
alter table roadmap_itens enable row level security;

create policy "roadmap_itens_select_public" on roadmap_itens for select using (true);

create policy "roadmap_itens_write_admin" on roadmap_itens for all
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
