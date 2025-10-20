const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigar() {
  console.log('🔍 INVESTIGANDO OS CLIENTES SUMIDOS...\n');
  console.log('='.repeat(70));

  try {
    // Buscar por IDs específicos dos 8 clientes que vimos antes
    const idsEsperados = [6662, 6663, 6664, 6668, 6669, 6670, 6653, 6650];

    console.log('\nVERIFICANDO OS 8 CLIENTES PELOS IDs:\n');

    for (const id of idsEsperados) {
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.log(`❌ ID ${id}: NÃO ENCONTRADO (deletado)`);
      } else {
        console.log(`✅ ID ${id}: ${data.name}`);
        console.log(`   Type: "${data.type}"`);
        console.log(`   Atualizado em: ${new Date(data.updated_at).toLocaleString('pt-BR')}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('OS 3 CLIENTES QUE EXISTEM AGORA:');
    console.log('='.repeat(70) + '\n');

    const { data: clientesAtuais, error: err2 } = await supabase
      .from('entities')
      .select('*')
      .eq('type', 'Cliente')
      .order('id');

    if (!err2 && clientesAtuais) {
      clientesAtuais.forEach((cliente, index) => {
        console.log(`${index + 1}. ${cliente.name}`);
        console.log(`   ID: ${cliente.id}`);
        console.log(`   CNPJ: ${cliente.document}`);
        console.log(`   Criado em: ${new Date(cliente.created_at).toLocaleString('pt-BR')}`);
        console.log(`   Atualizado em: ${new Date(cliente.updated_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
    }

    // Verificar logs de auditoria se existirem
    console.log('='.repeat(70));
    console.log('VERIFICANDO ÚLTIMAS AÇÕES (audit_logs):');
    console.log('='.repeat(70) + '\n');

    const { data: audits, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .in('action', ['ENTITY_DELETE', 'ENTITY_UPDATE'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (!auditError && audits && audits.length > 0) {
      audits.forEach((log, index) => {
        console.log(`${index + 1}. ${log.action} - ${new Date(log.created_at).toLocaleString('pt-BR')}`);
        console.log(`   User: ${log.user_id}`);
        console.log(`   Detalhes: ${JSON.stringify(log.details)}`);
        console.log('');
      });
    } else {
      console.log('Nenhum log de auditoria encontrado ou tabela não existe.');
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

investigar();
