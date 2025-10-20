const XLSX = require('xlsx');
const https = require('http');

function fetchEntities() {
  return new Promise((resolve, reject) => {
    https.get('http://localhost:3000/api/entities', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== FILTRANDO CASOS VÁLIDOS ===\n');

  // 1. Buscar todas as entidades cadastradas no sistema
  console.log('1. Buscando entidades cadastradas no sistema...');
  const entities = await fetchEntities();

  console.log(`   ✓ ${entities.length} entidades encontradas\n`);

  // Criar mapa de entidades por nome (case-insensitive)
  const entityMap = new Map();
  entities.forEach(e => {
    entityMap.set(e.name.toLowerCase().trim(), e);
  });

  console.log('2. Lendo arquivo de processos correto...');
  const filePath = 'c:\\Users\\Familia Oliveira\\Downloads\\PROCESSOS-IMPORTAR-CORRIGIDO.xlsx';
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const allCases = XLSX.utils.sheet_to_json(sheet);

  console.log(`   ✓ ${allCases.length} processos no arquivo\n`);

  // 3. Filtrar apenas casos válidos (onde cliente E executado existem)
  console.log('3. Filtrando apenas casos válidos...');
  const validCases = [];
  const invalidCases = [];
  const missingClients = new Set();
  const missingExecutados = new Set();

  allCases.forEach((caseRow, index) => {
    const clienteName = (caseRow.Cliente || '').toLowerCase().trim();
    const executadoName = (caseRow.Executado || '').toLowerCase().trim();

    const clientExists = entityMap.has(clienteName);
    const executadoExists = entityMap.has(executadoName);

    if (clientExists && executadoExists) {
      validCases.push(caseRow);
    } else {
      invalidCases.push({ row: index + 2, cliente: caseRow.Cliente, executado: caseRow.Executado });
      if (!clientExists) missingClients.add(caseRow.Cliente);
      if (!executadoExists) missingExecutados.add(caseRow.Executado);
    }
  });

  console.log(`   ✓ ${validCases.length} casos VÁLIDOS (ambas entidades existem)`);
  console.log(`   ✗ ${invalidCases.length} casos INVÁLIDOS (entidades faltando)\n`);

  if (missingClients.size > 0) {
    console.log(`Clientes faltando (${missingClients.size}):`);
    console.log([...missingClients].slice(0, 10).join('\n'));
    if (missingClients.size > 10) console.log(`... e mais ${missingClients.size - 10}`);
    console.log('');
  }

  if (missingExecutados.size > 0) {
    console.log(`Executados faltando (${missingExecutados.size}):`);
    console.log([...missingExecutados].slice(0, 10).join('\n'));
    if (missingExecutados.size > 10) console.log(`... e mais ${missingExecutados.size - 10}`);
    console.log('');
  }

  // 4. Criar nova planilha apenas com casos válidos
  if (validCases.length > 0) {
    console.log('4. Criando planilha apenas com casos válidos...');
    const newWorkbook = XLSX.utils.book_new();
    const newSheet = XLSX.utils.json_to_sheet(validCases);
    XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Processos');

    const outputPath = 'c:\\Users\\Familia Oliveira\\Downloads\\PROCESSOS-VALIDOS-FINAL.xlsx';
    XLSX.writeFile(newWorkbook, outputPath);

    console.log(`   ✓ Planilha salva: ${outputPath}`);
    console.log(`   ✓ Total de casos válidos: ${validCases.length}\n`);

    console.log('='.repeat(70));
    console.log('✅ PRONTO PARA IMPORTAR!');
    console.log('='.repeat(70));
    console.log('\nUse o arquivo: PROCESSOS-VALIDOS-FINAL.xlsx');
    console.log(`Este arquivo contém ${validCases.length} processos que PODEM ser importados.`);
  } else {
    console.log('❌ NENHUM caso válido encontrado!');
    console.log('Você precisa cadastrar as entidades primeiro.');
  }
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
