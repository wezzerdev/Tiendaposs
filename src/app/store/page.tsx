"use client"

import { useProducts } from "@/hooks/use-products"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useStoreConfig } from "@/hooks/use-store-config"
import { useStoreCart } from "@/hooks/use-store-cart"
import { StoreAuthDialog } from "@/components/store/store-auth-dialog"
import { StoreCartSheet } from "@/components/store/store-cart-sheet"
import { toast } from "sonner"
import { useRealTimeStock } from "@/hooks/use-real-time-stock"
import { useEffect } from "react"

export default function StorePage() {
  const { products, isLoading: isLoadingProducts } = useProducts()
  const { config: storeConfig, isLoaded: isConfigLoaded } = useStoreConfig()
  const { addItem, items: cartItems } = useStoreCart()
  const { getAvailableStock, notifyChange } = useRealTimeStock()

  // Sincronizar carrito de la tienda con localStorage para que useRealTimeStock lo lea
  useEffect(() => {
    // Zustand ya persiste, pero necesitamos notificar el cambio manual para reactividad inmediata
    notifyChange()
  }, [cartItems]) // Escuchar cambios en el carrito

  // Refrescar productos cuando cambie el storage (ej. después de una venta)
  useEffect(() => {
    const handleStorage = () => {
        // Invalidar query de productos para obtener el stock actualizado de la "BD"
        window.dispatchEvent(new Event('refresh-products'))
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  if (isLoadingProducts || !isConfigLoaded) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  if (!storeConfig.isActive) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
            <h1 className="text-3xl font-bold mb-2">{storeConfig.name}</h1>
            <p className="text-muted-foreground">Estamos en mantenimiento. Vuelve pronto.</p>
            <Button variant="link" className="mt-4" asChild>
                <Link href="/login">Soy el administrador</Link>
            </Button>
        </div>
    )
  }

  const handleAddToCart = (product: any, availableStock: number) => {
    if (availableStock <= 0) {
        toast.error("Producto agotado o reservado por otro cliente.")
        return
    }
    addItem(product)
    toast.success("Producto agregado al carrito")
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xl">
                <ShoppingBag className="h-6 w-6 text-primary" />
                <span>{storeConfig.name}</span>
            </div>
            <div className="flex items-center gap-4">
                <StoreAuthDialog />
                <StoreCartSheet />
                <Button asChild variant="default" size="sm">
                    <Link href="/login">Acceso Admin</Link>
                </Button>
            </div>
        </div>
        {storeConfig.bannerText && (
            <div className="bg-primary text-primary-foreground text-center text-xs py-1 px-4 font-medium">
                {storeConfig.bannerText}
            </div>
        )}
      </header>

      {/* Hero Section (Simple) */}
      <section className="bg-background py-12 md:py-20 border-b">
        <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
                Catálogo de Productos
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explora nuestra selección de productos de alta calidad. Encuentra lo que buscas al mejor precio.
            </p>
        </div>
      </section>

      {/* Product Grid */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
                const availableStock = getAvailableStock(product)

                return (
                <Card key={product.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="aspect-square bg-muted flex items-center justify-center relative">
                        {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="object-cover w-full h-full" />
                        ) : (
                            <span className="text-muted-foreground text-4xl font-light">IMG</span>
                        )}
                        {product.category && (
                            <Badge className="absolute top-2 left-2" variant="secondary">
                                {product.category}
                            </Badge>
                        )}
                        {product.manage_stock && (
                            <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold text-white shadow-sm
                                ${availableStock > 10 ? 'bg-green-500' : availableStock > 0 ? 'bg-yellow-500' : 'bg-red-500'}
                            `}>
                                Stock: {availableStock}
                            </div>
                        )}
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="line-clamp-1 text-lg">{product.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description || "Sin descripción disponible."}
                        </p>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between border-t p-4 bg-muted/5">
                        <div className="font-bold text-xl text-primary">
                            {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(product.price)}
                        </div>
                        <Button 
                            size="sm" 
                            onClick={() => handleAddToCart(product, availableStock)}
                            disabled={product.manage_stock && availableStock <= 0}
                        >
                            {product.manage_stock && availableStock <= 0 ? "Agotado" : "Agregar"}
                        </Button>
                    </CardFooter>
                </Card>
            )})}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} {storeConfig.name}. Todos los derechos reservados.</p>
            <p className="mt-2 text-xs">Powered by TiendaPOS</p>
        </div>
      </footer>
    </div>
  )
}
