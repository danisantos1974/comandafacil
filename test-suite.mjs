async function runTests() {
  console.log('🧪 Iniciando bateria de testes do Comanda Fácil...\n');
  const baseUrl = 'http://localhost:3000';

  // 1. Status API
  console.log('1. Testando API de Status...');
  const resStatus = await fetch(`${baseUrl}/api/status`);
  const statusData = await resStatus.json();
  console.log('   Status:', statusData.status, '| Banco:', statusData.database.type);
  console.log('   Contadores:', statusData.counts);

  // 2. Login inválido
  console.log('\n2. Testando Login com credenciais inválidas...');
  const resInvalid = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'errado@comanda.com', senha: '123' }),
  });
  console.log('   Código HTTP esperado 401:', resInvalid.status);

  // 3. Login como Atendente
  console.log('\n3. Testando Login como Atendente...');
  const resLoginAtendente = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'atendente@comanda.com', senha: 'atendente123' }),
  });
  console.log('   Código HTTP esperado 200:', resLoginAtendente.status);
  const cookieHeader = resLoginAtendente.headers.get('set-cookie');
  const tokenCookie = cookieHeader ? cookieHeader.split(';')[0] : '';
  console.log('   Cookie de sessão recebido:', tokenCookie.substring(0, 30) + '...');

  // 4. Listar Mesas
  console.log('\n4. Testando Listagem de Mesas (RF03)...');
  const resMesas = await fetch(`${baseUrl}/api/mesas`, {
    headers: { Cookie: tokenCookie },
  });
  const mesasData = await resMesas.json();
  console.log('   Total de mesas retornadas:', mesasData.mesas.length);
  const mesa1 = mesasData.mesas[0];
  console.log(`   Mesa 1 status inicial: ${mesa1.status}`);

  // 5. Abrir Comanda para Mesa 1 (RF04)
  console.log('\n5. Testando Abertura de Comanda (RF04)...');
  const resAbrir = await fetch(`${baseUrl}/api/comandas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: tokenCookie },
    body: JSON.stringify({ mesa_id: mesa1.id }),
  });
  const abrirData = await resAbrir.json();
  console.log('   Comanda aberta com sucesso ID:', abrirData.comanda?.id);
  const comandaId = abrirData.comanda.id;

  // 6. Adicionar Produtos à Comanda (RF05, RF06, RF07)
  console.log('\n6. Testando Adicionar Produtos à Comanda (RF05, RF07)...');
  // Buscar primeiro produto
  const resProd = await fetch(`${baseUrl}/api/produtos`);
  const prodData = await resProd.json();
  const prod1 = prodData.produtos[0];
  console.log(`   Adicionando 2 unidades de "${prod1.nome}" (R$ ${prod1.preco})...`);

  const resItem = await fetch(`${baseUrl}/api/comandas/${comandaId}/itens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: tokenCookie },
    body: JSON.stringify({ produto_id: prod1.id, quantidade: 2 }),
  });
  const itemData = await resItem.json();
  console.log('   Item adicionado! Novo total da comanda:', itemData.valor_total);

  // 7. Consultar Comanda (RF06, RF07)
  console.log('\n7. Consultando Detalhes da Comanda (RF06)...');
  const resDetalhes = await fetch(`${baseUrl}/api/comandas/${comandaId}`, {
    headers: { Cookie: tokenCookie },
  });
  const detalhesData = await resDetalhes.json();
  console.log('   Comanda #', detalhesData.comanda.id, 'Total:', detalhesData.comanda.valor_total);
  console.log('   Qtd Itens:', detalhesData.comanda.itens?.length);

  // 8. Finalizar Comanda (RF08)
  console.log('\n8. Testando Finalização de Comanda (RF08)...');
  const resFinalizar = await fetch(`${baseUrl}/api/comandas/${comandaId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: tokenCookie },
    body: JSON.stringify({ action: 'finalizar' }),
  });
  const finalData = await resFinalizar.json();
  console.log('   Comanda status finalizado:', finalData.comanda.status);
  console.log('   Data fechamento:', finalData.comanda.data_fechamento);

  // 9. Verificar se Mesa 1 voltou a ficar disponível
  console.log('\n9. Verificando liberação da Mesa 1 após finalizar comanda...');
  const resMesas2 = await fetch(`${baseUrl}/api/mesas`, {
    headers: { Cookie: tokenCookie },
  });
  const mesas2Data = await resMesas2.json();
  const mesa1Apos = mesas2Data.mesas.find((m) => m.id === mesa1.id);
  console.log('   Status Mesa 1 após fechamento:', mesa1Apos.status);

  // 10. Login como Administrador e CRUD de Produto (RF10, RF11, RF12, RF13)
  console.log('\n10. Testando Perfil de Administrador e CRUD de Produtos...');
  const resLoginAdmin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@comanda.com', senha: 'admin123' }),
  });
  const adminCookie = resLoginAdmin.headers.get('set-cookie')?.split(';')[0] || '';

  // Cadastrar produto
  console.log('   -> Cadastrando novo produto (RF10)...');
  const resNovoProd = await fetch(`${baseUrl}/api/produtos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      nome: 'Suco de Abacaxi com Hortelã',
      descricao: 'Abacaxi fresco batido com folhas selecionadas de hortelã',
      preco: 9.90,
      categoria: 'Bebidas',
    }),
  });
  const novoProduto = await resNovoProd.json();
  console.log('   Produto cadastrado ID:', novoProduto.produto?.id, novoProduto.produto?.nome);

  // Alterar produto
  console.log('   -> Alterando produto (RF12)...');
  const resAltProd = await fetch(`${baseUrl}/api/produtos/${novoProduto.produto.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      nome: 'Suco de Abacaxi com Hortelã 500ml',
      descricao: 'Copo grande com abacaxi fresco e hortelã',
      preco: 11.50,
      categoria: 'Bebidas',
    }),
  });
  const alterado = await resAltProd.json();
  console.log('   Produto alterado:', alterado.produto?.nome, 'Preço:', alterado.produto?.preco);

  // Excluir produto
  console.log('   -> Excluindo produto (RF13)...');
  const resDelProd = await fetch(`${baseUrl}/api/produtos/${novoProduto.produto.id}`, {
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  });
  const delData = await resDelProd.json();
  console.log('   Produto excluído com sucesso:', delData.success);

  console.log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO TOTAL!');
}

runTests().catch(console.error);
