import { useState } from 'react'

interface RenegotiationData {
  newFirstDueDate: string
}

export function FinancialRenegotiationModal() {
  const [renegotiationData, setRenegotiationData] = useState<RenegotiationData>({
    newFirstDueDate: '',
  })

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setRenegotiationData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  return (
    <div>
      <input
        type="date"
        name="newFirstDueDate"
        value={renegotiationData.newFirstDueDate}
        onChange={handleChange}
      />
    </div>
  )
}