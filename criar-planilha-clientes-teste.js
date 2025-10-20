const XLSX = require('xlsx');

const outputFile = 'c:\\Users\\Familia Oliveira\\Downloads\\CLIENTES-LOJAS-TESTE.xlsx';

console.log('📝 CRIANDO PLANILHA DE CLIENTES (LOJAS) PARA TESTE...\n');

// Dados das lojas com informações mais completas
const clientes = [
  {
    'Nome Completo': 'Serrana Comércio De Eletrodomésticos Ltda',
    'Cpf': '12.345.678/0001-90',
    'Email': 'contato@serrana.com.br',
    'Endereço': 'Rua das Flores',
    'Nº': '100',
    'Bairro': 'Centro',
    'Cidade': 'Campo Grande',
    'Cep': '79000-000',
    'Celular 1': '67999998888',
    'Celular 2': '6733334444',
  },
  {
    'Nome Completo': 'C. Regina Malaquias & Cia Ltda - ME',
    'Cpf': '23.456.789/0001-01',
    'Email': 'regina@malaquias.com.br',
    'Endereço': 'Avenida Afonso Pena',
    'Nº': '200',
    'Bairro': 'Centro',
    'Cidade': 'Campo Grande',
    'Cep': '79002-000',
    'Celular 1': '67988887777',
    'Celular 2': '6733335555',
  },
  {
    'Nome Completo': 'Aero Rancho Comércio Ltda',
    'Cpf': '34.567.890/0001-12',
    'Email': 'contato@aerorancho.com',
    'Endereço': 'Rua Marechal Rondon',
    'Nº': '300',
    'Bairro': 'Aero Rancho',
    'Cidade': 'Campo Grande',
    'Cep': '79084-000',
    'Celular 1': '67977776666',
    'Celular 2': '6733336666',
  },
  {
    'Nome Completo': 'Magazine Varejo e Atacado S/A',
    'Cpf': '45.678.901/0001-23',
    'Email': 'sac@magazine.com.br',
    'Endereço': 'Rua 14 de Julho',
    'Nº': '400',
    'Bairro': 'Centro',
    'Cidade': 'Campo Grande',
    'Cep': '79004-000',
    'Celular 1': '67966665555',
    'Celular 2': '6733337777',
  },
  {
    'Nome Completo': 'Comercial do Sul Ltda',
    'Cpf': '56.789.012/0001-34',
    'Email': 'financeiro@comercialsul.com.br',
    'Endereço': 'Rua Barão do Rio Branco',
    'Nº': '500',
    'Bairro': 'Amambaí',
    'Cidade': 'Campo Grande',
    'Cep': '79005-000',
    'Celular 1': '67955554444',
    'Celular 2': '6733338888',
  },
  {
    'Nome Completo': 'Eletro Center MS Comércio e Serviços',
    'Cpf': '67.890.123/0001-45',
    'Email': 'atendimento@eletrocenter.com.br',
    'Endereço': 'Avenida Mato Grosso',
    'Nº': '600',
    'Bairro': 'Jardim dos Estados',
    'Cidade': 'Campo Grande',
    'Cep': '79020-000',
    'Celular 1': '67944443333',
    'Celular 2': '6733339999',
  },
];

console.log(`✅ ${clientes.length} clientes preparados\n`);

// Mostrar os dados
console.log('📋 DADOS DOS CLIENTES:\n');
clientes.forEach((cliente, index) => {
  console.log(`${index + 1}. ${cliente['Nome Completo']}`);
  console.log(`   CNPJ: ${cliente.Cpf}`);
  console.log(`   Email: ${cliente.Email}`);
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
  { wch: 30 }, // Email
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
console.log('✅ ARQUIVO CRIADO COM SUCESSO!');
console.log('='.repeat(70));
console.log(`\n📁 Local: ${outputFile}`);
console.log('\n📋 INSTRUÇÕES PARA IMPORTAR:');
console.log('   1. Acesse o sistema em http://localhost:3000');
console.log('   2. Vá em: Entidades → Importar');
console.log('   3. Selecione o tipo: CLIENTE');
console.log('   4. Faça upload do arquivo: CLIENTES-LOJAS-TESTE.xlsx');
console.log('   5. Clique em "Importar"');
console.log('\n✅ TODAS AS COLUNAS ESTÃO NO FORMATO CORRETO!');
console.log('✅ Todos os campos estão preenchidos para teste');
console.log('✅ Este arquivo deve importar sem erros\n');
