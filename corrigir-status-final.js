const XLSX = require('xlsx');

console.log('=== CORRIGINDO STATUS PARA "Em Andamento" ===\n');

const filePath = 'c:\\Users\\Familia Oliveira\\Downloads\\PROCESSOS-IMPORTAR-LIMPO-FINAL.xlsx';
const wb = XLSX.readFile(filePath);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

console.log(`Lendo ${data.length} linhas...`);

// Corrigir o status
const correctedData = data.map(row => ({
  ...row,
  Status: 'Em Andamento'  // COM MAIÚSCULA!
}));

console.log('Corrigindo status de todas as linhas para "Em Andamento"...');

// Criar novo arquivo
const newWb = XLSX.utils.book_new();
const newWs = XLSX.utils.json_to_sheet(correctedData);
XLSX.utils.book_append_sheet(newWb, newWs, 'Processos');

const outputPath = 'c:\\Users\\Familia Oliveira\\Downloads\\PROCESSOS-FINAL-CORRETO.xlsx';
XLSX.writeFile(newWb, outputPath);

console.log(`\n✅ ARQUIVO CORRIGIDO!`);
console.log(`📁 Salvo em: ${outputPath}`);
console.log(`📊 Total: ${correctedData.length} processos`);
console.log(`\n✓ Status corrigido para: "Em Andamento" (com A maiúsculo)`);
console.log('\n🎯 AGORA IMPORTE ESTE ARQUIVO: PROCESSOS-FINAL-CORRETO.xlsx');
