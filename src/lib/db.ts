import { neon, Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { hashPassword } from './auth';
import { Comanda, ItemComanda, Mesa, Produto, StatusMesa, Usuario } from './types';

const isNeonConfigured = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres'));

let dbInitialized = false;

// Interface for local file storage
interface LocalDatabase {
  usuarios: Usuario[];
  produtos: Produto[];
  mesas: Mesa[];
  comandas: Comanda[];
  itens_comanda: ItemComanda[];
}

const LOCAL_DB_PATH = path.join(process.cwd(), 'data', 'local-db.json');

function readLocalDb(): LocalDatabase {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    const initialData: LocalDatabase = {
      usuarios: [],
      produtos: [],
      mesas: [],
      comandas: [],
      itens_comanda: [],
    };
    fs.mkdirSync(path.dirname(LOCAL_DB_PATH), { recursive: true });
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  try {
    const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {
      usuarios: [],
      produtos: [],
      mesas: [],
      comandas: [],
      itens_comanda: [],
    };
  }
}

function writeLocalDb(data: LocalDatabase) {
  fs.mkdirSync(path.dirname(LOCAL_DB_PATH), { recursive: true });
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function getDatabaseStatus() {
  return {
    isNeon: isNeonConfigured,
    type: isNeonConfigured ? 'PostgreSQL (Neon)' : 'Armazenamento Local / Demonstração',
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
  };
}

export async function initDb() {
  if (dbInitialized) return;

  if (isNeonConfigured) {
    const sql = neon(process.env.DATABASE_URL!);
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

      await sql`
        CREATE TABLE IF NOT EXISTS produtos (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          descricao TEXT,
          preco NUMERIC(10, 2) NOT NULL,
          categoria VARCHAR(100) NOT NULL
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS mesas (
          id SERIAL PRIMARY KEY,
          numero INT UNIQUE NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'ocupada'))
        );
      `;

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

      await sql`
        CREATE TABLE IF NOT EXISTS itens_comanda (
          id SERIAL PRIMARY KEY,
          comanda_id INT NOT NULL REFERENCES comandas(id) ON DELETE CASCADE,
          produto_id INT NOT NULL REFERENCES produtos(id),
          quantidade INT NOT NULL DEFAULT 1,
          preco_unitario NUMERIC(10, 2) NOT NULL
        );
      `;

      // Seed inicial se estiver vazio
      const usersCount = await sql`SELECT count(*) as count FROM usuarios`;
      if (Number(usersCount[0].count) === 0) {
        const adminPass = await hashPassword('admin123');
        const atendentePass = await hashPassword('atendente123');

        await sql`
          INSERT INTO usuarios (nome, email, senha, tipo) VALUES
          ('Administrador Chefe', 'admin@comanda.com', ${adminPass}, 'administrador'),
          ('Carlos Atendente', 'atendente@comanda.com', ${atendentePass}, 'atendente');
        `;
      }

      const mesasCount = await sql`SELECT count(*) as count FROM mesas`;
      if (Number(mesasCount[0].count) === 0) {
        for (let i = 1; i <= 8; i++) {
          await sql`INSERT INTO mesas (numero, status) VALUES (${i}, 'disponivel') ON CONFLICT DO NOTHING;`;
        }
      }

      const prodCount = await sql`SELECT count(*) as count FROM produtos`;
      if (Number(prodCount[0].count) === 0) {
        await sql`
          INSERT INTO produtos (nome, descricao, preco, categoria) VALUES
          ('X-Burger Artesanal', 'Pão brioche, hambúrguer 180g, queijo cheddar e maionese especial', 28.50, 'Lanches'),
          ('X-Bacon Especial', 'Hambúrguer 180g, queijo prato, fatias crocantes de bacon e molho barbecue', 32.00, 'Lanches'),
          ('Batata Frita Rústica', 'Porção de batatas com alecrim e alho com molho da casa', 22.00, 'Porções'),
          ('Pastel de Queijo (4 unid)', 'Pastéis crocantes recheados com muçarela premium', 18.00, 'Porções'),
          ('Refrigerante Lata 350ml', 'Coca-Cola, Guaraná Antarctica ou Fanta', 6.50, 'Bebidas'),
          ('Suco Natural de Laranja 400ml', 'Feito na hora com laranjas frescas', 8.50, 'Bebidas'),
          ('Água Mineral 500ml', 'Com ou sem gás', 4.50, 'Bebidas'),
          ('Pudim de Leite Condensado', 'Fatia cremosa com calda caramelizada tradicional', 12.00, 'Sobremesas'),
          ('Petit Gâteau de Chocolate', 'Bolo quente com recheio cremoso e sorvete de baunilha', 16.00, 'Sobremesas');
        `;
      }

      dbInitialized = true;
      return;
    } catch (err) {
      console.error('Falha ao conectar ao Neon PostgreSQL:', err);
      // Fallback para armazenamento local
    }
  }

  // Seed local file storage
  const db = readLocalDb();
  if (db.usuarios.length === 0) {
    const adminPass = await hashPassword('admin123');
    const atendentePass = await hashPassword('atendente123');

    db.usuarios = [
      { id: 1, nome: 'Administrador Chefe', email: 'admin@comanda.com', senha: adminPass, tipo: 'administrador' },
      { id: 2, nome: 'Carlos Atendente', email: 'atendente@comanda.com', senha: atendentePass, tipo: 'atendente' },
    ];
  }

  if (db.mesas.length === 0) {
    db.mesas = [
      { id: 1, numero: 1, status: 'disponivel' },
      { id: 2, numero: 2, status: 'disponivel' },
      { id: 3, numero: 3, status: 'disponivel' },
      { id: 4, numero: 4, status: 'disponivel' },
      { id: 5, numero: 5, status: 'disponivel' },
      { id: 6, numero: 6, status: 'disponivel' },
      { id: 7, numero: 7, status: 'disponivel' },
      { id: 8, numero: 8, status: 'disponivel' },
    ];
  }

  if (db.produtos.length === 0) {
    db.produtos = [
      { id: 1, nome: 'X-Burger Artesanal', descricao: 'Pão brioche, hambúrguer 180g, queijo cheddar e maionese especial', preco: 28.50, categoria: 'Lanches' },
      { id: 2, nome: 'X-Bacon Especial', descricao: 'Hambúrguer 180g, queijo prato, fatias crocantes de bacon e molho barbecue', preco: 32.00, categoria: 'Lanches' },
      { id: 3, nome: 'Batata Frita Rústica', descricao: 'Porção de batatas com alecrim e alho com molho da casa', preco: 22.00, categoria: 'Porções' },
      { id: 4, nome: 'Pastel de Queijo (4 unid)', descricao: 'Pastéis crocantes recheados com muçarela premium', preco: 18.00, categoria: 'Porções' },
      { id: 5, nome: 'Refrigerante Lata 350ml', descricao: 'Coca-Cola, Guaraná Antarctica ou Fanta', preco: 6.50, categoria: 'Bebidas' },
      { id: 6, nome: 'Suco Natural de Laranja 400ml', descricao: 'Feito na hora com laranjas frescas', preco: 8.50, categoria: 'Bebidas' },
      { id: 7, nome: 'Água Mineral 500ml', descricao: 'Com ou sem gás', preco: 4.50, categoria: 'Bebidas' },
      { id: 8, nome: 'Pudim de Leite Condensado', descricao: 'Fatia cremosa com calda caramelizada tradicional', preco: 12.00, categoria: 'Sobremesas' },
      { id: 9, nome: 'Petit Gâteau de Chocolate', descricao: 'Bolo quente com recheio cremoso e sorvete de baunilha', preco: 16.00, categoria: 'Sobremesas' },
    ];
  }

  writeLocalDb(db);
  dbInitialized = true;
}

// ----------------------------------------------------
// USUÁRIOS
// ----------------------------------------------------
export async function getUserByEmail(email: string): Promise<Usuario | null> {
  await initDb();
  if (isNeonConfigured) {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`SELECT * FROM usuarios WHERE LOWER(email) = LOWER(${email.trim()}) LIMIT 1`;
    if (rows.length === 0) return null;
    return rows[0] as Usuario;
  }
  const db = readLocalDb();
  const user = db.usuarios.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  return user || null;
}

export async function getUserById(id: number): Promise<Usuario | null> {
  await initDb();
  if (isNeonConfigured) {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`SELECT id, nome, email, tipo FROM usuarios WHERE id = ${id} LIMIT 1`;
    if (rows.length === 0) return null;
    return rows[0] as Usuario;
  }
  const db = readLocalDb();
  const user = db.usuarios.find((u) => u.id === id);
  if (!user) return null;
  const { senha, ...safeUser } = user;
  return safeUser as Usuario;
}

// ----------------------------------------------------
// PRODUTOS (RF10, RF11, RF12, RF13)
// ----------------------------------------------------
export async function getProdutos(): Promise<Produto[]> {
  await initDb();
  if (isNeonConfigured) {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`SELECT id, nome, descricao, preco::float, categoria FROM produtos ORDER BY categoria, nome`;
    return rows as Produto[];
  }
  const db = readLocalDb();
  return [...db.produtos].sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nome.localeCompare(b.nome));
}

