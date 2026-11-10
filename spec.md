# COMANDA FÁCIL
## Spec — Especificação do Sistema & Manual de Instalação

---

### 1. Objetivo
* O **Comanda Fácil** é um sistema de gerenciamento de pedidos e comandas voltado para pequenos restaurantes, lanchonetes e cafeterias.
* O sistema tem como objetivo facilitar o controle de comandas, permitindo que o funcionário registre os pedidos de uma mesa, acompanhe os itens adicionados e consulte o valor da comanda de forma organizada.
* A proposta é oferecer uma interface simples e fácil de utilizar, principalmente para pequenos estabelecimentos que precisam organizar seus pedidos sem utilizar sistemas muito complexos.

---

### 2. Usuários
* **Atendente**: Fazer login; visualizar as mesas; abrir uma comanda; adicionar produtos à comanda; consultar os itens; visualizar o valor total recalculado em tempo real; finalizar uma comanda liberando a mesa.
* **Administrador**: Fazer login; cadastrar novos produtos; alterar produtos; excluir produtos; consultar produtos cadastrados; visualizar o histórico financeiro e operacional de comandas.
* **Cliente (Totem Kiosk)**: Acessar a tela de autoatendimento para visualizar o cardápio interativo e enviar pedidos diretamente para a sua mesa sem precisar aguardar o garçom.

---

### 3. Casos de Uso Principais
* Usuário faz login no sistema.
* Atendente visualiza a situação das mesas (Disponível ou Ocupada).
* Atendente abre uma comanda vinculada a uma mesa disponível.
* Atendente adiciona produtos à comanda aberta.
* Atendente consulta os produtos e subtotais da comanda.
* Sistema calcula e atualiza o valor total da comanda em tempo real.
* Atendente finaliza a comanda, registrando data/hora de fechamento e liberando a mesa.
* Administrador cadastra um novo produto com validação obrigatória de campos.
* Administrador consulta produtos cadastrados com busca por texto e filtro por categoria.
* Administrador altera os dados de um produto existente.
* Administrador exclui um produto do cardápio.
* Cliente faz pedido direto no Totem de Autoatendimento.

---

### 4. Requisitos Funcionais
* **RF01**: O sistema deve permitir o login dos usuários através de e-mail e senha.
* **RF02**: O sistema deve identificar o tipo de usuário (*atendente* ou *administrador*) e liberar as permissões correspondentes.
* **RF03**: O sistema deve permitir visualizar o mapa de mesas com indicação visual de ocupação.
* **RF04**: O sistema deve permitir abrir uma comanda para uma mesa disponível.
* **RF05**: O sistema deve permitir adicionar produtos e suas respectivas quantidades a uma comanda aberta.
* **RF06**: O sistema deve permitir visualizar os itens, quantidades e preços de uma comanda.
* **RF07**: O sistema deve calcular o valor total da comanda de forma automática e precisa.
* **RF08**: O sistema deve permitir finalizar uma comanda, arquivando o total e liberando a mesa para novos atendimentos.
* **RF09**: O sistema deve armazenar as comandas e o histórico de fechamento no banco de dados.
* **RF10**: O sistema deve permitir ao administrador cadastrar produtos informando nome, descrição, preço e categoria.
* **RF11**: O sistema deve permitir consultar produtos cadastrados com opções de filtro.
* **RF12**: O sistema deve permitir ao administrador alterar dados de produtos cadastrados.
* **RF13**: O sistema deve permitir ao administrador excluir produtos do cardápio.
* **RF14**: O sistema deve impedir que usuários não autenticados acessem as áreas protegidas, redirecionando-os para a tela de login.

---

### 5. Requisitos Não Funcionais
* **Segurança**: As senhas dos usuários nunca são armazenadas em texto puro (utiliza-se hash criptográfico irreversível `bcrypt` com salt de 10 rounds); os formulários contam com validação de tipos e dados obrigatórios; dados sensíveis e credenciais são isolados em variáveis de ambiente; autenticação implementada via tokens JWT assinados digitalmente (`jose`) em cookies seguros `HttpOnly` com proteção `SameSite`.
* **Desempenho**: Renderização veloz via Next.js com geração estática e otimizações de bundle; aplicação responsiva adaptada tanto para computadores de mesa quanto celulares e tablets.
* **Usabilidade**: Interface limpa e minimalista com Tailwind CSS; navegação clara com cartões visuais para mesas; atalhos rápidos de teste e feedback em caso de erros operacionais.

---

### 6. Modelo de Dados (DER)

