const XLSX = require('xlsx');

console.log('=== DIAGNÓSTICO DO ÚLTIMO IMPORT ===\n');

// Verificar qual arquivo foi usado
const files = [
  { name: 'PROCESSOS-IMPORTAR-LIMPO-FINAL.xlsx', path: 'c:\\Users\\Familia Oliveira\\Downloads\\PROCESSOS-IMPORTAR-LIMPO-FINAL.xlsx' },
  { name: 'PROCESSOS-IMPORTAR-CORRIGIDO.xlsx', path: 'c:\\Users\\Familia Oliveira\\Downloads\\PROCESSOS-IMPORTAR-CORRIGIDO.xlsx' },
];

files.forEach(file => {
  try {
    const wb = XLSX.readFile(file.path);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws);

    console.log(`📁 ${file.name}`);
    console.log(`   Linhas: ${data.length}`);

    if (data.length > 0) {
      console.log(`   Colunas: ${Object.keys(data[0]).join(', ')}`);
      console.log(`   Primeira linha:`);
      console.log(`      Cliente: "${data[0].Cliente}"`);
      console.log(`      Executado: "${data[0].Executado}"`);
      console.log(`      Status: "${data[0].Status}"`);
      console.log(`      Prioridade: "${data[0].Prioridade}"`);

      // Verificar status únicos
      const statusSet = new Set(data.map(r => r.Status));
      console.log(`   Status únicos: ${[...statusSet].join(', ')}`);
    }
    console.log('');
  } catch (err) {
    console.log(`❌ ${file.name}: Não encontrado`);
    console.log('');
  }
});

// Ler o arquivo limpo e verificar se tem algum problema
console.log('=== VERIFICAÇÃO DETALHADA ===\n');
try {
  const filePath = 'c:\\Users\\Familia Oliveira\\Downloads\\PROCESSOS-IMPORTAR-LIMPO-FINAL.xlsx';
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws);

  console.log('Verificando campos obrigatórios...');

  let missingCliente = 0;
  let missingExecutado = 0;
  let missingStatus = 0;
  let invalidStatus = 0;

  const validStatus = ['Em Andamento', 'Finalizado', 'Arquivado', 'Suspenso', 'Acordo'];

  data.forEach((row, i) => {
    if (!row.Cliente) missingCliente++;
    if (!row.Executado) missingExecutado++;
    if (!row.Status) missingStatus++;
    if (row.Status && !validStatus.includes(row.Status)) {
      invalidStatus++;
      if (invalidStatus <= 5) {
        console.log(`   Linha ${i + 2}: Status inválido "${row.Status}"`);
      }
    }
  });

  console.log(`\n✓ Total de linhas: ${data.length}`);
  console.log(`${missingCliente > 0 ? '✗' : '✓'} Linhas sem Cliente: ${missingCliente}`);
  console.log(`${missingExecutado > 0 ? '✗' : '✓'} Linhas sem Executado: ${missingExecutado}`);
  console.log(`${missingStatus > 0 ? '✗' : '✓'} Linhas sem Status: ${missingStatus}`);
  console.log(`${invalidStatus > 0 ? '✗' : '✓'} Linhas com Status inválido: ${invalidStatus}`);

  if (invalidStatus > 0) {
    console.log(`\n⚠️  PROBLEMA ENCONTRADO!`);
    console.log(`   O arquivo tem ${invalidStatus} linhas com status inválido.`);
    console.log(`   Status válidos: ${validStatus.join(', ')}`);
    console.log(`   Provavelmente o status está como "Em andamento" ao invés de "Em Andamento"`);
  }

} catch (err) {
  console.error('Erro:', err.message);
}
