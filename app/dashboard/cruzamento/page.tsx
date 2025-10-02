// app/dashboard/cruzamento/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, GitCompareArrows, Loader2, AlertTriangle, Sigma, TrendingUp, FileSpreadsheet, CheckCircle } from 'lucide-react';

type ResultadoCruzamento = {
  nome: string;
  valor: number;
  data: string | null;
};

type ApiResponse = {
  resultados: ResultadoCruzamento[];
  total: number;
};

function CruzamentoStats({ resultados, total }: { resultados: ResultadoCruzamento[], total: number }) {
  const stats = [
    { label: "Correspondências Encontradas", value: resultados.length.toString(), icon: CheckCircle, color: "text-blue-600", bg: "from-blue-50 to-blue-100", trend: "100%" },
    { label: "Valor Total", value: total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: Sigma, color: "text-green-600", bg: "from-green-50 to-green-100", trend: "+15%" },
    { label: "Média por Cliente", value: (resultados.length > 0 ? total / resultados.length : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: TrendingUp, color: "text-purple-600", bg: "from-purple-50 to-purple-100", trend: "+8%" },
    { label: "Status", value: "Concluído", icon: FileSpreadsheet, color: "text-orange-600", bg: "from-orange-50 to-orange-100", trend: "OK" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const StatIcon = stat.icon;
        return (
          <Card key={index} className="group hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-0 bg-white relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white to-transparent rounded-full transform translate-x-8 -translate-y-8"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">{stat.trend}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                  <StatIcon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function CruzamentoPage() {
  const [arquivoPagamentos, setArquivoPagamentos] = useState<File | null>(null);
  const [arquivoJudicializados, setArquivoJudicializados] = useState<File | null>(null);
  const [resultados, setResultados] = useState<ResultadoCruzamento[]>([]);
  const [total, setTotal] = useState<number>(0);
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
    setTotal(0);

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

      const data: ApiResponse = await response.json();
      
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
      <div className="relative bg-gradient-to-br from-cyan-900 via-teal-800 to-cyan-900 rounded-3xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-10"></div>
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-bold mb-3">Cruzamento de Listas</h2>
          <p className="text-cyan-100 text-xl">Compare a lista de pagamentos com a de clientes judicializados para encontrar correspondências.</p>
        </div>
      </div>

      {resultados.length > 0 && <CruzamentoStats resultados={resultados} total={total} />}

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <CardTitle className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Upload className="h-6 w-6 text-cyan-600"/>
            Upload de Arquivos
          </CardTitle>
          <CardDescription className="text-slate-600">
            Use arquivos em formato .CSV ou .XLSX (Excel). O sistema buscará por nomes correspondentes em ambas as listas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="pagamentos" className="text-slate-700 font-semibold">Arquivo de Pagamentos</Label>
              <Input
                id="pagamentos"
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={(e) => setArquivoPagamentos(e.target.files?.[0] ?? null)}
                className="bg-white border-2 border-slate-200 rounded-xl h-11"
              />
              {arquivoPagamentos && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  {arquivoPagamentos.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="judicializados" className="text-slate-700 font-semibold">Arquivo de Judicializados</Label>
              <Input
                id="judicializados"
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={(e) => setArquivoJudicializados(e.target.files?.[0] ?? null)}
                className="bg-white border-2 border-slate-200 rounded-xl h-11"
              />
              {arquivoJudicializados && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  {arquivoJudicializados.name}
                </p>
              )}
            </div>
          </div>
          <Button 
            onClick={handleCompare} 
            disabled={isLoading || !arquivoPagamentos || !arquivoJudicializados}
            className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-lg rounded-xl h-12 px-8"
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <GitCompareArrows className="mr-2 h-5 w-5" />}
            {isLoading ? 'Analisando...' : 'Comparar Arquivos'}
          </Button>
          {error && (
             <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Ocorreu um Problema</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
             </Alert>
          )}
        </CardContent>
      </Card>

      {resultados.length > 0 && (
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <CardTitle className="text-2xl font-bold text-slate-900">Resultados Encontrados</CardTitle>
            <CardDescription className="text-slate-600">
              Os seguintes clientes foram encontrados em ambas as listas, com seus respectivos valores e datas da planilha de pagamentos.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200">
                  <TableHead className="text-slate-700 font-bold">Data do Pagamento</TableHead>
                  <TableHead className="text-slate-700 font-bold">Nome do Cliente</TableHead>
                  <TableHead className="text-right text-slate-700 font-bold">Valor Pago (R$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultados.map((item, index) => (
                  <TableRow key={index} className="group hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-transparent transition-all duration-200">
                    <TableCell className="font-mono text-sm">{item.data || 'Não informada'}</TableCell>
                    <TableCell className="font-medium group-hover:text-cyan-700 transition-colors">{item.nome}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-green-700">{item.valor.toFixed(2).replace('.', ',')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 transition-all">
                  <TableCell colSpan={2} className="font-bold text-lg text-slate-800">
                    <div className="flex items-center gap-2">
                      <Sigma className="h-5 w-5"/>
                      TOTAL GERAL
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold font-mono text-lg text-green-700">
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