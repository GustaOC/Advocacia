// scripts/filtra-processos-excel.js
// Gera uma cópia do Excel mantendo apenas as linhas que passariam na importação
// Uso: node scripts/filtra-processos-excel.js "c:/caminho/PROCESSOS-FINAL-CORRETO.xlsx" [urlBase]
// urlBase padrão: http://localhost:3000

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

async function main() {
  const file = process.argv[2];
  const baseUrl = process.argv[3] || 'http://localhost:3000';
  if (!file) {
    console.error('Informe o caminho do arquivo .xlsx');
    process.exit(1);
  }

  // 1) Carrega entidades do sistema
  const entRes = await fetch(`${baseUrl}/api/entities`);
  if (!entRes.ok) {
    console.error(`Falha ao buscar entidades em ${baseUrl}/api/entities (HTTP ${entRes.status})`);
    process.exit(2);
  }
  const entitiesPayload = await entRes.json();
  const entities = entitiesPayload?.entities || entitiesPayload?.data || entitiesPayload || [];
  const norm = (s) => (typeof s === 'string' ? s : '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  const entitySet = new Set(entities.map(e => norm(e.name || '')));

  // 2) Lê planilha
  const wb = XLSX.readFile(file);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws);

  // 3) Filtra linhas que teriam Cliente/Executado válidos
  const ok = [];
  const bad = [];
  for (const row of rows) {
    const cli = norm(row['Cliente']);
    const exe = norm(row['Executado']);
    if (entitySet.has(cli) && entitySet.has(exe)) ok.push(row); else bad.push(row);
  }

  // 4) Normaliza Prioridade textual para evitar rejeição por acento
  for (const r of ok) {
    const p = norm(r['Prioridade']);
    if (p === 'alta') r['Prioridade'] = 'Alta';
    else if (p === 'baixa') r['Prioridade'] = 'Baixa';
    else r['Prioridade'] = 'Média';
  }

  // 5) Grava arquivo limpo ao lado do original
  const outName = path.join(path.dirname(file), path.basename(file).replace(/\.xlsx$/i, '') + '-LIMPO.xlsx');
  const newWb = XLSX.utils.book_new();
  const newWs = XLSX.utils.json_to_sheet(ok);
  XLSX.utils.book_append_sheet(newWb, newWs, 'Processos');
  XLSX.writeFile(newWb, outName);

  console.log(`Linhas totais: ${rows.length} | Válidas: ${ok.length} | Removidas: ${bad.length}`);
  console.log(`Arquivo gerado: ${outName}`);
}

main().catch(err => { console.error(err); process.exit(99); });

