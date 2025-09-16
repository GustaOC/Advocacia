"use client"

import { useEffect } from "react"

export function NotificationScheduler() {
  useEffect(() => {
    const checkDeadlines = async () => {
      try {
        // This would typically be handled by a backend cron job
        // For demo purposes, we'll simulate the logic here
        console.log("[v0] Checking for upcoming deadlines...")

        // In a real implementation, this would
        // 1. Query petitions with deadlines in the next 3 days
        // 2. Create notifications for assigned lawyers
        // 3. Send email notifications if enabled

        const response = await fetch("/api/petitions?status=pending,under_review")
        if (response.ok) {
          const { petitions } = await response.json()

          const today = new Date()
          const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)

          const upcomingDeadlines =
            petitions?.filter((petition: any) => {
              const deadline = new Date(petition.deadline)
              return deadline <= threeDaysFromNow && deadline >= today
            }) || []

          for (const petition of upcomingDeadlines) {
            const daysUntilDeadline = Math.ceil(
              (new Date(petition.deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            )

            await fetch("/api/notifications", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                user_id: petition.assigned_to,
                title: "Lembrete: Prazo Próximo",
                message: `Lembrete: Petição '${petition.title}' com prazo para ${new Date(petition.deadline).toLocaleDateString("pt-BR")} (${daysUntilDeadline} dias)`,
                type: daysUntilDeadline <= 1 ? "error" : "warning",
                related_petition_id: petition.id,
              }),
            })
          }
        }
      } catch (error) {
        console.error("Error checking deadlines:", error)
      }
    }

    checkDeadlines()
    const interval = setInterval(checkDeadlines, 60 * 60 * 1000) // Every hour

    return () => clearInterval(interval)
  }, [])

  // This component doesn't render anything visible
  return null
}
