const XLSX = require('xlsx');

console.log('=== CRIANDO PLANILHA LIMPA (SEM ERROS DE STATUS) ===\n');

// Ler arquivo de processos
const filePath = 'c:\\Users\\Familia Oliveira\\Downloads\\ANDAMENTO DOS  PROCESSOS.xlsx';
console.log('1. Lendo arquivo original...');
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);
console.log(`   ✓ ${data.length} linhas encontradas\n`);

// Ler as entidades que FORAM criadas (clientes e executados)
console.log('2. Lendo entidades cadastradas...');
const clientsPath = 'c:\\Users\\Familia Oliveira\\Downloads\\1-CLIENTES-LOJAS-IMPORTAR.xlsx';
const executadosPath = 'c:\\Users\\Familia Oliveira\\Downloads\\2-EXECUTADOS-PESSOAS-IMPORTAR.xlsx';

const clientsWb = XLSX.readFile(clientsPath);
const clientsSheet = clientsWb.Sheets[clientsWb.SheetNames[0]];
const clientsData = XLSX.utils.sheet_to_json(clientsSheet);

const executadosWb = XLSX.readFile(executadosPath);
const executadosSheet = executadosWb.Sheets[executadosWb.SheetNames[0]];
const executadosData = XLSX.utils.sheet_to_json(executadosSheet);

console.log(`   ✓ ${clientsData.length} clientes (lojas)`);
console.log(`   ✓ ${executadosData.length} executados (pessoas)\n`);

// Criar mapa de nomes para validação rápida
const clientsSet = new Set(clientsData.map(c => c['Nome Completo'].toLowerCase().trim()));
const executadosSet = new Set(executadosData.map(e => e['Nome Completo'].toLowerCase().trim()));

console.log('3. Transformando e filtrando dados...');
const validCases = [];
const invalidCases = [];

data.forEach((row, index) => {
  const loja = (row['Loja'] || '').trim();
  const nome = (row['Nome '] || row['Nome'] || '').trim();

  // Verificar se ambas entidades existem
  const clientExists = clientsSet.has(loja.toLowerCase());
  const executadoExists = executadosSet.has(nome.toLowerCase());

  if (clientExists && executadoExists) {
    validCases.push({
      'Cliente': loja,
      'Executado': nome,
      'Numero Processo': row['Processo'] || '',
      'Observacao': `Processo ${loja} - ${nome}`,
      'Status': 'Em andamento',
      'Prioridade': 'Média'
    });
  } else {
    invalidCases.push({
      linha: index + 2,
      loja,
      nome,
      motivoclient: !clientExists ? 'Cliente não existe' : '',
      motivoexec: !executadoExists ? 'Executado não existe' : ''
    });
  }
});

console.log(`   ✓ ${validCases.length} casos VÁLIDOS`);
console.log(`   ✗ ${invalidCases.length} casos INVÁLIDOS\n`);

// Salvar apenas casos válidos
if (validCases.length > 0) {
  console.log('4. Salvando planilha limpa...');
  const newWorkbook = XLSX.utils.book_new();
  const newSheet = XLSX.utils.json_to_sheet(validCases);
  XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Processos');

  const outputPath = 'c:\\Users\\Familia Oliveira\\Downloads\\PROCESSOS-IMPORTAR-LIMPO-FINAL.xlsx';
  XLSX.writeFile(newWorkbook, outputPath);

  console.log(`   ✓ Arquivo salvo: ${outputPath}`);
  console.log(`   ✓ Total de processos: ${validCases.length}\n`);

  console.log('='.repeat(70));
  console.log('✅ ARQUIVO PRONTO!');
  console.log('='.repeat(70));
  console.log('\n📁 Arquivo: PROCESSOS-IMPORTAR-LIMPO-FINAL.xlsx');
  console.log(`📊 Total: ${validCases.length} processos`);
  console.log('\n⚠️  ANTES DE IMPORTAR:');
  console.log('   1. Verifique se você JÁ IMPORTOU as 6 lojas (clientes)');
  console.log('   2. Verifique se você JÁ IMPORTOU as 2216 pessoas (executados)');
  console.log('   3. Só depois importe este arquivo de processos!');
} else {
  console.log('❌ NENHUM caso válido!');
  console.log('Você precisa importar os clientes e executados primeiro.');
}

// Mostrar alguns casos inválidos
if (invalidCases.length > 0) {
  console.log('\n📋 Primeiros 10 casos inválidos:');
  invalidCases.slice(0, 10).forEach(c => {
    console.log(`   Linha ${c.linha}: ${c.loja} / ${c.nome}`);
    if (c.motivoclient) console.log(`      → ${c.motivoclient}`);
    if (c.motivoexec) console.log(`      → ${c.motivoexec}`);
  });
}
