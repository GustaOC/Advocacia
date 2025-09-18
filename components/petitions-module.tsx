import { ApiClient } from '@/lib/api-client'

export function PetitionsModule() {
  const apiClient = new ApiClient()

  const getPetitions = async () => {
    await apiClient.getPetitions()
  }

  return (
    <div>
      <button onClick={getPetitions}>Get Petitions</button>
    </div>
  )
}