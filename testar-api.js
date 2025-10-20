// Testar diretamente a API
async function testarAPI() {
  console.log('🔍 TESTANDO API /api/entities...\n');

  try {
    const response = await fetch('http://localhost:3000/api/entities', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Incluir cookies de autenticação
    });

    if (!response.ok) {
      console.error(`❌ Erro HTTP: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Resposta:', text);
      return;
    }

    const data = await response.json();

    console.log(`📊 TOTAL DE ENTIDADES RETORNADAS: ${data.length}\n`);

    // Agrupar por tipo
    const porTipo = {};
    data.forEach(entity => {
      const tipo = entity.type || 'SEM TIPO';
      if (!porTipo[tipo]) {
        porTipo[tipo] = [];
      }
      porTipo[tipo].push(entity);
    });

    console.log('📋 RESUMO POR TIPO:\n');
    Object.entries(porTipo).forEach(([tipo, entities]) => {
      console.log(`${tipo}: ${entities.length}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('CLIENTES RETORNADOS PELA API:');
    console.log('='.repeat(70) + '\n');

    if (porTipo['Cliente']) {
      porTipo['Cliente'].forEach((cliente, index) => {
        console.log(`${index + 1}. ${cliente.name}`);
        console.log(`   ID: ${cliente.id}`);
        console.log(`   CNPJ: ${cliente.document || 'Não informado'}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhum cliente retornado!\n');
    }

  } catch (error) {
    console.error('❌ ERRO:', error.message);
  }
}

testarAPI();
