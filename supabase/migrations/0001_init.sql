-- Kanban de Projetos — schema inicial (dygnus-status)
-- Colar este arquivo inteiro no SQL Editor do projeto Supabase.

create extension if not exists "pgcrypto";

-- Sequência global de numeração de demanda (compartilhada entre todos os projetos)
create sequence if not exists global_demanda_seq start 1;

create table if not exists projetos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  descricao text,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists categorias (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos(id) on delete cascade,
  nome text not null,
  slug text not null,
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  unique (projeto_id, slug)
);

create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references categorias(id) on delete cascade,
  numero_demanda bigint not null default nextval('global_demanda_seq') unique,
  titulo text not null,
  descricao text,
  status text not null default 'em-desenvolvimento'
    check (status in ('parado', 'em-desenvolvimento', 'finalizado')),
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists iteracoes (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  corpo text not null,
  data date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists anexos (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references cards(id) on delete cascade,
  iteracao_id uuid references iteracoes(id) on delete cascade,
  url text not null,
  nome text,
  created_at timestamptz not null default now(),
  check (card_id is not null or iteracao_id is not null)
);

-- updated_at automático em cards
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_cards_updated_at on cards;
create trigger trg_cards_updated_at
  before update on cards
  for each row execute function set_updated_at();

-- Índices de apoio
create index if not exists idx_categorias_projeto on categorias(projeto_id);
create index if not exists idx_cards_categoria on cards(categoria_id);
create index if not exists idx_iteracoes_card on iteracoes(card_id);
create index if not exists idx_anexos_card on anexos(card_id);
create index if not exists idx_anexos_iteracao on anexos(iteracao_id);

-- =========================================================
-- RLS — leitura pública (diretoria), escrita só autenticado
-- =========================================================
-- IMPORTANTE: no Supabase Auth deste projeto, deixe o cadastro público
-- DESATIVADO (Authentication > Providers > Email > "Allow new users to
-- sign up" = OFF). Crie manualmente o único usuário admin em
-- Authentication > Users > Add user. Como não há cadastro público,
-- "authenticated" == o admin.

alter table projetos enable row level security;
alter table categorias enable row level security;
alter table cards enable row level security;
alter table iteracoes enable row level security;
alter table anexos enable row level security;

-- Leitura pública (anon + authenticated) em todas as tabelas
create policy "projetos_select_public" on projetos for select using (true);
create policy "categorias_select_public" on categorias for select using (true);
create policy "cards_select_public" on cards for select using (true);
create policy "iteracoes_select_public" on iteracoes for select using (true);
create policy "anexos_select_public" on anexos for select using (true);

-- Escrita apenas para usuário autenticado (o admin)
create policy "projetos_write_admin" on projetos for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "categorias_write_admin" on categorias for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "cards_write_admin" on cards for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "iteracoes_write_admin" on iteracoes for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "anexos_write_admin" on anexos for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- =========================================================
-- Storage — bucket de anexos
-- =========================================================
insert into storage.buckets (id, name, public)
values ('anexos', 'anexos', true)
on conflict (id) do nothing;

create policy "anexos_storage_select_public" on storage.objects
  for select using (bucket_id = 'anexos');

create policy "anexos_storage_write_admin" on storage.objects
  for all using (bucket_id = 'anexos' and auth.role() = 'authenticated')
  with check (bucket_id = 'anexos' and auth.role() = 'authenticated');
