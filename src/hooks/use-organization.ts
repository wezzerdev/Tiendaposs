import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { organizationService } from "@/services/organization.service"
import { toast } from "sonner"

export function useOrganization() {
  const queryClient = useQueryClient()

  const orgQuery = useQuery({
    queryKey: ["organization"],
    queryFn: organizationService.getOrganization,
  })

  const updateMutation = useMutation({
    mutationFn: organizationService.updateOrganization,
    onSuccess: (updatedOrg) => {
      queryClient.setQueryData(["organization"], updatedOrg)
      toast.success("Información actualizada correctamente")
    },
    onError: (error) => {
        console.error(error)
        const msg = error instanceof Error ? error.message : "Error al actualizar la información"
        toast.error(msg)
    }
  })

  return {
    organization: orgQuery.data,
    isLoading: orgQuery.isLoading,
    updateOrganization: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending
  }
}
