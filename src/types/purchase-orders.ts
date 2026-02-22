export type Category = {
  id: string
  category_name: string
  category_code: string | null
  sku_schema: number
}

export type Print = {
  id: string
  official_print_name: string
  print_code: string | null
}

export type Size = {
  id: string
  size_name: string
}

export type SizeQuantity = {
  size: string
  sizeId: string | null
  quantity: number
  cost_price: number
  sku: string | null
}

export type PurchaseOrder = {
  id: string
  sku: string
  category: string
  print_name: string
  size: string
  cost_price: number
  discount: number
  quantity: number
  tax_class: number
  po_date: string
  created_at: string
}