#### Relacionamentos
* Um **usuário** pode registrar várias comandas (1:N).
* Uma **mesa** pode possuir várias comandas ao longo do tempo (1:N), mas apenas uma aberta simultaneamente.
* Uma **comanda** possui vários itens (1:N).
* Um **produto** pode aparecer em vários itens de comandas (1:N).
* Uma **comanda** pertence obrigatoriamente a uma mesa e a um usuário.
* Um **item de comanda** pertence a uma comanda e referencia um produto.

---

### 7. Critérios de Aceite
* **Dado** que o usuário possui uma conta cadastrada, **quando** informar e-mail e senha corretos, **então** deve conseguir acessar o sistema.
* **Dado** que o usuário não está autenticado, **quando** tentar acessar uma área protegida, **então** deve ser direcionado para a tela de login.
* **Dado** que uma mesa está disponível, **quando** o atendente abrir uma comanda, **então** uma nova comanda deve ser registrada no banco de dados e a mesa marcada como ocupada.
* **Dado** que uma comanda está aberta, **quando** o atendente adicionar um produto, **então** o produto deve aparecer na comanda e o valor total deve ser recalculado.
* **Dado** que uma comanda possui produtos, **quando** o atendente consultar a comanda, **então** o sistema deve mostrar os produtos e o valor total correto.
* **Dado** que uma comanda está aberta, **quando** o atendente finalizar a comanda, **então** a comanda deve ser marcada como finalizada, o valor total registrado, a data de fechamento gravada e a mesa liberada.
* **Dado** que o administrador está autenticado, **quando** cadastrar um produto com os dados obrigatórios, **então** o produto deve ser salvo e aparecer na lista de produtos.

---

