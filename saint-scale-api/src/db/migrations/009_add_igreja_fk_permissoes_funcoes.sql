-- Migration 009: Adicionar id_igreja_fk e permissoes em funcoes (cargos)
-- Data: 2026-10-19
-- Branch: feat/merge-phase
-- Necessario para: cadastro-igreja (POST /api/auth/cadastro-igreja)

-- UP
DO $$
DECLARE
    v_admin_id INTEGER;
    v_lider_id INTEGER;
    v_membro_id INTEGER;
BEGIN
    -- Adicionar colunas se nao existirem
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'funcoes' AND column_name = 'id_igreja_fk'
    ) THEN
        ALTER TABLE funcoes ADD COLUMN id_igreja_fk INTEGER REFERENCES igrejas(id_igreja) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'funcoes' AND column_name = 'permissoes'
    ) THEN
        ALTER TABLE funcoes ADD COLUMN permissoes VARCHAR(255);
    END IF;

    -- Associar funcoes existentes à Igreja 1 (registros pre-existentes)
    UPDATE funcoes SET id_igreja_fk = 1 WHERE id_igreja_fk IS NULL;

    -- Seed: Administrador (global, id_igreja_fk NULL)
    INSERT INTO funcoes (nome, permissoes, id_igreja_fk)
    SELECT 'Administrador', 'equipes,membros,aprovar,locais,musicas,escalas,ministerios,cargos,codigo', NULL
    WHERE NOT EXISTS (SELECT 1 FROM funcoes WHERE nome = 'Administrador' AND id_igreja_fk IS NULL);

    -- Seed: Líder de ministério (igreja 1)
    INSERT INTO funcoes (nome, permissoes, id_igreja_fk)
    SELECT 'Líder de ministério', 'equipes,musicas,escalas,aprovar,codigo', 1
    WHERE NOT EXISTS (SELECT 1 FROM funcoes WHERE nome = 'Líder de ministério' AND id_igreja_fk = 1);

    -- Seed: Membro (igreja 1)
    INSERT INTO funcoes (nome, permissoes, id_igreja_fk)
    SELECT 'Membro', NULL, 1
    WHERE NOT EXISTS (SELECT 1 FROM funcoes WHERE nome = 'Membro' AND id_igreja_fk = 1);

    -- Criar índice
    CREATE INDEX IF NOT EXISTS idx_funcoes_igreja ON funcoes(id_igreja_fk);

    -- Resolver IDs para uso posterior (nao necessario aqui, apenas para documento)
    SELECT id_funcao INTO v_admin_id FROM funcoes WHERE nome = 'Administrador' AND id_igreja_fk IS NULL LIMIT 1;
    SELECT id_funcao INTO v_lider_id FROM funcoes WHERE nome = 'Líder de ministério' AND id_igreja_fk = 1 LIMIT 1;
    SELECT id_funcao INTO v_membro_id FROM funcoes WHERE nome = 'Membro' AND id_igreja_fk = 1 LIMIT 1;
END$$;

-- ROLLBACK
-- ALTER TABLE funcoes DROP COLUMN IF EXISTS permissoes;
-- ALTER TABLE funcoes DROP COLUMN IF EXISTS id_igreja_fk;
-- DROP INDEX IF EXISTS idx_funcoes_igreja;
