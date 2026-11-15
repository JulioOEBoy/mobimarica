-- ============================================================================
-- Banco de Dados: CorridasApp (sistema similar ao Uber)
-- Materia: Banco de Dados (Práticas)
-- Aluno: Júlio César Ferreira Pedrini
-- Descricao: Banco relacional que modela um aplicativo de corrida
--   (como o Uber) contendo Aplicativo, Usuario, Motorista, Pedido e Avaliacao.
--   Inclui diagrama, CRUD, funcoes e dados de exemplo.
-- ============================================================================

-- -----------------------------------------------------------
-- 1. TABELA: aplicativo
-- Representa o aplicativo (veiculo/plataforma) que distribui os motoristas.
-- Um aplicativo pode ter varios motoristas vinculados a ele.
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS aplicativo (
    id_aplicativo      SERIAL          PRIMARY KEY,   -- chave primaria
    nome_aplicativo    VARCHAR(100)    NOT NULL,      -- ex: "Mi Uber", "CorridasX"
    descricao          TEXT,
    url_logo           VARCHAR(255),                  -- endereco da logo
    cnpj_aplicativo    VARCHAR(18),                   -- caso seja uma empresa
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE aplicativo IS 'Tabela de aplicativos (plataforma/veiculo que distribui motoristas).';
COMMENT ON COLUMN aplicativo.id_aplicativo IS 'Chave primaria do aplicativo.';
COMMENT ON COLUMN aplicativo.nome_aplicativo IS 'Nome do aplicativo (ex: Mi Uber, CorridasX).';

CREATE INDEX idx_aplicativo_nome ON aplicativo (nome_aplicativo);

-- -----------------------------------------------------------
-- 2. TABELA: usuario
-- Usuario (passageiro) que solicita corridas. Compartilha
--  a mesma tabela de "pessoa" para dados pessoais mais tarde,
--  mas aqui mantemos os dados pessoais diretamente.
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario         SERIAL          PRIMARY KEY,   -- chave primaria
    nome               VARCHAR(100)    NOT NULL,
    email              VARCHAR(150)    UNIQUE NOT NULL,
    telefone           VARCHAR(20),
    data_nascimento    DATE,
    cpf                VARCHAR(14)     UNIQUE,        -- XXX.XXX.XXX-X
    genero             VARCHAR(20),
    endereco_casa      TEXT,
    cep                VARCHAR(10),
    estado             VARCHAR(30),
    cidade             VARCHAR(50),
    logradouro         VARCHAR(100),
    numero             VARCHAR(10),
    complemento        VARCHAR(50),
    -- credenciais
    senha_hash         TEXT            NOT NULL,      -- hash do password
    tipo_conta         VARCHAR(20)     NOT NULL DEFAULT 'passageiro',
    -- metricas
    reputacao          DECIMAL(3,2)    NOT NULL DEFAULT 0,   -- 0.00 a 5.00
    qtd_corrida        INTEGER         NOT NULL DEFAULT 0,   -- quantidade de corridas
    qtd_avaliacao_positiva INTEGER      NOT NULL DEFAULT 0,
    qtd_avaliacao_negativa INTEGER      NOT NULL DEFAULT 0,
    foto_perfil        VARCHAR(255),
    ativo              BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE usuario IS 'Tabela de usuarios (passageiros).';
COMMENT ON COLUMN usuario.id_usuario IS 'Chave primaria do usuario.';
COMMENT ON COLUMN usuario.cpf IS 'CPF do usuario (unico).';
COMMENT ON COLUMN usuario.reputacao IS 'Pontuacao de reputacao (0.00 a 5.00).';
COMMENT ON COLUMN usuario.qtd_corrida IS 'Quantidade de corridas realizadas.';

CREATE INDEX idx_usuario_email ON usuario (email);
CREATE INDEX idx_usuario_cpf ON usuario (cpf);
CREATE INDEX idx_usuario_reputacao ON usuario (reputacao);

-- -----------------------------------------------------------
-- 3. TABELA: motorista
-- Motorista vinculado a um aplicativo. Uniao com usuario
--  (usando chave estrangeira id_usuario) para compartilhar dados.
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS motorista (
    id_motorista       SERIAL          PRIMARY KEY,   -- chave primaria
    id_usuario         INTEGER         NOT NULL,    -- FK para usuario
    id_aplicativo      INTEGER         NOT NULL,    -- FK para aplicativo
    placa_veiculo      VARCHAR(10)     NOT NULL,
    modelo_veiculo     VARCHAR(50),
    cor_veiculo        VARCHAR(30),
    bandeira_autorizada VARCHAR(50),
    qtdd_vagas         INTEGER         NOT NULL DEFAULT 4,
    qtdd_passageiros   INTEGER         NOT NULL DEFAULT 4,
    -- policy / aprovacao
    aprovado           BOOLEAN         NOT NULL DEFAULT FALSE,
    justificativa_rejeicao TEXT,
    disponivel         BOOLEAN         NOT NULL DEFAULT TRUE,
    -- metricas de motorista
    reputacao          DECIMAL(3,2)    NOT NULL DEFAULT 0,
    qtd_corrida        INTEGER         NOT NULL DEFAULT 0,
    receita_total      NUMERIC(12,2)   NOT NULL DEFAULT 0,
    -- endereco de trabalho (base do motorista)
    cep                VARCHAR(10),
    estado             VARCHAR(30),
    cidade             VARCHAR(50),
    logradouro         VARCHAR(100),
    numero             VARCHAR(10),
    complemento        VARCHAR(50),
    -- veiculo (relacao 1:1, duplicata dados do veiculo)
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT fk_motorista_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_motorista_aplicativo FOREIGN KEY (id_aplicativo)
        REFERENCES aplicativo(id_aplicativo) ON DELETE CASCADE,
    CONSTRAINT uq_motorista_usuario UNIQUE (id_usuario) -- um usuario so pode ser motorista em um aplicativo
);

COMMENT ON TABLE motorista IS 'Tabela de motoristas vinculados a um aplicativo.';
COMMENT ON COLUMN motorista.id_motorista IS 'Chave primaria do motorista.';
COMMENT ON COLUMN motorista.id_usuario IS 'Usuario que tambem e motorista (FK).';
COMMENT ON COLUMN motorista.placa_veiculo IS 'Placa do veiculo do motorista.';

CREATE INDEX idx_motorista_usuario ON motorista (id_usuario);
CREATE INDEX idx_motorista_aplicativo ON motorista (id_aplicativo);
CREATE INDEX idx_motorista_placa ON motorista (placa_veiculo);

-- -----------------------------------------------------------
-- 4. TABELA: pedido
-- Representa uma corrida realizada, com origem, destino,
--  status, pagamento e referencia ao usuario e motorista.
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedido (
    id_pedido          SERIAL          PRIMARY KEY,   -- chave primaria
    id_usuario         INTEGER         NOT NULL,    -- FK para usuario
    id_motorista       INTEGER         NOT NULL,    -- FK para motorista
    id_aplicativo      INTEGER         NOT NULL,    -- FK para aplicativo
    -- localizacao
    origem_lat         DECIMAL(10,8)   NOT NULL,
    origem_lon         DECIMAL(11,8)   NOT NULL,
    origem_endereco    VARCHAR(200)    NOT NULL,
    destino_lat        DECIMAL(10,8)   NOT NULL,
    destino_lon        DECIMAL(11,8)   NOT NULL,
    destino_endereco   VARCHAR(200)    NOT NULL,
    -- dados do pedido
    tipo_viagem        VARCHAR(20)     NOT NULL DEFAULT 'sede',  -- sede, objetivo, corrida, ida
    preco_aprovado     NUMERIC(10,2),                 -- preco sugerido/app
    preco_pago         NUMERIC(10,2)   NOT NULL,      -- preco pago
    forma_pagamento    VARCHAR(20)     NOT NULL DEFAULT 'cartao',
    tarifa_aplicada    NUMERIC(10,2)   NOT NULL DEFAULT 0,
    distancia          NUMERIC(6,2),                   -- km
    -- status de vida do pedido
    status             VARCHAR(30)     NOT NULL DEFAULT 'aguardando',
    -- historico
    observacao         TEXT,
    -- indicadores
    qtd_minutos        INTEGER,
    qtd_pessoas        INTEGER          NOT NULL DEFAULT 1,
    -- horarios
    data_corrida       TIMESTAMPTZ     NOT NULL DEFAULT now(),
    -- chave estrangeira
    CONSTRAINT fk_pedido_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT fk_pedido_motorista FOREIGN KEY (id_motorista)
        REFERENCES motorista(id_motorista) ON DELETE CASCADE,
    CONSTRAINT fk_pedido_aplicativo FOREIGN KEY (id_aplicativo)
        REFERENCES aplicativo(id_aplicativo) ON DELETE RESTRICT
);

COMMENT ON TABLE pedido IS 'Tabela de pedidos/corridas realizadas.';
COMMENT ON COLUMN pedido.id_pedido IS 'Chave primaria do pedido.';
COMMENT ON COLUMN pedido.id_usuario IS 'Usuario que solicitou a corrida.';
COMMENT ON COLUMN pedido.id_motorista IS 'Motorista atribuido ao pedido.';
COMMENT ON COLUMN pedido.preco_pago IS 'Valor pago pela corrida.';
COMMENT ON COLUMN pedido.status IS 'Status atual da corrida (aguardando, confirmado, etc).';

CREATE INDEX idx_pedido_usuario ON pedido (id_usuario);
CREATE INDEX idx_pedido_motorista ON pedido (id_motorista);
CREATE INDEX idx_pedido_status ON pedido (status);
CREATE INDEX idx_pedido_data ON pedido (data_corrida);

-- -----------------------------------------------------------
-- 5. TABELA: avaliacao
-- Armazena avaliacoes de usuarios para motoristas e vice-versa,
--  alimentando a metrica de reputacao.
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS avaliacao (
    id_avaliacao       SERIAL          PRIMARY KEY,   -- chave primaria
    id_pedido          INTEGER         NOT NULL,    -- FK para pedido
    id_usuario         INTEGER         NOT NULL,    -- usuario que avalia
    id_motorista       INTEGER         NOT NULL,    -- motorista avaliado
    -- nota e comentario
    nota               DECIMAL(2,1)    NOT NULL CHECK (nota >= 0 AND nota <= 5),
    comentario         TEXT,
    -- foto/evidencia
    foto_avaliacao     VARCHAR(255),
    -- mascara de realidade
    confirmada         BOOLEAN         NOT NULL DEFAULT FALSE,
    -- horario
    data_avaliacao     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT fk_avaliacao_pedido FOREIGN KEY (id_pedido)
        REFERENCES pedido(id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_avaliacao_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT fk_avaliacao_motorista FOREIGN KEY (id_motorista)
        REFERENCES motorista(id_motorista) ON DELETE CASCADE,
    CONSTRAINT uq_avaliacao_pedido UNIQUE (id_pedido)  -- um pedido so pode ter uma avaliacao
);

COMMENT ON TABLE avaliacao IS 'Tabela de avaliacoes de qualidade (motorista <-> usuario).';
COMMENT ON COLUMN avaliacao.id_avaliacao IS 'Chave primaria da avaliacao.';
COMMENT ON COLUMN avaliacao.nota IS 'Nota de 0 a 5.';

CREATE INDEX idx_avaliacao_pedido ON avaliacao (id_pedido);
CREATE INDEX idx_avaliacao_motorista ON avaliacao (id_motorista);
CREATE INDEX idx_avaliacao_usuario ON avaliacao (id_usuario);

-- -----------------------------------------------------------
-- 6. PROCEDIMENTO/FUNCAO DE EXEMPLO: atualizar reputacao
-- Re-calcula a reputacao do motorista a partir das avaliacoes.
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION atualizar_reputacao_motorista(p_id_motorista INT)
RETURNS VOID AS $$
DECLARE
    v_media   DECIMAL(3,2);
    v_total   INT;
    v_qtd     INT;
BEGIN
    -- calculo da media de notas
    SELECT COUNT(*), COALESCE(AVG(nota)::NUMERIC, 0)
      INTO v_qtd, v_media
      FROM avaliacao
     WHERE id_motorista = p_id_motorista;

    IF v_qtd >= 3 THEN
        v_media := ROUND((v_media * 0.7 + 4.0) / 1.0, 2);  -- suavizacao (70% nota + 30% base)
    END IF;

    -- atualiza a reputacao e a qtd de corridas do motorista
    UPDATE motorista m
       SET reputacao = LEAST(5.0, GREATEST(0.0, v_media::DECIMAL(3,2)),
                               m.reputacao),  -- nao vai abaixo de 0 e nao passa de 5
           qtd_corrida = m.qtd_corrida + v_qtd
     WHERE m.id_motorista = p_id_motorista;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION atualizar_reputacao_motorista(INT) IS 'Atualiza a reputacao e a quantidade de corridas do motorista com base nas avaliacoes.';

-- -----------------------------------------------------------
-- 7. PROCEDIMENTO/FUNCAO DE EXEMPLO: maior_preco_corrida
-- Retorna o pedido com maior preco pago.
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION maior_preco_corrida()
RETURNS TABLE (
    id_pedido     INT,
    id_usuario    INT,
    id_motorista  INT,
    preco_pago    NUMERIC(10,2),
    data_corrida  TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id_pedido, p.id_usuario, p.id_motorista,
           p.preco_pago, p.data_corrida
      FROM pedido p
     ORDER BY p.preco_pago DESC
     LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION maior_preco_corrida() IS 'Retorna o pedido de maior preco pago.';

-- -----------------------------------------------------------
-- 8. DADOS DE EXEMPLO (SEED)
-- -----------------------------------------------------------

-- 8.1 Aplicativos
INSERT INTO aplicativo (nome_aplicativo, descricao, url_logo, cnpj_aplicativo) VALUES
    ('Mi Uber', 'Aplicativo de corrida de veiculo', '/logos/mi-uber.png', '12.345.678/0001-99'),
    ('CorridasX', 'Corridas urbanas com veiculo compartilhado', '/logos/corridasx.png', '98.765.432/0001-11'),
    ('Velox Ride', 'Corrida rápida e pontual', '/logos/velox.png', '45.678.123/0001-22');

-- 8.2 Usuarios (passageiros)
INSERT INTO usuario (nome, email, telefone, data_nascimento, cpf, endereco_casa,
                     cep, estado, cidade, logradouro, numero, complemento,
                     senha_hash, tipo_conta, reputacao, qtd_corrida,
                     qtd_avaliacao_positiva, qtd_avaliacao_negativa) VALUES
    ('Ana Souza', 'ana.souza@gmail.com', '(+55) 21 99999-0001', '1995-04-12', '111.111.111-11', 'Av. Brasil, 1234', '22220-001', 'RJ', 'Rio de Janeiro', 'Av. Brasil', '1234', 'apt 12',
     '$2b$12$LoremIpsumPlaceHolder1234567890=', 'passageiro', 4.50, 12, 10, 2),
    ('Bruno Lima', 'bruno.lima@yahoo.com.br', '(+55) 21 98888-0002', '1992-08-25', '222.222.222-22', 'Rua das Flores, 45', '22220-002', 'RJ', 'Rio de Janeiro', 'Rua das Flores', '45', '',
     '$2b$12$LoremIpsumPlaceHolder9876543210=', 'passageiro', 3.80, 8, 7, 1),
    ('Carla Mendes', 'carla.mendes@gmail.com', '(+55) 21 97777-0003', '1988-11-02', '333.333.333-33', 'Av. do Passeio, 789', '22220-003', 'RJ', 'Rio de Janeiro', 'Av. do Passeio', '789', 'casa',
     '$2b$12$LoremIpsumPlaceHolder5555555555=', 'passageiro', 4.90, 25, 24, 1),
    ('Diego Rodrigues', 'diego.rodrigues@gmail.com', '(+55) 21 96666-0004', '1990-01-30', '444.444.444-44', 'Rua do Comercio, 101', '22220-004', 'RJ', 'Rio de Janeiro', 'Rua do Comercio', '101', '',
     '$2b$12$LoremIpsumPlaceHolder1357924680=', 'passageiro', 4.10, 15, 14, 1);

-- 8.3 Motoristas
INSERT INTO motorista (id_usuario, id_aplicativo, placa_veiculo, modelo_veiculo,
                       cor_veiculo, bandeira_autorizada, qtdd_vagas, qtdd_passageiros,
                       aprovado, disponivel, reputacao, qtd_corrida, receita_total,
                       cep, estado, cidade, logradouro, numero, complemento) VALUES
    (1, 1, 'ABC-1234', 'Toyota Corolla 2021', 'Preto', 'Reserva', 4, 4, TRUE, TRUE, 4.60, 18, 12400.00, '22220-001', 'RJ', 'Rio de Janeiro', 'Av. Brasil', '1234', 'apt 12'),
    (2, 1, 'DEF-5678', 'Honda Civic 2020', 'Branco', 'Reserva', 5, 5, TRUE, TRUE, 4.20, 14, 9800.00, '22220-002', 'RJ', 'Rio de Janeiro', 'Rua das Flores', '45', ''),
    (3, 1, 'GHI-9012', 'Chevrolet Onix 2022', 'Vermelho', 'Reserva', 3, 3, FALSE, FALSE, 4.90, 22, 15600.00, '22220-003', 'RJ', 'Rio de Janeiro', 'Av. do Passeio', '789', 'casa'),
    (4, 2, 'JKL-3456', 'Ford Mustang 2021', 'Prata', 'Premium', 4, 4, TRUE, TRUE, 4.80, 20, 18400.00, '22220-004', 'RJ', 'Rio de Janeiro', 'Rua do Comercio', '101', '');

-- 8.4 Pedidos
INSERT INTO pedido (id_usuario, id_motorista, id_aplicativo,
                    origem_lat, origem_lon, origem_endereco,
                    destino_lat, destino_lon, destino_endereco,
                    tipo_viagem, preco_aprovado, preco_pago, forma_pagamento,
                    tarifa_aplicada, distancia, status, qtd_minutos, qtd_pessoas,
                    data_corrida) VALUES
    (1, 1, 1, -22.908, -43.192, 'Av. Brasil, 1234', -21.808, -43.908, 'Praca XV', 'ida', 35.50, 35.50, 'cartao', 35.50, 12.5, 'concluido', 35, 1, now() - interval '2 days'),
    (2, 2, 1, -22.905, -43.190, 'Rua das Flores, 45', -22.912, -43.185, 'Shopping Cidade', 'ida', 28.00, 28.00, 'cartao', 28.00, 9.0, 'concluido', 28, 1, now() - interval '1 day'),
    (3, 3, 1, -22.910, -43.200, 'Av. do Passeio, 789', -22.905, -43.195, 'Terminal Santos', 'sede', 42.00, 42.00, 'dinheiro', 42.00, 14.0, 'concluido', 42, 1, now() - interval '1 day'),
    (1, 4, 2, -21.810, -43.910, 'Praca XV', -22.900, -43.200, 'Av. Brasil 1234', 'sede', 33.00, 33.00, 'pix', 33.00, 11.0, 'concluido', 33, 1, now() - interval '12 hours'),
    (2, 2, 1, -22.902, -43.188, 'Shopping Cidade', -22.915, -43.192, 'Av. Paulista', 'ativo', NULL, 28.00, 'cartao', 28.00, 9.0, 'em_andamento', 15, 2, now() - interval '2 hours');

-- 8.5 Avaliacoes
INSERT INTO avaliacao (id_pedido, id_usuario, id_motorista, nota, comentario,
                       foto_avaliacao, confirmada, data_avaliacao) VALUES
    (1, 1, 1, 4.5, 'Motorista pontual e veiculo limpo.', NULL, TRUE, now() - interval '2 days'),
    (2, 2, 2, 4.0, 'Bom atendimento, mas um pouco atrasou.', NULL, TRUE, now() - interval '1 day'),
    (3, 3, 3, 5.0, 'Excelente! Recomendo bastante.', NULL, TRUE, now() - interval '1 day'),
    (1, 1, 4, 4.0, 'Desculpe o atraso, mas veiculo bom.', NULL, TRUE, now() - interval '12 hours'),
    (2, 2, 2, 3.5, 'Aceitavel, mas precisa de mais atencao.', NULL, TRUE, now() - interval '12 hours'),
    (3, 3, 3, 5.0, 'Impecável, chegou antes do marcado.', NULL, TRUE, now() - interval '12 hours');

-- -----------------------------------------------------------
-- 9. CONSULTAS EXEMPLO (para visualizar os dados e testar o banco)
-- -----------------------------------------------------------
-- 9.1 Relacao Aplicativo -> Motorista
SELECT a.nome_aplicativo AS aplicativo,
       COUNT(m.id_motorista) AS total_motoristas
FROM aplicativo a
LEFT JOIN motorista m ON a.id_aplicativo = m.id_aplicativo
GROUP BY a.id_aplicativo, a.nome_aplicativo
ORDER BY a.nome_aplicativo;

-- 9.2 Usuario com dados pessoais + qtd de corridas + reputacao
SELECT u.nome        AS usuario_nome,
       u.email       AS usuario_email,
       u.cpf         AS usuario_cpf,
       u.telefone    AS usuario_telefone,
       u.cep         AS usuario_cep,
       u.estado      AS usuario_estado,
       u.cidade      AS usuario_cidade,
       u.logradouro  AS usuario_logradouro,
       u.numero      AS usuario_numero,
       u.reputacao   AS usuario_reputacao,
       u.qtd_corrida AS usuario_qtd_corrida,
       COALESCE(m.placa_veiculo, 'N/A') AS veiculo,
       COALESCE(m.aprovado::TEXT, 'N/A') AS motorista_aprovado
FROM usuario u
LEFT JOIN motorista m ON u.id_usuario = m.id_usuario
WHERE u.ativo = TRUE
ORDER BY u.reputacao DESC;

-- 9.3 Resumo de corridas por motorista
SELECT m.placa_veiculo,
       m.modelo_veiculo,
       COUNT(p.id_pedido) AS qtd_corrida_realizada,
       ROUND(AVG(p.preco_pago), 2) AS media_preco_corrida,
       ROUND(SUM(p.preco_pago), 2) AS receita_total,
       MAX(a.nota) AS melhor_avaliacao,
       MIN(a.nota) AS pior_avaliacao
FROM motorista m
LEFT JOIN pedido p ON m.id_motorista = p.id_motorista
LEFT JOIN avaliacao a ON m.id_motorista = a.id_motorista
GROUP BY m.id_motorista, m.placa_veiculo, m.modelo_veiculo
ORDER BY qtd_corrida_realizada DESC;

-- 9.4 Avaliacoes e reputacao
SELECT m.placa_veiculo,
       ROUND(AVG(a.nota), 2) AS media_avaliacao,
       COUNT(a.id_avaliacao) AS qtd_avaliacoes,
       SUM(CASE WHEN a.nota >= 4 THEN 1 ELSE 0 END) AS qtd_positivas,
       SUM(CASE WHEN a.nota < 4 THEN 1 ELSE 0 END) AS qtd_negativas
FROM motorista m
LEFT JOIN avaliacao a ON m.id_motorista = a.id_motorista
GROUP BY m.id_motorista, m.placa_veiculo
ORDER BY media_avaliacao DESC;

-- 9.5 Verificar relacionamento A-1 entre aplicativo e motorista
-- (um aplicativo pode ter varios motoristas)
SELECT m.id_motorista, m.placa_veiculo, a.nome_aplicativo AS aplicativo,
       m.aprovado, m.disponivel
FROM motorista m
JOIN aplicativo a ON m.id_aplicativo = a.id_aplicativo
ORDER BY a.nome_aplicativo, m.placa_veiculo;

-- Índices adicionais para performance
CREATE INDEX idx_pedido_origem ON pedido (origem_lat, origem_lon);
CREATE INDEX idx_pedido_destino ON pedido (destino_lat, destino_lon);
