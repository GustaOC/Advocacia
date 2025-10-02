// app/dashboard/cruzamento/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, GitCompareArrows, Loader2, AlertTriangle, Sigma } from 'lucide-react';

// O tipo para cada linha de resultado na tabela
type ResultadoCruzamento = {
  nome: string;
  valor: number;
  data: string | null;
};

// O tipo para a resposta completa que vem da API
type ApiResponse = {
  resultados: ResultadoCruzamento[];
  total: number;
};

export default function CruzamentoPage() {
  const [arquivoPagamentos, setArquivoPagamentos] = useState<File | null>(null);
  const [arquivoJudicializados, setArquivoJudicializados] = useState<File | null>(null);
  const [resultados, setResultados] = useState<ResultadoCruzamento[]>([]);
  const [total, setTotal] = useState<number>(0); // Estado para armazenar o valor total
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!arquivoPagamentos || !arquivoJudicializados) {
      setError('Por favor, selecione os dois arquivos para a comparação.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultados([]);
    setTotal(0); // Reseta o total a cada nova comparação

    const formData = new FormData();
    formData.append('pagamentos', arquivoPagamentos);
    formData.append('judicializados', arquivoJudicializados);

    try {
      const response = await fetch('/api/cruzamento', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ocorreu um erro ao processar os arquivos.');
      }

      const data: ApiResponse = await response.json(); // Espera o novo formato da API
      
      setResultados(data.resultados);
      setTotal(data.total);

      if (data.resultados.length === 0) {
        setError("Nenhuma correspondência encontrada entre os arquivos.");
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
       <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Cruzamento de Listas</h2>
        <p className="text-slate-300 text-lg">Compare a lista de pagamentos com a de clientes judicializados para encontrar correspondências.</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6 text-slate-700"/>
            Upload de Arquivos
          </CardTitle>
          <CardDescription>
            Use arquivos em formato .CSV ou .XLSX (Excel). O sistema buscará por nomes correspondentes em ambas as listas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="pagamentos" className="font-semibold">Arquivo de Pagamentos</Label>
              <Input
                id="pagamentos"
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={(e) => setArquivoPagamentos(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="judicializados" className="font-semibold">Arquivo de Judicializados</Label>
              <Input
                id="judicializados"
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={(e) => setArquivoJudicializados(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <Button onClick={handleCompare} disabled={isLoading || !arquivoPagamentos || !arquivoJudicializados}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitCompareArrows className="mr-2 h-4 w-4" />}
            {isLoading ? 'Analisando...' : 'Comparar Arquivos'}
          </Button>
          {error && (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Ocorreu um Problema</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
             </Alert>
          )}
        </CardContent>
      </Card>

      {resultados.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Resultados Encontrados</CardTitle>
            <CardDescription>
              Os seguintes clientes foram encontrados em ambas as listas, com seus respectivos valores e datas da planilha de pagamentos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data do Pagamento</TableHead>
                  <TableHead>Nome do Cliente</TableHead>
                  <TableHead className="text-right">Valor Pago (R$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultados.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.data || 'Não informada'}</TableCell>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell className="text-right font-mono">{item.valor.toFixed(2).replace('.', ',')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-slate-100 hover:bg-slate-200">
                  <TableCell colSpan={2} className="font-bold text-lg text-slate-800">
                    <div className="flex items-center gap-2">
                      <Sigma className="h-5 w-5"/>
                      TOTAL GERAL
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold font-mono text-lg text-slate-800">
                    {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}