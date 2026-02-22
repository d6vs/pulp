// ============================================
// BASE TYPES (used across multiple modules)
// ============================================

export type Category = {
  id: string
  category_name: string
  category_code: string | null
  sku_schema: number
  hsn_code: string | null
  size_in_product_name: boolean
  product_name_prefix: string | null
  category_type: string | null
}

export type Print = {
  id: string
  official_print_name: string
  print_code: string | null
  color: string | null
}

export type Size = {
  id: string
  size_name: string
}

// ============================================
// PRODUCT TYPES
// ============================================

export type Product = {
  id: string
  product_code: string | null
  name: string | null
  color: string | null
  base_price: number | null
  cost_price: number | null
  mrp: number | null
  product_categories: { category_name: string; category_code: string | null } | { category_name: string; category_code: string | null }[] | null
  sizes: { size_name: string } | { size_name: string }[] | null
  prints_name: { official_print_name: string } | { official_print_name: string }[] | null
}

export type BundleReference = {
  id: string
  category_code: string | null
  product_code: string
  name: string | null
  size: string | null
  base_price: number | null
  cost_price: number | null
  mrp: number | null
  component_product_code: string | null
  internal_style_name: string | null
  component_quantity: number | null
  component_price: number | null
}

// ============================================
// BUNDLE ITEM MASTER TYPE
// ============================================

export type BundleItemMaster = {
  id: string
  category_code: string | null
  product_code: string | null
  name: string | null
  description: string | null
  scan_identifier: string | null
  length_mm: number | null
  width_mm: number | null
  height_mm: number | null
  weight_gms: number | null
  ean: string | null
  upc: string | null
  isbn: string | null
  color: string | null
  brand: string | null
  size: string | null
  requires_customization: boolean | null
  min_order_size: number | null
  tax_type_code: string | null
  gst_tax_type_code: string | null
  hsn_code: string | null
  tags: string | null
  tat: string | null
  image_url: string | null
  product_page_url: string | null
  item_detail_fields: string | null
  cost_price: number | null
  mrp: number | null
  base_price: number | null
  enabled: boolean | null
  resync_inventory: boolean | null
  type: string | null
  scan_type: string | null
  component_product_code: string | null
  component_quantity: number | null
  component_price: number | null
  batch_group_code: string | null
  dispatch_expiry_tolerance: number | null
  shelf_life: number | null
  tax_calculation_type: string | null
  expirable: boolean | null
  determine_expiry_from: string | null
  grn_expiry_tolerance: number | null
  return_expiry_tolerance: number | null
  expiry_date: string | null
  sku_type: string | null
  material: string | null
  style: string | null
  created_at: string
  updated_at: string | null
}

// ============================================
// CATEGORY FILTER HELPERS
// ============================================

// Bundle schema types (3, 4, 5 are bundle schemas)
export const BUNDLE_SCHEMA_TYPES = [3, 4, 5]

export function isIndividualCategory(category: Category): boolean {
  return !BUNDLE_SCHEMA_TYPES.includes(category.sku_schema)
}

export function isBundleCategory(category: Category): boolean {
  return category.category_type?.toLowerCase().trim() === "bundle"
}

export function filterIndividualCategories(categories: Category[]): Category[] {
  return categories.filter((c) => !BUNDLE_SCHEMA_TYPES.includes(c.sku_schema))
}

export function filterBundleCategories(categories: Category[]): Category[] {
  return categories.filter((c) => c.category_type?.toLowerCase().trim() === "bundle")
}

export function filterNonBundleCategories(categories: Category[]): Category[] {
  return categories.filter((c) => c.category_type?.toLowerCase().trim() !== "bundle")
}
