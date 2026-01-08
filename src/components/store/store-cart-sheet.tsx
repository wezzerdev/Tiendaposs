
"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useStoreCart } from "@/hooks/use-store-cart"
import { ShoppingCart, Trash2, Plus, Minus, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import { useStoreAuth } from "@/hooks/use-store-auth"
import { salesService } from "@/services/sales.service"
import { toast } from "sonner"

export function StoreCartSheet() {
  const { items, removeItem, updateQuantity, total, clearCart } = useStoreCart()
  const { customer } = useStoreAuth()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleCheckout = async () => {
    if (!customer) {
        toast.error("Por favor inicia sesión para completar tu compra.")
        return
    }

    setIsCheckingOut(true)
    try {
        await salesService.createSale({
            total: total,
            payment_method: 'card', // Simulado
            status: 'completed',
            customer_id: customer.id,
            customer_name: customer.name,
            items: items.map(item => ({
                id: crypto.randomUUID(),
                product_id: item.id,
                product_name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity
            }))
        })
        
        clearCart()
        setIsOpen(false)
        toast.success("¡Pedido realizado con éxito!", {
            description: "Gracias por tu compra."
        })
        
        // Forzar actualización de inventario en otras pestañas
        window.dispatchEvent(new Event('storage'))
        
    } catch (error) {
        toast.error("Hubo un error al procesar tu pedido.")
    } finally {
        setIsCheckingOut(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {items.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                    {items.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
            )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Tu Carrito</SheetTitle>
          <SheetDescription>
            Revisa tus productos antes de finalizar la compra.
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-1 -mx-6 px-6 my-4">
            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <ShoppingCart className="h-10 w-10 mb-2 opacity-20" />
                    <p>Tu carrito está vacío</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {items.map((item) => (
                        <div key={item.id} className="flex gap-4">
                            <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center text-xs overflow-hidden shrink-0">
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                                ) : "IMG"}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                                <p className="text-sm font-bold text-primary">
                                    {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(item.price)}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="flex items-center border rounded-md h-7">
                                        <button 
                                            className="px-2 hover:bg-muted h-full flex items-center"
                                            onClick={() => updateQuantity(item.id, -1)}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="w-8 text-center text-xs">{item.quantity}</span>
                                        <button 
                                            className="px-2 hover:bg-muted h-full flex items-center"
                                            onClick={() => updateQuantity(item.id, 1)}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeItem(item.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ScrollArea>

        <div className="space-y-4 pt-4 border-t">
            <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(total)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                    <span>Total</span>
                    <span>{new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(total)}</span>
                </div>
            </div>
            
            {!customer && items.length > 0 && (
                <div className="bg-yellow-500/10 text-yellow-600 text-xs p-2 rounded-md border border-yellow-500/20">
                    Debes iniciar sesión para completar tu compra.
                </div>
            )}

            <SheetFooter>
                <Button 
                    className="w-full" 
                    disabled={items.length === 0 || !customer || isCheckingOut}
                    onClick={handleCheckout}
                >
                    {isCheckingOut ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</> : "Pagar Ahora"}
                </Button>
            </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
