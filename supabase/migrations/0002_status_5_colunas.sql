-- Kanban de Projetos — expande status de 3 para 5 colunas
-- Colar este arquivo inteiro no SQL Editor do projeto Supabase.

alter table cards drop constraint if exists cards_status_check;

alter table cards
  add constraint cards_status_check
  check (status in ('em-aberto', 'parado', 'em-desenvolvimento', 'em-teste', 'finalizado'));

alter table cards alter column status set default 'em-aberto';
