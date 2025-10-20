const XLSX = require('xlsx');

// Read the original Excel file
const filePath = 'c:\\Users\\Familia Oliveira\\Downloads\\ANDAMENTO DOS  PROCESSOS.xlsx';
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

console.log(`Transformando ${data.length} linhas...\n`);

// Transform data to the expected format
const transformedData = data.map((row, index) => {
  // O nome pode ter espaço no final da chave
  const nome = row['Nome '] || row['Nome'] || '';
  const loja = row['Loja'] || '';
  const cpf = row['CPF'] || '';
  const processo = row['Processo'] || '';

  // Para cada linha:
  // - Cliente: será a loja (store name)
  // - Executado: será o nome da pessoa
  // - Numero Processo: número do processo
  // - Observacao: uma descrição combinando loja + nome
  // - Status: definir como "Em andamento" (padrão)
  // - Prioridade: "Média" (padrão)

  return {
    'Cliente': loja,
    'Executado': nome.trim(),
    'Numero Processo': processo,
    'Observacao': `Processo ${loja} - ${nome.trim()}`,
    'Status': 'Em andamento',
    'Prioridade': 'Média'
  };
});

console.log('Primeiras 3 linhas transformadas:');
console.log(JSON.stringify(transformedData.slice(0, 3), null, 2));
console.log('\n');

// Create a new workbook with the transformed data
const newWorkbook = XLSX.utils.book_new();
const newSheet = XLSX.utils.json_to_sheet(transformedData);
XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Processos');

// Save the new file
const outputPath = 'c:\\Users\\Familia Oliveira\\Downloads\\PROCESSOS-IMPORTAR-CORRIGIDO.xlsx';
XLSX.writeFile(newWorkbook, outputPath);

console.log(`✓ Arquivo corrigido salvo em: ${outputPath}`);
console.log(`✓ Total de linhas: ${transformedData.length}`);
console.log('\n');

// Show unique clients and executados
const clientsSet = new Set(transformedData.map(r => r.Cliente));
const executadosSet = new Set(transformedData.map(r => r.Executado));

console.log(`Total de clientes únicos (Lojas): ${clientsSet.size}`);
console.log('Clientes (Lojas):');
console.log([...clientsSet].sort().join(', '));
console.log('\n');

console.log(`Total de executados únicos: ${executadosSet.size}`);
console.log('\nIMPORTANTE: Antes de importar, você precisa cadastrar:');
console.log(`1. ${clientsSet.size} lojas como "Clientes" no sistema`);
console.log(`2. ${executadosSet.size} pessoas como "Executados" no sistema`);
console.log('\nOu o sistema irá rejeitar a importação por entidades não encontradas.');
