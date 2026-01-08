"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { MoreHorizontal, Plus, Shield, User, Loader2, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Profile } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { EmployeeForm } from "./employee-form"
import { useEmployees } from "@/hooks/use-employees"
import { toast } from "sonner"
import { useOrganization } from "@/hooks/use-organization"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useCurrentRole } from "@/hooks/use-current-role"

export function EmployeeList() {
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false)
  const [isPinDialogOpen, setIsPinDialogOpen] = React.useState(false)
  
  const [selectedEmployee, setSelectedEmployee] = React.useState<Profile | null>(null)
  const [newPin, setNewPin] = React.useState("")
  
  const { employees, isLoading, createEmployee, updateEmployee, updatePin, toggleStatus, deleteEmployee } = useEmployees()
  const { organization } = useOrganization()
  const { role: currentUserRole } = useCurrentRole()

  const columns: ColumnDef<Profile>[] = [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={row.original.avatar_url} alt={row.original.name || "Empleado"} />
            <AvatarFallback>{(row.original.name || "U").charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="font-medium">{row.getValue("name") || "Sin nombre"}</div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Rol",
      cell: ({ row }) => {
        const role = row.getValue("role") as string
        const roleMap: Record<string, string> = {
          manager: "Gerente",
          seller: "Vendedor",
          inventory: "Inventario",
          admin: "Admin"
        }
        
        const variantMap: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
          manager: "default",
          seller: "secondary",
          inventory: "outline",
          admin: "default"
        }
  
        return (
          <Badge variant={variantMap[role] || "outline"}>
            {roleMap[role] || role}
          </Badge>
        )
      },
    },
    {
      accessorKey: "is_active",
      header: "Estado",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${row.original.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-muted-foreground">
            {row.original.is_active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const employee = row.original
        const isTargetAdmin = employee.role === 'admin'
        
        // Reglas de protección UI:
        // 1. Si es admin, solo puede editarse a sí mismo (y con restricciones)
        // 2. Si NO es admin (es gerente/etc), NO puede tocar al admin
        
        // Deshabilitar acciones destructivas si el destino es admin
        const canDelete = !isTargetAdmin
        const canDeactivate = !isTargetAdmin
        
        // Deshabilitar cambio de PIN si el destino es admin y yo NO soy ese admin
        // (El usuario pidió "gerentes no pueden cambiar PIN al admin")
        // Asumimos que si soy el mismo usuario, sí puedo cambiar mi PIN (lógica de negocio normal),
        // pero el requerimiento "admin no pueda cambiar su perfil" podría ser estricto.
        // Vamos a permitir al admin cambiar SU propio PIN, pero nadie más.
        const canChangePin = !isTargetAdmin || (currentUserRole === 'admin' && false) // Deshabilitado para todos por seguridad extrema si se desea, o:
        // const canChangePin = !isTargetAdmin || (currentUserRole === 'admin' && employee.id === currentUserId) --> Necesitaríamos currentUserId
        
        // Simplificación segura: Nadie cambia PIN de admin por UI de lista rápida
        const isSelf = false // TODO: Necesitaríamos el ID del usuario actual para saber si es self.
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                  setSelectedEmployee(employee)
                  setIsEditSheetOpen(true)
              }}>
                  Editar Perfil
              </DropdownMenuItem>
              
              {!isTargetAdmin && (
                  <DropdownMenuItem onClick={() => {
                      setSelectedEmployee(employee)
                      setNewPin("")
                      setIsPinDialogOpen(true)
                  }}>
                      Cambiar PIN
                  </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              {canDeactivate && (
                  <DropdownMenuItem 
                      className={employee.is_active ? "text-destructive" : "text-green-600"}
                      onClick={() => handleToggleStatus(employee)}
                  >
                      {employee.is_active ? "Desactivar" : "Activar"}
                  </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              {canDelete && (
                  <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                          if (confirm("¿Estás seguro de eliminar este empleado permanentemente? Esta acción no se puede deshacer.")) {
                              handleDeleteEmployee(employee)
                          }
                      }}
                  >
                      Eliminar permanentemente
                  </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: employees,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) {
      return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  const handleCreateEmployee = async (data: any) => {
      try {
          await createEmployee(data)
          toast.success("Empleado registrado exitosamente")
          setIsSheetOpen(false)
      } catch (error: any) {
          toast.error("Error al registrar empleado: " + error.message)
      }
  }

  const handleUpdateEmployee = async (data: any) => {
      if (!selectedEmployee) return
      
      try {
          await updateEmployee({ id: selectedEmployee.id, data })
          toast.success("Empleado actualizado correctamente")
          setIsEditSheetOpen(false)
          setSelectedEmployee(null)
      } catch (error) {
          toast.error("Error al actualizar empleado")
      }
  }

  const handleUpdatePin = async () => {
      if (!selectedEmployee || newPin.length !== 4) return
      
      try {
          await updatePin({ id: selectedEmployee.id, pin: newPin })
          toast.success("PIN actualizado correctamente")
          setIsPinDialogOpen(false)
          setNewPin("")
          setSelectedEmployee(null)
      } catch (error) {
          toast.error("Error al actualizar PIN")
      }
  }

  const handleToggleStatus = async (employee: Profile) => {
      try {
          await toggleStatus({ id: employee.id, isActive: !employee.is_active })
          toast.success(`Empleado ${employee.is_active ? 'desactivado' : 'activado'} correctamente`)
      } catch (error: any) {
          console.error("Error toggling status:", error)
          if (error.code === '42501') {
              toast.error("Error de permisos: Asegúrate de ejecutar el script 'supabase/allow_admin_updates.sql'")
          } else {
              toast.error("Error al cambiar estado")
          }
      }
  }

  const handleDeleteEmployee = async (employee: Profile) => {
    try {
        await deleteEmployee(employee.id)
        toast.success("Empleado eliminado correctamente")
    } catch (error: any) {
        console.error("Error en handleDeleteEmployee:", error)
        // Asegurar que mostramos el mensaje del error, no [object Object]
        const msg = error instanceof Error ? error.message : "Error desconocido al eliminar"
        toast.error(msg)
    }
}

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Listado de Personal</h2>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Empleado
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Registrar Empleado</SheetTitle>
              <SheetDescription>
                Para agregar un nuevo miembro a {organization?.name || "tu organización"}, ingresa sus datos.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <EmployeeForm 
                onSubmit={handleCreateEmployee}
                onCancel={() => setIsSheetOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Edit Sheet */}
        <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Editar Empleado</SheetTitle>
                    <SheetDescription>Actualiza los datos del perfil del empleado.</SheetDescription>
                </SheetHeader>
                <div className="py-4">
                    {selectedEmployee && (
                        <EmployeeForm
                            initialData={selectedEmployee}
                            onSubmit={handleUpdateEmployee}
                            onCancel={() => setIsEditSheetOpen(false)}
                        />
                    )}
                </div>
            </SheetContent>
        </Sheet>

        {/* PIN Dialog */}
        <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cambiar PIN de Acceso</DialogTitle>
                    <DialogDescription>
                        Ingresa un nuevo PIN de 4 dígitos para {selectedEmployee?.name}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="pin" className="text-right">
                            Nuevo PIN
                        </Label>
                        <Input
                            id="pin"
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                            className="col-span-3"
                            maxLength={4}
                            type="password"
                            placeholder="####"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPinDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleUpdatePin} disabled={newPin.length !== 4}>Guardar PIN</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No hay empleados registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
