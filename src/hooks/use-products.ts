import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { productService } from "@/services/product.service"
import { Product } from "@/types"
import { useEffect } from "react"

export function useProducts() {
  const queryClient = useQueryClient()

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: productService.getProducts,
  })

  // Escuchar evento personalizado para recargar productos
  useEffect(() => {
    const handleRefresh = () => {
        productsQuery.refetch()
    }
    window.addEventListener('refresh-products', handleRefresh)
    // También escuchar cambios en storage para sincronización entre pestañas
    window.addEventListener('storage', handleRefresh)
    
    return () => {
        window.removeEventListener('refresh-products', handleRefresh)
        window.removeEventListener('storage', handleRefresh)
    }
  }, [productsQuery])

  const createProductMutation = useMutation({
    mutationFn: productService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })

  const deleteProductMutation = useMutation({
    mutationFn: productService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })

  return {
    products: productsQuery.data ?? [],
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    createProduct: createProductMutation.mutateAsync,
    deleteProduct: deleteProductMutation.mutateAsync,
  }
}
