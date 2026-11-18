-- Migration 011: Transição do cargo Líder de ministério para Membro
-- Data: 2026-10-24
-- Prompt: 07/35 (Fase 2/6 — Simplificação dos cargos)
--
-- Contexto: O SaintScale passou a utilizar apenas dois perfis de acesso:
-- Administrador (id_cargo = 1) e Membro (todos os demais). O cargo
-- intermediário "Líder de ministério" foi removido do modelo de autorização.
--
-- Objetivo: Mover membros vinculados ao cargo "Líder de ministério" para o
-- cargo "Membro", preservando todos os vínculos com equipes, ministérios,
-- escalas, músicas e lembretes. Nenhum membro é transferido de igreja.
--
-- Esta migração NÃO deve ser executada automaticamente nesta etapa.
-- Registra sua finalidade para aplicação em momento posterior.

-- UP
DO $$
DECLARE
    v_lider_id INTEGER;
    v_membro_id INTEGER;
BEGIN
    -- Resolver IDs dos cargos existentes (idempotente: ignora se não existirem)
    SELECT id_cargo INTO v_lider_id
    FROM cargos
    WHERE nome = 'Líder de ministério' AND id_igreja_fk IS NOT NULL
    LIMIT 1;

    SELECT id_cargo INTO v_membro_id
    FROM cargos
    WHERE nome = 'Membro' AND id_igreja_fk IS NOT NULL
    LIMIT 1;

    -- Se ambos os cargos existem, transicionar membros de Líder para Membro
    IF v_lider_id IS NOT NULL AND v_membro_id IS NOT NULL THEN
        UPDATE membros
        SET id_cargo_fk = v_membro_id
        WHERE id_cargo_fk = v_lider_id;
    END IF;

    -- Se o cargo Membro não existe para alguma igreja, criar como idempotente
    -- (garante que membros sem cargo válido tenham um perfil Membro)
    INSERT INTO cargos (nome, permissoes, id_igreja_fk)
    SELECT 'Membro', NULL, m.id_igreja_fk
    FROM membros m
    WHERE m.id_cargo_fk IS NULL
      AND m.id_igreja_fk IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM cargos c
          WHERE c.nome = 'Membro' AND c.id_igreja_fk = m.id_igreja_fk
      );

    -- Atualizar membros sem cargo_fk para o Membro de sua igreja
    UPDATE membros m
    SET id_cargo_fk = c.id_cargo
    FROM cargos c
    WHERE m.id_cargo_fk IS NULL
      AND m.id_igreja_fk IS NOT NULL
      AND c.nome = 'Membro'
      AND c.id_igreja_fk = m.id_igreja_fk;
END$$;

-- ROLLBACK
-- (Reversão manual: restaurar id_cargo_fk para Líder de ministério onde aplicável)
