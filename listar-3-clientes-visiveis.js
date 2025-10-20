const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listar3Clientes() {
  console.log('🔍 LISTANDO OS 3 CLIENTES QUE APARECEM NO SISTEMA...\n');

  try {
    const { data: clientes, error } = await supabase
      .from('entities')
      .select('*')
      .eq('type', 'Cliente')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro:', error.message);
      return;
    }

    console.log(`📊 CLIENTES COM type="Cliente": ${clientes.length}\n`);

    if (clientes.length > 0) {
      clientes.forEach((cliente, index) => {
        console.log(`${index + 1}. ${cliente.name}`);
        console.log(`   ID: ${cliente.id}`);
        console.log(`   CNPJ: ${cliente.document}`);
        console.log(`   Type: "${cliente.type}"`);
        console.log(`   Criado em: ${new Date(cliente.created_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
    } else {
      console.log('❌ NENHUM cliente encontrado com type="Cliente"\n');
    }

    // Mostrar os últimos 10 executados criados
    const { data: ultimos, error: err2 } = await supabase
      .from('entities')
      .select('*')
      .eq('type', 'Executado')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!err2 && ultimos) {
      console.log('='.repeat(70));
      console.log('ÚLTIMOS 10 EXECUTADOS CRIADOS:');
      console.log('='.repeat(70) + '\n');
      ultimos.forEach((exec, index) => {
        console.log(`${index + 1}. ${exec.name} (ID: ${exec.id}) - ${new Date(exec.created_at).toLocaleString('pt-BR')}`);
      });
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

listar3Clientes();
