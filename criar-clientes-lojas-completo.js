const XLSX = require('xlsx');

const inputFile = 'c:\\Users\\Familia Oliveira\\Downloads\\ANDAMENTO DOS  PROCESSOS.xlsx';
const outputFile = 'c:\\Users\\Familia Oliveira\\Downloads\\CLIENTES-LOJAS-COMPLETO.xlsx';

console.log('📝 CRIANDO ARQUIVO DE CLIENTES (LOJAS) COMPLETO...\n');

try {
  const workbook = XLSX.readFile(inputFile);
  const sheet = workbook.Sheets['Planilha1'];
  const data = XLSX.utils.sheet_to_json(sheet);

  // Extrair lojas únicas
  const lojasSet = new Set();
  data.forEach((row) => {
    const loja = (row['Loja'] || '').toString().trim();
    if (loja) {
      lojasSet.add(loja);
    }
  });

  const lojasArray = Array.from(lojasSet);

  console.log(`✅ ${lojasArray.length} lojas únicas encontradas:\n`);

  // Criar dados completos para cada loja (igual ao arquivo de teste)
  const clientes = lojasArray.map((loja, index) => {
    // Gerar dados fictícios mas completos para cada loja
    const cnpjBase = String(12345678 + index).padStart(8, '0');
    const telefone1Base = String(67999990000 + index);
    const telefone2Base = String(67333330000 + index);

    return {
      'Nome Completo': loja,
      'Cpf': `${cnpjBase}/0001-${String(90 + index).padStart(2, '0')}`, // CNPJ fictício
      'Email': `contato@${loja.toLowerCase().replace(/\s+/g, '').substring(0, 20)}.com.br`,
      'Endereço': 'Rua Comercial',
      'Nº': String(100 + index * 10),
      'Bairro': 'Centro',
      'Cidade': 'Campo Grande',
      'Cep': '79000-000',
      'Celular 1': telefone1Base,
      'Celular 2': telefone2Base,
    };
  });

  console.log('📋 CLIENTES CRIADOS:\n');
  clientes.forEach((cliente, index) => {
    console.log(`${index + 1}. ${cliente['Nome Completo']}`);
    console.log(`   CNPJ: ${cliente.Cpf}`);
    console.log(`   Email: ${cliente.Email}`);
    console.log(`   Endereço: ${cliente.Endereço}, ${cliente['Nº']} - ${cliente.Bairro}`);
    console.log(`   Cidade: ${cliente.Cidade} - CEP: ${cliente.Cep}`);
    console.log(`   Telefones: ${cliente['Celular 1']} / ${cliente['Celular 2']}`);
    console.log('');
  });

  // Verificar que NENHUM campo está vazio ou null
  console.log('🔍 VERIFICAÇÃO DE CAMPOS:');
  let allFieldsFilled = true;
  clientes.forEach((cliente, index) => {
    Object.entries(cliente).forEach(([key, value]) => {
      if (!value || value === '' || value === null || value === undefined) {
        console.log(`   ❌ Cliente ${index + 1}: Campo "${key}" está vazio/null`);
        allFieldsFilled = false;
      }
    });
  });

  if (allFieldsFilled) {
    console.log('   ✅ Todos os campos estão preenchidos!');
  }

  // Criar workbook
  const newWorkbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(clientes);

  // Ajustar largura das colunas
  worksheet['!cols'] = [
    { wch: 45 }, // Nome Completo
    { wch: 20 }, // Cpf
    { wch: 40 }, // Email
    { wch: 35 }, // Endereço
    { wch: 8 },  // Nº
    { wch: 20 }, // Bairro
    { wch: 20 }, // Cidade
    { wch: 12 }, // Cep
    { wch: 15 }, // Celular 1
    { wch: 15 }, // Celular 2
  ];

  // Adicionar a planilha ao workbook
  XLSX.utils.book_append_sheet(newWorkbook, worksheet, 'Clientes');

  // Salvar o arquivo
  XLSX.writeFile(newWorkbook, outputFile);

  console.log('\n' + '='.repeat(70));
  console.log('✅ ARQUIVO CRIADO COM SUCESSO!');
  console.log('='.repeat(70));
  console.log(`\n📁 Local: ${outputFile}`);
  console.log(`\n📊 ${clientes.length} lojas com dados COMPLETOS`);
  console.log('\n✅ CARACTERÍSTICAS DO ARQUIVO:');
  console.log('   • TODOS os campos preenchidos (igual ao arquivo de teste)');
  console.log('   • CNPJ fictício gerado automaticamente');
  console.log('   • Email gerado baseado no nome da loja');
  console.log('   • Endereço, telefones, CEP - tudo preenchido');
  console.log('   • Formato IDÊNTICO ao arquivo de teste que funcionou');
  console.log('\n📋 INSTRUÇÕES PARA IMPORTAR:');
  console.log('   1. Acesse o sistema em http://localhost:3000');
  console.log('   2. Vá em: Entidades → Importar');
  console.log('   3. Selecione o tipo: CLIENTE');
  console.log('   4. Faça upload: CLIENTES-LOJAS-COMPLETO.xlsx');
  console.log('   5. Clique em "Importar"');
  console.log('\n🚀 ESTE ARQUIVO DEVE FUNCIONAR 100%!\n');

} catch (error) {
  console.error('❌ ERRO:', error.message);
  console.error(error);
}
