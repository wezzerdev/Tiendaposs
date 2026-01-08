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
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe, ShoppingBag, Loader2 } from "lucide-react"
import { useStoreConfig } from "@/hooks/use-store-config"
import { useEffect } from "react"
import Link from "next/link"

const ecommerceSchema = z.object({
  isActive: z.boolean(),
  bannerText: z.string().optional(),
})

type EcommerceFormValues = z.infer<typeof ecommerceSchema>

export function EcommerceSettings() {
  const { config, updateConfig, isLoaded } = useStoreConfig()

  const form = useForm<EcommerceFormValues>({
    resolver: zodResolver(ecommerceSchema),
    defaultValues: {
      isActive: false,
      bannerText: "",
    },
  })

  // Sincronizar formulario con estado persistido
  useEffect(() => {
    if (isLoaded) {
      form.reset({
        isActive: config.isActive,
        bannerText: config.bannerText,
      })
    }
  }, [isLoaded, config, form])

  function onSubmit(data: EcommerceFormValues) {
    updateConfig({
        isActive: data.isActive,
        bannerText: data.bannerText || ""
    })
  }

  if (!isLoaded) {
      return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tienda Online</CardTitle>
        <CardDescription>
          Configura la apariencia y estado de tu tienda pública.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                        <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Tienda Pública Activa
                        </div>
                    </FormLabel>
                    <FormDescription>
                      Si desactivas esta opción, tus clientes verán una página de mantenimiento.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-4">
                <h3 className="text-sm font-medium">Personalización</h3>
                
                <FormField
                control={form.control}
                name="bannerText"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Texto del Banner Promocional</FormLabel>
                    <FormControl>
                        <Input placeholder="¡Ofertas especiales por tiempo limitado!" {...field} />
                    </FormControl>
                    <FormDescription>
                        Aparecerá en la parte superior de tu tienda.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" type="button" className="gap-2" asChild>
                <Link href="/store" target="_blank">
                    <ShoppingBag className="h-4 w-4" />
                    Ver mi Tienda
                </Link>
              </Button>
              <Button type="submit">Guardar Cambios</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
