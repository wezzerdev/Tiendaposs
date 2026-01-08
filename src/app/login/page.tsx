"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import Link from "next/link"

const formSchema = z.object({
  email: z.string().email({
    message: "Ingresa un correo válido.",
  }),
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres.",
  }),
  fullName: z.string().optional(), // Para registro
})

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
    },
  })

  async function onLogin(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
            throw new Error("Credenciales incorrectas. Por favor verifica tu correo y contraseña.")
        }
        throw error
      }

      toast.success("Sesión iniciada correctamente")
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión"
      setError(message)
      toast.error("Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  async function onRegister(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const { error, data } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
            data: {
                full_name: values.fullName,
                avatar_url: `https://ui-avatars.com/api/?name=${values.fullName}&background=random`
            },
            emailRedirectTo: `${location.origin}/auth/callback`
        }
      })

      if (error) throw error

      if (data.session) {
          toast.success("Cuenta creada exitosamente. ¡Bienvenido!")
          router.push("/dashboard")
          router.refresh()
      } else if (data.user) {
          setSuccessMessage("Hemos enviado un enlace de confirmación a tu correo electrónico. Por favor verifica tu cuenta para continuar.")
          toast.success("Registro exitoso. Verifica tu correo.")
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al registrarse"
      setError(message)
      toast.error("Error al registrarse")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-2xl">
            TP
          </div>
          <CardTitle className="text-2xl">TiendaPOS</CardTitle>
          <CardDescription>
            Plataforma integral de gestión omnicanal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onLogin)} className="space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <p>{error}</p>
                        </div>
                    )}
                    
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Correo Electrónico</FormLabel>
                            <FormControl>
                            <Input placeholder="admin@tienda.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                                <FormLabel>Contraseña</FormLabel>
                                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                            <FormControl>
                            <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...</> : "Iniciar Sesión"}
                    </Button>
                    </form>
                </Form>
            </TabsContent>

            <TabsContent value="register">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onRegister)} className="space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <p>{error}</p>
                        </div>
                    )}

                    {successMessage && (
                        <div className="flex items-center gap-2 rounded-md bg-green-500/15 p-3 text-sm text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <p>{successMessage}</p>
                        </div>
                    )}
                    
                    <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre Completo</FormLabel>
                            <FormControl>
                            <Input placeholder="Juan Pérez" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Correo Electrónico</FormLabel>
                            <FormControl>
                            <Input placeholder="tu@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contraseña</FormLabel>
                            <FormControl>
                            <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando...</> : "Crear Cuenta"}
                    </Button>
                    </form>
                </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
