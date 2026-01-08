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
import { AlertCircle, Loader2, CheckCircle2, ArrowLeft } from "lucide-react"
import Link from "next/link"

const formSchema = z.object({
  email: z.string().email({
    message: "Ingresa un correo válido.",
  }),
})

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${location.origin}/auth/callback?next=/dashboard/profile`,
      })

      if (error) throw error

      setSuccess(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al enviar el correo de recuperación"
      setError(message)
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
          <CardTitle className="text-2xl">Recuperar Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu correo para recibir un enlace de recuperación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center text-green-600 mb-2">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <p className="text-sm text-muted-foreground">
                Si existe una cuenta con el correo <strong>{form.getValues("email")}</strong>, recibirás un enlace para restablecer tu contraseña.
              </p>
              <Button asChild className="w-full mt-4" variant="outline">
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Login
                </Link>
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <Input placeholder="tu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : "Enviar Enlace"}
                </Button>

                <div className="text-center text-sm">
                  <Link href="/login" className="text-primary hover:underline flex items-center justify-center gap-1">
                     <ArrowLeft className="h-3 w-3" /> Volver al inicio de sesión
                  </Link>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
