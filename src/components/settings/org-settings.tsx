"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

const orgSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  slug: z.string().min(3, "El identificador debe tener al menos 3 caracteres.").regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones."),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url("Ingresa una URL válida").optional().or(z.literal("")),
})

type OrgFormValues = z.infer<typeof orgSchema>

import { useOrganization } from "@/hooks/use-organization"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

// ... imports anteriores

export function OrganizationSettings() {
  const { organization, isLoading, updateOrganization, isUpdating } = useOrganization()

  const form = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: "",
      slug: "",
      address: "",
      phone: "",
      website: "",
    },
  })

  // Sincronizar datos al cargar
  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name || "",
        slug: organization.slug || "",
        address: organization.address || "",
        phone: organization.phone || "",
        website: organization.website || "",
      })
    }
  }, [organization, form])

  async function onSubmit(data: OrgFormValues) {
    await updateOrganization(data)
  }

  if (isLoading) {
      return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos de la Organización</CardTitle>
        <CardDescription>
          Información general de tu empresa que aparecerá en los tickets y facturas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Comercial</FormLabel>
                  <FormControl>
                    <Input placeholder="Mi Tienda SA de CV" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Identificador (Subdominio)</FormLabel>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">https://</span>
                    <FormControl>
                        <Input placeholder="mi-tienda" {...field} />
                    </FormControl>
                    <span className="text-muted-foreground text-sm">.tiendapos.com</span>
                  </div>
                  <FormDescription>
                    Este será el enlace para tu tienda online.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                        <Input placeholder="55 1234 5678" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Sitio Web (Opcional)</FormLabel>
                    <FormControl>
                        <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección Fiscal</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Calle, Número, Colonia, CP..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
