-- Demandas externas (reports de erro/melhoria) — usuários com role=externo
-- Colar este arquivo inteiro no SQL Editor do projeto Supabase.

-- =========================================================
-- Colunas novas em cards: tipo (erro/melhoria) e autor
-- =========================================================
alter table cards add column if not exists tipo text check (tipo in ('erro', 'melhoria'));
alter table cards add column if not exists autor_id uuid references auth.users(id) on delete set null;

-- =========================================================
-- Categoria fixa "Demandas Externas" por projeto
-- =========================================================
-- Backfill: garante a categoria em todo projeto já existente
insert into categorias (projeto_id, nome, slug, ordem)
select p.id, 'Demandas Externas', 'demandas-externas', 9999
from projetos p
where not exists (
  select 1 from categorias c where c.projeto_id = p.id and c.slug = 'demandas-externas'
);

-- Seed automático: todo projeto novo já nasce com a categoria
create or replace function seed_categoria_demandas_externas()
returns trigger language plpgsql as $$
begin
  insert into categorias (projeto_id, nome, slug, ordem)
  values (new.id, 'Demandas Externas', 'demandas-externas', 9999)
  on conflict (projeto_id, slug) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_projetos_seed_categoria on projetos;
create trigger trg_projetos_seed_categoria
  after insert on projetos
  for each row execute function seed_categoria_demandas_externas();

-- =========================================================
-- RLS — troca de "qualquer authenticated" por role=admin
-- (agora existem authenticated com role=externo também)
-- =========================================================
-- IMPORTANTE: ajuste o user_metadata do usuário admin atual para
-- {"role":"admin"} antes de aplicar esta migration (ver instruções
-- no fim deste arquivo), senão o admin perde acesso de escrita.

drop policy if exists "projetos_write_admin" on projetos;
create policy "projetos_write_admin" on projetos for all
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

drop policy if exists "categorias_write_admin" on categorias;
create policy "categorias_write_admin" on categorias for all
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

drop policy if exists "cards_write_admin" on cards;
create policy "cards_write_admin" on cards for all
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

drop policy if exists "iteracoes_write_admin" on iteracoes;
create policy "iteracoes_write_admin" on iteracoes for all
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

drop policy if exists "anexos_write_admin" on anexos;
create policy "anexos_write_admin" on anexos for all
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

drop policy if exists "anexos_storage_write_admin" on storage.objects;
create policy "anexos_storage_write_admin" on storage.objects
  for all using (bucket_id = 'anexos' and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  with check (bucket_id = 'anexos' and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- =========================================================
-- RLS — usuário externo: só INSERT na sua própria demanda
-- (não pode criar/editar/apagar projetos, categorias, nem
-- cards/iterações que não sejam dele)
-- =========================================================
drop policy if exists "cards_insert_externo" on cards;
create policy "cards_insert_externo" on cards for insert
  to authenticated
  with check (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'externo'
    and autor_id = auth.uid()
    and tipo in ('erro', 'melhoria')
    and categoria_id in (select id from categorias where slug = 'demandas-externas')
  );

drop policy if exists "anexos_insert_externo" on anexos;
create policy "anexos_insert_externo" on anexos for insert
  to authenticated
  with check (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'externo'
    and card_id in (select id from cards where autor_id = auth.uid())
    and iteracao_id is null
  );

drop policy if exists "anexos_storage_insert_externo" on storage.objects;
create policy "anexos_storage_insert_externo" on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'anexos' and (auth.jwt() -> 'user_metadata' ->> 'role') = 'externo');

-- =========================================================
-- Passos manuais (Supabase Dashboard) — não automatizáveis por SQL
-- =========================================================
-- 1. Cole este arquivo inteiro no SQL Editor do projeto e rode.
-- 2. Ajuste o usuário admin atual: Authentication > Users > (usuário
--    admin) > "User Metadata" > cole:
--      {"role": "admin"}
--    Salve. (Sem isso, o admin perde permissão de escrita após esta
--    migration, pois as policies deixam de aceitar qualquer authenticated.)
-- 3. Para cada usuário externo, crie manualmente em Authentication >
--    Users > Add user, e em "User Metadata" cole:
--      {"role": "externo"}
