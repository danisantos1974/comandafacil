-- ==============================================================================
-- COMANDA FÁCIL - Script de Criação do Banco de Dados PostgreSQL (Neon)
-- Arquivo: database/schema.sql
-- ==============================================================================

-- 1. Criação das Tabelas

-- Tabela: usuarios (RF01, RF02)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('atendente', 'administrador'))
);

-- Tabela: produtos (RF10, RF11, RF12, RF13)
CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco NUMERIC(10, 2) NOT NULL,
    categoria VARCHAR(100) NOT NULL
);

-- Tabela: mesas (RF03)
CREATE TABLE IF NOT EXISTS mesas (
    id SERIAL PRIMARY KEY,
    numero INT UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'ocupada'))
);

-- Tabela: comandas (RF04, RF07, RF08, RF09)
CREATE TABLE IF NOT EXISTS comandas (
    id SERIAL PRIMARY KEY,
    mesa_id INT NOT NULL REFERENCES mesas(id),
    usuario_id INT NOT NULL REFERENCES usuarios(id),
    status VARCHAR(50) NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'finalizada')),
    data_abertura TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_fechamento TIMESTAMP WITH TIME ZONE,
    valor_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);

-- Tabela: itens_comanda (RF05, RF06, RF07)
CREATE TABLE IF NOT EXISTS itens_comanda (
    id SERIAL PRIMARY KEY,
    comanda_id INT NOT NULL REFERENCES comandas(id) ON DELETE CASCADE,
    produto_id INT NOT NULL REFERENCES produtos(id),
    quantidade INT NOT NULL DEFAULT 1,
    preco_unitario NUMERIC(10, 2) NOT NULL
);

-- ==============================================================================
-- 2. Inserção de Dados Iniciais (Seed)
-- ==============================================================================

-- Usuários Padrão para Teste
-- Senha de teste para ambos: admin123 / atendente123 (hash bcrypt 10 rounds)
INSERT INTO usuarios (nome, email, senha, tipo) VALUES
('Administrador Chefe', 'admin@comanda.com', '$2a$10$wE8wUuXN76yG4zK0W8sH0OUc4mD1k6a.8I2W5G1B2L4H7G8Q0N1a2', 'administrador'),
('Carlos Atendente', 'atendente@comanda.com', '$2a$10$7Z4wUuXN76yG4zK0W8sH0OUc4mD1k6a.8I2W5G1B2L4H7G8Q0N1a3', 'atendente')
ON CONFLICT (email) DO NOTHING;

-- Mesas do Estabelecimento (Mesas 1 a 8)
INSERT INTO mesas (numero, status) VALUES
(1, 'disponivel'),
(2, 'disponivel'),
(3, 'disponivel'),
(4, 'disponivel'),
(5, 'disponivel'),
(6, 'disponivel'),
(7, 'disponivel'),
(8, 'disponivel')
ON CONFLICT (numero) DO NOTHING;

-- Catálogo Inicial de Produtos
INSERT INTO produtos (nome, descricao, preco, categoria) VALUES
('X-Burger Artesanal', 'Pão brioche, hambúrguer 180g, queijo cheddar e maionese especial', 28.50, 'Lanches'),
('X-Bacon Especial', 'Hambúrguer 180g, queijo prato, fatias crocantes de bacon e molho barbecue', 32.00, 'Lanches'),
('Batata Frita Rústica', 'Porção de batatas com alecrim e alho com molho da casa', 22.00, 'Porções'),
('Pastel de Queijo (4 unid)', 'Pastéis crocantes recheados com muçarela premium', 18.00, 'Porções'),
('Refrigerante Lata 350ml', 'Coca-Cola, Guaraná Antarctica ou Fanta', 6.50, 'Bebidas'),
('Suco Natural de Laranja 400ml', 'Feito na hora com laranjas frescas', 8.50, 'Bebidas'),
('Água Mineral 500ml', 'Com ou sem gás', 4.50, 'Bebidas'),
('Pudim de Leite Condensado', 'Fatia cremosa com calda caramelizada tradicional', 12.00, 'Sobremesas'),
('Petit Gâteau de Chocolate', 'Bolo quente com recheio cremoso e sorvete de baunilha', 16.00, 'Sobremesas')
ON CONFLICT DO NOTHING;
