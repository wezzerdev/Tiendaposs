import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { employeeService } from "@/services/employee.service"
import { Profile } from "@/types"

export function useEmployees() {
  const queryClient = useQueryClient()

  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: employeeService.getEmployees,
  })

  const createEmployeeMutation = useMutation({
    mutationFn: employeeService.createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
    },
  })

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Profile> }) =>
      employeeService.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
    },
  })

  const updatePinMutation = useMutation({
    mutationFn: ({ id, pin }: { id: string; pin: string }) =>
      employeeService.updatePin(id, pin),
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      employeeService.toggleStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
    },
  })

  const deleteEmployeeMutation = useMutation({
    mutationFn: (id: string) => employeeService.deleteEmployee(id),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["employees"] })
    }
  })

  return {
    employees: employeesQuery.data ?? [],
    isLoading: employeesQuery.isLoading,
    isError: employeesQuery.isError,
    createEmployee: createEmployeeMutation.mutateAsync,
    updateEmployee: updateEmployeeMutation.mutateAsync,
    updatePin: updatePinMutation.mutateAsync,
    toggleStatus: toggleStatusMutation.mutateAsync,
    deleteEmployee: deleteEmployeeMutation.mutateAsync,
  }
}
