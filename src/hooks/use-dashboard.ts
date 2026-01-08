import { useQuery } from "@tanstack/react-query"
import { dashboardService } from "@/services/dashboard.service"

export function useDashboardStats() {
  const statsQuery = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardService.getStats,
  })

  const chartQuery = useQuery({
      queryKey: ["sales-chart"],
      queryFn: dashboardService.getSalesChartData,
  })

  return {
    stats: statsQuery.data,
    isLoading: statsQuery.isLoading,
    isError: statsQuery.isError,
    chartData: chartQuery.data,
    isLoadingChart: chartQuery.isLoading
  }
}