export async function getProdutoById(id: number): Promise<Produto | null> {
  await initDb();
  if (isNeonConfigured) {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`SELECT id, nome, descricao, preco::float, categoria FROM produtos WHERE id = ${id} LIMIT 1`;
    return (rows[0] as Produto) || null;
  }
  const db = readLocalDb();
  return db.produtos.find((p) => p.id === id) || null;
}

export async function createProduto(data: { nome: string; descricao: string; preco: number; categoria: string }): Promise<Produto> {
  await initDb();
  if (isNeonConfigured) {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      INSERT INTO produtos (nome, descricao, preco, categoria)
      VALUES (${data.nome}, ${data.descricao}, ${data.preco}, ${data.categoria})
      RETURNING id, nome, descricao, preco::float, categoria
    `;
    return rows[0] as Produto;
  }
  const db = readLocalDb();
  const nextId = db.produtos.length > 0 ? Math.max(...db.produtos.map((p) => p.id)) + 1 : 1;
  const newProd: Produto = {
    id: nextId,
    nome: data.nome,
    descricao: data.descricao,
    preco: data.preco,
    categoria: data.categoria,
  };
  db.produtos.push(newProd);
  writeLocalDb(db);
  return newProd;
}

export async function updateProduto(id: number, data: { nome: string; descricao: string; preco: number; categoria: string }): Promise<Produto | null> {
  await initDb();
  if (isNeonConfigured) {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      UPDATE produtos
      SET nome = ${data.nome}, descricao = ${data.descricao}, preco = ${data.preco}, categoria = ${data.categoria}
      WHERE id = ${id}
      RETURNING id, nome, descricao, preco::float, categoria
    `;
    return (rows[0] as Produto) || null;
  }
  const db = readLocalDb();
  const index = db.produtos.findIndex((p) => p.id === id);
  if (index === -1) return null;
  db.produtos[index] = {
    ...db.produtos[index],
    nome: data.nome,
    descricao: data.descricao,
    preco: data.preco,
    categoria: data.categoria,
  };
  writeLocalDb(db);
  return db.produtos[index];
}

