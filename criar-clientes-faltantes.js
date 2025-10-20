const XLSX = require('xlsx');

const outputFile = 'c:\\Users\\Familia Oliveira\\Downloads\\CLIENTES-FALTANTES.xlsx';

console.log('📝 CRIANDO ARQUIVO DOS 3 CLIENTES FALTANTES...\n');

// Função para remover acentos
function removerAcentos(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '');
}

// Apenas os 3 clientes que falharam
const clientes = [
  {
    'Nome Completo': 'Serrana Comércio De Eletrodomés',
    'Cpf': '12345679/0001-91',
    'Email': 'contato@serranacomercio.com.br', // SEM acentos
    'Endereço': 'Rua Comercial',
    'Nº': '110',
    'Bairro': 'Centro',
    'Cidade': 'Campo Grande',
    'Cep': '79000-000',
    'Celular 1': '67999990001',
    'Celular 2': '67333330001',
  },
  {
    'Nome Completo': 'M R M Comercio De Móveis',
    'Cpf': '12345680/0001-92',
    'Email': 'contato@mrmcomerciodemoveis.com.br', // SEM acentos
    'Endereço': 'Rua Comercial',
    'Nº': '120',
    'Bairro': 'Centro',
    'Cidade': 'Campo Grande',
    'Cep': '79000-000',
    'Celular 1': '67999990002',
    'Celular 2': '67333330002',
  },
  {
    'Nome Completo': 'Serrana Colchões',
    'Cpf': '12345683/0001-95',
    'Email': 'contato@serranacolchoes.com.br', // SEM acentos
    'Endereço': 'Rua Comercial',
    'Nº': '150',
    'Bairro': 'Centro',
    'Cidade': 'Campo Grande',
    'Cep': '79000-000',
    'Celular 1': '67999990005',
    'Celular 2': '67333330005',
  },
];

console.log('📋 CLIENTES FALTANTES:\n');
clientes.forEach((cliente, index) => {
  console.log(`${index + 1}. ${cliente['Nome Completo']}`);
  console.log(`   CNPJ: ${cliente.Cpf}`);
  console.log(`   Email: ${cliente.Email} ✅ SEM ACENTOS`);
  console.log(`   Endereço: ${cliente.Endereço}, ${cliente['Nº']} - ${cliente.Bairro}`);
  console.log(`   Cidade: ${cliente.Cidade} - CEP: ${cliente.Cep}`);
  console.log(`   Telefones: ${cliente['Celular 1']} / ${cliente['Celular 2']}`);
  console.log('');
});

// Criar workbook
const workbook = XLSX.utils.book_new();
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
XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

// Salvar o arquivo
XLSX.writeFile(workbook, outputFile);

console.log('='.repeat(70));
console.log('✅ ARQUIVO DOS CLIENTES FALTANTES CRIADO!');
console.log('='.repeat(70));
console.log(`\n📁 Local: ${outputFile}`);
console.log(`\n📊 ${clientes.length} clientes com emails CORRIGIDOS`);
console.log('\n✅ CORREÇÃO APLICADA:');
console.log('   • Todos os acentos removidos dos emails');
console.log('   • Formato válido de email');
console.log('\n📋 INSTRUÇÕES:');
console.log('   1. Importe: CLIENTES-FALTANTES.xlsx');
console.log('   2. Tipo: Cliente');
console.log('   3. Resultado: 3 clientes importados');
console.log('\n🎯 DEPOIS TERÁ OS 6 CLIENTES COMPLETOS!\n');
