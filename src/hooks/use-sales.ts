import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { salesService } from "@/services/sales.service"
import { Sale } from "@/services/sales.service"

export function useSales() {
  const queryClient = useQueryClient()

  const salesQuery = useQuery({
    queryKey: ["sales"],
    queryFn: salesService.getSales,
  })

  const createSaleMutation = useMutation({
    mutationFn: salesService.createSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] })
    },
  })

  return {
    sales: salesQuery.data ?? [],
    isLoading: salesQuery.isLoading,
    isError: salesQuery.isError,
    createSale: createSaleMutation.mutateAsync,
  }
}
