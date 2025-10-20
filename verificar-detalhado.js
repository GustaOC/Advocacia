const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarDetalhado() {
  console.log('🔍 VERIFICAÇÃO DETALHADA...\n');

  try {
    // Buscar TODAS as entidades
    const { data: allEntities, error: allError } = await supabase
      .from('entities')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Erro:', allError.message);
      return;
    }

    console.log(`📊 TOTAL DE ENTIDADES NO BANCO: ${allEntities.length}\n`);

    // Agrupar por tipo
    const porTipo = {};
    allEntities.forEach(entity => {
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
    console.log('DETALHES DOS CLIENTES:');
    console.log('='.repeat(70) + '\n');

    if (porTipo['Cliente']) {
      porTipo['Cliente'].forEach((cliente, index) => {
        console.log(`${index + 1}. ${cliente.name}`);
        console.log(`   ID: ${cliente.id}`);
        console.log(`   Type: "${cliente.type}"`);
        console.log(`   CNPJ: ${cliente.document || 'Não informado'}`);
        console.log(`   Email: ${cliente.email || 'Não informado'}`);
        console.log(`   Criado em: ${cliente.created_at}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhuma entidade com type="Cliente" encontrada!\n');
    }

    // Verificar se tem alguma com nome parecido mas type diferente
    console.log('='.repeat(70));
    console.log('VERIFICANDO LOJAS COM TYPE DIFERENTE:');
    console.log('='.repeat(70) + '\n');

    const nomesDasLojas = [
      'Serrana Comércio De Eletrodomés',
      'M R M Comercio De Móveis',
      'Serrana Colchões'
    ];

    nomesDasLojas.forEach(nomeLoja => {
      const encontrada = allEntities.find(e =>
        e.name.toLowerCase().includes(nomeLoja.toLowerCase().substring(0, 15))
      );

      if (encontrada) {
        console.log(`✅ Encontrada: ${encontrada.name}`);
        console.log(`   Type atual: "${encontrada.type}"`);
        console.log(`   ID: ${encontrada.id}`);
        console.log('');
      } else {
        console.log(`❌ NÃO encontrada: ${nomeLoja}\n`);
      }
    });

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

verificarDetalhado();
