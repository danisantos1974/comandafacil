# 📝 CHANGELOG & Registro de Decisões do Projeto

Este documento registra as decisões de arquitetura, correções realizadas, revisões humanas e melhorias técnicas implementadas durante o ciclo de desenvolvimento do **Comanda Fácil** com apoio da IA (Google Antigravity), em conformidade com as diretrizes da apostila *"Programar com IA de forma responsável"*.

---

## 📌 [v1.2.0] — 2026-11-10

### 🚀 Novas Funcionalidades
* **Módulo de Totem de Autoatendimento (`/totem`)**:
  * Implementação de interface touchscreen orientada a quiosques/tablets para os clientes fazerem pedidos diretamente nas mesas.
  * Criação do endpoint [`/api/totem/pedido`](src/app/api/totem/pedido/route.ts), que identifica a mesa, abre a comanda automaticamente se necessário e adiciona os itens selecionados.
  * Integração visual na Navbar desktop e gaveta mobile.
* **Documentação Final & Banco de Dados**:
  * Criação do arquivo [`database/schema.sql`](database/schema.sql) contendo a definição DDL completa do PostgreSQL e carga inicial de sementes (seed).
  * Criação do [`spec.md`](spec.md) com todas as seções atualizadas e o manual detalhado de instalação, configuração de ambiente e roteiro de testes para o avaliador.

### 🛡️ Revisão de Segurança (Checklist Anexo B da Apostila)
* **Prevenção contra SQL Injection**: Todas as consultas ao banco de dados no Neon utilizam template strings parametrizadas nativas do driver (`sql\`...\``), garantindo que nenhum input de usuário seja concatenado em queries puras.
* **Isolamento de Credenciais**: Nenhuma chave privada ou senha está exposta no código-fonte. O arquivo `.env.example` fornece modelos sem dados sensíveis e o `.gitignore` protege os arquivos `.env.local` e `.env`.
* **Criptografia de Senhas**: Substituição de qualquer possibilidade de texto plano pelo algoritmo de hash criptográfico `bcrypt` com salt de 10 rounds para todos os usuários cadastrados e seed.
* **Sessões e Tokens**: Utilização de JWT assinado com algoritmo HS256 trafegado em cookies `HttpOnly`, `SameSite=Lax` e `Secure` (em produção), mitigando vulnerabilidades XSS e CSRF.

---

## 📌 [v1.1.0] — 2026-10-27

### 🛠️ Decisões de Arquitetura e Revisão Humana
1. **Resiliência Dual de Banco de Dados**:
   * *Proposta Inicial do Agente*: Conectar exclusivamente ao PostgreSQL do Neon.
   * *Revisão Humana*: O professor ou avaliador pode testar o projeto offline ou sem criar conta no Neon. Foi implementada uma camada de abstração em [`src/lib/db.ts`](src/lib/db.ts) com fallback transparente para armazenamento local em arquivo JSON (`data/local-db.json`), garantindo que 100% dos requisitos funcionem tanto no Neon quanto localmente sem travar a avaliação.
2. **Correção de Tipagem no TypeScript**:
   * O agente gerou um mapeamento na função `getMesas()` em que o tipo `string` não era compatível com o enum restrito `'disponivel' | 'ocupada'`.
   * *Correção*: Adicionada a asserção de tipo explícita `as StatusMesa` e importado o tipo `StatusMesa` em [`src/lib/db.ts`](src/lib/db.ts).
3. **Controle de Sessão e Rotas Protegidas**:
   * *Revisão Humana*: O middleware Next.js precisava proteger não apenas `/mesas`, mas todas as rotas operacionais (`/comanda/*`, `/comandas`, `/produtos`) contra acessos não autenticados (RF14), e barrar atendentes comuns de acessarem o painel de gerenciamento de produtos do administrador.
   * *Correção*: Implementação de regras estritas no arquivo [`src/middleware.ts`](src/middleware.ts).

---

## 📌 [v1.0.0] — 2026-10-20

### 🚀 Implementação Inicial do Sistema (RF01 a RF14)
* **Autenticação**:
  * Rotas `/api/auth/login`, `/api/auth/logout` e `/api/auth/me`.
  * Tela de login com validação de campos e atalhos rápidos com 1 clique para agilizar a avaliação do professor.
* **Gerenciamento de Mesas e Comandas**:
  * Mapa de mesas com badges de status em tempo real.
  * Abertura de comandas com vinculação à mesa.
  * Adição e remoção de itens com cálculo de subtotal e valor total da comanda em tempo real.
  * Encerramento de comanda com gravação de data/hora de fechamento e liberação automática da mesa.
* **Catálogo de Produtos (Área Administrativa)**:
  * CRUD completo com modal para cadastrar, editar e excluir produtos.
  * Filtros por categoria e busca textual em tempo real.
* **Testes Automatizados**:
  * Desenvolvimento do script [`test-suite.mjs`](test-suite.mjs) para executar bateria de testes ponta a ponta simulando todos os casos de uso do sistema.
