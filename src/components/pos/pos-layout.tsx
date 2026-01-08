"use client"

import { useState, useMemo, useEffect } from "react"
import { Product, Customer } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, ShoppingCart, Trash2, CreditCard, Banknote, User, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { CheckoutDialog, ReceiptDialog } from "./checkout-dialog"
import { useProducts } from "@/hooks/use-products"
import { useSales } from "@/hooks/use-sales"
import { CustomerSelector } from "./customer-selector"
import { useRealTimeStock } from "@/hooks/use-real-time-stock"

import { toast } from "sonner"

type CartItem = Product & { quantity: number }

export function POSLayout() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const { products, isLoading } = useProducts()
  const { createSale } = useSales()
  const { getAvailableStock, notifyChange } = useRealTimeStock()

  // Sincronizar carrito del POS con localStorage para que useRealTimeStock lo lea
  useEffect(() => {
    localStorage.setItem('pos-cart', JSON.stringify(cart))
    notifyChange()
  }, [cart])

  const addToCart = (product: Product) => {
    // Validar stock en tiempo real
    if (product.manage_stock) {
        const available = getAvailableStock(product)
        
        if (available <= 0) {
            toast.error(`Stock insuficiente. Alguien más tiene este producto en su carrito o se agotó.`)
            return
        }
    }

    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === product.id)
      if (existingItem) {
        return currentCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        )
      }
      return [...currentCart, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(currentCart => currentCart.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(currentCart => {
      return currentCart.map(item => {
        if (item.id === productId) {
          // Validar stock al incrementar
          if (delta > 0 && item.manage_stock) {
             const available = getAvailableStock(item) // Esto retorna lo disponible "extra"
             if (available <= 0) {
                 toast.error(`Stock insuficiente. No hay más unidades disponibles.`)
                 return item
             }
          }

          const newQuantity = Math.max(1, item.quantity + delta)
          return { ...item, quantity: newQuantity }
        }
        return item
      })
    })
  }

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const tax = subtotal * 0.16 // IVA 16% ejemplo
  const total = subtotal + tax

  const handlePaymentSuccess = async () => {
    // Registrar la venta usando el servicio
    await createSale({
        total: total,
        payment_method: 'cash', // Simplificado por ahora, idealmente vendría del diálogo
        status: 'completed',
        customer_id: selectedCustomer?.id,
        customer_name: selectedCustomer?.name,
        items: cart.map(item => ({
            id: crypto.randomUUID(),
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
        }))
    })

    setIsCheckoutOpen(false)
    setIsReceiptOpen(true)
    toast.success("Venta registrada correctamente", {
        description: `Total: ${new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(total)}`
    })
  }

  const handleNewSale = () => {
    setIsReceiptOpen(false)
    setCart([])
    setSelectedCustomer(null) // Resetear cliente también
  }

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const term = searchTerm.toLowerCase()
      const matchesSearch = 
        product.name.toLowerCase().includes(term) || 
        product.sku?.toLowerCase().includes(term) ||
        product.barcode?.includes(term)

      const matchesCategory = selectedCategory ? product.category === selectedCategory : true
      return matchesSearch && matchesCategory
    })
  }, [products, searchTerm, selectedCategory])

  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[]
  }, [products])

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row gap-4 p-4 overflow-hidden">
      
      {/* Columna Izquierda: Grid de Productos */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        {/* Barra de Búsqueda y Filtros */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar producto..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            <Button 
              variant={selectedCategory === null ? "default" : "outline"} 
              onClick={() => setSelectedCategory(null)}
              size="sm"
            >
              Todos
            </Button>
            {categories.map(cat => (
              <Button 
                key={cat} 
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
                size="sm"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
                {filteredProducts.map((product) => {
                    // Calcular stock real disponible usando el hook global
                    const availableStock = getAvailableStock(product)
                    
                    return (
                    <Card 
                        key={product.id} 
                        className="cursor-pointer hover:border-primary transition-colors active:scale-95 duration-100"
                        onClick={() => addToCart(product)}
                    >
                        <CardContent className="p-4 flex flex-col gap-2 h-full justify-between">
                        <div className="aspect-square bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs relative overflow-hidden">
                            {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="object-cover w-full h-full" />
                            ) : (
                            "IMG"
                            )}
                            {product.manage_stock && (
                            <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white
                                ${availableStock > 10 ? 'bg-green-500' : availableStock > 0 ? 'bg-yellow-500' : 'bg-red-500'}
                            `}>
                                Stock: {availableStock}
                            </div>
                            )}
                        </div>
                        <div>
                            <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                            <div className="flex justify-between items-center">
                                <p className="font-bold text-primary">
                                {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(product.price)}
                                </p>
                                {product.sku && <span className="text-[10px] text-muted-foreground">{product.sku}</span>}
                            </div>
                        </div>
                        </CardContent>
                    </Card>
                    )
                })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Columna Derecha: Carrito / Ticket */}
      <div className="w-full md:w-96 flex flex-col bg-card border rounded-xl shadow-sm overflow-hidden h-full">
        {/* Header del Ticket */}
        <div className="p-4 border-b flex flex-col gap-3 bg-muted/30">
          <div className="flex items-center justify-between gap-2">
             <CustomerSelector 
                selectedCustomer={selectedCustomer} 
                onSelectCustomer={setSelectedCustomer} 
             />
             <Badge variant="outline" className="font-mono whitespace-nowrap">TICKET #001</Badge>
          </div>
          
          {cart.length > 0 && (
            <div className="flex justify-end animate-in fade-in slide-in-from-top-1 duration-200">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setCart([])}
                >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Vaciar carrito
                </Button>
            </div>
          )}
        </div>

        {/* Lista de Items */}
        <ScrollArea className="flex-1 p-4">
          <div className="flex flex-col gap-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                <ShoppingCart className="h-8 w-8 opacity-20" />
                <p>Carrito vacío</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex gap-3 items-start group">
                   <div className="flex-1">
                     <div className="flex justify-between items-start">
                        <span className="font-medium text-sm">{item.name}</span>
                        <span className="font-bold text-sm">
                          {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(item.price * item.quantity)}
                        </span>
                     </div>
                     <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center border rounded-md h-7">
                          <button 
                            className="px-2 hover:bg-muted text-sm"
                            onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}
                          >-</button>
                          <span className="w-8 text-center text-xs font-mono">{item.quantity}</span>
                          <button 
                            className="px-2 hover:bg-muted text-sm"
                            onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}
                          >+</button>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          x {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(item.price)}
                        </span>
                     </div>
                   </div>
                   <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                   >
                     <Trash2 className="h-3 w-3" />
                   </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Totales y Botones de Pago */}
        <div className="p-4 border-t bg-muted/10 space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>IVA (16%)</span>
              <span>{new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button 
                variant="outline" 
                className="w-full gap-2" 
                disabled={cart.length === 0}
                onClick={() => setIsCheckoutOpen(true)}
            >
              <CreditCard className="h-4 w-4" />
              Tarjeta
            </Button>
            <Button 
                className="w-full gap-2" 
                disabled={cart.length === 0}
                onClick={() => setIsCheckoutOpen(true)}
            >
              <Banknote className="h-4 w-4" />
              Efectivo
            </Button>
          </div>
        </div>
      </div>
      
      <CheckoutDialog 
        open={isCheckoutOpen} 
        onOpenChange={setIsCheckoutOpen}
        total={total}
        onConfirm={handlePaymentSuccess}
      />
      
      <ReceiptDialog 
        open={isReceiptOpen}
        onOpenChange={handleNewSale}
        total={total}
        cart={cart}
      />
    </div>
  )
}
