# 🍽️ Comanda Fácil — Sistema de Gerenciamento Gastronômico

O **Comanda Fácil** é uma aplicação completa e moderna para gerenciamento de pedidos e comandas, desenvolvida especificamente para pequenos restaurantes, lanchonetes e cafeterias.

O projeto foi construído rigorosamente de acordo com as especificações contidas no documento `spec_comanda_facil.pdf`.

🌐 **Sistema publicado e disponível no ar em:** [https://comandafacil-xkq1.onrender.com](https://comandafacil-xkq1.onrender.com)

---

## 🚀 Tecnologias e Arquitetura

- **Front-end & Back-end**: [Next.js](https://nextjs.org/) (App Router, Server-Side Rendering e API Routes)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/) com design responsivo (desktop e mobile)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Banco de Dados**: PostgreSQL com [Neon](https://neon.tech/) (driver oficial `@neondatabase/serverless`)
- **Autenticação & Segurança**: [bcryptjs](https://github.com/dcodeIO/bcrypt.js) para hashing irreversível de senhas e JWT assinado via [jose](https://github.com/panva/jose) em cookies HTTP-Only seguros
- **Deploy**: Otimizado para [Vercel](https://vercel.com/) com integração ao GitHub

---

## 📋 Requisitos Implementados

### Perfis de Usuários
1. **Atendente**:
   - Fazer login seguro
   - Visualizar mapa de mesas (status: *Disponível* / *Ocupada*)
   - Abrir comandas para mesas livres
   - Adicionar produtos à comanda com busca rápida e categorias
   - Consultar itens detalhados com preços unitários e subtotais
   - Visualizar valor total recalculado em tempo real
   - Finalizar comandas e liberar as mesas automaticamente
2. **Administrador**:
   - Fazer login seguro
   - Cadastrar novos produtos no cardápio
   - Alterar produtos existentes (nome, descrição, preço e categoria)
   - Excluir produtos do catálogo
   - Consultar produtos cadastrados
   - Visualizar histórico financeiro de comandas

### Requisitos Funcionais (RF01 - RF14)
- **RF01**: Login de usuários com validação.
- **RF02**: Identificação do tipo de usuário (atendente ou administrador).
- **RF03**: Visualização em grade do status das mesas.
- **RF04**: Abertura de comanda vinculada à mesa.
- **RF05**: Inclusão de produtos com quantidade na comanda.
- **RF06**: Consulta e visualização dos itens de uma comanda.
- **RF07**: Cálculo automático do valor total da comanda.
- **RF08**: Finalização da comanda com data de encerramento e liberação da mesa.
- **RF09**: Persistência de todas as comandas e itens no banco de dados.
- **RF10**: Cadastro de novos produtos com validação.
- **RF11**: Consulta e filtro de produtos por categoria e pesquisa.
- **RF12**: Edição e atualização de produtos.
- **RF13**: Exclusão de produtos.
- **RF14**: Middleware protegendo todas as áreas privadas contra acessos não autenticados.

### Requisitos Não Funcionais
- **Segurança**: Senhas criptografadas com bcrypt (sem texto puro); formulários com validações de tipo e obrigatoriedade; dados sensíveis via variáveis de ambiente.
- **Desempenho**: Next.js com geração estática e otimizações Turbopack; layout leve e carregamento ultra rápido.
- **Usabilidade**: Interface intuitiva, cartões visuais para mesas, gaveta mobile responsiva e atalhos de teste na tela de login.

---

## 🗄️ Modelo de Dados (DER)

- **`usuarios`**: `id`, `nome`, `email`, `senha` (hash bcrypt), `tipo` (`atendente` | `administrador`)
- **`produtos`**: `id`, `nome`, `descricao`, `preco`, `categoria`
- **`mesas`**: `id`, `numero`, `status` (`disponivel` | `ocupada`)
- **`comandas`**: `id`, `mesa_id`, `usuario_id`, `status` (`aberta` | `finalizada`), `data_abertura`, `data_fechamento`, `valor_total`
- **`itens_comanda`**: `id`, `comanda_id`, `produto_id`, `quantidade`, `preco_unitario`

---

## 🔑 Credenciais Padrão para Teste

A tela de login possui botões de preenchimento automático para facilitar a avaliação:

| Perfil | E-mail | Senha |
|---|---|---|
| **Atendente** | `atendente@comanda.com` | `atendente123` |
| **Administrador** | `admin@comanda.com` | `admin123` |

---

## 💻 Como Executar Localmente

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
O projeto já conta com um arquivo `.env.local` configurado com chave de segurança padrão.

Caso queira conectar diretamente à sua instância do **PostgreSQL no Neon**, adicione sua connection string:
```env
DATABASE_URL="postgresql://usuario:senha@ep-exemplo.us-east-2.aws.neon.tech/neondb?sslmode=require"
```
> **Nota de Conveniência**: Caso não informe a `DATABASE_URL`, o sistema opera automaticamente em modo local com persistência em arquivo (`data/local-db.json`), permitindo testar 100% das funções imediatamente.

### 3. Inicializar o Banco de Dados no Neon (Opcional)
Se configurou o Neon no `.env.local`, execute o script de migração e sementes:
```bash
npm run seed
```

### 4. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### 5. Executar os Testes Automatizados End-to-End
Com o servidor rodando, execute:
```bash
node test-suite.mjs
```

---

## ☁️ Deploy na Vercel

1. Suba o repositório para o **GitHub**.
2. No painel da [Vercel](https://vercel.com/), clique em **"Add New Project"** e selecione o repositório.
3. Em **Environment Variables**, configure:
   - `DATABASE_URL`: Connection string do seu projeto no **Neon**
   - `JWT_SECRET`: Uma chave secreta segura aleatória
4. Clique em **Deploy**. A Vercel criará a build de produção automaticamente!
