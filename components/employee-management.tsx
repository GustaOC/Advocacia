import { ApiClient } from '@/lib/api-client'

export function EmployeeManagement() {
  const apiClient = new ApiClient()

  const createEmployee = async () => {
    await apiClient.createEmployee({ name: 'New Employee', email: 'employee@example.com', role_id: 1 })
  }

  const updateEmployee = async () => {
    await apiClient.updateEmployee(1, { name: 'Updated Employee' })
  }

  const deleteEmployee = async () => {
    await apiClient.deleteEmployee(1)
  }

  return (
    <div>
      <button onClick={createEmployee}>Create Employee</button>
      <button onClick={updateEmployee}>Update Employee</button>
      <button onClick={deleteEmployee}>Delete Employee</button>
    </div>
  )
}