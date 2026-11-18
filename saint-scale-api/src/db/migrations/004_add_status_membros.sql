-- Migration 004: Adicionar status em membros
-- Data: 2026-10-18
-- Branch: feat/merge-phase1

-- UP
DO $$
DECLARE
    v_col_exists BOOLEAN;
    v_type_exists BOOLEAN;
    v_udt_name TEXT;
BEGIN
    SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_membro') INTO v_type_exists;
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'membros' AND column_name = 'status'
    ) INTO v_col_exists;

    -- Validação de consistência de estado parcial:
    -- Se a coluna já existir mas não utilizar o tipo 'status_membro', falha explicitamente.
    IF v_col_exists THEN
        SELECT udt_name INTO v_udt_name
        FROM information_schema.columns
        WHERE table_name = 'membros' AND column_name = 'status';

        IF v_udt_name <> 'status_membro' THEN
            RAISE EXCEPTION 'Coluna membros.status ja existe mas possui tipo incompativel (udt_name: %)', v_udt_name;
        END IF;

        -- Reexecução segura: coluna já existe e possui o tipo correto.
        -- Não executa UPDATE incondicional para não sobrescrever membros novos (pendentes) ou bloqueados.
        RAISE NOTICE 'Migration 004 ja aplicada anteriormente. Nenhuma alteracao realizada.';
        RETURN;
    END IF;

    -- Criação do tipo ENUM se não existir
    IF NOT v_type_exists THEN
        CREATE TYPE status_membro AS ENUM ('pendente', 'aprovado', 'bloqueado');
    END IF;

    -- Criação inicial da coluna membros.status:
    -- Registros preexistentes recebem 'aprovado' (DECISION-LOG: STATUS-C5 e MIGRATION-001)
    ALTER TABLE membros ADD COLUMN status status_membro NOT NULL DEFAULT 'aprovado';

    -- Altera o DEFAULT para 'pendente' para todos os novos cadastros futuros
    ALTER TABLE membros ALTER COLUMN status SET DEFAULT 'pendente'::status_membro;
END$$;

-- ROLLBACK
-- Instruções de reversão (execução manual somente se necessário):
-- A remoção da coluna deve preceder estritamente a remoção do tipo ENUM.
-- Não utilize CASCADE no DROP TYPE para evitar a eliminação acidental de dependências não mapeadas.
-- 1. ALTER TABLE membros DROP COLUMN IF EXISTS status;
-- 2. DROP TYPE IF EXISTS status_membro; -- Falhará intencionalmente se outros objetos dependerem do tipo.

