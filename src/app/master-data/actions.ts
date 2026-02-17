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
// CATEGORIES
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

export async function createCategory(category: {
  category_name: string
  category_code: string
  sku_schema: number
  hsn_code: string | null
  size_in_product_name: boolean
  product_name_prefix: string | null
}) {
  try {
    // Check duplicate category name
    const { data: existingName } = await supabaseAdmin
      .from("product_categories")
      .select("id")
      .ilike("category_name", category.category_name)
      .maybeSingle()

    if (existingName) {
      return { data: null, error: `Category name "${category.category_name}" already exists` }
    }

    // Check duplicate category code
    const { data: existingCode } = await supabaseAdmin
      .from("product_categories")
      .select("id")
      .ilike("category_code", category.category_code)
      .maybeSingle()

    if (existingCode) {
      return { data: null, error: `Category code "${category.category_code}" already exists. Please use a different code.` }
    }

    // Ensure product_name_prefix ends with " |"
    if (category.product_name_prefix && !category.product_name_prefix.trimEnd().endsWith("|")) {
      category.product_name_prefix = category.product_name_prefix.trimEnd() + " |"
    }

    const { data, error } = await supabaseAdmin
      .from("product_categories")
      .insert([category])
      .select()

    if (error) {
      console.error("Error creating category:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to create category" }
  }
}

export async function updateCategory(id: string, category: {
  category_name: string
  category_code: string
  sku_schema: number
  hsn_code: string | null
  size_in_product_name: boolean
  product_name_prefix: string | null
}) {
  try {
    // Check duplicate category name (excluding current)
    const { data: existingName } = await supabaseAdmin
      .from("product_categories")
      .select("id")
      .ilike("category_name", category.category_name)
      .neq("id", id)
      .maybeSingle()

    if (existingName) {
      return { data: null, error: `Category name "${category.category_name}" already exists` }
    }

    // Check duplicate category code (excluding current)
    const { data: existingCode } = await supabaseAdmin
      .from("product_categories")
      .select("id")
      .ilike("category_code", category.category_code)
      .neq("id", id)
      .maybeSingle()

    if (existingCode) {
      return { data: null, error: `Category code "${category.category_code}" already exists. Please use a different code.` }
    }

    // Ensure product_name_prefix ends with " |"
    if (category.product_name_prefix && !category.product_name_prefix.trimEnd().endsWith("|")) {
      category.product_name_prefix = category.product_name_prefix.trimEnd() + " |"
    }

    const { data, error } = await supabaseAdmin
      .from("product_categories")
      .update(category)
      .eq("id", id)
      .select()

    if (error) {
      console.error("Error updating category:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to update category" }
  }
}

export async function deleteCategory(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from("product_categories")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting category:", error)
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { error: "Failed to delete category" }
  }
}

// ============================================
// PRINTS
// ============================================

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

export async function createPrint(print: {
  official_print_name: string
  print_code: string
  color: string | null
}) {
  try {
    // Check duplicate print name
    const { data: existingName } = await supabaseAdmin
      .from("prints_name")
      .select("id")
      .ilike("official_print_name", print.official_print_name)
      .maybeSingle()

    if (existingName) {
      return { data: null, error: `Print name "${print.official_print_name}" already exists` }
    }

    // Check duplicate print code
    const { data: existingCode } = await supabaseAdmin
      .from("prints_name")
      .select("id")
      .ilike("print_code", print.print_code)
      .maybeSingle()

    if (existingCode) {
      return { data: null, error: `Print code "${print.print_code}" already exists. Please use a different code.` }
    }

    const { data, error } = await supabaseAdmin
      .from("prints_name")
      .insert([print])
      .select()

    if (error) {
      console.error("Error creating print:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to create print" }
  }
}

export async function updatePrint(id: string, print: {
  official_print_name: string
  print_code: string
  color: string | null
}) {
  try {
    // Check duplicate print name (excluding current)
    const { data: existingName } = await supabaseAdmin
      .from("prints_name")
      .select("id")
      .ilike("official_print_name", print.official_print_name)
      .neq("id", id)
      .maybeSingle()

    if (existingName) {
      return { data: null, error: `Print name "${print.official_print_name}" already exists` }
    }

    // Check duplicate print code (excluding current)
    const { data: existingCode } = await supabaseAdmin
      .from("prints_name")
      .select("id")
      .ilike("print_code", print.print_code)
      .neq("id", id)
      .maybeSingle()

    if (existingCode) {
      return { data: null, error: `Print code "${print.print_code}" already exists. Please use a different code.` }
    }

    const { data, error } = await supabaseAdmin
      .from("prints_name")
      .update(print)
      .eq("id", id)
      .select()

    if (error) {
      console.error("Error updating print:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to update print" }
  }
}

export async function deletePrint(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from("prints_name")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting print:", error)
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { error: "Failed to delete print" }
  }
}

// ============================================
// SIZES
// ============================================

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

export async function createSize(size: {
  size_name: string
}) {
  try {
    const { data: existing } = await supabaseAdmin
      .from("sizes")
      .select("id")
      .ilike("size_name", size.size_name)
      .maybeSingle()

    if (existing) {
      return { data: null, error: `Size "${size.size_name}" already exists` }
    }

    const { data, error } = await supabaseAdmin
      .from("sizes")
      .insert([size])
      .select()

    if (error) {
      console.error("Error creating size:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to create size" }
  }
}

// ============================================
// PRODUCTS
// ============================================

export async function createProduct(product: {
  category_id: string
  size_id: string | null
  product_code: string
  name: string
  base_price: number | null
  cost_price: number | null
  mrp: number | null
  hsn_code: string | null
  material: string | null
  color: string | null
  brand: string | null
}, printIds: string[]) {
  try {
    // Check for duplicate SKU
    const { data: existing } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("product_code", product.product_code)
      .maybeSingle()

    if (existing) {
      return { data: null, error: `Product with SKU "${product.product_code}" already exists` }
    }

    // Find weight_id based on category_id + size_id
    let weight_id = null
    if (product.size_id) {
      const { data: weight } = await supabaseAdmin
        .from("product_weights")
        .select("id")
        .eq("category_id", product.category_id)
        .eq("size_id", product.size_id)
        .single()

      if (weight) {
        weight_id = weight.id
      }
    }

    // Insert product
    const { data, error } = await supabaseAdmin
      .from("products")
      .insert([{ ...product, weight_id }])
      .select()
      .single()

    if (error) {
      console.error("Error creating product:", error)
      return { data: null, error: error.message }
    }

    // Insert product_prints
    if (printIds.length > 0) {
      const productPrints = printIds.map((printId, index) => ({
        product_id: data.id,
        print_id: printId,
        position: index + 1,
      }))

      const { error: ppError } = await supabaseAdmin
        .from("product_prints")
        .insert(productPrints)

      if (ppError) {
        console.error("Error linking prints:", ppError)
        return { data, error: `Product created but failed to link prints: ${ppError.message}` }
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to create product" }
  }
}

export async function getProducts() {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*, product_categories(category_name), sizes(size_name)")
      .order("name")

    if (error) {
      console.error("Error fetching products:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to fetch products" }
  }
}

// ============================================
// PRODUCT WEIGHTS
// ============================================

export async function getProductWeights() {
  try {
    const { data, error } = await supabaseAdmin
      .from("product_weights")
      .select("*, product_categories(category_name), sizes(size_name)")

    if (error) {
      console.error("Error fetching product weights:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to fetch product weights" }
  }
}

export async function upsertProductWeight(weightData: {
  category_id: string
  size_id: string
  weight_grams: number
}) {
  try {
    // Check if weight already exists for this category+size combination
    const { data: existing } = await supabaseAdmin
      .from("product_weights")
      .select("id")
      .eq("category_id", weightData.category_id)
      .eq("size_id", weightData.size_id)
      .maybeSingle()

    // Use 'weight' as the column name (matching the database schema)
    const weightValue = { weight: weightData.weight_grams }

    if (existing) {
      // Update existing weight
      const { data, error } = await supabaseAdmin
        .from("product_weights")
        .update(weightValue)
        .eq("id", existing.id)
        .select()

      if (error) {
        console.error("Error updating weight:", error)
        return { data: null, error: error.message }
      }

      return { data, error: null, updated: true }
    } else {
      // Insert new weight
      const { data, error } = await supabaseAdmin
        .from("product_weights")
        .insert([{
          category_id: weightData.category_id,
          size_id: weightData.size_id,
          weight: weightData.weight_grams
        }])
        .select()

      if (error) {
        console.error("Error creating weight:", error)
        return { data: null, error: error.message }
      }

      return { data, error: null, updated: false }
    }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to save product weight" }
  }
}

export async function deleteProductWeight(id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("product_weights")
      .delete()
      .eq("id", id)
      .select()

    if (error) {
      console.error("Error deleting weight:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to delete product weight" }
  }
}

