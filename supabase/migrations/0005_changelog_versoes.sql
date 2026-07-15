-- Changelog de versões por projeto (modal "Versões / Changelog")
-- Colar este arquivo inteiro no SQL Editor do projeto Supabase.

create table if not exists versoes (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos(id) on delete cascade,
  numero text not null,
  descricao text,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists funcionalidades (
  id uuid primary key default gen_random_uuid(),
  versao_id uuid not null references versoes(id) on delete cascade,
  nome text not null,
  descricao text,
  novidade boolean not null default false,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists funcionalidade_imagens (
  id uuid primary key default gen_random_uuid(),
  funcionalidade_id uuid not null references funcionalidades(id) on delete cascade,
  url text not null,
  nome text,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_versoes_projeto on versoes(projeto_id);
create index if not exists idx_funcionalidades_versao on funcionalidades(versao_id);
create index if not exists idx_funcionalidade_imagens_funcionalidade on funcionalidade_imagens(funcionalidade_id);

-- =========================================================
-- RLS — leitura pública, escrita só admin (mesmo padrão de cards/anexos)
-- =========================================================
alter table versoes enable row level security;
alter table funcionalidades enable row level security;
alter table funcionalidade_imagens enable row level security;

create policy "versoes_select_public" on versoes for select using (true);
create policy "funcionalidades_select_public" on funcionalidades for select using (true);
create policy "funcionalidade_imagens_select_public" on funcionalidade_imagens for select using (true);

create policy "versoes_write_admin" on versoes for all
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
create policy "funcionalidades_write_admin" on funcionalidades for all
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
create policy "funcionalidade_imagens_write_admin" on funcionalidade_imagens for all
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Reaproveita o bucket de storage "anexos" já existente (policies de leitura
-- pública e escrita admin já cobrem qualquer objeto desse bucket, incluindo
-- os prefixados com "changelog/<funcionalidade_id>/...").
