-- Nome público do autor de demandas externas
-- Colar este arquivo inteiro no SQL Editor do projeto Supabase.

-- =========================================================
-- Coluna autor_nome: nome legível do autor, gravado no momento
-- da criação da demanda (a partir de user_metadata.nome do
-- usuário externo logado). auth.users não é exposto por RLS
-- ao público, então o nome precisa ser persistido em cards.
-- =========================================================
alter table cards add column if not exists autor_nome text;

-- =========================================================
-- Passos manuais (Supabase Dashboard) — não automatizáveis por SQL
-- =========================================================
-- 1. Cole este arquivo inteiro no SQL Editor do projeto e rode.
-- 2. Nada além disso: usuários externos já deveriam ter
--    user_metadata.nome preenchido (ver instruções da migration
--    0003_demandas_externas.sql). Se algum usuário externo não tiver
--    "nome" no User Metadata, cards criados por ele ficarão com
--    autor_nome nulo — edite o User Metadata em Authentication > Users
--    para incluir {"role": "externo", "nome": "Nome da Pessoa"}.
