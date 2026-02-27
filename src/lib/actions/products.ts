"use server"

import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"
import { sortSizesByCustomOrder } from "@/lib/size-utils"

// ============================================
// PRINTS BY CATEGORY
// ============================================

export async function getPrintsByCategory(categoryId: string) {
  try {
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("prints_name:print_id(id, official_print_name, print_code, color)")
      .eq("category_id", categoryId)
      .not("print_id", "is", null)

    if (error) {
      console.error("Error fetching prints:", error)
      return { data: null, error: error.message }
    }

    if (!products || products.length === 0) {
      return { data: [], error: null }
    }

    // Deduplicate prints across all products
    type PrintRecord = { id: string; official_print_name: string; print_code: string | null; color: string | null }
    const printMap = new Map<string, PrintRecord>()
    for (const product of products) {
      const printData = product.prints_name
      const print = Array.isArray(printData) ? printData[0] : printData
      if (print && !printMap.has((print as PrintRecord).id)) {
        printMap.set((print as PrintRecord).id, print as PrintRecord)
      }
    }

    const prints = [...printMap.values()].sort((a, b) =>
      a.official_print_name.localeCompare(b.official_print_name)
    )

    return { data: prints, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to fetch prints by category" }
  }
}

// ============================================
// SIZES BY CATEGORY AND PRINT
// ============================================

export async function getSizesByCategoryAndPrint(categoryId: string, printId: string) {
  try {
    if (!printId) {
      return { data: [], sizeToProductCode: {}, error: null }
    }

    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("size_id, product_code, sizes(id, size_name)")
      .eq("category_id", categoryId)
      .eq("print_id", printId)
      .not("size_id", "is", null)

    if (error) {
      console.error("Error fetching products:", error)
      return { data: null, sizeToProductCode: {}, error: error.message }
    }

    if (!products || products.length === 0) {
      return { data: [], sizeToProductCode: {}, error: null }
    }

    type SizeRecord = { id: string; size_name: string }
    const sizeMap = new Map<string, SizeRecord>()
    const sizeToProductCode: Record<string, string> = {}

    for (const product of products) {
      const sizeData = product.sizes
      const size = Array.isArray(sizeData) ? sizeData[0] : sizeData

      if (size) {
        const sizeRecord = size as SizeRecord
        if (!sizeMap.has(sizeRecord.id)) {
          sizeMap.set(sizeRecord.id, sizeRecord)
        }
        // Map size_name to product_code (for bundle checking)
        if (product.product_code) {
          sizeToProductCode[sizeRecord.size_name] = product.product_code
        }
      }
    }

    const sizes = sortSizesByCustomOrder([...sizeMap.values()])

    return { data: sizes, sizeToProductCode, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, sizeToProductCode: {}, error: "Failed to fetch sizes by category and print" }
  }
}

// ============================================
// GET PRODUCT SKU
// ============================================

export async function getProductSKU(categoryId: string, printId: string, sizeId: string | null) {
  try {
    // Build query to find a product matching category, size, and print
    let query = supabaseAdmin
      .from("products")
      .select("product_code, cost_price")
      .eq("category_id", categoryId)
      .eq("print_id", printId)

    if (sizeId) {
      query = query.eq("size_id", sizeId)
    } else {
      query = query.is("size_id", null)
    }

    const { data: products, error: productsError } = await query

    if (productsError) {
      console.error("Error fetching products:", productsError)
      return { data: null, error: productsError.message }
    }

    if (!products || products.length === 0) {
      return { data: null, error: null }
    }

    const product = products[0]
    return { data: { sku: product.product_code, cost_price: product.cost_price }, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to fetch product SKU" }
  }
}
