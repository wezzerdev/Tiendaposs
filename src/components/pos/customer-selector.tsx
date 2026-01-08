
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useCustomers } from "@/hooks/use-customers"
import { Customer } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface CustomerSelectorProps {
  selectedCustomer: Customer | null
  onSelectCustomer: (customer: Customer | null) => void
}

export function CustomerSelector({ selectedCustomer, onSelectCustomer }: CustomerSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const { customers, createCustomer, isCreating } = useCustomers()
  const [isNewCustomerOpen, setIsNewCustomerOpen] = React.useState(false)
  
  // Form state for new customer
  const [newCustomerName, setNewCustomerName] = React.useState("")
  const [newCustomerEmail, setNewCustomerEmail] = React.useState("")
  const [newCustomerPhone, setNewCustomerPhone] = React.useState("")

  const handleCreateCustomer = async () => {
    if (!newCustomerName) return
    
    try {
      const newCustomer = await createCustomer({
        name: newCustomerName,
        email: newCustomerEmail,
        phone: newCustomerPhone
      })
      onSelectCustomer(newCustomer)
      setIsNewCustomerOpen(false)
      setOpen(false)
      // Reset form
      setNewCustomerName("")
      setNewCustomerEmail("")
      setNewCustomerPhone("")
    } catch (error) {
       // Error handled in hook
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[250px] justify-between"
          >
            {selectedCustomer ? (
                <div className="flex items-center gap-2 overflow-hidden">
                    <User className="h-4 w-4 shrink-0" />
                    <span className="truncate">{selectedCustomer.name}</span>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4 shrink-0" />
                    Seleccionar cliente...
                </div>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0">
          <Command>
            <CommandInput placeholder="Buscar cliente..." />
            <CommandList>
              <CommandEmpty>
                <div className="p-2 text-sm text-center text-muted-foreground">
                    No encontrado. 
                    <Button 
                        variant="link" 
                        className="h-auto p-0 ml-1"
                        onClick={() => setIsNewCustomerOpen(true)}
                    >
                        Crear nuevo
                    </Button>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.name}
                    onSelect={() => {
                      onSelectCustomer(customer)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                        <span>{customer.name}</span>
                        {customer.phone && <span className="text-xs text-muted-foreground">{customer.phone}</span>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Dialogo Nuevo Cliente */}
      <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Nuevo Cliente</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input id="name" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email (Opcional)</Label>
                    <Input id="email" type="email" value={newCustomerEmail} onChange={e => setNewCustomerEmail(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="phone">Teléfono (Opcional)</Label>
                    <Input id="phone" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewCustomerOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateCustomer} disabled={!newCustomerName || isCreating}>
                    {isCreating ? "Creando..." : "Crear Cliente"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
