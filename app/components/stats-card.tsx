import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: number
  icon: LucideIcon
  color?: string
}

export function StatsCard({ title, value, icon: Icon, color = "chart-1" }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          </div>
          <Icon className={`h-8 w-8 text-${color}`} style={{ color: `hsl(var(--${color}))` }} />
        </div>
      </CardContent>
    </Card>
  )
}
