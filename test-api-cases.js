// Script de teste para verificar quantos casos a API /api/cases retorna

async function testCasesAPI() {
  try {
    console.log('Testando API /api/cases...\n');

    const response = await fetch('http://localhost:3000/api/cases', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.error(`Erro HTTP: ${response.status}`);
      const errorText = await response.text();
      console.error('Resposta:', errorText);
      return;
    }

    const data = await response.json();

    console.log('=== RESULTADO DO TESTE ===');
    console.log(`Total de casos retornados: ${data.cases?.length || 0}`);
    console.log(`Total informado pela API: ${data.total || 0}`);
    console.log(`\nPrimeiros 3 casos:`, data.cases?.slice(0, 3).map(c => ({
      id: c.id,
      title: c.title,
      case_number: c.case_number
    })));

    if (data.cases?.length === 1000) {
      console.log('\n⚠️  PROBLEMA DETECTADO: Exatamente 1000 casos retornados - há limitação!');
    } else {
      console.log('\n✓ Sem limitação aparente de 1000 registros');
    }

  } catch (error) {
    console.error('Erro ao testar API:', error.message);
  }
}

testCasesAPI();
