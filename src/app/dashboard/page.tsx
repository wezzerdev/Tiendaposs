"use client"

import { SalesChart } from "@/components/dashboard/sales-chart"
import { useDashboardStats } from "@/hooks/use-dashboard"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { stats, isLoading } = useDashboardStats()

  if (isLoading || !stats) {
      return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <h3 className="font-semibold mb-2">Ventas del Día</h3>
          <div className="text-3xl font-bold text-primary">
            {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(stats.totalSales)}
          </div>
        </div>
        <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <h3 className="font-semibold mb-2">Pedidos Pendientes</h3>
          <div className="text-3xl font-bold">{stats.pendingOrders}</div>
        </div>
        <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <h3 className="font-semibold mb-2">Alertas de Stock</h3>
          <div className="text-3xl font-bold text-destructive">{stats.lowStock}</div>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <SalesChart />
        </div>
        <div className="col-span-3 rounded-xl bg-muted/50 p-4">
          <h3 className="font-semibold mb-4">Actividad Reciente</h3>
          <ul className="space-y-4">
            {stats.recentActivity.map((activity) => (
                <li key={activity.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                    <div>
                        <span className="font-medium block">{activity.description}</span>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                    {activity.amount && (
                        <span className="font-bold">
                            {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(activity.amount)}
                        </span>
                    )}
                </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
