const XLSX = require('xlsx');
const fs = require('fs');

// Read the original Excel file
const filePath = 'c:\\Users\\Familia Oliveira\\Downloads\\ANDAMENTO DOS  PROCESSOS.xlsx';
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

console.log('Analisando entidades para criar...\n');

// Extract unique clients (Lojas)
const clientsMap = new Map();
data.forEach(row => {
  const loja = row['Loja'] || '';
  if (loja && !clientsMap.has(loja)) {
    clientsMap.set(loja, {
      name: loja,
      document: `LOJA-${loja.replace(/\s+/g, '-').toUpperCase()}`, // Documento fake para loja
      type: 'Cliente',
      email: null,
      phone: null,
      address: null
    });
  }
});

// Extract unique executados (pessoas)
const executadosMap = new Map();
data.forEach(row => {
  const nome = (row['Nome '] || row['Nome'] || '').trim();
  const cpf = row['CPF'] || '';

  if (nome && !executadosMap.has(nome)) {
    executadosMap.set(nome, {
      name: nome,
      document: cpf || `CPF-${nome.substring(0, 11).replace(/\s+/g, '')}`,
      type: 'Executado',
      email: null,
      phone: null,
      address: null
    });
  }
});

console.log(`✓ ${clientsMap.size} clientes (lojas) para criar`);
console.log(`✓ ${executadosMap.size} executados (pessoas) para criar`);
console.log('\n');

// Create Excel files for import
const clientsData = Array.from(clientsMap.values());
const executadosData = Array.from(executadosMap.values());

// Save Clientes
const clientsWorkbook = XLSX.utils.book_new();
const clientsSheet = XLSX.utils.json_to_sheet(clientsData);
XLSX.utils.book_append_sheet(clientsWorkbook, clientsSheet, 'Clientes');
const clientsPath = 'c:\\Users\\Familia Oliveira\\Downloads\\CLIENTES-IMPORTAR.xlsx';
XLSX.writeFile(clientsWorkbook, clientsPath);
console.log(`✓ Arquivo de clientes salvo: ${clientsPath}`);

// Save Executados
const executadosWorkbook = XLSX.utils.book_new();
const executadosSheet = XLSX.utils.json_to_sheet(executadosData);
XLSX.utils.book_append_sheet(executadosWorkbook, executadosSheet, 'Executados');
const executadosPath = 'c:\\Users\\Familia Oliveira\\Downloads\\EXECUTADOS-IMPORTAR.xlsx';
XLSX.writeFile(executadosWorkbook, executadosPath);
console.log(`✓ Arquivo de executados salvo: ${executadosPath}`);

console.log('\n=== PRÓXIMOS PASSOS ===');
console.log('1. Importe primeiro: CLIENTES-IMPORTAR.xlsx (6 lojas) na aba "Entidades"');
console.log('2. Depois importe: EXECUTADOS-IMPORTAR.xlsx (2216 pessoas) na aba "Entidades"');
console.log('3. Por último importe: PROCESSOS-IMPORTAR-CORRIGIDO.xlsx (2359 processos) na aba "Processos"');
