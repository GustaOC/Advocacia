const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarClientes() {
  console.log('🔍 VERIFICANDO CLIENTES NO BANCO...\n');

  try {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('type', 'Cliente')
      .order('name');

    if (error) {
      console.error('❌ Erro:', error.message);
      return;
    }

    console.log(`📊 TOTAL DE CLIENTES: ${data.length}\n`);

    if (data.length > 0) {
      console.log('📋 LISTA DE CLIENTES:\n');
      data.forEach((cliente, index) => {
        console.log(`${index + 1}. ${cliente.name}`);
        console.log(`   ID: ${cliente.id}`);
        console.log(`   CNPJ: ${cliente.document || 'Não informado'}`);
        console.log(`   Email: ${cliente.email || 'Não informado'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  Nenhum cliente encontrado no banco de dados.');
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

verificarClientes();
