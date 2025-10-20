const XLSX = require('xlsx');

const filePath = 'c:\\Users\\Familia Oliveira\\Downloads\\PROCESSOS-IMPORTAR-CORRIGIDO.xlsx';
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

console.log('=== VERIFICAÇÃO DO ARQUIVO DE PROCESSOS ===\n');
console.log(`Total de linhas: ${data.length}`);
console.log(`Nome da planilha: ${sheetName}\n`);

if (data.length > 0) {
  console.log('Colunas encontradas:');
  console.log(Object.keys(data[0]).join(', '));
  console.log('\n');

  console.log('Primeiras 3 linhas:');
  console.log(JSON.stringify(data.slice(0, 3), null, 2));
  console.log('\n');

  // Verificar se tem os campos obrigatórios
  const requiredFields = ['Cliente', 'Executado', 'Numero Processo', 'Observacao', 'Status', 'Prioridade'];
  const missingFields = requiredFields.filter(field => !Object.keys(data[0]).includes(field));

  if (missingFields.length > 0) {
    console.log('❌ CAMPOS FALTANDO:');
    console.log(missingFields.join(', '));
  } else {
    console.log('✅ Todos os campos obrigatórios estão presentes!');
  }
}
