const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Caminho do arquivo
const inputFile = 'c:\\Users\\Familia Oliveira\\Downloads\\amostragem para importação (1).xlsx';
const outputFile = 'c:\\Users\\Familia Oliveira\\Downloads\\amostragem-corrigido.xlsx';

console.log('📊 Analisando arquivo Excel...\n');

try {
  // Ler o arquivo
  const workbook = XLSX.readFile(inputFile);

  console.log('📑 Planilhas encontradas:', workbook.SheetNames.join(', '));
  console.log('');

  // Analisar cada planilha
  workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`PLANILHA ${index + 1}: "${sheetName}"`);
    console.log('='.repeat(60));

    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      console.log('⚠️  Planilha vazia!');
      return;
    }

    // Mostrar estrutura atual
    const columns = Object.keys(data[0]);
    console.log('\n📋 COLUNAS ATUAIS:');
    columns.forEach((col, i) => {
      console.log(`   ${i + 1}. "${col}"`);
    });

    console.log(`\n📊 Total de linhas: ${data.length}`);

    // Mostrar primeiras 3 linhas como exemplo
    console.log('\n🔍 PRIMEIRAS LINHAS (amostra):');
    data.slice(0, 3).forEach((row, i) => {
      console.log(`\n   Linha ${i + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        const displayValue = String(value).length > 50
          ? String(value).substring(0, 47) + '...'
          : value;
        console.log(`      ${key}: ${displayValue}`);
      });
    });

    // Detectar tipo de dados
    console.log('\n🔎 ANÁLISE:');
    const hasNomeCompleto = columns.some(col =>
      col.toLowerCase().includes('nome') ||
      col.toLowerCase().includes('cliente')
    );
    const hasCPF = columns.some(col =>
      col.toLowerCase().includes('cpf') ||
      col.toLowerCase().includes('documento')
    );
    const hasEndereco = columns.some(col =>
      col.toLowerCase().includes('endereço') ||
      col.toLowerCase().includes('endereco')
    );
    const hasProcesso = columns.some(col =>
      col.toLowerCase().includes('processo')
    );
    const hasExecutado = columns.some(col =>
      col.toLowerCase().includes('executado') ||
      col.toLowerCase().includes('réu')
    );

    if (hasNomeCompleto && (hasCPF || hasEndereco)) {
      console.log('   ✅ Parece ser uma planilha de ENTIDADES (Clientes/Executados)');
    } else if (hasProcesso || (hasNomeCompleto && hasExecutado)) {
      console.log('   ✅ Parece ser uma planilha de CASOS (Processos)');
    } else {
      console.log('   ⚠️  Tipo de planilha não identificado');
    }

    // Sugestões de mapeamento
    console.log('\n💡 SUGESTÃO DE MAPEAMENTO:');

    if (hasNomeCompleto && (hasCPF || hasEndereco)) {
      // É entidade
      console.log('   Para importação de ENTIDADES, renomeie as colunas para:');
      console.log('');
      const mapping = {
        'Nome Completo': columns.find(c =>
          c.toLowerCase().includes('nome') ||
          c.toLowerCase().includes('cliente') ||
          c.toLowerCase().includes('razão social')
        ),
        'Cpf': columns.find(c =>
          c.toLowerCase().includes('cpf') ||
          c.toLowerCase().includes('cnpj') ||
          c.toLowerCase().includes('documento')
        ),
        'Email': columns.find(c => c.toLowerCase().includes('email') || c.toLowerCase().includes('e-mail')),
        'Endereço': columns.find(c =>
          c.toLowerCase().includes('endereço') ||
          c.toLowerCase().includes('endereco') ||
          c.toLowerCase().includes('logradouro') ||
          c.toLowerCase().includes('rua')
        ),
        'Nº': columns.find(c =>
          c.toLowerCase().includes('número') ||
          c.toLowerCase().includes('numero') ||
          c.toLowerCase() === 'nº' ||
          c.toLowerCase() === 'n°'
        ),
        'Bairro': columns.find(c => c.toLowerCase().includes('bairro')),
        'Cidade': columns.find(c => c.toLowerCase().includes('cidade') || c.toLowerCase().includes('município')),
        'Cep': columns.find(c => c.toLowerCase().includes('cep')),
        'Celular 1': columns.find(c =>
          c.toLowerCase().includes('celular') ||
          c.toLowerCase().includes('telefone') ||
          c.toLowerCase().includes('fone') ||
          c.toLowerCase().includes('tel')
        ),
        'Celular 2': columns.find(c =>
          c.toLowerCase().includes('celular 2') ||
          c.toLowerCase().includes('telefone 2') ||
          c.toLowerCase().includes('fone 2')
        ),
      };

      Object.entries(mapping).forEach(([target, source]) => {
        if (source) {
          console.log(`   "${source}" → "${target}"`);
        } else {
          console.log(`   (não encontrado) → "${target}" ⚠️`);
        }
      });

      // Criar nova planilha corrigida
      console.log('\n🔧 Criando planilha corrigida...');
      const correctedData = data.map(row => {
        const newRow = {};
        Object.entries(mapping).forEach(([target, source]) => {
          if (source && row[source] !== undefined) {
            newRow[target] = row[source];
          } else {
            newRow[target] = null;
          }
        });
        return newRow;
      });

      // Salvar arquivo corrigido
      const newWorkbook = XLSX.utils.book_new();
      const newSheet = XLSX.utils.json_to_sheet(correctedData);
      XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Entidades Corrigido');
      XLSX.writeFile(newWorkbook, outputFile);

      console.log(`\n✅ Arquivo corrigido salvo em:\n   ${outputFile}`);

    } else if (hasProcesso || (hasNomeCompleto && hasExecutado)) {
      // É caso
      console.log('   Para importação de CASOS, renomeie as colunas para:');
      console.log('');
      const mapping = {
        'Cliente': columns.find(c => c.toLowerCase().includes('cliente')),
        'Executado': columns.find(c =>
          c.toLowerCase().includes('executado') ||
          c.toLowerCase().includes('réu') ||
          c.toLowerCase().includes('reu')
        ),
        'Numero Processo': columns.find(c =>
          c.toLowerCase().includes('processo') ||
          c.toLowerCase().includes('número')
        ),
        'Observacao': columns.find(c =>
          c.toLowerCase().includes('observação') ||
          c.toLowerCase().includes('observacao') ||
          c.toLowerCase().includes('título') ||
          c.toLowerCase().includes('titulo') ||
          c.toLowerCase().includes('descrição')
        ),
        'Status': columns.find(c => c.toLowerCase().includes('status')),
        'Prioridade': columns.find(c => c.toLowerCase().includes('prioridade')),
      };

      Object.entries(mapping).forEach(([target, source]) => {
        if (source) {
          console.log(`   "${source}" → "${target}"`);
        } else {
          console.log(`   (não encontrado) → "${target}" ⚠️`);
        }
      });
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ Análise concluída!');
  console.log('='.repeat(60) + '\n');

} catch (error) {
  console.error('❌ Erro ao processar arquivo:', error.message);
  console.error('\nDetalhes:', error);
}
