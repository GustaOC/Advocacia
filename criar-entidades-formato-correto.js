const XLSX = require('xlsx');

// Read the original Excel file
const filePath = 'c:\\Users\\Familia Oliveira\\Downloads\\ANDAMENTO DOS  PROCESSOS.xlsx';
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

console.log('Criando arquivos de entidades no formato correto...\n');

// === CRIAR CLIENTES (LOJAS) ===
const clientsMap = new Map();
data.forEach(row => {
  const loja = row['Loja'] || '';
  if (loja && !clientsMap.has(loja)) {
    clientsMap.set(loja, {
      'Nome Completo': loja,
      'Cpf': `LOJA-${loja.replace(/\s+/g, '-').toUpperCase()}`,
      'Email': '',
      'Endereço': '',
      'Nº': '',
      'Bairro': '',
      'Cidade': '',
      'Cep': '',
      'Celular 1': '',
      'Celular 2': ''
    });
  }
});

const clientsData = Array.from(clientsMap.values());
const clientsWorkbook = XLSX.utils.book_new();
const clientsSheet = XLSX.utils.json_to_sheet(clientsData);
XLSX.utils.book_append_sheet(clientsWorkbook, clientsSheet, 'Clientes');
const clientsPath = 'c:\\Users\\Familia Oliveira\\Downloads\\1-CLIENTES-LOJAS-IMPORTAR.xlsx';
XLSX.writeFile(clientsWorkbook, clientsPath);
console.log(`✓ Clientes (Lojas): ${clientsData.length} registros`);
console.log(`  Salvo em: ${clientsPath}\n`);

// === CRIAR EXECUTADOS (PESSOAS) ===
const executadosMap = new Map();
data.forEach(row => {
  const nome = (row['Nome '] || row['Nome'] || '').trim();
  const cpf = row['CPF'] || '';

  if (nome && !executadosMap.has(nome)) {
    executadosMap.set(nome, {
      'Nome Completo': nome,
      'Cpf': cpf,
      'Email': '',
      'Endereço': '',
      'Nº': '',
      'Bairro': '',
      'Cidade': '',
      'Cep': '',
      'Celular 1': '',
      'Celular 2': ''
    });
  }
});

const executadosData = Array.from(executadosMap.values());
const executadosWorkbook = XLSX.utils.book_new();
const executadosSheet = XLSX.utils.json_to_sheet(executadosData);
XLSX.utils.book_append_sheet(executadosWorkbook, executadosSheet, 'Executados');
const executadosPath = 'c:\\Users\\Familia Oliveira\\Downloads\\2-EXECUTADOS-PESSOAS-IMPORTAR.xlsx';
XLSX.writeFile(executadosWorkbook, executadosPath);
console.log(`✓ Executados (Pessoas): ${executadosData.length} registros`);
console.log(`  Salvo em: ${executadosPath}\n`);

// === ARQUIVO DE PROCESSOS JÁ FOI CRIADO ANTERIORMENTE ===
console.log('✓ Processos: 2359 registros');
console.log('  Já salvo em: c:\\Users\\Familia Oliveira\\Downloads\\PROCESSOS-IMPORTAR-CORRIGIDO.xlsx\n');

console.log('='.repeat(70));
console.log('INSTRUÇÕES PARA IMPORTAÇÃO');
console.log('='.repeat(70));
console.log('\n1️⃣  PRIMEIRO: Importe as LOJAS (Clientes)');
console.log('   - Arquivo: 1-CLIENTES-LOJAS-IMPORTAR.xlsx');
console.log('   - Na aba "Entidades" do sistema');
console.log('   - Selecione tipo: "Cliente"');
console.log(`   - Total: ${clientsData.length} lojas\n`);

console.log('2️⃣  SEGUNDO: Importe as PESSOAS (Executados)');
console.log('   - Arquivo: 2-EXECUTADOS-PESSOAS-IMPORTAR.xlsx');
console.log('   - Na aba "Entidades" do sistema');
console.log('   - Selecione tipo: "Executado"');
console.log(`   - Total: ${executadosData.length} pessoas\n`);

console.log('3️⃣  TERCEIRO: Importe os PROCESSOS');
console.log('   - Arquivo: PROCESSOS-IMPORTAR-CORRIGIDO.xlsx');
console.log('   - Na aba "Processos" do sistema');
console.log('   - Total: 2359 processos\n');

console.log('='.repeat(70));
console.log('⚠️  IMPORTANTE: Siga essa ordem exata!');
console.log('    Os processos precisam que clientes e executados existam primeiro.');
console.log('='.repeat(70));
