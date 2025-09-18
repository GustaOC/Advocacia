"use client"

import * as XLSX from 'xlsx'

export function EntitiesModule() {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]

        if (sheetName) {
          const worksheet = workbook.Sheets[sheetName]
          // ✅ CORREÇÃO: Adicionada verificação para garantir que 'worksheet' não é undefined.
          if (worksheet) {
            const json = XLSX.utils.sheet_to_json(worksheet)
            console.log("Dados da planilha importada:", json)
            // Aqui você pode adicionar a lógica para enviar os dados para a sua API.
          } else {
            console.error("A planilha encontrada está vazia ou corrompida.");
          }
        } else {
          console.error("Nenhuma planilha encontrada no arquivo Excel.");
        }
      }
      reader.readAsBinaryString(file)
    }
  }

  return (
    <div>
      <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
    </div>
  )
}