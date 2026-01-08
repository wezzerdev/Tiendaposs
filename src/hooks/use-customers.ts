
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { customerService } from "@/services/customer.service"
import { Customer } from "@/types"
import { toast } from "sonner"

export function useCustomers() {
  const queryClient = useQueryClient()

  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getCustomers,
  })

  const createCustomerMutation = useMutation({
    mutationFn: customerService.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success("Cliente creado correctamente")
    },
    onError: (error) => {
      toast.error("Error al crear cliente")
      console.error(error)
    }
  })

  return {
    customers,
    isLoading,
    error,
    createCustomer: createCustomerMutation.mutateAsync,
    isCreating: createCustomerMutation.isPending
  }
}
