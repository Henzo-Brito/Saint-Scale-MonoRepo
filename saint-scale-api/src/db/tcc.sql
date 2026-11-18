-- ============================================================
-- SaintScale — Schema MySQL (migrado do PostgreSQL)
-- Charset: utf8mb4 / Collation: utf8mb4_unicode_ci
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- DROP (ordem inversa das FKs)
-- ============================================================
DROP TABLE IF EXISTS lembrete_funcoes;
DROP TABLE IF EXISTS notificacoes;
DROP TABLE IF EXISTS lembretes;
DROP TABLE IF EXISTS membros_escalas;
DROP TABLE IF EXISTS membros_funcoes;
DROP TABLE IF EXISTS equipes_membros;
DROP TABLE IF EXISTS musicas_escalas;
DROP TABLE IF EXISTS musicas;
DROP TABLE IF EXISTS escalas;
DROP TABLE IF EXISTS membros;
DROP TABLE IF EXISTS equipes;
DROP TABLE IF EXISTS logradouros;
DROP TABLE IF EXISTS funcoes;
DROP TABLE IF EXISTS membros_ministerios;
DROP TABLE IF EXISTS ministerios;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS cargos;
DROP TABLE IF EXISTS igrejas;

-- ============================================================
-- igrejas
-- ============================================================
CREATE TABLE igrejas (
    id_igreja   INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome        VARCHAR(150) NOT NULL,
    criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- cargos
-- ============================================================
CREATE TABLE cargos (
    id_cargo     INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome         VARCHAR(150) NOT NULL,
    permissoes   VARCHAR(255),
    id_igreja_fk INT,
    criado_em    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_igreja_fk) REFERENCES igrejas(id_igreja) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- funcoes
-- ============================================================
CREATE TABLE funcoes (
    id_funcao    INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome         VARCHAR(100) NOT NULL,
    permissoes   VARCHAR(255),
    id_igreja_fk INT,
    FOREIGN KEY (id_igreja_fk) REFERENCES igrejas(id_igreja) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- logradouros
-- ============================================================
CREATE TABLE logradouros (
    id_logradouro INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    rua           VARCHAR(255) NOT NULL,
    numero        INT          NOT NULL,
    id_igreja_fk  INT,
    UNIQUE KEY uq_rua_numero (rua(100), numero),
    FOREIGN KEY (id_igreja_fk) REFERENCES igrejas(id_igreja)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- equipes
-- ============================================================
CREATE TABLE equipes (
    id_equipes   INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    img_id       VARCHAR(255),
    title        VARCHAR(100) NOT NULL,
    id_igreja_fk INT,
    FOREIGN KEY (id_igreja_fk) REFERENCES igrejas(id_igreja)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ministerios
-- ============================================================
CREATE TABLE ministerios (
    id_ministerio INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome          VARCHAR(150) NOT NULL,
    id_igreja_fk  INT NOT NULL,
    criado_em     DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_nome_igreja (nome(100), id_igreja_fk),
    FOREIGN KEY (id_igreja_fk) REFERENCES igrejas(id_igreja) ON DELETE CASCADE,
    KEY idx_ministerios_igreja (id_igreja_fk)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- membros
-- ============================================================
CREATE TABLE membros (
    id_membro               INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome                    VARCHAR(150) NOT NULL,
    email                   VARCHAR(255) NOT NULL,
    usuario                 VARCHAR(30),
    senha                   VARCHAR(255) NOT NULL,
    img_id                  VARCHAR(255),
    cargo                   VARCHAR(60)  NOT NULL DEFAULT 'membro',
    id_cargo_fk             INT,
    data_nascimento         DATE,
    telefone                VARCHAR(11),
    id_logradouro_fk        INT,
    id_igreja_fk            INT,
    status                  ENUM('pendente','aprovado','bloqueado') NOT NULL DEFAULT 'pendente',
    data_registro           DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_email (email),
    UNIQUE KEY membros_usuario_unique (usuario),
    FOREIGN KEY (id_logradouro_fk) REFERENCES logradouros(id_logradouro) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (id_cargo_fk) REFERENCES cargos(id_cargo),
    FOREIGN KEY (id_igreja_fk) REFERENCES igrejas(id_igreja),
    KEY idx_membros_igreja (id_igreja_fk),
    KEY idx_membros_cargo (id_cargo_fk)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- membros_ministerios
-- ============================================================
CREATE TABLE membros_ministerios (
    id_membros_ministerios INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_membro_fk           INT NOT NULL,
    id_ministerio_fk       INT NOT NULL,
    UNIQUE KEY uq_membro_ministerio (id_membro_fk, id_ministerio_fk),
    FOREIGN KEY (id_membro_fk) REFERENCES membros(id_membro) ON DELETE CASCADE,
    FOREIGN KEY (id_ministerio_fk) REFERENCES ministerios(id_ministerio) ON DELETE CASCADE,
    KEY idx_membros_ministerios_membro (id_membro_fk),
    KEY idx_membros_ministerios_ministerio (id_ministerio_fk)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- equipes_membros
-- ============================================================
CREATE TABLE equipes_membros (
    id_equipes_membros  INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_membros_fk       INT NOT NULL,
    id_equipes_fk       INT NOT NULL,
    FOREIGN KEY (id_membros_fk) REFERENCES membros(id_membro) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (id_equipes_fk) REFERENCES equipes(id_equipes) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- membros_funcoes
-- ============================================================
CREATE TABLE membros_funcoes (
    id_membros_funcoes  INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_membros_fk       INT NOT NULL,
    id_funcoes_fk       INT NOT NULL,
    FOREIGN KEY (id_membros_fk) REFERENCES membros(id_membro) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (id_funcoes_fk) REFERENCES funcoes(id_funcao) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- escalas
-- ============================================================
CREATE TABLE escalas (
    id_escala        INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome_escala      VARCHAR(150) NOT NULL,
    data_hora        DATETIME    NOT NULL,
    descricao        VARCHAR(255),
    local            VARCHAR(255),
    id_igreja_fk     INT,
    data_registro    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_igreja_fk) REFERENCES igrejas(id_igreja),
    KEY idx_escalas_igreja (id_igreja_fk)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- musicas
-- ============================================================
CREATE TABLE musicas (
    id_musica            INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome                 VARCHAR(150) NOT NULL,
    autor                VARCHAR(150) NOT NULL,
    tom                  VARCHAR(10) NOT NULL,
    bpm                  SMALLINT,
    link_spotify         VARCHAR(255),
    link_youtube         VARCHAR(255),
    link_cifra           VARCHAR(255),
    link_letra           VARCHAR(255),
    duracao              CHAR(8) NOT NULL,
    img_id               VARCHAR(255),
    id_igreja_fk         INT,
    FOREIGN KEY (id_igreja_fk) REFERENCES igrejas(id_igreja),
    KEY idx_musicas_igreja (id_igreja_fk)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- musicas_escalas
-- ============================================================
CREATE TABLE musicas_escalas (
    id_musica_escala INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tom              VARCHAR(10),
    ordem            INT,
    id_escala_fk     INT NOT NULL,
    id_musica_fk     INT NOT NULL,
    FOREIGN KEY (id_escala_fk) REFERENCES escalas(id_escala) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (id_musica_fk) REFERENCES musicas(id_musica) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- membros_escalas
-- ============================================================
CREATE TABLE membros_escalas (
    id_membro_escala INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_escala_fk     INT NOT NULL,
    id_membro_fk     INT NOT NULL,
    id_funcao_fk     INT,
    disponibilidade  ENUM('indisponível','confirmado','pendente') NOT NULL DEFAULT 'pendente',
    data_registro    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_escala_fk) REFERENCES escalas(id_escala) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (id_membro_fk) REFERENCES membros(id_membro) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (id_funcao_fk) REFERENCES funcoes(id_funcao) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- lembretes
-- ============================================================
CREATE TABLE lembretes (
    id_lembrete   INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome          VARCHAR(150) NOT NULL,
    data          DATE         NOT NULL,
    tempo         TIME         NOT NULL,
    descricao     TEXT,
    id_igreja_fk  INT,
    data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_igreja_fk) REFERENCES igrejas(id_igreja),
    KEY idx_lembretes_igreja (id_igreja_fk)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- lembrete_funcoes
-- ============================================================
CREATE TABLE lembrete_funcoes (
    id             INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_lembrete_fk INT NOT NULL,
    id_funcao_fk   INT NOT NULL,
    FOREIGN KEY (id_lembrete_fk) REFERENCES lembretes(id_lembrete) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (id_funcao_fk) REFERENCES funcoes(id_funcao) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- notificacoes
-- ============================================================
CREATE TABLE notificacoes (
    id_notificacao INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_membro_fk   INT,
    id_igreja_fk   INT,
    titulo         VARCHAR(150) NOT NULL,
    conteudo       TEXT,
    data           DATE         NOT NULL,
    data_registro  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_membro_fk) REFERENCES membros(id_membro) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (id_igreja_fk) REFERENCES igrejas(id_igreja),
    KEY idx_notificacoes_igreja (id_igreja_fk)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- password_reset_tokens
-- ============================================================
CREATE TABLE password_reset_tokens (
    id           INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_membro_fk INT NOT NULL,
    token        VARCHAR(255) NOT NULL,
    token_hash   VARCHAR(255),
    expires_at   DATETIME NOT NULL,
    used_at      DATETIME,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_token (token),
    FOREIGN KEY (id_membro_fk) REFERENCES membros(id_membro) ON DELETE CASCADE,
    KEY idx_password_reset_tokens_membro (id_membro_fk),
    KEY idx_password_reset_tokens_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Seed básico
-- ============================================================

-- Igreja padrão
INSERT INTO igrejas (id_igreja, nome) VALUES (1, 'Igreja Central')
ON DUPLICATE KEY UPDATE nome = nome;

-- Cargo Administrador (global, id_igreja_fk NULL)
INSERT INTO cargos (id_cargo, nome, permissoes, id_igreja_fk)
VALUES (1, 'Administrador', 'equipes,membros,aprovar,locais,musicas,escalas,ministerios,cargos,codigo', NULL)
ON DUPLICATE KEY UPDATE nome = nome;

-- Cargo Líder (igreja 1)
INSERT INTO cargos (nome, permissoes, id_igreja_fk)
SELECT 'Líder de ministério', 'equipes,musicas,escalas,aprovar,codigo', 1
WHERE NOT EXISTS (SELECT 1 FROM cargos WHERE nome = 'Líder de ministério' AND id_igreja_fk = 1);

-- Cargo Membro (igreja 1)
INSERT INTO cargos (nome, permissoes, id_igreja_fk)
SELECT 'Membro', NULL, 1
WHERE NOT EXISTS (SELECT 1 FROM cargos WHERE nome = 'Membro' AND id_igreja_fk = 1);

-- Funções básicas
INSERT INTO funcoes (id_funcao, nome, id_igreja_fk) VALUES
    (1, 'guitarrista', 1),
    (2, 'baterista',   1),
    (3, 'baixista',    1),
    (4, 'tecladista',  1),
    (5, 'vocalista',   1)
ON DUPLICATE KEY UPDATE nome = nome;

-- Logradouros
INSERT INTO logradouros (id_logradouro, rua, numero, id_igreja_fk) VALUES
    (1, 'Rua das Flores',   100, 1),
    (2, 'Avenida Central',  200, 1),
    (3, 'Travessa da Paz',   50, 1)
ON DUPLICATE KEY UPDATE rua = rua;

-- Membros de exemplo (senha = hash fictício, não utilizável para login)
INSERT INTO membros (id_membro, nome, email, senha, img_id, cargo, id_logradouro_fk, id_igreja_fk, status) VALUES
    (1, 'João Silva',  'joao@example.com',  '$argon2id$v=19$m=65536,t=3,p=4$placeholder1', 'img_001', 'membro', 1, 1, 'aprovado'),
    (2, 'Maria Souza', 'maria@example.com', '$argon2id$v=19$m=65536,t=3,p=4$placeholder2', 'img_002', 'lider',  2, 1, 'aprovado'),
    (3, 'Carlos Lima', 'carlos@example.com','$argon2id$v=19$m=65536,t=3,p=4$placeholder3', 'img_003', 'membro', 3, 1, 'aprovado')
ON DUPLICATE KEY UPDATE nome = nome;

-- Equipes
INSERT INTO equipes (id_equipes, img_id, title, id_igreja_fk) VALUES
    (1, 'eq_001', 'Louvor', 1),
    (2, 'eq_002', 'Mídia',  1)
ON DUPLICATE KEY UPDATE title = title;

-- Funções dos membros
INSERT INTO membros_funcoes (id_membros_funcoes, id_membros_fk, id_funcoes_fk) VALUES
    (1, 1, 1), (2, 1, 4), (3, 2, 5), (4, 3, 2)
ON DUPLICATE KEY UPDATE id_membros_fk = id_membros_fk;

-- Equipes dos membros
INSERT INTO equipes_membros (id_equipes_membros, id_membros_fk, id_equipes_fk) VALUES
    (1, 1, 1), (2, 2, 1), (3, 3, 1), (4, 2, 2)
ON DUPLICATE KEY UPDATE id_membros_fk = id_membros_fk;

-- Escalas
INSERT INTO escalas (id_escala, nome_escala, data_hora, descricao, id_igreja_fk) VALUES
    (1, 'Mavi',                '2026-11-14 19:00:00', 'Culto de sexta',                        1),
    (2, 'Louvor Domingo',      '2026-11-16 09:00:00', 'Culto dominical',                       1),
    (3, 'Louvor Sexta',        '2026-12-05 19:00:00', 'Culto de sexta - dezembro',              1),
    (4, 'Louvor Domingo',      '2026-12-07 09:00:00', 'Culto dominical',                       1),
    (5, 'Ensaio Geral Natal',  '2026-12-13 10:00:00', 'Ensaio preparatório para o culto de natal', 1),
    (6, 'Louvor Sexta',        '2026-12-19 19:00:00', 'Última sexta antes do natal',           1),
    (7, 'Culto de Natal',      '2026-12-24 19:00:00', 'Culto especial de natal',               1),
    (8, 'Louvor Domingo',      '2026-12-28 09:00:00', 'Último culto dominical do ano',         1)
ON DUPLICATE KEY UPDATE nome_escala = nome_escala;

-- Músicas
INSERT INTO musicas (id_musica, nome, autor, tom, bpm, duracao, id_igreja_fk) VALUES
    (1, 'Oceans',                   'Hillsong',            'Re',  72, '05:30:00', 1),
    (2, 'Nada Além',                'Pregador Luo',        'La',  80, '04:15:00', 1),
    (3, 'Quão Grande é o Meu Deus', 'Chris Tomlin',        'Sol', 76, '04:00:00', 1),
    (4, 'Glorioso',                 'Ministério Zoe',      'Mi',  74, '05:10:00', 1),
    (5, 'Bondade de Deus',          'Comunidade da Graça', 'Re',  68, '04:45:00', 1),
    (6, 'Noite Feliz',              'Tradicional',         'Sol', 60, '03:00:00', 1),
    (7, 'Alegria',                  'Diante do Trono',     'La',  88, '04:30:00', 1),
    (8, 'Nenhum Outro Nome',        'Hillsong',            'Re',  78, '05:00:00', 1)
ON DUPLICATE KEY UPDATE nome = nome;

-- Músicas das escalas
INSERT INTO musicas_escalas (id_escala_fk, id_musica_fk, ordem) VALUES
    (1, 1, 1), (1, 2, 2), (1, 3, 3),
    (2, 1, 1), (2, 3, 2),
    (3, 4, 1), (3, 5, 2), (3, 1, 3),
    (4, 2, 1), (4, 7, 2), (4, 3, 3),
    (5, 6, 1), (5, 8, 2), (5, 4, 3), (5, 5, 4),
    (6, 7, 1), (6, 4, 2), (6, 1, 3),
    (7, 6, 1), (7, 8, 2), (7, 3, 3), (7, 5, 4),
    (8, 2, 1), (8, 4, 2), (8, 7, 3);

-- Membros das escalas
INSERT INTO membros_escalas (id_escala_fk, id_membro_fk, id_funcao_fk, disponibilidade) VALUES
    (1, 1, 1, 'confirmado'), (1, 2, 5, 'confirmado'), (1, 3, 2, 'pendente'),
    (2, 1, 1, 'confirmado'), (2, 2, 5, 'pendente'),
    (3, 1, 4, 'confirmado'), (3, 2, 5, 'confirmado'), (3, 3, 2, 'pendente'),
    (4, 2, 5, 'confirmado'), (4, 1, 4, 'pendente'),
    (5, 1, 4, 'confirmado'), (5, 2, 5, 'confirmado'), (5, 3, 2, 'confirmado'),
    (6, 1, 1, 'confirmado'), (6, 2, 5, 'confirmado'),
    (7, 1, 4, 'confirmado'), (7, 2, 5, 'confirmado'), (7, 3, 2, 'pendente'),
    (8, 1, 1, 'confirmado'), (8, 2, 5, 'pendente'),   (8, 3, 3, 'pendente');

-- Lembretes
INSERT INTO lembretes (id_lembrete, nome, data, tempo, descricao, id_igreja_fk) VALUES
    (1, 'ALERTA Ensaio Geral',       '2026-12-02', '10:20:00', 'Ensaio antes do culto de natal. Levar instrumentos.', 1),
    (2, 'Reunião de Líderes',        '2026-12-10', '19:00:00', 'Pauta: planejamento do próximo semestre.',            1),
    (3, 'Ensaio Extra Natal',        '2026-12-20', '15:00:00', 'Ensaio extra para o culto de natal. Presença obrigatória.', 1),
    (4, 'Confraternização da Equipe','2026-12-22', '18:00:00', 'Confraternização de fim de ano da equipe de louvor.', 1)
ON DUPLICATE KEY UPDATE nome = nome;

INSERT INTO lembrete_funcoes (id_lembrete_fk, id_funcao_fk) VALUES
    (1, 1), (1, 2),
    (2, 5),
    (3, 1), (3, 2), (3, 3), (3, 4), (3, 5),
    (4, 1), (4, 2), (4, 3), (4, 4), (4, 5);

INSERT INTO notificacoes (id_notificacao, id_membro_fk, titulo, conteudo, data, id_igreja_fk) VALUES
    (1, 1, 'Confirmação pendente', 'Sua presença na escala de 07/12 ainda está pendente. Confirme!', '2026-11-28', 1),
    (2, 2, 'Confirmação pendente', 'Sua presença na escala de 16/11 ainda está pendente.',           '2026-11-14', 1)
ON DUPLICATE KEY UPDATE titulo = titulo;
