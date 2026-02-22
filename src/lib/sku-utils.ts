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
