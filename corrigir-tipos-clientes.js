const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function corrigirTipos() {
  console.log('🔧 CORRIGINDO TIPOS DAS ENTIDADES...\n');
  console.log('='.repeat(70));

  try {
    // 1. Buscar TODAS as entidades
    const { data: todas, error: allError } = await supabase
      .from('entities')
      .select('*')
      .order('id');

    if (allError) {
      console.error('❌ Erro ao buscar entidades:', allError.message);
      return;
    }

    console.log(`\n📊 TOTAL DE ENTIDADES: ${todas.length}\n`);

    // Agrupar por tipo
    const porTipo = {};
    todas.forEach(entity => {
      const tipo = entity.type || 'SEM TIPO';
      if (!porTipo[tipo]) {
        porTipo[tipo] = [];
      }
      porTipo[tipo].push(entity);
    });

    console.log('SITUAÇÃO ATUAL:');
    Object.entries(porTipo).forEach(([tipo, entities]) => {
      console.log(`  ${tipo}: ${entities.length}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('OS 8 CLIENTES QUE DEVERIAM EXISTIR:');
    console.log('='.repeat(70) + '\n');

    const nomesClientesEsperados = [
      'Aero Rancho',
      'C. Regina Malaquias',
      'C.R Malaquias',
      'M R M Comercio De Móveis',
      'Magazine Varejo e Atacado S/A',
      'Serrana Colchões',
      'Serrana Comércio De Eletrodomés',
      'Serrana Comércio De Eletrodomésticos Ltda'
    ];

    const correções = [];

    for (const nomeEsperado of nomesClientesEsperados) {
      const entidade = todas.find(e =>
        e.name.toLowerCase().includes(nomeEsperado.toLowerCase().substring(0, 10))
      );

      if (entidade) {
        console.log(`✅ Encontrado: ${entidade.name}`);
        console.log(`   ID: ${entidade.id}`);
        console.log(`   Type ATUAL: "${entidade.type}"`);

        if (entidade.type !== 'Cliente') {
          console.log(`   ⚠️  PRECISA CORRIGIR: type="${entidade.type}" → type="Cliente"`);
          correções.push(entidade.id);
        } else {
          console.log(`   ✅ Já está correto`);
        }
        console.log('');
      } else {
        console.log(`❌ NÃO ENCONTRADO: ${nomeEsperado}\n`);
      }
    }

    if (correções.length > 0) {
      console.log('\n' + '='.repeat(70));
      console.log(`🔧 CORRIGINDO ${correções.length} ENTIDADES...`);
      console.log('='.repeat(70) + '\n');

      for (const id of correções) {
        const { error: updateError } = await supabase
          .from('entities')
          .update({ type: 'Cliente' })
          .eq('id', id);

        if (updateError) {
          console.log(`❌ Erro ao corrigir ID ${id}:`, updateError.message);
        } else {
          console.log(`✅ ID ${id} corrigido para type="Cliente"`);
        }
      }

      console.log('\n✅ CORREÇÃO CONCLUÍDA!\n');
      console.log('🔄 Atualize a página no navegador para ver os 8 clientes.\n');
    } else {
      console.log('\n✅ Todos os clientes já estão com o tipo correto!\n');
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

corrigirTipos();
