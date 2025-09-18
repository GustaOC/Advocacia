import { useState } from 'react'
import { ApiClient } from '@/lib/api-client'

export function CreatePetition() {
  const [file, setFile] = useState<File>()
  const apiClient = new ApiClient()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (file) {
      const files: File[] = [file]
      // await apiClient.createPetition(files)
    }
  }

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  )
}