"use client"

import * as React from "react"
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table"
import { ArrowUpDown, Loader2, Eye, Receipt } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useSales } from "@/hooks/use-sales"
import { Sale } from "@/services/sales.service"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"

export const columns: ColumnDef<Sale>[] = [
  {
    accessorKey: "id",
    header: "ID Venta",
    cell: ({ row }) => <div className="font-mono text-xs">#{row.getValue("id")}</div>,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Fecha
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
    },
    cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"))
        return <div>{date.toLocaleString()}</div>
    },
  },
  {
    accessorKey: "payment_method",
    header: "Método",
    cell: ({ row }) => {
        const method = row.getValue("payment_method") as string
        return (
            <div className="capitalize flex items-center gap-2">
                {method === 'card' ? '💳 Tarjeta' : '💵 Efectivo'}
            </div>
        )
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
            <Badge variant={status === 'completed' ? 'default' : 'destructive'}>
                {status === 'completed' ? 'Completado' : 'Reembolsado'}
            </Badge>
        )
    },
  },
  {
    accessorKey: "total",
    header: () => <div className="text-right">Total</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total"))
      const formatted = new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
      }).format(amount)
 
      return <div className="text-right font-bold">{formatted}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const sale = row.original
      return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Detalle de Venta #{sale.id}</SheetTitle>
                    <SheetDescription>
                        Realizada el {new Date(sale.created_at).toLocaleString()}
                    </SheetDescription>
                </SheetHeader>
                
                <ScrollArea className="h-[80vh] mt-4 pr-4">
                    <div className="space-y-6">
                        {/* Lista de Items */}
                        <div className="border rounded-lg p-4 bg-muted/30">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Receipt className="h-4 w-4" />
                                Productos
                            </h3>
                            <div className="space-y-3">
                                {sale.items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <div>
                                            <p className="font-medium">{item.product_name}</p>
                                            <p className="text-muted-foreground text-xs">
                                                {item.quantity} x {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(item.price)}
                                            </p>
                                        </div>
                                        <div className="font-mono">
                                            {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(item.total)}
                                        </div>
                                    </div>
                                ))}
                                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>{new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(sale.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Info Adicional */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="border rounded-lg p-3">
                                <p className="text-muted-foreground">Método de Pago</p>
                                <p className="font-medium capitalize">{sale.payment_method === 'card' ? 'Tarjeta' : 'Efectivo'}</p>
                            </div>
                            <div className="border rounded-lg p-3">
                                <p className="text-muted-foreground">Vendedor</p>
                                <p className="font-medium">Juan Pérez (Cajero)</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button className="w-full" variant="outline">
                                <Receipt className="mr-2 h-4 w-4" /> Reimprimir Ticket
                            </Button>
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
      )
    },
  },
]

export default function SalesPage() {
  const { sales, isLoading } = useSales()

  const table = useReactTable({
    data: sales,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Historial de Ventas</h1>
        <p className="text-muted-foreground">Consulta todas las transacciones realizadas.</p>
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
                  No hay ventas registradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
