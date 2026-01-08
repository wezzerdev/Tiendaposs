"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { supabase } from "@/lib/supabase"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Product } from "@/types"

const productSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  sku: z.string().min(1, "El SKU es requerido."),
  price: z.coerce.number().min(0, "El precio no puede ser negativo."),
  cost: z.coerce.number().min(0, "El costo no puede ser negativo."),
  category: z.string().optional(),
  description: z.string().optional(),
  manage_stock: z.boolean().default(true),
  stock: z.coerce.number().min(0).default(0),
  min_stock_alert: z.coerce.number().min(0),
  image_url: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  initialData?: Product | null
  onSubmit: (data: ProductFormValues) => void
  onCancel: () => void
}

export function ProductForm({ initialData, onSubmit, onCancel }: ProductFormProps) {
  const [isUploading, setIsUploading] = useState(false)

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: initialData ? {
      name: initialData.name,
      sku: initialData.sku,
      price: initialData.price,
      cost: initialData.cost,
      category: initialData.category,
      description: initialData.description,
      manage_stock: initialData.manage_stock,
      stock: initialData.stock || 0,
      min_stock_alert: initialData.min_stock_alert,
      image_url: initialData.image_url,
    } : {
      name: "",
      sku: "",
      price: 0,
      cost: 0,
      category: "",
      description: "",
      manage_stock: true,
      stock: 0,
      min_stock_alert: 5,
      image_url: "",
    },
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validaciones
    if (file.size > 2 * 1024 * 1024) { // 2MB
        toast.error("La imagen es demasiado pesada (Máx 2MB)")
        return
    }

    if (!file.type.startsWith('image/')) {
        toast.error("Solo se permiten archivos de imagen")
        return
    }

    // Verificar sesión antes de subir
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        toast.error("No hay sesión activa. Por favor inicia sesión nuevamente.")
        return
    }

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = fileName

      // Subir con upsert
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
            upsert: true,
            contentType: file.type
        })

      if (uploadError) {
        console.error("Upload error detail:", uploadError)
        throw uploadError
      }

      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(filePath)
      
      const publicUrl = data.publicUrl

      form.setValue('image_url', publicUrl)
      toast.success("Imagen subida correctamente")
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error(`Error al subir imagen: ${error.message || "Error desconocido"}`)
    } finally {
      setIsUploading(false)
      // Reset input value to allow selecting same file again if needed
      e.target.value = ''
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col gap-4 p-4 border rounded-lg">
          <FormLabel>Imagen del Producto</FormLabel>
          <div className="flex items-center gap-4">
            {form.watch("image_url") ? (
              <div className="relative h-24 w-24 rounded-md overflow-hidden border">
                <img 
                  src={form.watch("image_url")} 
                  alt="Preview" 
                  className="h-full w-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-0 right-0 h-6 w-6 rounded-bl-md"
                  onClick={() => form.setValue("image_url", "")}
                >
                  <span className="sr-only">Eliminar</span>
                  &times;
                </Button>
              </div>
            ) : (
              <div className="h-24 w-24 rounded-md border-2 border-dashed flex items-center justify-center text-muted-foreground bg-muted/50">
                <Upload className="h-8 w-8 opacity-50" />
              </div>
            )}
            
            <div className="flex-1">
              <Input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {isUploading ? "Subiendo..." : "Sube una imagen (JPG, PNG, WEBP)"}
              </p>
            </div>
          </div>
          <input type="hidden" {...form.register("image_url")} />
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Producto</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Camiseta Negra Talla M" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU (Código)</FormLabel>
                <FormControl>
                  <Input placeholder="CAM-BLK-M" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <FormControl>
                  <Input placeholder="Ropa" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio de Venta</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Costo Unitario</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Detalles adicionales..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">Gestionar Inventario</FormLabel>
            <FormDescription>
              Activar si deseas controlar el stock de este producto.
            </FormDescription>
          </div>
          <FormControl>
            <FormField
              control={form.control}
              name="manage_stock"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </FormControl>
        </div>

        {form.watch("manage_stock") && (
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Stock Inicial</FormLabel>
                        <FormControl>
                        <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="min_stock_alert"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Alerta de Stock Mínimo</FormLabel>
                        <FormControl>
                        <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>Te avisaremos cuando baje de esta cantidad.</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {initialData ? "Guardar Cambios" : "Crear Producto"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
