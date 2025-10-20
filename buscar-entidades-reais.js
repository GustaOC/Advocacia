const { createClient } = require('@supabase/supabase-js');

// Credenciais do .env.local
const supabaseUrl = 'https://enroqbjkbhosuelsmmae.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucm9xYmprYmhvc3VlbHNtbWFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE5NjY5NSwiZXhwIjoyMDcwNzcyNjk1fQ.isSxMDRobviVVXZeMzLHf8XEG0q4eIPCYbpePkwWi7w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('=== BUSCANDO ENTIDADES REAIS DO BANCO ===\n');

  // Buscar TODAS as entidades do banco (sem limite)
  let allEntities = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('entities')
      .select('id, name, type, document')
      .order('name')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Erro ao buscar entidades:', error);
      process.exit(1);
    }

    if (!data || data.length === 0) break;

    allEntities = allEntities.concat(data);
    page++;

    if (data.length < pageSize) break;
  }

  const entities = allEntities;
  const error = null;

  if (error) {
    console.error('Erro ao buscar entidades:', error);
    process.exit(1);
  }

  console.log(`✓ ${entities.length} entidades encontradas no banco\n`);

  const clientes = entities.filter(e => e.type === 'Cliente');
  const executados = entities.filter(e => e.type === 'Executado');

  console.log(`📊 RESUMO:`);
  console.log(`   Clientes: ${clientes.length}`);
  console.log(`   Executados: ${executados.length}\n`);

  console.log(`📋 PRIMEIROS 20 CLIENTES NO BANCO:`);
  clientes.slice(0, 20).forEach((c, i) => {
    console.log(`   ${i + 1}. "${c.name}"`);
  });

  console.log(`\n📋 PRIMEIROS 20 EXECUTADOS NO BANCO:`);
  executados.slice(0, 20).forEach((e, i) => {
    console.log(`   ${i + 1}. "${e.name}"`);
  });

  // Salvar em arquivo para referência
  const fs = require('fs');
  fs.writeFileSync('entidades-banco.json', JSON.stringify({ clientes, executados }, null, 2));
  console.log(`\n✓ Lista completa salva em: entidades-banco.json`);
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
