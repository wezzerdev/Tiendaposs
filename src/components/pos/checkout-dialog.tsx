"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Printer, Receipt } from "lucide-react"

interface CheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  total: number
  onConfirm: () => void
}

export function CheckoutDialog({ open, onOpenChange, total, onConfirm }: CheckoutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Pago</DialogTitle>
          <DialogDescription>
            Selecciona el método de pago para procesar la venta.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <div className="text-center">
             <p className="text-sm text-muted-foreground">Total a Pagar</p>
             <p className="text-4xl font-bold text-primary">
                {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(total)}
             </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Button size="lg" className="h-24 flex flex-col gap-2" onClick={onConfirm}>
                <span className="text-2xl">💵</span>
                Efectivo
            </Button>
            <Button size="lg" variant="outline" className="h-24 flex flex-col gap-2" onClick={onConfirm}>
                <span className="text-2xl">💳</span>
                Tarjeta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { useOrganization } from "@/hooks/use-organization"
import { Product } from "@/types"

interface ReceiptDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    total: number
    cart: (Product & { quantity: number })[]
}

export function ReceiptDialog({ open, onOpenChange, total, cart }: ReceiptDialogProps) {
    const { organization } = useOrganization()
    const now = new Date()

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm text-center">
          <div className="flex flex-col items-center justify-center gap-4 py-6">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            
            {/* Ticket Preview */}
            <div className="bg-white text-black p-4 rounded shadow-sm w-full font-mono text-left text-xs space-y-2 border">
                <div className="text-center border-b pb-2 mb-2">
                    <h3 className="font-bold text-lg">{organization?.name || "Tienda Demo"}</h3>
                    <p>{organization?.address || "Dirección no configurada"}</p>
                    <p>{organization?.phone || ""}</p>
                    <p>{now.toLocaleDateString()} {now.toLocaleTimeString()}</p>
                </div>
                
                <div className="space-y-1">
                    {cart.map((item, i) => (
                        <div key={i} className="flex justify-between">
                            <span>{item.quantity} x {item.name.slice(0, 15)}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-sm">
                    <span>TOTAL</span>
                    <span>{new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(total)}</span>
                </div>
                
                <div className="text-center pt-2 text-[10px]">
                    <p>¡Gracias por su compra!</p>
                </div>
            </div>

            <div className="flex gap-2 w-full">
                <Button className="flex-1" variant="outline" onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" /> Imprimir
                </Button>
                <Button className="flex-1" onClick={() => onOpenChange(false)}>
                    <Receipt className="mr-2 h-4 w-4" /> Nuevo Ticket
                </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
}
