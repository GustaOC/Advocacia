const XLSX = require('xlsx');

const inputFile = 'c:\\Users\\Familia Oliveira\\Downloads\\ANDAMENTO DOS  PROCESSOS.xlsx';
const outputFile = 'c:\\Users\\Familia Oliveira\\Downloads\\CLIENTES-LOJAS-IMPORTAR.xlsx';

console.log('🔧 RECRIANDO ARQUIVO DE CLIENTES (LOJAS)...\n');

try {
  const workbook = XLSX.readFile(inputFile);
  const sheet = workbook.Sheets['Planilha1'];
  const data = XLSX.utils.sheet_to_json(sheet);

  // Extrair lojas únicas
  const lojasMap = new Map();

  data.forEach((row) => {
    const loja = (row['Loja'] || '').toString().trim();

    if (loja) {
      const key = loja.toLowerCase();
      if (!lojasMap.has(key)) {
        lojasMap.set(key, {
          'Nome Completo': loja,
          'Cpf': '', // Vazio - será preenchido manualmente se necessário
          'Email': '', // Vazio - NÃO null para evitar erro de validação
          'Endereço': '',
          'Nº': '',
          'Bairro': '',
          'Cidade': 'Campo Grande',
          'Cep': '',
          'Celular 1': '',
          'Celular 2': '',
        });
      }
    }
  });

  const lojasArray = Array.from(lojasMap.values());

  console.log(`✅ ${lojasArray.length} lojas únicas encontradas:\n`);
  lojasArray.forEach((loja, index) => {
    console.log(`   ${index + 1}. ${loja['Nome Completo']}`);
  });

  // Criar workbook
  const newWorkbook = XLSX.utils.book_new();
  const newSheet = XLSX.utils.json_to_sheet(lojasArray);

  // Ajustar largura das colunas
  newSheet['!cols'] = [
    { wch: 45 }, // Nome Completo
    { wch: 20 }, // Cpf
    { wch: 30 }, // Email
    { wch: 35 }, // Endereço
    { wch: 8 },  // Nº
    { wch: 20 }, // Bairro
    { wch: 20 }, // Cidade
    { wch: 12 }, // Cep
    { wch: 15 }, // Celular 1
    { wch: 15 }, // Celular 2
  ];

  XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Clientes');
  XLSX.writeFile(newWorkbook, outputFile);

  console.log('\n' + '='.repeat(70));
  console.log('✅ ARQUIVO DE CLIENTES (LOJAS) RECRIADO!');
  console.log('='.repeat(70));
  console.log(`\n📁 Local: ${outputFile}`);
  console.log(`\n📊 ${lojasArray.length} lojas prontas para importação`);
  console.log('\n⚠️  OBSERVAÇÃO:');
  console.log('   • Todos os campos vazios estão como string vazia ("")');
  console.log('   • NÃO há valores null que causariam erro de validação');
  console.log('   • Você pode preencher CNPJ, Email, etc. depois no sistema');
  console.log('\n🚀 PODE IMPORTAR AGORA!\n');

} catch (error) {
  console.error('❌ ERRO:', error.message);
}
