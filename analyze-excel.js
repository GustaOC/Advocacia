const XLSX = require('xlsx');
const fs = require('fs');

// Read the Excel file
const filePath = 'c:\\Users\\Familia Oliveira\\Downloads\\ANDAMENTO DOS  PROCESSOS.xlsx';
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

console.log('=== ANÁLISE DO ARQUIVO EXCEL ===\n');
console.log(`Total de linhas: ${data.length}\n`);

// Analyze columns
if (data.length > 0) {
  console.log('Colunas encontradas:');
  console.log(Object.keys(data[0]).join(', '));
  console.log('\n');
}

// Analyze unique status values
const statusSet = new Set();
data.forEach(row => {
  if (row.Status) statusSet.add(row.Status);
});

console.log('Status únicos encontrados:');
console.log([...statusSet].join(', '));
console.log('\n');

// Analyze unique clients
const clientsSet = new Set();
data.forEach(row => {
  if (row.Cliente) clientsSet.add(row.Cliente);
});

console.log(`Total de clientes únicos: ${clientsSet.size}`);
console.log('Primeiros 10 clientes:');
console.log([...clientsSet].slice(0, 10).join('\n'));
console.log('\n');

// Analyze unique executados
const executadosSet = new Set();
data.forEach(row => {
  if (row.Executado) executadosSet.add(row.Executado);
});

console.log(`Total de executados únicos: ${executadosSet.size}`);
console.log('Primeiros 10 executados:');
console.log([...executadosSet].slice(0, 10).join('\n'));
console.log('\n');

// Show first 3 rows as sample
console.log('=== PRIMEIRAS 3 LINHAS DO ARQUIVO ===');
console.log(JSON.stringify(data.slice(0, 3), null, 2));
