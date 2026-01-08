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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Profile } from "@/types"

const employeeSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  pin: z.string().length(4, "El PIN debe ser de 4 dígitos.").regex(/^\d+$/, "El PIN debe ser numérico."),
  role: z.enum(["admin", "manager", "seller", "inventory"]),
})

type EmployeeFormValues = z.infer<typeof employeeSchema>

interface EmployeeFormProps {
  initialData?: Profile | null
  onSubmit: (data: EmployeeFormValues) => void
  onCancel: () => void
}

export function EmployeeForm({ initialData, onSubmit, onCancel }: EmployeeFormProps) {
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      // Nota: El PIN no se recupera por seguridad, solo se establece uno nuevo si se edita
      pin: "", 
      role: initialData.role,
    } : {
      name: "",
      pin: "",
      role: "seller",
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Juan Pérez" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="pin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PIN de Acceso (4 dígitos)</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  maxLength={4} 
                  placeholder="****" 
                  {...field} 
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    field.onChange(value)
                  }}
                />
              </FormControl>
              <FormDescription>
                Este PIN se usará para ingresar al sistema en el modo POS.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol / Permisos</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="manager">Gerente (Acceso Total)</SelectItem>
                  <SelectItem value="seller">Vendedor (Solo Ventas)</SelectItem>
                  <SelectItem value="inventory">Inventario (Solo Stock)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {initialData ? "Actualizar Empleado" : "Registrar Empleado"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
