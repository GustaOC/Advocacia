const XLSX = require('xlsx');

const inputFile = 'c:\\Users\\Familia Oliveira\\Downloads\\ANDAMENTO DOS  PROCESSOS.xlsx';
const outputDir = 'c:\\Users\\Familia Oliveira\\Downloads\\';

console.log('🔄 CORRIGINDO INVERSÃO DE PAPÉIS...\n');
console.log('='.repeat(70));
console.log('⚠️  CORREÇÃO: Lojas são os CLIENTES, Pessoas são os EXECUTADOS');
console.log('='.repeat(70));

try {
  const workbook = XLSX.readFile(inputFile);
  const mainSheetName = 'Planilha1';
  const sheet = workbook.Sheets[mainSheetName];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log(`\n📊 Processando ${data.length} linhas...\n`);

  // ========================================================================
  // 1. EXTRAIR CLIENTES (LOJAS) - CORRETO AGORA
  // ========================================================================
  console.log('📁 1/3 - EXTRAINDO CLIENTES (Lojas)...');

  const clientesMap = new Map();

  data.forEach((row) => {
    const loja = (row['Loja'] || '').toString().trim();

    if (loja) {
      const key = loja.toLowerCase();
      if (!clientesMap.has(key)) {
        clientesMap.set(key, {
          'Nome Completo': loja,
          'Cpf': '', // Lojas normalmente têm CNPJ, mas não está no arquivo
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
  console.log(`   ✅ ${clientesArray.length} clientes únicos extraídos (Lojas)`);

  // Salvar arquivo de clientes
  const clientesWorkbook = XLSX.utils.book_new();
  const clientesSheet = XLSX.utils.json_to_sheet(clientesArray);
  clientesSheet['!cols'] = [
    { wch: 35 }, { wch: 15 }, { wch: 25 }, { wch: 35 },
    { wch: 8 }, { wch: 20 }, { wch: 20 }, { wch: 12 },
    { wch: 15 }, { wch: 15 }
  ];
  XLSX.utils.book_append_sheet(clientesWorkbook, clientesSheet, 'Clientes');
  XLSX.writeFile(clientesWorkbook, outputDir + '1-CLIENTES-importar-CORRIGIDO.xlsx');
  console.log(`   💾 Arquivo salvo: 1-CLIENTES-importar-CORRIGIDO.xlsx`);

  // ========================================================================
  // 2. EXTRAIR EXECUTADOS (PESSOAS) - CORRETO AGORA
  // ========================================================================
  console.log('\n📁 2/3 - EXTRAINDO EXECUTADOS (Pessoas físicas)...');

  const executadosMap = new Map();

  data.forEach((row) => {
    const nome = (row['Nome '] || '').toString().trim();
    const cpf = (row['CPF'] || '').toString().trim();

    if (nome && cpf) {
      const key = cpf.toLowerCase();
      if (!executadosMap.has(key)) {
        executadosMap.set(key, {
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

  const executadosArray = Array.from(executadosMap.values());
  console.log(`   ✅ ${executadosArray.length} executados únicos extraídos (Pessoas)`);

  // Salvar arquivo de executados
  const executadosWorkbook = XLSX.utils.book_new();
  const executadosSheet = XLSX.utils.json_to_sheet(executadosArray);
  executadosSheet['!cols'] = [
    { wch: 35 }, { wch: 15 }, { wch: 25 }, { wch: 35 },
    { wch: 8 }, { wch: 20 }, { wch: 20 }, { wch: 12 },
    { wch: 15 }, { wch: 15 }
  ];
  XLSX.utils.book_append_sheet(executadosWorkbook, executadosSheet, 'Executados');
  XLSX.writeFile(executadosWorkbook, outputDir + '2-EXECUTADOS-importar-CORRIGIDO.xlsx');
  console.log(`   💾 Arquivo salvo: 2-EXECUTADOS-importar-CORRIGIDO.xlsx`);

  // ========================================================================
  // 3. GERAR ARQUIVO DE CASOS (Processos) - CORRETO AGORA
  // ========================================================================
  console.log('\n📁 3/3 - GERANDO CASOS (Processos) - PAPÉIS CORRIGIDOS...');

  const casosArray = [];
  const processadoSet = new Set();
  let duplicados = 0;
  let semProcesso = 0;
  let semCliente = 0;
  let semExecutado = 0;

  data.forEach((row) => {
    const cliente = (row['Loja'] || '').toString().trim(); // INVERTIDO
    const executado = (row['Nome '] || '').toString().trim(); // INVERTIDO
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
      'Cliente': cliente, // Loja (quem move a ação)
      'Executado': executado, // Pessoa física (devedor)
      'Numero Processo': processo,
      'Observacao': `Cobrança judicial - Devedor: ${executado}`,
      'Status': 'Em andamento',
      'Prioridade': 'Média',
    });
  });

  console.log(`   ✅ ${casosArray.length} casos únicos gerados`);
  if (duplicados > 0) console.log(`   ⚠️  ${duplicados} processos duplicados removidos`);
  if (semProcesso > 0) console.log(`   ⚠️  ${semProcesso} linhas sem número de processo`);
  if (semCliente > 0) console.log(`   ⚠️  ${semCliente} linhas sem loja (cliente)`);
  if (semExecutado > 0) console.log(`   ⚠️  ${semExecutado} linhas sem pessoa (executado)`);

  // Salvar arquivo de casos
  const casosWorkbook = XLSX.utils.book_new();
  const casosSheet = XLSX.utils.json_to_sheet(casosArray);
  casosSheet['!cols'] = [
    { wch: 35 }, // Cliente (Loja)
    { wch: 35 }, // Executado (Pessoa)
    { wch: 30 }, // Numero Processo
    { wch: 50 }, // Observacao
    { wch: 15 }, // Status
    { wch: 12 }, // Prioridade
  ];
  XLSX.utils.book_append_sheet(casosWorkbook, casosSheet, 'Casos');
  XLSX.writeFile(casosWorkbook, outputDir + '3-CASOS-importar-CORRIGIDO.xlsx');
  console.log(`   💾 Arquivo salvo: 3-CASOS-importar-CORRIGIDO.xlsx`);

  // ========================================================================
  // PROCESSAR PLANILHA "QUITADO" - CORRETO AGORA
  // ========================================================================
  console.log('\n📁 EXTRA - PROCESSANDO CASOS QUITADOS...');

  if (workbook.Sheets['QUITADO']) {
    const quitadoSheet = workbook.Sheets['QUITADO'];
    const quitadoData = XLSX.utils.sheet_to_json(quitadoSheet);

    const quitadosArray = [];
    const quitadosSet = new Set();

    quitadoData.forEach((row) => {
      const cliente = (row['LOJA'] || '').toString().trim(); // INVERTIDO
      const executado = (row['NOME'] || '').toString().trim(); // INVERTIDO
      const processo = (row['PROCESSO'] || '').toString().trim().replace(/\s/g, '');
      const situacao = (row['SITUAÇÃO/MOTIVO'] || '').toString().trim();

      if (processo && cliente && executado && !quitadosSet.has(processo.toLowerCase())) {
        quitadosSet.add(processo.toLowerCase());
        quitadosArray.push({
          'Cliente': cliente, // Loja
          'Executado': executado, // Pessoa
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
      XLSX.writeFile(quitadosWorkbook, outputDir + '4-CASOS-QUITADOS-importar-CORRIGIDO.xlsx');
      console.log(`   💾 Arquivo salvo: 4-CASOS-QUITADOS-importar-CORRIGIDO.xlsx`);
    }
  }

  // ========================================================================
  // RESUMO FINAL
  // ========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('✅ ARQUIVOS CORRIGIDOS GERADOS COM SUCESSO!');
  console.log('='.repeat(70));

  console.log('\n📋 RESUMO (PAPÉIS CORRETOS):');
  console.log(`   • ${clientesArray.length} Clientes (Lojas/Empresas)`);
  console.log(`   • ${executadosArray.length} Executados (Pessoas físicas/Devedores)`);
  console.log(`   • ${casosArray.length} Casos em andamento`);
  console.log(`   • ${quitadosArray?.length || 0} Casos quitados`);

  console.log('\n📁 ARQUIVOS GERADOS (CORRIGIDOS):');
  console.log(`   1. 1-CLIENTES-importar-CORRIGIDO.xlsx → ${clientesArray.length} Lojas`);
  console.log(`   2. 2-EXECUTADOS-importar-CORRIGIDO.xlsx → ${executadosArray.length} Pessoas`);
  console.log(`   3. 3-CASOS-importar-CORRIGIDO.xlsx → ${casosArray.length} processos`);
  console.log(`   4. 4-CASOS-QUITADOS-importar-CORRIGIDO.xlsx → ${quitadosArray?.length || 0} quitados`);

  console.log('\n⚖️  ESTRUTURA CORRETA:');
  console.log(`   Cliente (autor) = LOJA/EMPRESA (quem cobra)`);
  console.log(`   Executado (réu) = PESSOA FÍSICA (quem deve)`);
  console.log(`   Processo = Ação de cobrança`);

  console.log('\n🚀 ORDEM DE IMPORTAÇÃO:');
  console.log(`   1º → Importar CLIENTES (Lojas) - tipo: Cliente`);
  console.log(`   2º → Importar EXECUTADOS (Pessoas) - tipo: Executado`);
  console.log(`   3º → Importar CASOS em andamento`);
  console.log(`   4º → Importar CASOS QUITADOS`);

  console.log('\n💡 OBSERVAÇÃO IMPORTANTE:');
  console.log(`   ✅ Os papéis agora estão CORRETOS!`);
  console.log(`   ✅ Lojas = Clientes (credores)`);
  console.log(`   ✅ Pessoas = Executados (devedores)`);
  console.log(`   ⚠️  DELETE os arquivos anteriores para evitar confusão!\n`);

} catch (error) {
  console.error('❌ ERRO:', error.message);
  console.error('\nDetalhes:', error);
}
