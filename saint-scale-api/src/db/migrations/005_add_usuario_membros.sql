-- Migration 005: Adicionar coluna usuario em membros
-- Data: 2026-10-18
-- Branch: feat/merge-phase1

-- UP
DO $$
DECLARE
    v_col_exists BOOLEAN;
    v_con_exists_on_membros BOOLEAN;
    v_con_conflict_other_table TEXT;
    v_data_type TEXT;
    v_char_len INTEGER;
    v_is_nullable TEXT;
    v_default TEXT;
    v_con_type CHAR;
    v_con_cols TEXT[];
BEGIN
    -- 1. Verifica pré-existência da tabela membros no schema public
    IF to_regclass('public.membros') IS NULL THEN
        RAISE EXCEPTION 'Tabela public.membros nao existe.';
    END IF;

    -- 2. Inspeciona a coluna public.membros.usuario
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'membros' AND column_name = 'usuario'
    ) INTO v_col_exists;

    -- 3. Inspeciona se ha conflito de nome da constraint em OUTRA tabela do schema public
    SELECT rel.relname INTO v_con_conflict_other_table
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public' 
      AND con.conname = 'membros_usuario_unique'
      AND rel.relname <> 'membros'
    LIMIT 1;

    IF v_con_conflict_other_table IS NOT NULL THEN
        RAISE EXCEPTION 'Conflito de nome: constraint membros_usuario_unique ja existe na tabela public.%.', v_con_conflict_other_table;
    END IF;

    -- 4. Inspeciona a constraint membros_usuario_unique especificamente em public.membros
    SELECT 
        con.contype,
        array_agg(att.attname ORDER BY array_position(con.conkey, att.attnum))
    INTO v_con_type, v_con_cols
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
    WHERE nsp.nspname = 'public' 
      AND rel.relname = 'membros' 
      AND con.conname = 'membros_usuario_unique'
    GROUP BY con.contype;

    v_con_exists_on_membros := (v_con_type IS NOT NULL);

    -- 5. Analise de Idempotencia e Estados Parciais Incompatíveis
    IF v_col_exists THEN
        -- Coluna existe: valida atributos estritamente
        SELECT data_type, character_maximum_length, is_nullable, column_default
        INTO v_data_type, v_char_len, v_is_nullable, v_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'membros' AND column_name = 'usuario';

        IF v_data_type <> 'character varying' OR v_char_len <> 30 THEN
            RAISE EXCEPTION 'Coluna public.membros.usuario existe com tipo incompativel: % (tamanho: %)', v_data_type, v_char_len;
        END IF;

        IF v_is_nullable <> 'YES' THEN
            RAISE EXCEPTION 'Coluna public.membros.usuario existe mas possui restricao NOT NULL incompativel.';
        END IF;

        IF v_default IS NOT NULL THEN
            RAISE EXCEPTION 'Coluna public.membros.usuario existe com valor default inesperado: %', v_default;
        END IF;

        -- Se a coluna existe, a constraint DEVE existir e ser valida
        IF NOT v_con_exists_on_membros THEN
            RAISE EXCEPTION 'Estado parcial detectado: coluna public.membros.usuario existe, mas a constraint membros_usuario_unique esta ausente.';
        END IF;

        IF v_con_type <> 'u' OR v_con_cols IS DISTINCT FROM ARRAY['usuario'] THEN
            RAISE EXCEPTION 'Estado parcial detectado: constraint membros_usuario_unique existe com definicao incompativel (tipo: %, colunas: %)', v_con_type, v_con_cols;
        END IF;

        -- Estado perfeitamente compativel com migracao previamente aplicada
        RAISE NOTICE 'Migration 005 ja aplicada e consistente. Nenhuma alteracao realizada.';
        RETURN;
    END IF;

    -- Se a coluna nao existe, a constraint tambem nao deve existir em public.membros
    IF v_con_exists_on_membros THEN
        RAISE EXCEPTION 'Estado parcial detectado: constraint membros_usuario_unique existe em public.membros, mas a coluna usuario esta ausente.';
    END IF;

    -- 6. Criacao da coluna e da constraint (ambas ausentes)
    ALTER TABLE public.membros ADD COLUMN usuario VARCHAR(30);
    ALTER TABLE public.membros ADD CONSTRAINT membros_usuario_unique UNIQUE (usuario);
END$$;

-- ROLLBACK
-- Instrucoes de reversao (execucao manual somente se necessario):
-- A constraint de unicidade deve ser removida antes ou junto com a exclusao da coluna.
-- 1. ALTER TABLE public.membros DROP CONSTRAINT IF EXISTS membros_usuario_unique;
-- 2. ALTER TABLE public.membros DROP COLUMN IF EXISTS usuario;

