const XLSX = require('xlsx');

const inputFile = 'c:\\Users\\Familia Oliveira\\Downloads\\ANDAMENTO DOS  PROCESSOS.xlsx';
const outputDir = 'c:\\Users\\Familia Oliveira\\Downloads\\';

console.log('🚀 GERANDO ARQUIVOS PARA IMPORTAÇÃO...\n');
console.log('='.repeat(70));

try {
  const workbook = XLSX.readFile(inputFile);

  // Vamos usar a planilha "Planilha1" que é a mais completa
  const mainSheetName = 'Planilha1';
  const sheet = workbook.Sheets[mainSheetName];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log(`\n📊 Processando ${data.length} linhas da planilha "${mainSheetName}"...`);

  // ========================================================================
  // 1. EXTRAIR CLIENTES ÚNICOS
  // ========================================================================
  console.log('\n📁 1/3 - EXTRAINDO CLIENTES...');

  const clientesMap = new Map();

  data.forEach((row, index) => {
    const nome = (row['Nome '] || '').toString().trim();
    const cpf = (row['CPF'] || '').toString().trim();
    const loja = (row['Loja'] || '').toString().trim();

    if (nome && cpf) {
      const key = cpf.toLowerCase();
      if (!clientesMap.has(key)) {
        clientesMap.set(key, {
          'Nome Completo': nome,
          'Cpf': cpf,
          'Email': '',
          'Endereço': '',
          'Nº': '',
          'Bairro': '',
          'Cidade': '',
          'Cep': '',
          'Celular 1': '',
          'Celular 2': '',
        });
      }
    }
  });

  const clientesArray = Array.from(clientesMap.values());
  console.log(`   ✅ ${clientesArray.length} clientes únicos extraídos`);

  // Salvar arquivo de clientes
  const clientesWorkbook = XLSX.utils.book_new();
  const clientesSheet = XLSX.utils.json_to_sheet(clientesArray);
  clientesSheet['!cols'] = [
    { wch: 35 }, { wch: 15 }, { wch: 25 }, { wch: 35 },
    { wch: 8 }, { wch: 20 }, { wch: 20 }, { wch: 12 },
    { wch: 15 }, { wch: 15 }
  ];
  XLSX.utils.book_append_sheet(clientesWorkbook, clientesSheet, 'Clientes');
  XLSX.writeFile(clientesWorkbook, outputDir + '1-CLIENTES-importar.xlsx');
  console.log(`   💾 Arquivo salvo: 1-CLIENTES-importar.xlsx`);

  // ========================================================================
  // 2. EXTRAIR EXECUTADOS ÚNICOS (Lojas)
  // ========================================================================
  console.log('\n📁 2/3 - EXTRAINDO EXECUTADOS (Lojas)...');

  const executadosMap = new Map();

  data.forEach((row, index) => {
    const loja = (row['Loja'] || '').toString().trim();

    if (loja) {
      const key = loja.toLowerCase();
      if (!executadosMap.has(key)) {
        executadosMap.set(key, {
          'Nome Completo': loja,
          'Cpf': '',
          'Email': '',
          'Endereço': '',
          'Nº': '',
          'Bairro': '',
          'Cidade': '',
          'Cep': '',
          'Celular 1': '',
          'Celular 2': '',
        });
      }
    }
  });

  const executadosArray = Array.from(executadosMap.values());
  console.log(`   ✅ ${executadosArray.length} executados únicos extraídos`);

  // Salvar arquivo de executados
  const executadosWorkbook = XLSX.utils.book_new();
  const executadosSheet = XLSX.utils.json_to_sheet(executadosArray);
  executadosSheet['!cols'] = [
    { wch: 35 }, { wch: 15 }, { wch: 25 }, { wch: 35 },
    { wch: 8 }, { wch: 20 }, { wch: 20 }, { wch: 12 },
    { wch: 15 }, { wch: 15 }
  ];
  XLSX.utils.book_append_sheet(executadosWorkbook, executadosSheet, 'Executados');
  XLSX.writeFile(executadosWorkbook, outputDir + '2-EXECUTADOS-importar.xlsx');
  console.log(`   💾 Arquivo salvo: 2-EXECUTADOS-importar.xlsx`);

  // ========================================================================
  // 3. GERAR ARQUIVO DE CASOS (Processos)
  // ========================================================================
  console.log('\n📁 3/3 - GERANDO CASOS (Processos)...');

  const casosArray = [];
  const processadoSet = new Set();
  let duplicados = 0;
  let semProcesso = 0;
  let semCliente = 0;
  let semExecutado = 0;

  data.forEach((row, index) => {
    const cliente = (row['Nome '] || '').toString().trim();
    const executado = (row['Loja'] || '').toString().trim();
    const processo = (row['Processo'] || '').toString().trim();

    // Verificar dados essenciais
    if (!processo) {
      semProcesso++;
      return;
    }

    if (!cliente) {
      semCliente++;
      return;
    }

    if (!executado) {
      semExecutado++;
      return;
    }

    // Evitar duplicatas
    const key = processo.toLowerCase();
    if (processadoSet.has(key)) {
      duplicados++;
      return;
    }

    processadoSet.add(key);

    casosArray.push({
      'Cliente': cliente,
      'Executado': executado,
      'Numero Processo': processo,
      'Observacao': `Processo judicial - ${executado}`,
      'Status': 'Em andamento',
      'Prioridade': 'Média',
    });
  });

  console.log(`   ✅ ${casosArray.length} casos únicos gerados`);
  if (duplicados > 0) console.log(`   ⚠️  ${duplicados} processos duplicados removidos`);
  if (semProcesso > 0) console.log(`   ⚠️  ${semProcesso} linhas sem número de processo`);
  if (semCliente > 0) console.log(`   ⚠️  ${semCliente} linhas sem nome de cliente`);
  if (semExecutado > 0) console.log(`   ⚠️  ${semExecutado} linhas sem executado`);

  // Salvar arquivo de casos
  const casosWorkbook = XLSX.utils.book_new();
  const casosSheet = XLSX.utils.json_to_sheet(casosArray);
  casosSheet['!cols'] = [
    { wch: 35 }, // Cliente
    { wch: 35 }, // Executado
    { wch: 30 }, // Numero Processo
    { wch: 50 }, // Observacao
    { wch: 15 }, // Status
    { wch: 12 }, // Prioridade
  ];
  XLSX.utils.book_append_sheet(casosWorkbook, casosSheet, 'Casos');
  XLSX.writeFile(casosWorkbook, outputDir + '3-CASOS-importar.xlsx');
  console.log(`   💾 Arquivo salvo: 3-CASOS-importar.xlsx`);

  // ========================================================================
  // PROCESSAR PLANILHA "QUITADO" PARA STATUS
  // ========================================================================
  console.log('\n📁 EXTRA - PROCESSANDO CASOS QUITADOS...');

  if (workbook.Sheets['QUITADO']) {
    const quitadoSheet = workbook.Sheets['QUITADO'];
    const quitadoData = XLSX.utils.sheet_to_json(quitadoSheet);

    const quitadosArray = [];
    const quitadosSet = new Set();

    quitadoData.forEach((row) => {
      const cliente = (row['NOME'] || '').toString().trim();
      const executado = (row['LOJA'] || '').toString().trim();
      const processo = (row['PROCESSO'] || '').toString().trim().replace(/\s/g, '');
      const situacao = (row['SITUAÇÃO/MOTIVO'] || '').toString().trim();

      if (processo && cliente && executado && !quitadosSet.has(processo.toLowerCase())) {
        quitadosSet.add(processo.toLowerCase());
        quitadosArray.push({
          'Cliente': cliente,
          'Executado': executado,
          'Numero Processo': processo,
          'Observacao': situacao,
          'Status': 'Pago',
          'Prioridade': 'Baixa',
        });
      }
    });

    console.log(`   ✅ ${quitadosArray.length} casos quitados extraídos`);

    if (quitadosArray.length > 0) {
      const quitadosWorkbook = XLSX.utils.book_new();
      const quitadosSheet = XLSX.utils.json_to_sheet(quitadosArray);
      quitadosSheet['!cols'] = [
        { wch: 35 }, { wch: 35 }, { wch: 30 },
        { wch: 50 }, { wch: 15 }, { wch: 12 }
      ];
      XLSX.utils.book_append_sheet(quitadosWorkbook, quitadosSheet, 'Quitados');
      XLSX.writeFile(quitadosWorkbook, outputDir + '4-CASOS-QUITADOS-importar.xlsx');
      console.log(`   💾 Arquivo salvo: 4-CASOS-QUITADOS-importar.xlsx`);
    }
  }

  // ========================================================================
  // RESUMO FINAL
  // ========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('✅ ARQUIVOS GERADOS COM SUCESSO!');
  console.log('='.repeat(70));

  console.log('\n📋 RESUMO:');
  console.log(`   • ${clientesArray.length} Clientes únicos`);
  console.log(`   • ${executadosArray.length} Executados únicos (Lojas)`);
  console.log(`   • ${casosArray.length} Casos em andamento`);
  console.log(`   • ${quitadosSet?.size || 0} Casos quitados`);
  console.log(`   • Total: ${casosArray.length + (quitadosSet?.size || 0)} processos`);

  console.log('\n📁 ARQUIVOS GERADOS:');
  console.log(`   1. 1-CLIENTES-importar.xlsx`);
  console.log(`   2. 2-EXECUTADOS-importar.xlsx`);
  console.log(`   3. 3-CASOS-importar.xlsx`);
  console.log(`   4. 4-CASOS-QUITADOS-importar.xlsx`);

  console.log('\n🚀 ORDEM DE IMPORTAÇÃO:');
  console.log(`   1º → Importar CLIENTES (tipo: Cliente)`);
  console.log(`   2º → Importar EXECUTADOS (tipo: Executado)`);
  console.log(`   3º → Importar CASOS em andamento`);
  console.log(`   4º → Importar CASOS QUITADOS`);

  console.log('\n💡 DICA:');
  console.log(`   • Todos os arquivos estão em: ${outputDir}`);
  console.log(`   • Revise os arquivos no Excel antes de importar`);
  console.log(`   • A importação de Casos só funcionará após Clientes e Executados`);
  console.log(`   • estarem cadastrados no sistema\n`);

} catch (error) {
  console.error('❌ ERRO:', error.message);
  console.error('\nDetalhes:', error);
}