### 8. Decisão de Stack e Deploy
* **Front-end & Back-end**: [Next.js](https://nextjs.org/) (App Router, Server Actions / API Routes, TypeScript, Tailwind CSS).
* **Banco de Dados**: PostgreSQL na nuvem utilizando o [Neon](https://neon.tech/) (driver `@neondatabase/serverless`), com fallback local em JSON (`data/local-db.json`) para viabilizar testes instantâneos offline.
* **Controle de Versão**: Git e GitHub.
* **Deploy**: Hospedado e publicado na nuvem via [Render](https://render.com/) (Web Service integrado ao GitHub).

---

### 9. Instalação e Execução

Esta seção contém todas as instruções necessárias para qualquer avaliador clonar o repositório em um computador novo e executar o sistema localmente do zero.

#### 9.1 Ambiente
* **Linguagem & Runtime**: Node.js versão **20.x** ou **22.x** (LTS).
* **Gerenciador de Pacotes**: `npm` (versão 10 ou superior).
* **Framework**: Next.js 15 / 16 (App Router com TypeScript).
* **Sistema Operacional Testado**: Windows 10/11 e Linux Ubuntu 22.04 LTS.

#### 9.2 Banco de Dados
* **SGBD**: PostgreSQL versão 15+ (recomendado serviço serverless [Neon](https://neon.tech/)) ou banco local.
* **Nome do Banco**: `neondb` (ou qualquer nome de banco PostgreSQL criado).
* **Caminho do Script SQL**: [`database/schema.sql`](database/schema.sql).
* **Como Executar o Script**:
  * **Opção A (Neon Web Console)**: No painel do seu projeto no Neon, vá na aba **SQL Editor**, cole o conteúdo de `database/schema.sql` e clique em **Run**.
  * **Opção B (Terminal / psql)**:
    ```bash
    psql "sua_connection_string_aqui" -f database/schema.sql
    ```
  * **Opção C (Script Automatizado do Projeto)**:
    Configurando a variável `DATABASE_URL` no arquivo `.env.local`, basta executar:
    ```bash
    npm run seed
    ```

#### Dicionário de Tabelas (DER Implementado)

| Tabela | Campos Principais | Chave Primária | Relacionamentos (Chaves Estrangeiras) |
|---|---|:---:|---|
| **`usuarios`** | `id`, `nome`, `email`, `senha`, `tipo` | `id` | — |
| **`produtos`** | `id`, `nome`, `descricao`, `preco`, `categoria` | `id` | — |
| **`mesas`** | `id`, `numero`, `status` | `id` | — |
| **`comandas`** | `id`, `mesa_id`, `usuario_id`, `status`, `data_abertura`, `data_fechamento`, `valor_total` | `id` | `mesa_id` → `mesas.id`<br>`usuario_id` → `usuarios.id` |
| **`itens_comanda`** | `id`, `comanda_id`, `produto_id`, `quantidade`, `preco_unitario` | `id` | `comanda_id` → `comandas.id`<br>`produto_id` → `produtos.id` |

* **Dados Iniciais Inseridos**: O script SQL já insere 2 usuários de teste com hash bcrypt (`admin@comanda.com` e `atendente@comanda.com`), 8 mesas (Mesa 01 a 08) e 9 produtos com preços e categorias reais.

#### 9.3 Variáveis de Ambiente
O repositório disponibiliza o arquivo [`.env.example`](.env.example). Para rodar localmente, crie o arquivo `.env.local` na raiz:

```env
# Conexão com o PostgreSQL Neon (opcional para teste local, obrigatório para produção)
DATABASE_URL="postgresql://usuario:senha@ep-exemplo.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Chave secreta usada para assinar os tokens JWT de sessão
JWT_SECRET="comanda-facil-secret-jwt-key-development-2026"
```

> **Nota de Resiliência Local**: Caso o avaliador queira rodar o sistema localmente **sem configurar nenhuma conta externa no Neon**, o sistema detecta automaticamente a ausência da `DATABASE_URL` e inicializa um banco de dados local com os mesmos dados em `data/local-db.json`, permitindo rodar e testar 100% das funções imediatamente!

#### 9.4 Passo a Passo de Instalação

Siga os passos numerados abaixo em seu terminal:

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/danisantos1974/comandafacil.git
   ```

2. **Entrar na pasta do projeto:**
   ```bash
   cd comandafacil
   ```

3. **Instalar as dependências:**
   ```bash
   npm install
   ```

4. **Configurar as variáveis de ambiente:**
   Copie o arquivo de exemplo para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   *(No Windows PowerShell: `Copy-Item .env.example .env.local`)*

5. **(Opcional) Inicializar o banco PostgreSQL:**
   Se configurou a `DATABASE_URL` no `.env.local`, execute:
   ```bash
   npm run seed
   ```

6. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

7. **Acessar o sistema no navegador:**
   Abra no seu navegador o endereço:
   👉 **[http://localhost:3000](http://localhost:3000)**

---

### 10. Como Testar o Sistema

#### 10.1 Credenciais de Teste
A tela de login possui botões interativos de **Acesso Rápido** (com 1 clique), ou você pode digitar manualmente:

* **Perfil Atendente**:
  * **E-mail**: `atendente@comanda.com`
  * **Senha**: `atendente123`
* **Perfil Administrador**:
  * **E-mail**: `admin@comanda.com`
  * **Senha**: `admin123`

#### 10.2 Roteiro do Fluxo Principal de Teste
1. **Login como Atendente**: Entre com `atendente@comanda.com` / `atendente123`.
2. **Mapa de Mesas**: Visualize as 8 mesas do restaurante (mesas livres em verde, ocupadas em amarelo).
3. **Abrir Comanda**: Clique em **"Abrir Comanda"** em uma mesa disponível (ex: Mesa 02). A mesa passará imediatamente a constar como ocupada e você será levado para a tela da comanda.
4. **Adicionar Itens**: Na coluna da direita, selecione itens do cardápio (ex: *X-Burger Artesanal*, *Batata Frita Rústica*, *Refrigerante*) clicando em **"+1"**. Observe o valor total recalculando instantaneamente.
5. **Histórico de Comandas**: Acesse o menu superior **"Comandas"** e veja o registro da comanda aberta com seu respectivo valor e horário.
6. **Finalizar Comanda**: Volte para a comanda e clique em **"Finalizar Comanda"**. O sistema confirmará o valor total, salvará a data/hora de fechamento e liberará a Mesa 02 automaticamente.
7. **Login como Administrador**: Faça logout pelo ícone no topo e entre com `admin@comanda.com` / `admin123`.
8. **Gerenciar Produtos**: Acesse a aba **"Produtos"** (visível exclusivamente para administradores).
   * Clique em **"Novo Produto"** para cadastrar um item.
   * Edite o preço ou nome de um produto existente.
   * Exclua um produto para validar a exclusão.
9. **Totem de Autoatendimento**: Acesse [`/totem`](http://localhost:3000/totem) pelo menu superior para simular o autoatendimento por parte dos clientes no salão.

#### 10.3 Testes Automatizados End-to-End
O projeto inclui um script com bateria completa de testes de API e integração. Com o servidor rodando em background, basta executar:
```bash
node test-suite.mjs
```
O script testará automaticamente login, restrições de permissão, abertura de comanda, adição de itens, cálculo de totais, fechamento e o CRUD de produtos.

#### 10.4 Limitações e Observações Conhecidas
* O sistema não realiza processamento real de pagamentos via cartão de crédito ou gateways externos (PIX/TEF), limitando-se ao controle gerencial de consumo e fechamento de conta.
* Em conexões locais sem internet, o sistema opera automaticamente no modo de fallback local com arquivo JSON sem interrupção de serviço.
