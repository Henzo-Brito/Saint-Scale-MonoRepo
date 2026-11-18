-- Migration 007: Adicionar id_cargo_fk em membros e popular cargos (C1)
-- Data: 2026-10-18
-- Branch: feat/merge-phase1

-- UP
DO $$
DECLARE
    v_col_exists BOOLEAN;
    v_lider_id INTEGER;
    v_membro_id INTEGER;
BEGIN
    -- Verifica se a coluna id_cargo_fk já existe em membros
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'membros' AND column_name = 'id_cargo_fk'
    ) INTO v_col_exists;

    IF NOT v_col_exists THEN
        ALTER TABLE membros ADD COLUMN id_cargo_fk INTEGER REFERENCES cargos(id_cargo);
    END IF;

    -- Seed: Líder de ministério (se não existir para a igreja 1)
    INSERT INTO cargos (nome, permissoes, id_igreja_fk)
    SELECT 'Líder de ministério', 'equipes,musicas,escalas,aprovar,codigo', 1
    WHERE NOT EXISTS (SELECT 1 FROM cargos WHERE nome = 'Líder de ministério' AND id_igreja_fk = 1);

    -- Seed: Membro (se não existir para a igreja 1)
    INSERT INTO cargos (nome, permissoes, id_igreja_fk)
    SELECT 'Membro', NULL, 1
    WHERE NOT EXISTS (SELECT 1 FROM cargos WHERE nome = 'Membro' AND id_igreja_fk = 1);

    -- Resolve IDs dos cargos seedados/existentes
    SELECT id_cargo INTO v_lider_id FROM cargos WHERE nome = 'Líder de ministério' AND id_igreja_fk = 1 LIMIT 1;
    SELECT id_cargo INTO v_membro_id FROM cargos WHERE nome = 'Membro' AND id_igreja_fk = 1 LIMIT 1;

    -- Popula id_cargo_fk para membros existentes baseado no cargo VARCHAR
    UPDATE membros SET id_cargo_fk = v_lider_id WHERE cargo ILIKE 'lider' AND id_cargo_fk IS NULL;
    UPDATE membros SET id_cargo_fk = v_membro_id WHERE cargo ILIKE 'membro' AND id_cargo_fk IS NULL;

    CREATE INDEX IF NOT EXISTS idx_membros_cargo ON membros(id_cargo_fk);
END$$;

-- ROLLBACK
-- ALTER TABLE membros DROP COLUMN IF EXISTS id_cargo_fk;
