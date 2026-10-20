import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.log('⚠️ DATABASE_URL não foi definida no arquivo .env.local ou nas variáveis de ambiente.');
  console.log('ℹ️ Para rodar o seed no Neon PostgreSQL, configure sua connection string em .env.local.');
  console.log('ℹ️ Exemplo: DATABASE_URL="postgresql://usuario:senha@ep-exemplo.neon.tech/neondb?sslmode=require"');
  process.exit(0);
}

const sql = neon(connectionString);

async function runSeed() {
  console.log('🚀 Conectando ao Neon PostgreSQL e executando migrações...');

  try {
    // 1. Criar tabelas conforme DER do Spec
    await sql`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('atendente', 'administrador'))
      );
    `;
    console.log('✅ Tabela `usuarios` pronta');

    await sql`
      CREATE TABLE IF NOT EXISTS produtos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        descricao TEXT,
        preco NUMERIC(10, 2) NOT NULL,
        categoria VARCHAR(100) NOT NULL
      );
    `;
    console.log('✅ Tabela `produtos` pronta');

    await sql`
      CREATE TABLE IF NOT EXISTS mesas (
        id SERIAL PRIMARY KEY,
        numero INT UNIQUE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'ocupada'))
      );
    `;
    console.log('✅ Tabela `mesas` pronta');

    await sql`
      CREATE TABLE IF NOT EXISTS comandas (
        id SERIAL PRIMARY KEY,
        mesa_id INT NOT NULL REFERENCES mesas(id),
        usuario_id INT NOT NULL REFERENCES usuarios(id),
        status VARCHAR(50) NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'finalizada')),
        data_abertura TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        data_fechamento TIMESTAMP WITH TIME ZONE,
        valor_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00
      );
    `;
    console.log('✅ Tabela `comandas` pronta');

    await sql`
      CREATE TABLE IF NOT EXISTS itens_comanda (
        id SERIAL PRIMARY KEY,
        comanda_id INT NOT NULL REFERENCES comandas(id) ON DELETE CASCADE,
        produto_id INT NOT NULL REFERENCES produtos(id),
        quantidade INT NOT NULL DEFAULT 1,
        preco_unitario NUMERIC(10, 2) NOT NULL
      );
    `;
    console.log('✅ Tabela `itens_comanda` pronta');

    // Inserir usuários padrão
    const adminPass = await bcrypt.hash('admin123', 10);
    const atendentePass = await bcrypt.hash('atendente123', 10);

    await sql`
      INSERT INTO usuarios (nome, email, senha, tipo)
      VALUES 
        ('Administrador Chefe', 'admin@comanda.com', ${adminPass}, 'administrador'),
        ('Carlos Atendente', 'atendente@comanda.com', ${atendentePass}, 'atendente')
      ON CONFLICT (email) DO NOTHING;
    `;
    console.log('✅ Usuários padrão criados (admin@comanda.com e atendente@comanda.com)');

    // Inserir mesas de 1 a 10
    for (let i = 1; i <= 10; i++) {
      await sql`
        INSERT INTO mesas (numero, status)
        VALUES (${i}, 'disponivel')
        ON CONFLICT (numero) DO NOTHING;
      `;
    }
    console.log('✅ Mesas 1 a 10 criadas');

    // Inserir produtos padrão
    await sql`
      INSERT INTO produtos (nome, descricao, preco, categoria)
      VALUES
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
    `;
    console.log('✅ Cardápio de produtos padrão criado com sucesso!');
    console.log('🎉 Banco de dados Neon inicializado com perfeição!');
  } catch (error) {
    console.error('❌ Erro ao executar seed no Neon:', error);
    process.exit(1);
  }
}

runSeed();
