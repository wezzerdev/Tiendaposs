export type Organization = {
  id: string
  name: string
  slug: string
  owner_id: string
  logo_url?: string
  address?: string
  phone?: string
  website?: string
  created_at: string
}

export type Branch = {
  id: string
  organization_id: string
  name: string
  address?: string
  phone?: string
  is_main: boolean
  created_at: string
}

export type UserRole = 'admin' | 'manager' | 'seller' | 'inventory'

export type Profile = {
  id: string
  organization_id: string
  branch_id?: string
  name: string
  avatar_url?: string
  role: UserRole
  is_active: boolean
  pin?: string
  created_at: string
}

export type Product = {
  id: string
  organization_id: string
  name: string
  description?: string
  sku?: string
  barcode?: string
  price: number
  cost: number
  category?: string
  image_url?: string
  manage_stock: boolean
  stock?: number // Cantidad actual (Simplificación para UI)
  min_stock_alert: number
  variants: ProductVariant[]
  created_at: string
}

export type ProductVariant = {
  name: string // e.g., "Talla"
  options: string[] // e.g., ["S", "M", "L"]
}

export type InventoryItem = {
  id: string
  product_id: string
  branch_id: string
  quantity: number
  updated_at: string
}

export type Customer = {
  id: string
  organization_id: string
  name: string
  email?: string
  phone?: string
  address?: string
  created_at: string
}
