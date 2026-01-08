
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStoreAuth } from "@/hooks/use-store-auth"
import { customerService } from "@/services/customer.service"
import { toast } from "sonner"
import { User } from "lucide-react"

export function StoreAuthDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const { customer, login, logout } = useStoreAuth()
  
  // Login State
  const [loginEmail, setLoginEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Register State
  const [regName, setRegName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPhone, setRegPhone] = useState("")

  const handleLogin = async () => {
    setIsLoading(true)
    try {
        const customers = await customerService.getCustomers()
        const found = customers.find(c => c.email?.toLowerCase() === loginEmail.toLowerCase())
        
        if (found) {
            login(found)
            setIsOpen(false)
            toast.success(`Bienvenido de nuevo, ${found.name}`)
        } else {
            toast.error("No encontramos una cuenta con este correo.")
        }
    } catch (error) {
        toast.error("Error al iniciar sesión")
    } finally {
        setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    setIsLoading(true)
    try {
        // Validar si ya existe
        const customers = await customerService.getCustomers()
        if (customers.some(c => c.email?.toLowerCase() === regEmail.toLowerCase())) {
            toast.error("Este correo ya está registrado.")
            return
        }

        const newCustomer = await customerService.createCustomer({
            name: regName,
            email: regEmail,
            phone: regPhone,
        } as any)
        
        login(newCustomer)
        setIsOpen(false)
        toast.success("Cuenta creada exitosamente")
    } catch (error) {
        toast.error("Error al crear cuenta")
    } finally {
        setIsLoading(false)
    }
  }

  if (customer) {
      return (
          <div className="flex items-center gap-2">
              <span className="text-sm font-medium hidden sm:inline-block">Hola, {customer.name}</span>
              <Button variant="ghost" size="sm" onClick={logout}>Salir</Button>
          </div>
      )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mi Cuenta</DialogTitle>
          <DialogDescription>
            Accede a tu historial de pedidos y agiliza tus compras.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="register">Registrarse</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="tu@email.com" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleLogin} disabled={!loginEmail || isLoading}>
                {isLoading ? "Verificando..." : "Entrar"}
            </Button>
          </TabsContent>
          
          <TabsContent value="register" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input 
                id="name" 
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Correo Electrónico</Label>
              <Input 
                id="reg-email" 
                type="email" 
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono (Opcional)</Label>
              <Input 
                id="phone" 
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleRegister} disabled={!regName || !regEmail || isLoading}>
                {isLoading ? "Creando..." : "Crear Cuenta"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
