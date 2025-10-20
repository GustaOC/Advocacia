const XLSX = require('xlsx');

const inputFile = 'c:\\Users\\Familia Oliveira\\Downloads\\amostragem para importação (1).xlsx';
const outputFile = 'c:\\Users\\Familia Oliveira\\Downloads\\amostragem-PRONTO-IMPORTAR.xlsx';

console.log('🔧 Corrigindo arquivo para importação...\n');

try {
  const workbook = XLSX.readFile(inputFile);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log(`📊 Processando ${data.length} linhas...\n`);

  // Mapear e corrigir dados
  const correctedData = data.map((row, index) => {
    return {
      'Nome Completo': row['Cliente'] || '',
      'Cpf': row['CPF'] || '',
      'Email': '', // Não existe no arquivo original
      'Endereço': row['ENDEREÇO.:'] || '',
      'Nº': row['Nº.:'] || '',
      'Bairro': row['BAIRRO.:'] || '',
      'Cidade': row['CIDADE.:'] || '',
      'Cep': '', // Não existe no arquivo original
      'Celular 1': row['TELF.CEL.:'] || row['TELF.F.:'] || '',
      'Celular 2': (row['TELF.CEL.:'] && row['TELF.F.:'] && row['TELF.CEL.:'] !== row['TELF.F.:'])
        ? row['TELF.F.:']
        : ''
    };
  });

  // Validar dados
  console.log('✅ VALIDAÇÃO:');
  let validCount = 0;
  let invalidCount = 0;
  const issues = [];

  correctedData.forEach((row, index) => {
    const lineNum = index + 2; // +2 porque linha 1 é cabeçalho e index começa em 0

    if (!row['Nome Completo'] || row['Nome Completo'].length < 2) {
      issues.push(`Linha ${lineNum}: Nome inválido ou vazio`);
      invalidCount++;
    } else {
      validCount++;
    }

    // Avisos (não bloqueiam importação)
    if (!row['Cpf']) {
      issues.push(`Linha ${lineNum}: CPF vazio (aviso)`);
    }
    if (!row['Celular 1']) {
      issues.push(`Linha ${lineNum}: Telefone vazio (aviso)`);
    }
  });

  console.log(`   ✅ Linhas válidas: ${validCount}`);
  console.log(`   ⚠️  Linhas com problemas: ${invalidCount}`);

  if (issues.length > 0) {
    console.log('\n📋 DETALHES:');
    issues.slice(0, 10).forEach(issue => console.log(`   ${issue}`));
    if (issues.length > 10) {
      console.log(`   ... e mais ${issues.length - 10} avisos`);
    }
  }

  // Criar novo arquivo
  const newWorkbook = XLSX.utils.book_new();
  const newSheet = XLSX.utils.json_to_sheet(correctedData);

  // Ajustar largura das colunas
  const columnWidths = [
    { wch: 35 }, // Nome Completo
    { wch: 15 }, // Cpf
    { wch: 25 }, // Email
    { wch: 35 }, // Endereço
    { wch: 8 },  // Nº
    { wch: 20 }, // Bairro
    { wch: 20 }, // Cidade
    { wch: 12 }, // Cep
    { wch: 15 }, // Celular 1
    { wch: 15 }, // Celular 2
  ];
  newSheet['!cols'] = columnWidths;

  XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Clientes');
  XLSX.writeFile(newWorkbook, outputFile);

  console.log('\n✅ ARQUIVO PRONTO PARA IMPORTAÇÃO!');
  console.log(`📁 Local: ${outputFile}`);
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('   1. Abra o arquivo no Excel se quiser revisar');
  console.log('   2. Importe no sistema através da opção "Importar"');
  console.log('   3. Selecione o tipo "Cliente" na importação');
  console.log('\n⚠️  OBSERVAÇÕES:');
  console.log('   • Campos Email e Cep ficaram vazios (não existiam no arquivo original)');
  console.log('   • Os dados de processos/financeiro não foram incluídos (devem ser importados separadamente)');

} catch (error) {
  console.error('❌ Erro:', error.message);
}
