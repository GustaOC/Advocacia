// app/api/cruzamento/route.ts
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// Tipo para o resultado final, incluindo a data
type ResultadoCruzamento = {
  nome: string;
  valor: number;
  data: string | null;
};

// O tipo para a resposta completa da API
type ApiResponse = {
  resultados: ResultadoCruzamento[];
  total: number;
};

// Função de normalização para uma comparação precisa
const normalizeString = (str: string) => {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/\s+/g, ' ');           // Garante espaços simples
};

// Função para converter data serial do Excel para string
const excelDateToString = (serial: number): string => {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  
  const day = String(date_info.getUTCDate()).padStart(2, '0');
  const month = String(date_info.getUTCMonth() + 1).padStart(2, '0');
  const year = date_info.getUTCFullYear();
  
  return `${day}/${month}/${year}`;
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const pagamentosFile = formData.get('pagamentos') as File | null;
    const judicializadosFile = formData.get('judicializados') as File | null;

    if (!pagamentosFile || !judicializadosFile) {
      return NextResponse.json({ error: 'Arquivos não enviados.' }, { status: 400 });
    }

    // --- 1. Processar arquivo de JUDICIALIZADOS ---
    const judicializadosBuffer = await judicializadosFile.arrayBuffer();
    const judicializadosWorkbook = XLSX.read(judicializadosBuffer, { type: 'buffer' });
    const judicializadosSheetName = judicializadosWorkbook.SheetNames[0];

    if (!judicializadosSheetName) {
      return NextResponse.json({ error: 'O arquivo de judicializados está vazio.' }, { status: 400 });
    }
    const judicializadosSheet = judicializadosWorkbook.Sheets[judicializadosSheetName];
    if (!judicializadosSheet) {
      return NextResponse.json({ error: `A planilha '${judicializadosSheetName}' não pôde ser lida.` }, { status: 400 });
    }

    const judicializadosData: any[][] = XLSX.utils.sheet_to_json(judicializadosSheet, { header: 1 });
    const nomesJudicializados = new Set<string>();
    
    judicializadosData.forEach(row => {
      if (row[0] && typeof row[0] === 'string' && row[0].trim() !== '') {
        nomesJudicializados.add(normalizeString(row[0]));
      }
    });

    if (nomesJudicializados.size === 0) {
      return NextResponse.json({ error: "Nenhum nome válido encontrado no arquivo de judicializados." }, { status: 400 });
    }

    // --- 2. Processar arquivo de PAGAMENTOS ---
    const pagamentosBuffer = await pagamentosFile.arrayBuffer();
    const pagamentosWorkbook = XLSX.read(pagamentosBuffer, { 
      type: 'buffer',
      cellDates: true,  // Tenta converter datas automaticamente
      cellNF: false,
      cellStyles: false
    });
    const pagamentosSheetName = pagamentosWorkbook.SheetNames[0];

    if (!pagamentosSheetName) {
      return NextResponse.json({ error: 'O arquivo de pagamentos está vazio.' }, { status: 400 });
    }
    const pagamentosSheet = pagamentosWorkbook.Sheets[pagamentosSheetName];
    if (!pagamentosSheet) {
      return NextResponse.json({ error: `A planilha '${pagamentosSheetName}' não pôde ser lida.` }, { status: 400 });
    }
    
    const pagamentosData: any[][] = XLSX.utils.sheet_to_json(pagamentosSheet, { 
      header: 1,
      raw: false,  // Retorna valores formatados como strings
      dateNF: 'dd/mm/yyyy'
    });
    
    const resultados: ResultadoCruzamento[] = [];
    let totalValor = 0;
    
    // --- 3. Lógica Final e Definitiva com RegEx ---
    let dataAtual: string | null = null; 
    const dateRegex = /(\d{2}\/\d{2}\/\d{4})/; // Expressão regular para encontrar datas no formato dd/mm/yyyy

    console.log('Iniciando processamento de pagamentos...');
    console.log('Total de linhas encontradas:', pagamentosData.length);

    pagamentosData.forEach((row, rowIndex) => {
        // Verifica se alguma célula da linha contém "Data:"
        let dataEncontrada = false;
        
        for (let i = 0; i < row.length; i++) {
            const cell = row[i];
            const cellStr = String(cell || '').trim();
            
            // Se encontrar "Data:", procura a data na célula anterior ou atual
            if (cellStr.toUpperCase() === 'DATA:') {
                // Procura a data na célula anterior (i-1)
                if (i > 0) {
                    const prevCell = String(row[i - 1] || '').trim();
                    const match = prevCell.match(dateRegex);
                    if (match && match[0]) {
                        dataAtual = match[0];
                        dataEncontrada = true;
                        console.log(`✓✓✓ DATA CAPTURADA: ${dataAtual} (linha ${rowIndex + 1}, encontrada na célula ${i - 1})`);
                        break;
                    }
                }
                
                // Se não encontrou antes, procura na próxima célula (i+1)
                if (!dataEncontrada && i < row.length - 1) {
                    const nextCell = String(row[i + 1] || '').trim();
                    const match = nextCell.match(dateRegex);
                    if (match && match[0]) {
                        dataAtual = match[0];
                        dataEncontrada = true;
                        console.log(`✓✓✓ DATA CAPTURADA: ${dataAtual} (linha ${rowIndex + 1}, encontrada na célula ${i + 1})`);
                        break;
                    }
                }
            }
            
            // Também verifica se a célula atual já tem "Data: DD/MM/YYYY" junto
            if (cellStr.toUpperCase().includes('DATA:')) {
                const match = cellStr.match(dateRegex);
                if (match && match[0]) {
                    dataAtual = match[0];
                    dataEncontrada = true;
                    console.log(`✓✓✓ DATA CAPTURADA: ${dataAtual} (linha ${rowIndex + 1}, na mesma célula)`);
                    break;
                }
            }
        }
        
        // Se encontrou data, pula para próxima linha
        if (dataEncontrada) return;
        
        // Procura pela linha de transação
        const descriptionCell = row[0]; // Descrição na coluna A
        const valueCell = row[1];       // Valor na coluna B

        if (descriptionCell && typeof descriptionCell === 'string' && descriptionCell.includes('Rec. Parc.:') && descriptionCell.includes('Cli.:')) {
            const prefixo = 'Cli.:';
            const indicePrefixo = descriptionCell.toUpperCase().indexOf(prefixo.toUpperCase());
            
            if (indicePrefixo !== -1) {
                const nomeCliente = descriptionCell.substring(indicePrefixo + prefixo.length).trim();
                const nomeNormalizado = normalizeString(nomeCliente);

                if (nomesJudicializados.has(nomeNormalizado)) {
                    const valor = parseFloat(String(valueCell || '0').replace(',', '.')) || 0;
                    
                    if (!dataAtual) {
                        console.warn(`⚠ ATENÇÃO: Match encontrado na linha ${rowIndex + 1} mas SEM DATA: ${nomeCliente} - R$ ${valor.toFixed(2)}`);
                    } else {
                        console.log(`✓ Match encontrado na linha ${rowIndex + 1}: ${nomeCliente} - R$ ${valor.toFixed(2)} - Data: ${dataAtual}`);
                    }
                    
                    resultados.push({
                        data: dataAtual,
                        nome: nomeCliente,
                        valor: valor,
                    });
                    totalValor += valor;
                }
            }
        }
    });

    console.log(`Processamento finalizado. Total de correspondências: ${resultados.length}`);
    console.log(`Valor total: R$ ${totalValor.toFixed(2)}`);

    const responseData: ApiResponse = {
        resultados: resultados,
        total: totalValor
    };

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Erro no processamento dos arquivos:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao processar os arquivos no servidor.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}