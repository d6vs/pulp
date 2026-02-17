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

// Bundle types that support multiple prints
export const BUNDLE_SCHEMA_TYPES = [3, 4, 5]

export function isBundleSchema(schemaType: number): boolean {
  return BUNDLE_SCHEMA_TYPES.includes(schemaType)
}

export function generateSKU(
  schemaType: number,
  categoryCode: string,
  printCodes: string[],
  size?: string
): string {
  const sizeCode = !size || size === "Standard" ? "" : `_${size}`

  switch (schemaType) {
    case 0: // PRINTCODECategorycode_SIZE
      return `${printCodes[0]}${categoryCode}${sizeCode}`
    case 1: // Printcode_Categorycode_Size
      return `${printCodes[0]}_${categoryCode}${sizeCode}`
    case 2: // Categorycode_PrintCode_Size
      return `${categoryCode}_${printCodes[0]}${sizeCode}`
    case 3: // Print_Print..._Categorycode_Size
      return `${printCodes.join("_")}_${categoryCode}${sizeCode}`
    case 4: // Categorycode_Print_Print..._Size
      return `${categoryCode}_${printCodes.join("_")}${sizeCode}`
    case 5: // Categorycode_Print_Print
      return `${categoryCode}_${printCodes.join("_")}`
    case 6: // Categorycode_Print
      return `${categoryCode}_${printCodes[0]}`
    default:
      return `${printCodes[0]}_${categoryCode}${sizeCode}`
  }
}
