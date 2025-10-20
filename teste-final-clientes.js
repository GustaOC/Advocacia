const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarCompleto() {
  console.log('🔍 TESTE COMPLETO - CLIENTES NO BANCO VS SISTEMA\n');
  console.log('='.repeat(70));

  try {
    // 1. Buscar TODOS os clientes do banco
    const { data: clientes, error } = await supabase
      .from('entities')
      .select('*')
      .eq('type', 'Cliente')
      .order('name');

    if (error) {
      console.error('❌ Erro ao buscar clientes:', error.message);
      return;
    }

    console.log(`\n📊 TOTAL DE CLIENTES NO BANCO: ${clientes.length}\n`);
    console.log('='.repeat(70));
    console.log('LISTA COMPLETA DE CLIENTES:');
    console.log('='.repeat(70) + '\n');

    clientes.forEach((cliente, index) => {
      console.log(`${index + 1}. ${cliente.name}`);
      console.log(`   ID: ${cliente.id}`);
      console.log(`   Type: "${cliente.type}"`);
      console.log(`   CNPJ: ${cliente.document || 'Não informado'}`);
      console.log(`   Email: ${cliente.email || 'Não informado'}`);
      console.log(`   Criado em: ${new Date(cliente.created_at).toLocaleString('pt-BR')}`);
      console.log('');
    });

    console.log('='.repeat(70));
    console.log('DIAGNÓSTICO:');
    console.log('='.repeat(70));
    console.log(`✅ O banco TEM ${clientes.length} clientes`);
    console.log(`❌ O sistema MOSTRA apenas 3 clientes`);
    console.log(`\n🔧 POSSÍVEIS CAUSAS:`);
    console.log(`   1. Cache do React Query no navegador`);
    console.log(`   2. Filtro ou paginação na interface`);
    console.log(`   3. Bug no código do frontend`);
    console.log(`\n💡 SOLUÇÃO RECOMENDADA:`);
    console.log(`   • Feche COMPLETAMENTE o navegador (todas as abas)`);
    console.log(`   • Limpe o cache do navegador (Ctrl+Shift+Delete)`);
    console.log(`   • Abra novamente: http://localhost:3000`);
    console.log(`   • Faça login novamente`);
    console.log(`\n📋 Se ainda não funcionar, vou adicionar logs no código do frontend.\n`);

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

testarCompleto();
