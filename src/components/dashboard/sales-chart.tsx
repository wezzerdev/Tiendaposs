"use client"

import { TrendingUp, Loader2 } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { useDashboardStats } from "@/hooks/use-dashboard"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  sales: {
    label: "Ventas",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function SalesChart() {
  const { chartData, isLoadingChart } = useDashboardStats()

  if (isLoadingChart || !chartData) {
      return (
        <Card className="flex flex-col items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </Card>
      )
  }

  // Calcular tendencia (comparando último mes con el anterior)
  const currentMonthSales = chartData[chartData.length - 1]?.sales || 0
  const prevMonthSales = chartData[chartData.length - 2]?.sales || 0
  const trend = prevMonthSales > 0 
    ? ((currentMonthSales - prevMonthSales) / prevMonthSales) * 100 
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas Mensuales</CardTitle>
        <CardDescription>Últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="sales" fill="var(--color-sales)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {trend >= 0 ? 'Tendencia al alza' : 'Tendencia a la baja'} del {Math.abs(trend).toFixed(1)}% este mes <TrendingUp className={`h-4 w-4 ${trend < 0 ? 'rotate-180 text-destructive' : 'text-green-500'}`} />
        </div>
        <div className="leading-none text-muted-foreground">
          Mostrando ventas totales de los últimos 6 meses
        </div>
      </CardFooter>
    </Card>
  )
}
