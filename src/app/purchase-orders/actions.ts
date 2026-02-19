"use server"

import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"

// Custom size order for display
const SIZE_ORDER = [
  "0-6M",
  "Standard",
  "0-3M",
  "3-6M",
  "6-9M",
  "9-12M",
  "12-18M",
  "18-24M",
  "2-3Y",
  "3-4Y",
  "4-5Y",
  "5-6Y",
  "6-7Y",
  "7-8Y",
  "8-9Y",
  "9-10Y",
  "Small"
]

function sortSizesByCustomOrder<T extends { size_name: string }>(sizes: T[]): T[] {
  return sizes.sort((a, b) => {
    const indexA = SIZE_ORDER.indexOf(a.size_name)
    const indexB = SIZE_ORDER.indexOf(b.size_name)
    // If not in the predefined list, put at the end alphabetically
    if (indexA === -1 && indexB === -1) return a.size_name.localeCompare(b.size_name)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })
}

// ============================================
// PURCHASE ORDERS
// ============================================

export async function createPurchaseOrder(purchaseOrder: {
  sku: string
  category: string
  print_name: string
  size: string
  cost_price: number
  quantity: number
  po_date: string
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from("purchase_orders")
      .insert([purchaseOrder])
      .select()

    if (error) {
      console.error("Error creating purchase order:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to create purchase order" }
  }
}

export async function getPurchaseOrdersByDate(date: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("purchase_orders")
      .select("*")
      .eq("po_date", date)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching purchase orders:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to fetch purchase orders" }
  }
}

export async function updatePurchaseOrder(
  id: string,
  updates: {
    sku?: string
    category?: string
    print_name?: string
    size?: string
    quantity?: number
    cost_price?: number
  }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("purchase_orders")
      .update(updates)
      .eq("id", id)
      .select()

    if (error) {
      console.error("Error updating purchase order:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to update purchase order" }
  }
}

export async function deletePurchaseOrder(id: string) {
  try {
    // First fetch the order to check its date
    const { data: order, error: fetchError } = await supabaseAdmin
      .from("purchase_orders")
      .select("po_date")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching purchase order:", fetchError)
      return { data: null, error: fetchError.message }
    }

    if (!order) {
      return { data: null, error: "Purchase order not found" }
    }

    // Check if order is within 5 days
    const orderDate = new Date(order.po_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    orderDate.setHours(0, 0, 0, 0)

    const diffTime = today.getTime() - orderDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays > 5) {
      return { data: null, error: "Cannot delete orders older than 5 days" }
    }

    const { data, error } = await supabaseAdmin
      .from("purchase_orders")
      .delete()
      .eq("id", id)
      .select()

    if (error) {
      console.error("Error deleting purchase order:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to delete purchase order" }
  }
}

export async function deletePurchaseOrdersByDate(date: string) {
  try {
    // Check if date is within 5 days
    const orderDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    orderDate.setHours(0, 0, 0, 0)

    const diffTime = today.getTime() - orderDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays > 5) {
      return { data: null, error: "Cannot delete orders older than 5 days", deletedCount: 0 }
    }

    const { data, error } = await supabaseAdmin
      .from("purchase_orders")
      .delete()
      .eq("po_date", date)
      .select()

    if (error) {
      console.error("Error deleting purchase orders:", error)
      return { data: null, error: error.message, deletedCount: 0 }
    }

    return { data, error: null, deletedCount: data?.length || 0 }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to delete purchase orders", deletedCount: 0 }
  }
}

// ============================================
// SHARED DATA (needed by purchase orders)
// ============================================

export async function getCategories() {
  try {
    const { data, error } = await supabaseAdmin
      .from("product_categories")
      .select("*")
      .order("category_name")

    if (error) {
      console.error("Error fetching categories:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to fetch categories" }
  }
}

export async function getPrints() {
  try {
    const { data, error } = await supabaseAdmin
      .from("prints_name")
      .select("*")
      .order("official_print_name")

    if (error) {
      console.error("Error fetching prints:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to fetch prints" }
  }
}

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

export async function getSizesByCategory(categoryId: string) {
  try {
    // Get distinct size IDs from products that belong to this category
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("size_id")
      .eq("category_id", categoryId)
      .not("size_id", "is", null)

    if (productsError) {
      console.error("Error fetching products:", productsError)
      return { data: null, error: productsError.message }
    }

    if (!products || products.length === 0) {
      return { data: [], error: null }
    }

    const uniqueSizeIds = [...new Set(products.map((p) => p.size_id).filter(Boolean))]

    if (uniqueSizeIds.length === 0) {
      return { data: [], error: null }
    }

    // Fetch the actual size records
    const { data, error } = await supabaseAdmin
      .from("sizes")
      .select("*")
      .in("id", uniqueSizeIds)

    if (error) {
      console.error("Error fetching sizes:", error)
      return { data: null, error: error.message }
    }

    // Sort by custom order
    const sortedData = data ? sortSizesByCustomOrder(data) : null

    return { data: sortedData, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to fetch sizes by category" }
  }
}

export async function getSizesByCategoryAndPrint(categoryId: string, printId: string) {
  try {
    if (!printId) {
      return { data: [], error: null }
    }

    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("size_id, sizes(id, size_name)")
      .eq("category_id", categoryId)
      .eq("print_id", printId)
      .not("size_id", "is", null)

    if (error) {
      console.error("Error fetching products:", error)
      return { data: null, error: error.message }
    }

    if (!products || products.length === 0) {
      return { data: [], error: null }
    }

    type SizeRecord = { id: string; size_name: string }
    const sizeMap = new Map<string, SizeRecord>()

    for (const product of products) {
      const sizeData = product.sizes
      const sizes = Array.isArray(sizeData) ? sizeData : sizeData ? [sizeData] : []
      for (const size of sizes as SizeRecord[]) {
        if (size && !sizeMap.has(size.id)) {
          sizeMap.set(size.id, size)
        }
      }
    }

    const sizes = sortSizesByCustomOrder([...sizeMap.values()])

    return { data: sizes, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to fetch sizes by category and print" }
  }
}

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

export async function getSizes() {
  try {
    const { data, error } = await supabaseAdmin
      .from("sizes")
      .select("*")

    if (error) {
      console.error("Error fetching sizes:", error)
      return { data: null, error: error.message }
    }

    // Sort by custom order
    const sortedData = data ? sortSizesByCustomOrder(data) : null

    return { data: sortedData, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to fetch sizes" }
  }
}
