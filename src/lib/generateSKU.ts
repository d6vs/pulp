/**
 * Generates SKU based on the category's schema
 *
 * Schema 1 (default): printName_category_size
 * Schema 2: category_printName_size
 */
export function generateSKU(
  printName: string,
  categoryName: string,
  size: string,
  skuSchema: number = 1
): string {
  // Remove spaces and special characters
  const print = printName.replace(/\s+/g, '');
  const category = categoryName.replace(/\s+/g, '');
  const sizeCode = size.toUpperCase();

  if (skuSchema === 2) {
    // Schema 2: category_printName_size
    return `${category}_${print}_${sizeCode}`;
  } else {
    // Schema 1 (default): printName_category_size
    return `${print}_${category}_${sizeCode}`;
  }
}
