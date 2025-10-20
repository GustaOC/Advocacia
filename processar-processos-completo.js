const XLSX = require('xlsx');
const path = require('path');

const inputFile = 'c:\\Users\\Familia Oliveira\\Downloads\\ANDAMENTO DOS  PROCESSOS.xlsx';
const outputDir = 'c:\\Users\\Familia Oliveira\\Downloads\\';

console.log('🔍 ANALISANDO ARQUIVO DE PROCESSOS...\n');
console.log('='.repeat(70));

try {
  const workbook = XLSX.readFile(inputFile);

  console.log('\n📑 PLANILHAS ENCONTRADAS:', workbook.SheetNames.join(', '));

  // Processar cada planilha
  workbook.SheetNames.forEach((sheetName, sheetIndex) => {
    console.log('\n' + '='.repeat(70));
    console.log(`ANALISANDO PLANILHA ${sheetIndex + 1}: "${sheetName}"`);
    console.log('='.repeat(70));

    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      console.log('⚠️  Planilha vazia, pulando...');
      return;
    }

    console.log(`\n📊 Total de linhas: ${data.length}`);

    // Mostrar todas as colunas
    const columns = Object.keys(data[0]);
    console.log('\n📋 COLUNAS ENCONTRADAS:');
    columns.forEach((col, i) => {
      console.log(`   ${(i + 1).toString().padStart(2, '0')}. "${col}"`);
    });

    // Mostrar 3 primeiras linhas completas
    console.log('\n🔍 AMOSTRA DE DADOS (3 primeiras linhas):');
    data.slice(0, 3).forEach((row, i) => {
      console.log(`\n   === LINHA ${i + 1} ===`);
      Object.entries(row).forEach(([key, value]) => {
        let displayValue = value;

        // Formatar valores para melhor visualização
        if (typeof value === 'number' && value > 40000 && value < 50000) {
          // Provavelmente é data do Excel
          const date = XLSX.SSF.parse_date_code(value);
          displayValue = `${date.d}/${date.m}/${date.y} (${value})`;
        } else if (typeof value === 'string' && value.length > 60) {
          displayValue = value.substring(0, 57) + '...';
        }

        console.log(`   ${key}: ${displayValue}`);
      });
    });

    // Análise inteligente do tipo de dados
    console.log('\n🤖 ANÁLISE INTELIGENTE:');

    const hasCliente = columns.some(col =>
      col.toLowerCase().includes('cliente') ||
      col.toLowerCase().includes('autor') ||
      col.toLowerCase().includes('nome')
    );

    const hasExecutado = columns.some(col =>
      col.toLowerCase().includes('executado') ||
      col.toLowerCase().includes('réu') ||
      col.toLowerCase().includes('reu') ||
      col.toLowerCase().includes('devedor')
    );

    const hasProcesso = columns.some(col =>
      col.toLowerCase().includes('processo') ||
      col.toLowerCase().includes('número') ||
      col.toLowerCase().includes('num')
    );

    const hasCPF = columns.some(col =>
      col.toLowerCase().includes('cpf') ||
      col.toLowerCase().includes('documento')
    );

    const hasEndereco = columns.some(col =>
      col.toLowerCase().includes('endereço') ||
      col.toLowerCase().includes('endereco')
    );

    const hasValor = columns.some(col =>
      col.toLowerCase().includes('valor') ||
      col.toLowerCase().includes('parcela')
    );

    const hasVencimento = columns.some(col =>
      col.toLowerCase().includes('vencimento') ||
      col.toLowerCase().includes('data')
    );

    console.log('   Identificadores encontrados:');
    console.log(`   • Cliente/Autor: ${hasCliente ? '✅' : '❌'}`);
    console.log(`   • Executado/Réu: ${hasExecutado ? '✅' : '❌'}`);
    console.log(`   • Nº Processo: ${hasProcesso ? '✅' : '❌'}`);
    console.log(`   • CPF/Documento: ${hasCPF ? '✅' : '❌'}`);
    console.log(`   • Endereço: ${hasEndereco ? '✅' : '❌'}`);
    console.log(`   • Valores: ${hasValor ? '✅' : '❌'}`);
    console.log(`   • Vencimentos: ${hasVencimento ? '✅' : '❌'}`);

    console.log('\n💡 TIPO DE DADOS:');
    if (hasCliente && hasExecutado && hasProcesso) {
      console.log('   📁 ARQUIVO COMPLETO DE PROCESSOS');
      console.log('   Contém: Clientes + Executados + Processos' + (hasValor ? ' + Dados Financeiros' : ''));
    } else if (hasCliente && hasCPF) {
      console.log('   👥 ARQUIVO DE ENTIDADES (Clientes/Executados)');
    } else {
      console.log('   ❓ ESTRUTURA NÃO IDENTIFICADA - Análise manual necessária');
    }

    // Sugerir mapeamento detalhado
    console.log('\n📋 MAPEAMENTO SUGERIDO:');

    const mapping = {
      clientes: {
        'Nome Completo': columns.find(c =>
          c.toLowerCase().includes('cliente') ||
          c.toLowerCase().includes('autor') ||
          (c.toLowerCase().includes('nome') && !c.toLowerCase().includes('executado'))
        ),
        'Cpf': columns.find(c =>
          c.toLowerCase().includes('cpf') && !c.toLowerCase().includes('executado')
        ),
        'Endereço': columns.find(c =>
          c.toLowerCase().includes('endereço') || c.toLowerCase().includes('endereco')
        ),
        'Telefone': columns.find(c =>
          c.toLowerCase().includes('tel') ||
          c.toLowerCase().includes('celular') ||
          c.toLowerCase().includes('fone')
        ),
      },
      executados: {
        'Nome': columns.find(c =>
          c.toLowerCase().includes('executado') ||
          c.toLowerCase().includes('réu') ||
          c.toLowerCase().includes('reu')
        ),
        'CPF': columns.find(c =>
          c.toLowerCase().includes('cpf') && c.toLowerCase().includes('executado')
        ),
      },
      processos: {
        'Numero Processo': columns.find(c =>
          c.toLowerCase().includes('processo') ||
          c.toLowerCase().includes('número') ||
          c.toLowerCase().includes('num')
        ),
        'Status': columns.find(c => c.toLowerCase().includes('status')),
        'Observacao': columns.find(c =>
          c.toLowerCase().includes('observa') ||
          c.toLowerCase().includes('descrição') ||
          c.toLowerCase().includes('andamento')
        ),
      },
      financeiro: {
        'Valor': columns.find(c =>
          c.toLowerCase().includes('valor') &&
          !c.toLowerCase().includes('parcela')
        ),
        'Valor Parcela': columns.find(c =>
          c.toLowerCase().includes('parcela')
        ),
        'Vencimento': columns.find(c =>
          c.toLowerCase().includes('vencimento')
        ),
        'Num Parcelas': columns.find(c =>
          c.toLowerCase().includes('núm') && c.toLowerCase().includes('parcela')
        ),
      }
    };

    console.log('\n   📌 CLIENTES:');
    Object.entries(mapping.clientes).forEach(([target, source]) => {
      if (source) {
        console.log(`      "${source}" → ${target} ✅`);
      } else {
        console.log(`      (não encontrado) → ${target} ⚠️`);
      }
    });

    console.log('\n   📌 EXECUTADOS:');
    Object.entries(mapping.executados).forEach(([target, source]) => {
      if (source) {
        console.log(`      "${source}" → ${target} ✅`);
      } else {
        console.log(`      (não encontrado) → ${target} ⚠️`);
      }
    });

    console.log('\n   📌 PROCESSOS:');
    Object.entries(mapping.processos).forEach(([target, source]) => {
      if (source) {
        console.log(`      "${source}" → ${target} ✅`);
      } else {
        console.log(`      (não encontrado) → ${target} ⚠️`);
      }
    });

    console.log('\n   📌 DADOS FINANCEIROS:');
    Object.entries(mapping.financeiro).forEach(([target, source]) => {
      if (source) {
        console.log(`      "${source}" → ${target} ✅`);
      } else {
        console.log(`      (não encontrado) → ${target} ⚠️`);
      }
    });

    // Estatísticas adicionais
    console.log('\n📊 ESTATÍSTICAS:');

    // Contar valores únicos
    const uniqueClients = mapping.clientes['Nome Completo']
      ? new Set(data.map(r => r[mapping.clientes['Nome Completo']]).filter(Boolean)).size
      : 0;

    const uniqueExecutados = mapping.executados['Nome']
      ? new Set(data.map(r => r[mapping.executados['Nome']]).filter(Boolean)).size
      : 0;

    const uniqueProcessos = mapping.processos['Numero Processo']
      ? new Set(data.map(r => r[mapping.processos['Numero Processo']]).filter(Boolean)).size
      : 0;

    console.log(`   • Clientes únicos: ${uniqueClients}`);
    console.log(`   • Executados únicos: ${uniqueExecutados}`);
    console.log(`   • Processos únicos: ${uniqueProcessos}`);
    console.log(`   • Total de linhas: ${data.length}`);

    // Verificar dados vazios
    console.log('\n⚠️  VERIFICAÇÃO DE QUALIDADE:');

    let emptyClientNames = 0;
    let emptyProcessNumbers = 0;
    let emptyExecutados = 0;

    data.forEach(row => {
      if (mapping.clientes['Nome Completo'] && !row[mapping.clientes['Nome Completo']]) {
        emptyClientNames++;
      }
      if (mapping.processos['Numero Processo'] && !row[mapping.processos['Numero Processo']]) {
        emptyProcessNumbers++;
      }
      if (mapping.executados['Nome'] && !row[mapping.executados['Nome']]) {
        emptyExecutados++;
      }
    });

    if (emptyClientNames > 0) {
      console.log(`   ⚠️  ${emptyClientNames} linhas sem nome de cliente`);
    }
    if (emptyProcessNumbers > 0) {
      console.log(`   ⚠️  ${emptyProcessNumbers} linhas sem número de processo`);
    }
    if (emptyExecutados > 0) {
      console.log(`   ⚠️  ${emptyExecutados} linhas sem nome de executado`);
    }

    if (emptyClientNames === 0 && emptyProcessNumbers === 0 && emptyExecutados === 0) {
      console.log('   ✅ Todos os campos obrigatórios estão preenchidos!');
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log('✅ ANÁLISE CONCLUÍDA!');
  console.log('='.repeat(70));
  console.log('\n💬 AGUARDANDO CONFIRMAÇÃO PARA GERAR ARQUIVOS DE IMPORTAÇÃO...\n');

} catch (error) {
  console.error('❌ ERRO ao processar arquivo:', error.message);
  console.error('\nDetalhes técnicos:', error);
}
