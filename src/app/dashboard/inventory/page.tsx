import { ProductList } from "@/components/inventory/product-list"

export default function InventoryPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventario</h1>
      </div>
      <ProductList />
    </div>
  )
}
