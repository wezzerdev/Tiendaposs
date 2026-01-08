import { EcommerceSettings } from "@/components/ecommerce/ecommerce-settings"

export default function EcommercePage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">E-commerce</h1>
        <p className="text-muted-foreground">Gestiona tu tienda online pública.</p>
      </div>
      
      <div className="grid gap-6">
        <EcommerceSettings />
      </div>
    </div>
  )
}
