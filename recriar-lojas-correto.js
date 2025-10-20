const XLSX = require('xlsx');

const inputFile = 'c:\\Users\\Familia Oliveira\\Downloads\\ANDAMENTO DOS  PROCESSOS.xlsx';
const outputFile = 'c:\\Users\\Familia Oliveira\\Downloads\\CLIENTES-LOJAS-FINAL.xlsx';

console.log('🔧 CRIANDO ARQUIVO DE CLIENTES (LOJAS) CORRIGIDO...\n');

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
          'Cpf': '', // String vazia, NÃO null
          'Email': '', // String vazia, NÃO null
          'Endereço': '',
          'Nº': '',
          'Bairro': '',
          'Cidade': 'Campo Grande', // Preenchendo com valor padrão
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

  // Verificar que NENHUM campo é null
  console.log('\n🔍 VERIFICAÇÃO DE DADOS:');
  let hasNull = false;
  lojasArray.forEach((loja, index) => {
    Object.entries(loja).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        console.log(`   ❌ Linha ${index + 1}: Campo "${key}" é null/undefined`);
        hasNull = true;
      }
    });
  });

  if (!hasNull) {
    console.log('   ✅ Nenhum campo é null - Tudo OK!');
  }

  // Criar workbook com formato correto
  const newWorkbook = XLSX.utils.book_new();

  // Converter para JSON com garantia de strings vazias
  const safeData = lojasArray.map(loja => {
    const safeLoja = {};
    Object.entries(loja).forEach(([key, value]) => {
      // Garantir que seja string, nunca null ou undefined
      safeLoja[key] = (value === null || value === undefined) ? '' : String(value);
    });
    return safeLoja;
  });

  const newSheet = XLSX.utils.json_to_sheet(safeData);

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
  console.log('✅ ARQUIVO CORRIGIDO CRIADO COM SUCESSO!');
  console.log('='.repeat(70));
  console.log(`\n📁 Local: ${outputFile}`);
  console.log(`\n📊 ${lojasArray.length} lojas prontas para importação`);
  console.log('\n✅ GARANTIAS:');
  console.log('   • Nenhum campo é null');
  console.log('   • Todos os campos vazios são strings vazias ("")');
  console.log('   • Campo Cidade preenchido com "Campo Grande"');
  console.log('\n🚀 PODE IMPORTAR AGORA!\n');

  // Mostrar exemplo da primeira linha
  console.log('📋 EXEMPLO DA PRIMEIRA LINHA:');
  console.log(JSON.stringify(safeData[0], null, 2));

} catch (error) {
  console.error('❌ ERRO:', error.message);
  console.error(error);
}
