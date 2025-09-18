"use client"
import { useSearchParams } from 'next/navigation'
import { ApiClient } from '@/lib/api-client'

export default function UpdatePasswordPage() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const apiClient = new ApiClient()

  const handlePasswordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const password = new FormData(event.currentTarget).get('password') as string;
    if (code) {
        await apiClient.setPassword({ code, password })
    }
  }

  return (
    <form onSubmit={handlePasswordUpdate}>
      <input type="password" name="password" />
      <button type="submit">Update Password</button>
    </form>
  )
}