export async function deleteProduto(id: number): Promise<boolean> {
  await initDb();
  if (isNeonConfigured) {
    const sql = neon(process.env.DATABASE_URL!);
    const res = await sql`DELETE FROM produtos WHERE id = ${id}`;
    return true;
  }
  const db = readLocalDb();
  const initialLength = db.produtos.length;
  db.produtos = db.produtos.filter((p) => p.id !== id);
  writeLocalDb(db);
  return db.produtos.length < initialLength;
}

// ----------------------------------------------------
// MESAS (RF03)
// ----------------------------------------------------
export async function getMesas(): Promise<Mesa[]> {
  await initDb();
  if (isNeonConfigured) {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT 
        m.id, 
        m.numero, 
        m.status,
        (SELECT c.id FROM comandas c WHERE c.mesa_id = m.id AND c.status = 'aberta' ORDER BY c.id DESC LIMIT 1) as comanda_ativa_id
      FROM mesas m
      ORDER BY m.numero ASC
    `;
    return rows.map((r) => ({
      id: r.id,
      numero: r.numero,
      status: r.status as 'disponivel' | 'ocupada',
      comanda_ativa_id: r.comanda_ativa_id ? Number(r.comanda_ativa_id) : null,
    }));
  }
  const db = readLocalDb();
  return db.mesas.map((m) => {
    const activeOrder = db.comandas.find((c) => c.mesa_id === m.id && c.status === 'aberta');
    return {
      ...m,
      status: (activeOrder ? 'ocupada' : 'disponivel') as StatusMesa,
      comanda_ativa_id: activeOrder ? activeOrder.id : null,
    };
  }).sort((a, b) => a.numero - b.numero);
}

export async function getMesaById(id: number): Promise<Mesa | null> {
  const mesas = await getMesas();
  return mesas.find((m) => m.id === id) || null;
}

// ----------------------------------------------------
// COMANDAS (RF04, RF06, RF07, RF08, RF09)
// ----------------------------------------------------
export async function getComandas(filters?: { mesa_id?: number; status?: string }): Promise<Comanda[]> {
  await initDb();
  if (isNeonConfigured) {
    const sql = neon(process.env.DATABASE_URL!);
    let rows;
    if (filters?.mesa_id && filters?.status) {
      rows = await sql`
        SELECT 
          c.id, c.mesa_id, c.usuario_id, c.status, 
          c.data_abertura, c.data_fechamento, c.valor_total::float,
          m.numero as mesa_numero,
          u.nome as usuario_nome
        FROM comandas c
        JOIN mesas m ON c.mesa_id = m.id
        JOIN usuarios u ON c.usuario_id = u.id
        WHERE c.mesa_id = ${filters.mesa_id} AND c.status = ${filters.status}
        ORDER BY c.data_abertura DESC
      `;
    } else if (filters?.mesa_id) {
      rows = await sql`
        SELECT 
          c.id, c.mesa_id, c.usuario_id, c.status, 
          c.data_abertura, c.data_fechamento, c.valor_total::float,
          m.numero as mesa_numero,
          u.nome as usuario_nome
        FROM comandas c
        JOIN mesas m ON c.mesa_id = m.id
        JOIN usuarios u ON c.usuario_id = u.id
        WHERE c.mesa_id = ${filters.mesa_id}
        ORDER BY c.data_abertura DESC
      `;
    } else if (filters?.status) {
      rows = await sql`
        SELECT 
          c.id, c.mesa_id, c.usuario_id, c.status, 
          c.data_abertura, c.data_fechamento, c.valor_total::float,
          m.numero as mesa_numero,
          u.nome as usuario_nome
        FROM comandas c
        JOIN mesas m ON c.mesa_id = m.id
        JOIN usuarios u ON c.usuario_id = u.id
        WHERE c.status = ${filters.status}
        ORDER BY c.data_abertura DESC
      `;
    } else {
      rows = await sql`
        SELECT 
          c.id, c.mesa_id, c.usuario_id, c.status, 
          c.data_abertura, c.data_fechamento, c.valor_total::float,
          m.numero as mesa_numero,
          u.nome as usuario_nome
        FROM comandas c
        JOIN mesas m ON c.mesa_id = m.id
        JOIN usuarios u ON c.usuario_id = u.id
        ORDER BY c.data_abertura DESC
      `;
    }
    return rows as Comanda[];
  }

  const db = readLocalDb();
  let list = db.comandas.map((c) => {
    const mesa = db.mesas.find((m) => m.id === c.mesa_id);
    const user = db.usuarios.find((u) => u.id === c.usuario_id);
    return {
      ...c,
      mesa_numero: mesa ? mesa.numero : undefined,
      usuario_nome: user ? user.nome : undefined,
    };
  });

  if (filters?.mesa_id) {
    list = list.filter((c) => c.mesa_id === Number(filters.mesa_id));
  }
  if (filters?.status) {
    list = list.filter((c) => c.status === filters.status);
  }

  return list.sort((a, b) => new Date(b.data_abertura).getTime() - new Date(a.data_abertura).getTime());
}

export async function getComandaById(id: number): Promise<Comanda | null> {
  await initDb();
  if (isNeonConfigured) {
    const sql = neon(process.env.DATABASE_URL!);
    const orderRows = await sql`
      SELECT 
        c.id, c.mesa_id, c.usuario_id, c.status, 
        c.data_abertura, c.data_fechamento, c.valor_total::float,
        m.numero as mesa_numero,
        u.nome as usuario_nome
      FROM comandas c
      JOIN mesas m ON c.mesa_id = m.id
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.id = ${id}
      LIMIT 1
    `;
    if (orderRows.length === 0) return null;

    const itemsRows = await sql`
      SELECT 
        i.id, i.comanda_id, i.produto_id, i.quantidade, i.preco_unitario::float,
        p.nome as produto_nome, p.categoria as produto_categoria,
        (i.quantidade * i.preco_unitario)::float as subtotal
      FROM itens_comanda i
      JOIN produtos p ON i.produto_id = p.id
      WHERE i.comanda_id = ${id}
      ORDER BY i.id ASC
    `;

    const comanda = orderRows[0] as Comanda;
    comanda.itens = itemsRows as ItemComanda[];
    return comanda;
  }

  const db = readLocalDb();
  const comanda = db.comandas.find((c) => c.id === id);
  if (!comanda) return null;

  const mesa = db.mesas.find((m) => m.id === comanda.mesa_id);
  const user = db.usuarios.find((u) => u.id === comanda.usuario_id);

  const items = db.itens_comanda
    .filter((i) => i.comanda_id === id)
    .map((i) => {
      const prod = db.produtos.find((p) => p.id === i.produto_id);
      return {
        ...i,
        produto_nome: prod?.nome,
        produto_categoria: prod?.categoria,
        subtotal: Number((i.quantidade * i.preco_unitario).toFixed(2)),
      };
    });

  return {
    ...comanda,
    mesa_numero: mesa?.numero,
    usuario_nome: user?.nome,
    itens: items,
  };
}

export async function abrirComanda(mesa_id: number, usuario_id: number): Promise<Comanda> {
  await initDb();
  if (isNeonConfigured) {
    const sql = neon(process.env.DATABASE_URL!);

    // Verificar se já existe comanda aberta para esta mesa
    const openOrders = await sql`
      SELECT id FROM comandas WHERE mesa_id = ${mesa_id} AND status = 'aberta' LIMIT 1
    `;
    if (openOrders.length > 0) {
      throw new Error('Já existe uma comanda aberta para esta mesa');
    }

    const inserted = await sql`
      INSERT INTO comandas (mesa_id, usuario_id, status, data_abertura, valor_total)
      VALUES (${mesa_id}, ${usuario_id}, 'aberta', NOW(), 0.00)
      RETURNING id, mesa_id, usuario_id, status, data_abertura, data_fechamento, valor_total::float
    `;

    // Atualiza status da mesa para ocupada
    await sql`UPDATE mesas SET status = 'ocupada' WHERE id = ${mesa_id}`;

    return inserted[0] as Comanda;
  }

  const db = readLocalDb();
  const openOrder = db.comandas.find((c) => c.mesa_id === mesa_id && c.status === 'aberta');
  if (openOrder) {
    throw new Error('Já existe uma comanda aberta para esta mesa');
  }

  const nextId = db.comandas.length > 0 ? Math.max(...db.comandas.map((c) => c.id)) + 1 : 1;
  const newComanda: Comanda = {
    id: nextId,
    mesa_id,
    usuario_id,
    status: 'aberta',
    data_abertura: new Date().toISOString(),
    data_fechamento: null,
    valor_total: 0.0,
    itens: [],
  };

  db.comandas.push(newComanda);

  // Marca mesa como ocupada
  const mesaIndex = db.mesas.findIndex((m) => m.id === mesa_id);
  if (mesaIndex !== -1) {
    db.mesas[mesaIndex].status = 'ocupada';
  }

  writeLocalDb(db);
  return newComanda;
}

// ----------------------------------------------------
// ITENS DA COMANDA (RF05, RF06, RF07)
// ----------------------------------------------------
export async function adicionarItemComanda(
  comanda_id: number,
  produto_id: number,
  quantidade: number = 1
): Promise<{ item: ItemComanda; valor_total: number }> {
  await initDb();
  if (quantidade <= 0) {
    throw new Error('A quantidade deve ser maior que zero');
  }

  if (isNeonConfigured) {
    const sql = neon(process.env.DATABASE_URL!);

    // Verificar se comanda está aberta
    const orderRows = await sql`SELECT status, mesa_id FROM comandas WHERE id = ${comanda_id} LIMIT 1`;
    if (orderRows.length === 0) throw new Error('Comanda não encontrada');
    if (orderRows[0].status !== 'aberta') throw new Error('Não é possível adicionar itens a uma comanda finalizada');

    // Buscar produto
    const prodRows = await sql`SELECT preco::float FROM produtos WHERE id = ${produto_id} LIMIT 1`;
    if (prodRows.length === 0) throw new Error('Produto não encontrado');
    const preco = Number(prodRows[0].preco);

    // Verificar se já existe item deste produto nesta comanda
    const existing = await sql`
      SELECT id, quantidade FROM itens_comanda WHERE comanda_id = ${comanda_id} AND produto_id = ${produto_id} LIMIT 1
    `;

    let itemResult: ItemComanda;
    if (existing.length > 0) {
      const newQty = existing[0].quantidade + quantidade;
      const updated = await sql`
        UPDATE itens_comanda
        SET quantidade = ${newQty}
        WHERE id = ${existing[0].id}
        RETURNING id, comanda_id, produto_id, quantidade, preco_unitario::float
      `;
      itemResult = updated[0] as ItemComanda;
    } else {
      const inserted = await sql`
        INSERT INTO itens_comanda (comanda_id, produto_id, quantidade, preco_unitario)
        VALUES (${comanda_id}, ${produto_id}, ${quantidade}, ${preco})
        RETURNING id, comanda_id, produto_id, quantidade, preco_unitario::float
      `;
      itemResult = inserted[0] as ItemComanda;
    }

    // Recalcular total da comanda
    const totalRow = await sql`
      SELECT COALESCE(SUM(quantidade * preco_unitario), 0)::float as total
      FROM itens_comanda
      WHERE comanda_id = ${comanda_id}
    `;
    const novoTotal = Number(totalRow[0].total);

    await sql`UPDATE comandas SET valor_total = ${novoTotal} WHERE id = ${comanda_id}`;

    return { item: itemResult, valor_total: novoTotal };
  }

  const db = readLocalDb();
  const comandaIndex = db.comandas.findIndex((c) => c.id === comanda_id);
  if (comandaIndex === -1) throw new Error('Comanda não encontrada');
  if (db.comandas[comandaIndex].status !== 'aberta') throw new Error('Não é possível adicionar itens a uma comanda finalizada');

  const produto = db.produtos.find((p) => p.id === produto_id);
  if (!produto) throw new Error('Produto não encontrado');

  const existingItemIndex = db.itens_comanda.findIndex(
    (i) => i.comanda_id === comanda_id && i.produto_id === produto_id
  );

  let resultItem: ItemComanda;
  if (existingItemIndex !== -1) {
    db.itens_comanda[existingItemIndex].quantidade += quantidade;
    resultItem = db.itens_comanda[existingItemIndex];
  } else {
    const nextItemId = db.itens_comanda.length > 0 ? Math.max(...db.itens_comanda.map((i) => i.id)) + 1 : 1;
    resultItem = {
      id: nextItemId,
      comanda_id,
      produto_id,
      quantidade,
      preco_unitario: produto.preco,
    };
    db.itens_comanda.push(resultItem);
  }

  // Recalcular total
  const total = db.itens_comanda
    .filter((i) => i.comanda_id === comanda_id)
    .reduce((sum, item) => sum + item.quantidade * item.preco_unitario, 0);

  db.comandas[comandaIndex].valor_total = Number(total.toFixed(2));
  writeLocalDb(db);

  return { item: resultItem, valor_total: db.comandas[comandaIndex].valor_total };
}

export async function removerItemComanda(itemId: number): Promise<{ valor_total: number }> {
  await initDb();
  if (isNeonConfigured) {
    const sql = neon(process.env.DATABASE_URL!);
    const itemRows = await sql`SELECT comanda_id FROM itens_comanda WHERE id = ${itemId} LIMIT 1`;
    if (itemRows.length === 0) throw new Error('Item não encontrado');
    const comanda_id = itemRows[0].comanda_id;

    // Verificar se comanda está aberta
    const orderRows = await sql`SELECT status FROM comandas WHERE id = ${comanda_id} LIMIT 1`;
    if (orderRows.length === 0 || orderRows[0].status !== 'aberta') {
      throw new Error('Não é possível alterar itens de comanda finalizada');
    }

    await sql`DELETE FROM itens_comanda WHERE id = ${itemId}`;

    const totalRow = await sql`
      SELECT COALESCE(SUM(quantidade * preco_unitario), 0)::float as total
      FROM itens_comanda
      WHERE comanda_id = ${comanda_id}
    `;
    const novoTotal = Number(totalRow[0].total);
    await sql`UPDATE comandas SET valor_total = ${novoTotal} WHERE id = ${comanda_id}`;

    return { valor_total: novoTotal };
  }

  const db = readLocalDb();
  const itemIndex = db.itens_comanda.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) throw new Error('Item não encontrado');

  const comanda_id = db.itens_comanda[itemIndex].comanda_id;
  const comanda = db.comandas.find((c) => c.id === comanda_id);
  if (!comanda || comanda.status !== 'aberta') {
    throw new Error('Não é possível alterar itens de comanda finalizada');
  }

  db.itens_comanda.splice(itemIndex, 1);

  const total = db.itens_comanda
    .filter((i) => i.comanda_id === comanda_id)
    .reduce((sum, item) => sum + item.quantidade * item.preco_unitario, 0);

  comanda.valor_total = Number(total.toFixed(2));
  writeLocalDb(db);

  return { valor_total: comanda.valor_total };
}

// ----------------------------------------------------
// FINALIZAR COMANDA (RF08, RF09)
// ----------------------------------------------------
export async function finalizarComanda(comanda_id: number): Promise<Comanda> {
  await initDb();
  if (isNeonConfigured) {
    const sql = neon(process.env.DATABASE_URL!);

    const comandaRows = await sql`
      SELECT id, mesa_id, status FROM comandas WHERE id = ${comanda_id} LIMIT 1
    `;
    if (comandaRows.length === 0) throw new Error('Comanda não encontrada');
    if (comandaRows[0].status === 'finalizada') throw new Error('Esta comanda já foi finalizada');

    const mesa_id = comandaRows[0].mesa_id;

    // Calcular total final garantido
    const totalRow = await sql`
      SELECT COALESCE(SUM(quantidade * preco_unitario), 0)::float as total
      FROM itens_comanda
      WHERE comanda_id = ${comanda_id}
    `;
    const totalFinal = Number(totalRow[0].total);

    const updated = await sql`
      UPDATE comandas
      SET status = 'finalizada', data_fechamento = NOW(), valor_total = ${totalFinal}
      WHERE id = ${comanda_id}
      RETURNING id, mesa_id, usuario_id, status, data_abertura, data_fechamento, valor_total::float
    `;

    // Liberar mesa se não houver outra comanda aberta
    const remainingOpen = await sql`
      SELECT id FROM comandas WHERE mesa_id = ${mesa_id} AND status = 'aberta' LIMIT 1
    `;
    if (remainingOpen.length === 0) {
      await sql`UPDATE mesas SET status = 'disponivel' WHERE id = ${mesa_id}`;
    }

    return updated[0] as Comanda;
  }

  const db = readLocalDb();
  const comanda = db.comandas.find((c) => c.id === comanda_id);
  if (!comanda) throw new Error('Comanda não encontrada');
  if (comanda.status === 'finalizada') throw new Error('Esta comanda já foi finalizada');

  // Recalcular total
  const total = db.itens_comanda
    .filter((i) => i.comanda_id === comanda_id)
    .reduce((sum, item) => sum + item.quantidade * item.preco_unitario, 0);

  comanda.status = 'finalizada';
  comanda.data_fechamento = new Date().toISOString();
  comanda.valor_total = Number(total.toFixed(2));

  // Verificar se mesa deve voltar a ser disponível
  const remainingOpen = db.comandas.some((c) => c.mesa_id === comanda.mesa_id && c.status === 'aberta');
  if (!remainingOpen) {
    const mesa = db.mesas.find((m) => m.id === comanda.mesa_id);
    if (mesa) mesa.status = 'disponivel';
  }

  writeLocalDb(db);
  return comanda;
}
