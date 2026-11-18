-- Migration 003: Adicionar id_igreja_fk nas tabelas de domínio
-- Data: 2026-10-18
-- Branch: feat/merge-phase1

-- UP
-- Nota: id_igreja_fk é adicionada como NULLABLE para preservar registros existentes.
-- NOT NULL será aplicado somente após a migração de dados aprovada.

ALTER TABLE membros      ADD COLUMN IF NOT EXISTS id_igreja_fk INTEGER REFERENCES igrejas(id_igreja);
ALTER TABLE escalas      ADD COLUMN IF NOT EXISTS id_igreja_fk INTEGER REFERENCES igrejas(id_igreja);
ALTER TABLE equipes      ADD COLUMN IF NOT EXISTS id_igreja_fk INTEGER REFERENCES igrejas(id_igreja);
ALTER TABLE musicas      ADD COLUMN IF NOT EXISTS id_igreja_fk INTEGER REFERENCES igrejas(id_igreja);
ALTER TABLE logradouros  ADD COLUMN IF NOT EXISTS id_igreja_fk INTEGER REFERENCES igrejas(id_igreja);
ALTER TABLE lembretes    ADD COLUMN IF NOT EXISTS id_igreja_fk INTEGER REFERENCES igrejas(id_igreja);
ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS id_igreja_fk INTEGER REFERENCES igrejas(id_igreja);

-- Associar todos os registros existentes à Igreja 1 (Opção B aprovada)
UPDATE membros      SET id_igreja_fk = 1 WHERE id_igreja_fk IS NULL;
UPDATE escalas      SET id_igreja_fk = 1 WHERE id_igreja_fk IS NULL;
UPDATE equipes      SET id_igreja_fk = 1 WHERE id_igreja_fk IS NULL;
UPDATE musicas      SET id_igreja_fk = 1 WHERE id_igreja_fk IS NULL;
UPDATE logradouros  SET id_igreja_fk = 1 WHERE id_igreja_fk IS NULL;
UPDATE lembretes    SET id_igreja_fk = 1 WHERE id_igreja_fk IS NULL;
UPDATE notificacoes SET id_igreja_fk = 1 WHERE id_igreja_fk IS NULL;

CREATE INDEX IF NOT EXISTS idx_membros_igreja      ON membros(id_igreja_fk);
CREATE INDEX IF NOT EXISTS idx_escalas_igreja      ON escalas(id_igreja_fk);
CREATE INDEX IF NOT EXISTS idx_equipes_igreja      ON equipes(id_igreja_fk);
CREATE INDEX IF NOT EXISTS idx_musicas_igreja      ON musicas(id_igreja_fk);
CREATE INDEX IF NOT EXISTS idx_logradouros_igreja  ON logradouros(id_igreja_fk);
CREATE INDEX IF NOT EXISTS idx_lembretes_igreja    ON lembretes(id_igreja_fk);
CREATE INDEX IF NOT EXISTS idx_notificacoes_igreja ON notificacoes(id_igreja_fk);

-- ROLLBACK
-- DROP INDEX IF EXISTS idx_notificacoes_igreja;
-- DROP INDEX IF EXISTS idx_lembretes_igreja;
-- DROP INDEX IF EXISTS idx_logradouros_igreja;
-- DROP INDEX IF EXISTS idx_musicas_igreja;
-- DROP INDEX IF EXISTS idx_equipes_igreja;
-- DROP INDEX IF EXISTS idx_escalas_igreja;
-- DROP INDEX IF EXISTS idx_membros_igreja;
-- ALTER TABLE notificacoes DROP COLUMN IF EXISTS id_igreja_fk;
-- ALTER TABLE lembretes    DROP COLUMN IF EXISTS id_igreja_fk;
-- ALTER TABLE logradouros  DROP COLUMN IF EXISTS id_igreja_fk;
-- ALTER TABLE musicas      DROP COLUMN IF EXISTS id_igreja_fk;
-- ALTER TABLE equipes      DROP COLUMN IF EXISTS id_igreja_fk;
-- ALTER TABLE escalas      DROP COLUMN IF EXISTS id_igreja_fk;
-- ALTER TABLE membros      DROP COLUMN IF EXISTS id_igreja_fk;
