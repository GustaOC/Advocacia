const XLSX = require('xlsx');
const fs = require('fs');

console.log('=== CRIANDO PLANILHA COM ENTIDADES REAIS DO BANCO ===\n');

// 1. Ler entidades do banco
const entitiesData = JSON.parse(fs.readFileSync('entidades-banco.json', 'utf8'));
const { clientes, executados } = entitiesData;

console.log(`✓ ${clientes.length} clientes no banco`);
console.log(`✓ ${executados.length} executados no banco\n`);

// Criar mapas para busca rápida (case-insensitive)
const clientesMap = new Map();
clientes.forEach(c => {
  clientesMap.set(c.name.toLowerCase().trim(), c.name);
});

const executadosMap = new Map();
executados.forEach(e => {
  executadosMap.set(e.name.toLowerCase().trim(), e.name);
});

// 2. Ler arquivo original
const filePath = 'c:\\Users\\Familia Oliveira\\Downloads\\ANDAMENTO DOS  PROCESSOS.xlsx';
const wb = XLSX.readFile(filePath);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

console.log(`Processando ${data.length} linhas...\n`);

const validCases = [];
const invalidCases = [];

data.forEach((row, index) => {
  const loja = (row['Loja'] || '').trim();
  const nome = (row['Nome '] || row['Nome'] || '').trim();
  const processo = row['Processo'] || '';

  // Buscar nome EXATO no banco
  const clienteReal = clientesMap.get(loja.toLowerCase());
  const executadoReal = executadosMap.get(nome.toLowerCase());

  if (clienteReal && executadoReal) {
    validCases.push({
      'Cliente': clienteReal,  // Nome EXATO do banco
      'Executado': executadoReal,  // Nome EXATO do banco
      'Numero Processo': processo,
      'Observacao': `Processo ${loja} - ${nome}`,
      'Status': 'Em Andamento',  // COM A MAIÚSCULO
      'Prioridade': 'Média'
    });
  } else {
    invalidCases.push({
      linha: index + 2,
      loja,
      nome,
      clienteExists: !!clienteReal,
      executadoExists: !!executadoReal
    });
  }
});

console.log(`✓ ${validCases.length} casos VÁLIDOS`);
console.log(`✗ ${invalidCases.length} casos INVÁLIDOS\n`);

if (validCases.length > 0) {
  const newWb = XLSX.utils.book_new();
  const newWs = XLSX.utils.json_to_sheet(validCases);
  XLSX.utils.book_append_sheet(newWb, newWs, 'Processos');

  const outputPath = 'c:\\Users\\Familia Oliveira\\Downloads\\PROCESSOS-IMPORTAR-DEFINITIVO.xlsx';
  XLSX.writeFile(newWb, outputPath);

  console.log(`✅ ARQUIVO CRIADO!`);
  console.log(`📁 ${outputPath}`);
  console.log(`📊 ${validCases.length} processos\n`);
  console.log(`✓ Usa nomes EXATOS do banco de dados`);
  console.log(`✓ Status: "Em Andamento" (correto!)`);
  console.log(`\n🎯 IMPORTE ESTE ARQUIVO: PROCESSOS-IMPORTAR-DEFINITIVO.xlsx`);
} else {
  console.log('❌ Nenhum caso válido encontrado!');
}

if (invalidCases.length > 0) {
  console.log(`\n⚠️  ${invalidCases.length} casos NÃO puderam ser importados:`);
  console.log(`   (clientes/executados não estão no banco)`);

  invalidCases.slice(0, 10).forEach(c => {
    console.log(`   Linha ${c.linha}: ${c.loja} / ${c.nome}`);
    if (!c.clienteExists) console.log(`      ✗ Cliente não existe`);
    if (!c.executadoExists) console.log(`      ✗ Executado não existe`);
  });
}
