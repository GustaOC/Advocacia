import { CheckCircle } from 'lucide-react'

export function ReviewPetition() {
  const getStatusInfo = () => {
    return {
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50 border-green-200",
      title: "Petição será aprovada",
      description: "A petição será marcada como aprovada e estará pronta para uso."
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className={statusInfo.bg}>
      <statusInfo.icon className={statusInfo.color} />
      <h3>{statusInfo.title}</h3>
      <p>{statusInfo.description}</p>
    </div>
  )
}