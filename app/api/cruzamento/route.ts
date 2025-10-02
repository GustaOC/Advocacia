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
    const pagamentosWorkbook = XLSX.read(pagamentosBuffer, { type: 'buffer' });
    const pagamentosSheetName = pagamentosWorkbook.SheetNames[0];

    if (!pagamentosSheetName) {
      return NextResponse.json({ error: 'O arquivo de pagamentos está vazio.' }, { status: 400 });
    }
    const pagamentosSheet = pagamentosWorkbook.Sheets[pagamentosSheetName];
    if (!pagamentosSheet) {
      return NextResponse.json({ error: `A planilha '${pagamentosSheetName}' não pôde ser lida.` }, { status: 400 });
    }
    
    const pagamentosData: any[][] = XLSX.utils.sheet_to_json(pagamentosSheet, { header: 1 });
    
    const resultados: ResultadoCruzamento[] = [];
    let totalValor = 0;
    
    // --- 3. Lógica Final e Definitiva com RegEx ---
    let dataAtual: string | null = null; 
    const dateRegex = /(\d{2}\/\d{2}\/\d{4})/; // Expressão regular para encontrar datas no formato dd/mm/yyyy

    pagamentosData.forEach(row => {
        let isDateRow = false;
        
        // Itera sobre as células da linha para encontrar a data
        for (const cell of row) {
            if (typeof cell === 'string' && cell.toUpperCase().includes('DATA:')) {
                const match = cell.match(dateRegex);
                if (match && match[0]) {
                    dataAtual = match[0];
                    isDateRow = true;
                    break; 
                }
            }
        }
        
        if (isDateRow) return;
        
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