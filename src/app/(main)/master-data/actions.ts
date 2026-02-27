"use server"

import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"

// ============================================
// CATEGORIES (CRUD operations)
// ============================================

export async function createCategory(category: {
  category_name: string
  category_code: string
  sku_schema: number
  hsn_code: string | null
  size_in_product_name: boolean
  product_name_prefix: string | null
  category_type: string | null
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
      if (error.message?.includes("duplicate key") || error.message?.includes("unique constraint")) {
        return { data: null, error: "Category already exists" }
      }
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes("fetch failed") || errorMessage.includes("TypeError")) {
      return { data: null, error: "Unable to create category. Please check your connection and try again." }
    }
    return { data: null, error: "Unable to create category. Please try again." }
  }
}

export async function updateCategory(id: string, category: {
  category_name: string
  category_code: string
  sku_schema: number
  hsn_code: string | null
  size_in_product_name: boolean
  product_name_prefix: string | null
  category_type: string | null
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
    return { data: null, error: "Unable to update category. Please try again." }
  }
}

// Check how many products use this category
export async function getCategoryProductCount(categoryId: string) {
  try {
    const { count, error } = await supabaseAdmin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", categoryId)

    if (error) {
      return { count: 0, error: error.message }
    }

    return { count: count || 0, error: null }
  } catch {
    return { count: 0, error: "Unable to check product count" }
  }
}

export async function deleteCategory(id: string, forceDelete: boolean = false) {
  try {
    // Check if any products use this category
    const { count } = await getCategoryProductCount(id)

    if (count > 0 && !forceDelete) {
      return {
        error: null,
        hasProducts: true,
        productCount: count,
        message: `This category is used by ${count} product${count === 1 ? "" : "s"}. You need to delete those products first, or choose "Delete All" to remove everything.`
      }
    }

    // If force delete, remove products first
    if (forceDelete && count > 0) {
      await supabaseAdmin
        .from("products")
        .delete()
        .eq("category_id", id)
    }

    // Now delete the category
    const { error } = await supabaseAdmin
      .from("product_categories")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting category:", error)
      // User-friendly error messages
      if (error.message.includes("foreign key") || error.message.includes("violates")) {
        return { error: "Cannot delete this category because it's still being used by some products. Please try again or contact support." }
      }
      return { error: "Something went wrong while deleting the category. Please try again." }
    }

    return { error: null, hasProducts: false, productCount: 0 }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { error: "Something unexpected happened. Please try again or contact support." }
  }
}

// ============================================
// PRINTS (CRUD operations)
// ============================================

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
      if (error.message?.includes("duplicate key") || error.message?.includes("unique constraint")) {
        return { data: null, error: "Print already exists" }
      }
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes("fetch failed") || errorMessage.includes("TypeError")) {
      return { data: null, error: "Unable to create print. Please check your connection and try again." }
    }
    return { data: null, error: "Unable to create print. Please try again." }
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
    return { data: null, error: "Unable to update print. Please try again." }
  }
}

// Check how many products use this print
export async function getPrintProductCount(printId: string) {
  try {
    const { count, error } = await supabaseAdmin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("print_id", printId)

    if (error) {
      return { count: 0, error: error.message }
    }

    return { count: count || 0, error: null }
  } catch {
    return { count: 0, error: "Unable to check product count" }
  }
}

export async function deletePrint(id: string, forceDelete: boolean = false) {
  try {
    // Check if any products use this print
    const { count } = await getPrintProductCount(id)

    if (count > 0 && !forceDelete) {
      return {
        error: null,
        hasProducts: true,
        productCount: count,
        message: `This print is used by ${count} product${count === 1 ? "" : "s"}. You need to delete those products first, or choose "Delete All" to remove everything.`
      }
    }

    // If force delete, remove products using this print
    if (forceDelete && count > 0) {
      await supabaseAdmin
        .from("products")
        .delete()
        .eq("print_id", id)
    }

    // Now delete the print
    const { error } = await supabaseAdmin
      .from("prints_name")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting print:", error)
      // User-friendly error messages
      if (error.message.includes("foreign key") || error.message.includes("violates")) {
        return { error: "Cannot delete this print because it's still being used by some products. Please try again or contact support." }
      }
      return { error: "Something went wrong while deleting the print. Please try again." }
    }

    return { error: null, hasProducts: false, productCount: 0 }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { error: "Something unexpected happened. Please try again or contact support." }
  }
}

// ============================================
// SIZES (CRUD operations)
// ============================================

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
      if (error.message?.includes("duplicate key") || error.message?.includes("unique constraint")) {
        return { data: null, error: "Size already exists" }
      }
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes("fetch failed") || errorMessage.includes("TypeError")) {
      return { data: null, error: "Unable to create size. Please check your connection and try again." }
    }
    return { data: null, error: "Unable to create size. Please try again." }
  }
}

// ============================================
// PRODUCTS
// ============================================

export async function createProduct(product: {
  category_id: string
  size_id: string | null
  print_id: string | null
  product_code: string
  name: string
  base_price: number | null
  cost_price: number | null
  mrp: number | null
  hsn_code: string | null
  material: string | null
  color: string | null
  brand: string | null
}) {
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

    // Insert product with print_id directly
    const { data, error } = await supabaseAdmin
      .from("products")
      .insert([{ ...product, weight_id }])
      .select()
      .single()

    if (error) {
      console.error("Error creating product:", error)
      // Check for duplicate key constraint violation
      if (error.message?.includes("duplicate key") || error.message?.includes("unique constraint")) {
        return { data: null, error: "Product already exists" }
      }
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    // Don't show technical errors like "TypeError: fetch failed"
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes("fetch failed") || errorMessage.includes("TypeError")) {
      return { data: null, error: "Unable to create product. Please check your connection and try again." }
    }
    return { data: null, error: "Unable to create product. Please try again." }
  }
}

export async function getProducts() {
  try {
    const BATCH = 1000
    const all: unknown[] = []
    let from = 0

    while (true) {
      const { data, error } = await supabaseAdmin
        .from("products")
        .select("id, product_code, name, color, base_price, cost_price, mrp, product_categories:category_id(category_name, category_code), sizes:size_id(size_name), prints_name:print_id(official_print_name)")
        .order("product_code")
        .range(from, from + BATCH - 1)

      if (error) {
        console.error("Error fetching products:", error)
        return { data: null, error: error.message }
      }

      all.push(...(data ?? []))
      if (!data || data.length < BATCH) break
      from += BATCH
    }

    return { data: all, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Unable to load products. Please refresh the page." }
  }
}

export async function getBundleReferences() {
  try {
    const BATCH = 1000
    const all: unknown[] = []
    let from = 0

    while (true) {
      const { data, error } = await supabaseAdmin
        .from("bundle_reference")
        .select("id, category_code, product_code, name, size, base_price, cost_price, mrp, component_product_code, internal_style_name, component_quantity, component_price")
        .order("product_code")
        .range(from, from + BATCH - 1)

      if (error) {
        console.error("Error fetching bundle references:", error)
        return { data: null, error: error.message }
      }

      all.push(...(data ?? []))
      if (!data || data.length < BATCH) break
      from += BATCH
    }

    return { data: all, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Unable to load bundle references. Please refresh the page." }
  }
}

export async function deleteProduct(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting product:", error)
      return { error: error.message }
    }
    return { error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { error: "Unable to delete product. Please try again." }
  }
}

export async function deleteBundleReference(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from("bundle_reference")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting bundle reference:", error)
      return { error: error.message }
    }
    return { error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { error: "Unable to delete bundle reference. Please try again." }
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
    return { data: null, error: "Unable to load weights. Please refresh the page." }
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
    return { data: null, error: "Unable to save weight. Please try again." }
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
    return { data: null, error: "Unable to delete weight. Please try again." }
  }
}

// ============================================
// BULK IMPORT FUNCTIONS
// ============================================

type ImportError = {
  row: number
  field: string
  message: string
}

type ImportSkipped = {
  row: number
  name: string
  reason: string
}

type ImportResult = {
  successCount: number
  errorCount: number
  skippedCount: number
  errors: ImportError[]
  skipped: ImportSkipped[]
}

export async function importCategories(data: Record<string, unknown>[]): Promise<ImportResult> {
  const errors: ImportError[] = []
  const skipped: ImportSkipped[] = []
  let successCount = 0

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const rowNum = i + 2 // +2 because row 1 is header, and i is 0-indexed

    try {
      // Ensure product_name_prefix ends with " |"
      let prefix = row.product_name_prefix ? String(row.product_name_prefix) : null
      if (prefix && !prefix.trimEnd().endsWith("|")) {
        prefix = prefix.trimEnd() + " |"
      }

      const categoryData = {
        category_name: String(row.category_name || ""),
        category_code: String(row.category_code || ""),
        sku_schema: Number(row.sku_schema) || 1,
        hsn_code: row.hsn_code ? String(row.hsn_code) : null,
        size_in_product_name: row.size_in_product_name === true || row.size_in_product_name === "true",
        product_name_prefix: prefix,
        category_type: row.category_type ? String(row.category_type) : null,
      }

      // Check if category already exists (by name) - fetch full record for comparison
      const { data: existingByName } = await supabaseAdmin
        .from("product_categories")
        .select("*")
        .ilike("category_name", categoryData.category_name)
        .maybeSingle()

      if (existingByName) {
        // Check if values are the same
        const isSame =
          existingByName.category_code === categoryData.category_code &&
          existingByName.sku_schema === categoryData.sku_schema &&
          existingByName.hsn_code === categoryData.hsn_code &&
          existingByName.size_in_product_name === categoryData.size_in_product_name &&
          existingByName.product_name_prefix === categoryData.product_name_prefix &&
          existingByName.category_type === categoryData.category_type

        if (isSame) {
          skipped.push({ row: rowNum, name: categoryData.category_name, reason: "No changes detected" })
          continue
        }

        // Update existing category
        const { error } = await supabaseAdmin
          .from("product_categories")
          .update(categoryData)
          .eq("id", existingByName.id)

        if (error) {
          errors.push({ row: rowNum, field: "category_name", message: error.message })
        } else {
          successCount++
        }
      } else {
        // Check for duplicate code
        const { data: existingByCode } = await supabaseAdmin
          .from("product_categories")
          .select("id")
          .ilike("category_code", categoryData.category_code)
          .maybeSingle()

        if (existingByCode) {
          errors.push({ row: rowNum, field: "category_code", message: `Category code "${categoryData.category_code}" already exists` })
          continue
        }

        // Insert new category
        const { error } = await supabaseAdmin
          .from("product_categories")
          .insert([categoryData])

        if (error) {
          errors.push({ row: rowNum, field: "", message: error.message })
        } else {
          successCount++
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      errors.push({ row: rowNum, field: "", message })
    }
  }

  return { successCount, errorCount: errors.length, skippedCount: skipped.length, errors, skipped }
}

export async function importPrints(data: Record<string, unknown>[]): Promise<ImportResult> {
  const errors: ImportError[] = []
  const skipped: ImportSkipped[] = []
  let successCount = 0

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const rowNum = i + 2

    try {
      const printData = {
        official_print_name: String(row.official_print_name || ""),
        print_code: String(row.print_code || ""),
        color: row.color ? String(row.color) : null,
      }

      // Check if print already exists (by name) - fetch full record for comparison
      const { data: existingByName } = await supabaseAdmin
        .from("prints_name")
        .select("*")
        .ilike("official_print_name", printData.official_print_name)
        .maybeSingle()

      if (existingByName) {
        // Check if values are the same
        const isSame =
          existingByName.print_code === printData.print_code &&
          existingByName.color === printData.color

        if (isSame) {
          skipped.push({ row: rowNum, name: printData.official_print_name, reason: "No changes detected" })
          continue
        }

        // Update existing print
        const { error } = await supabaseAdmin
          .from("prints_name")
          .update(printData)
          .eq("id", existingByName.id)

        if (error) {
          errors.push({ row: rowNum, field: "official_print_name", message: error.message })
        } else {
          successCount++
        }
      } else {
        // Check for duplicate code
        const { data: existingByCode } = await supabaseAdmin
          .from("prints_name")
          .select("id")
          .ilike("print_code", printData.print_code)
          .maybeSingle()

        if (existingByCode) {
          errors.push({ row: rowNum, field: "print_code", message: `Print code "${printData.print_code}" already exists` })
          continue
        }

        // Insert new print
        const { error } = await supabaseAdmin
          .from("prints_name")
          .insert([printData])

        if (error) {
          errors.push({ row: rowNum, field: "", message: error.message })
        } else {
          successCount++
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      errors.push({ row: rowNum, field: "", message })
    }
  }

  return { successCount, errorCount: errors.length, skippedCount: skipped.length, errors, skipped }
}


export async function importProducts(data: Record<string, unknown>[]): Promise<ImportResult> {
  const errors: ImportError[] = []
  const skipped: ImportSkipped[] = []
  let successCount = 0

  // Pre-fetch all categories, prints, and sizes for lookup
  const { data: categories } = await supabaseAdmin
    .from("product_categories")
    .select("id, category_name")

  const { data: prints } = await supabaseAdmin
    .from("prints_name")
    .select("id, official_print_name")

  const { data: sizes } = await supabaseAdmin
    .from("sizes")
    .select("id, size_name")

  const categoryMap = new Map(
    (categories || []).map((c) => [c.category_name.toLowerCase(), c.id])
  )
  const printMap = new Map(
    (prints || []).map((p) => [p.official_print_name.toLowerCase(), p.id])
  )
  const sizeMap = new Map(
    (sizes || []).map((s) => [s.size_name.toLowerCase(), s.id])
  )

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const rowNum = i + 2

    try {
      // Support both "category" and "category_name" field names
      const categoryValue = row.category || row.category_name || ""
      const categoryName = String(categoryValue).toLowerCase()
      // Support both "print" and "print_name" field names
      const printValue = row.print || row.print_name
      const printName = printValue ? String(printValue).toLowerCase() : null
      // Support both "size" and "size_name" field names
      const sizeValue = row.size || row.size_name
      const sizeName = sizeValue ? String(sizeValue).toLowerCase() : null

      // Resolve category_id
      const category_id = categoryMap.get(categoryName)
      if (!category_id) {
        errors.push({ row: rowNum, field: "category", message: `Category "${categoryValue}" not found` })
        continue
      }

      // Resolve print_id (optional)
      let print_id: string | null = null
      if (printName) {
        print_id = printMap.get(printName) || null
        if (!print_id) {
          errors.push({ row: rowNum, field: "print", message: `Print "${printValue}" not found` })
          continue
        }
      }

      // Resolve size_id (optional)
      let size_id: string | null = null
      if (sizeName) {
        size_id = sizeMap.get(sizeName) || null
        if (!size_id) {
          errors.push({ row: rowNum, field: "size", message: `Size "${sizeValue}" not found` })
          continue
        }
      }

      const productCode = String(row.product_code || "")

      // Check if product already exists (by product_code) - fetch full record for comparison
      const { data: existing } = await supabaseAdmin
        .from("products")
        .select("*")
        .eq("product_code", productCode)
        .maybeSingle()

      // Find weight_id based on category_id + size_id
      let weight_id = null
      if (size_id) {
        const { data: weight } = await supabaseAdmin
          .from("product_weights")
          .select("id")
          .eq("category_id", category_id)
          .eq("size_id", size_id)
          .single()

        if (weight) {
          weight_id = weight.id
        }
      }

      const productData = {
        category_id,
        size_id,
        print_id,
        weight_id,
        product_code: productCode,
        name: String(row.name || ""),
        base_price: row.base_price ? Number(row.base_price) : null,
        cost_price: row.cost_price ? Number(row.cost_price) : null,
        mrp: row.mrp ? Number(row.mrp) : null,
        hsn_code: row.hsn_code ? String(row.hsn_code) : null,
        material: row.material ? String(row.material) : null,
        color: row.color ? String(row.color) : null,
        brand: row.brand ? String(row.brand) : null,
        length_mm: row.length_mm ? Number(row.length_mm) : null,
        width_mm: row.width_mm ? Number(row.width_mm) : null,
        height_mm: row.height_mm ? Number(row.height_mm) : null,
        isbn: row.isbn ? String(row.isbn) : null,
      }

      if (existing) {
        // Check if values are the same
        const isSame =
          existing.category_id === productData.category_id &&
          existing.size_id === productData.size_id &&
          existing.print_id === productData.print_id &&
          existing.name === productData.name &&
          existing.base_price === productData.base_price &&
          existing.cost_price === productData.cost_price &&
          existing.mrp === productData.mrp &&
          existing.hsn_code === productData.hsn_code &&
          existing.material === productData.material &&
          existing.color === productData.color &&
          existing.brand === productData.brand &&
          existing.length_mm === productData.length_mm &&
          existing.width_mm === productData.width_mm &&
          existing.height_mm === productData.height_mm &&
          existing.isbn === productData.isbn

        if (isSame) {
          skipped.push({ row: rowNum, name: productCode, reason: "No changes detected" })
          continue
        }

        // Update existing product
        const { error } = await supabaseAdmin
          .from("products")
          .update(productData)
          .eq("id", existing.id)

        if (error) {
          errors.push({ row: rowNum, field: "", message: error.message })
        } else {
          successCount++
        }
      } else {
        // Insert new product
        const { error } = await supabaseAdmin
          .from("products")
          .insert([productData])

        if (error) {
          errors.push({ row: rowNum, field: "", message: error.message })
        } else {
          successCount++
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      errors.push({ row: rowNum, field: "", message })
    }
  }

  return { successCount, errorCount: errors.length, skippedCount: skipped.length, errors, skipped }
}

export async function importProductWeights(data: Record<string, unknown>[]): Promise<ImportResult> {
  const errors: ImportError[] = []
  const skipped: ImportSkipped[] = []
  let successCount = 0

  // Pre-fetch all categories and sizes for lookup
  const { data: categories } = await supabaseAdmin
    .from("product_categories")
    .select("id, category_name")

  const { data: sizes } = await supabaseAdmin
    .from("sizes")
    .select("id, size_name")

  const categoryMap = new Map(
    (categories || []).map((c) => [c.category_name.toLowerCase(), c.id])
  )
  const categoryNameMap = new Map(
    (categories || []).map((c) => [c.id, c.category_name])
  )
  const sizeMap = new Map(
    (sizes || []).map((s) => [s.size_name.toLowerCase(), s.id])
  )
  const sizeNameMap = new Map(
    (sizes || []).map((s) => [s.id, s.size_name])
  )

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const rowNum = i + 2

    try {
      // Support both "category" and "category_name" field names
      const categoryValue = row.category || row.category_name || ""
      const categoryName = String(categoryValue).toLowerCase()
      // Support both "size" and "size_name" field names
      const sizeValue = row.size || row.size_name || ""
      const sizeName = String(sizeValue).toLowerCase()
      const weight = Number(row.weight)

      // Resolve category_id
      const category_id = categoryMap.get(categoryName)
      if (!category_id) {
        errors.push({ row: rowNum, field: "category", message: `Category "${categoryValue}" not found` })
        continue
      }

      // Resolve size_id
      const size_id = sizeMap.get(sizeName)
      if (!size_id) {
        errors.push({ row: rowNum, field: "size", message: `Size "${sizeValue}" not found` })
        continue
      }

      if (isNaN(weight) || weight <= 0) {
        errors.push({ row: rowNum, field: "weight", message: "Weight must be a positive number" })
        continue
      }

      // Check if weight already exists for this category+size - fetch full record
      const { data: existing } = await supabaseAdmin
        .from("product_weights")
        .select("*")
        .eq("category_id", category_id)
        .eq("size_id", size_id)
        .maybeSingle()

      if (existing) {
        // Check if weight is the same
        if (existing.weight === weight) {
          const displayName = `${categoryNameMap.get(category_id)} - ${sizeNameMap.get(size_id)}`
          skipped.push({ row: rowNum, name: displayName, reason: "No changes detected" })
          continue
        }

        // Update existing weight
        const { error } = await supabaseAdmin
          .from("product_weights")
          .update({ weight })
          .eq("id", existing.id)

        if (error) {
          errors.push({ row: rowNum, field: "", message: error.message })
        } else {
          successCount++
        }
      } else {
        // Insert new weight
        const { error } = await supabaseAdmin
          .from("product_weights")
          .insert([{ category_id, size_id, weight }])

        if (error) {
          errors.push({ row: rowNum, field: "", message: error.message })
        } else {
          successCount++
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      errors.push({ row: rowNum, field: "", message })
    }
  }

  return { successCount, errorCount: errors.length, skippedCount: skipped.length, errors, skipped }
}

export async function importBundles(data: Record<string, unknown>[]): Promise<ImportResult> {
  const errors: ImportError[] = []
  const skipped: ImportSkipped[] = []
  let successCount = 0

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const rowNum = i + 2

    try {
      const productCode = String(row.product_code || "")
      const componentProductCode = String(row.component_product_code || "")
      const componentQuantity = Number(row.component_quantity) || 1

      if (!productCode) {
        errors.push({ row: rowNum, field: "product_code", message: "Bundle product_code is required" })
        continue
      }

      if (!componentProductCode) {
        errors.push({ row: rowNum, field: "component_product_code", message: "Component product_code is required" })
        continue
      }

      const bundleData = {
        category_code: row.category_code ? String(row.category_code) : null,
        product_code: productCode,
        name: row.name ? String(row.name) : null,
        size: row.size ? String(row.size) : null,
        length_mm: row.length_mm ? Number(row.length_mm) : null,
        width_mm: row.width_mm ? Number(row.width_mm) : null,
        height_mm: row.height_mm ? Number(row.height_mm) : null,
        weight_gms: row.weight_gms ? Number(row.weight_gms) : null,
        isbn: row.isbn ? String(row.isbn) : null,
        color: row.color ? String(row.color) : null,
        brand: row.brand ? String(row.brand) : null,
        base_price: row.base_price ? Number(row.base_price) : null,
        cost_price: row.cost_price ? Number(row.cost_price) : null,
        mrp: row.mrp ? Number(row.mrp) : null,
        hsn_code: row.hsn_code ? String(row.hsn_code) : null,
        material: row.material ? String(row.material) : null,
        enabled: row.enabled === true || row.enabled === "true" || row.enabled === null ? true : false,
        type: row.type ? String(row.type) : "BUNDLE",
        tax_calculation_type: row.tax_calculation_type ? String(row.tax_calculation_type) : "PRICE_OF_BUNDLE_SKU",
        component_product_code: componentProductCode,
        internal_style_name: row.internal_style_name ? String(row.internal_style_name) : null,
        component_quantity: componentQuantity,
        component_price: row.component_price ? Number(row.component_price) : null,
      }

      // Check if this exact bundle component row already exists
      const { data: existing } = await supabaseAdmin
        .from("bundle_reference")
        .select("*")
        .eq("product_code", productCode)
        .eq("component_product_code", componentProductCode)
        .maybeSingle()

      if (existing) {
        // Check if values are the same
        const isSame =
          existing.category_code === bundleData.category_code &&
          existing.name === bundleData.name &&
          existing.size === bundleData.size &&
          existing.length_mm === bundleData.length_mm &&
          existing.width_mm === bundleData.width_mm &&
          existing.height_mm === bundleData.height_mm &&
          existing.weight_gms === bundleData.weight_gms &&
          existing.isbn === bundleData.isbn &&
          existing.color === bundleData.color &&
          existing.brand === bundleData.brand &&
          existing.base_price === bundleData.base_price &&
          existing.cost_price === bundleData.cost_price &&
          existing.mrp === bundleData.mrp &&
          existing.hsn_code === bundleData.hsn_code &&
          existing.material === bundleData.material &&
          existing.internal_style_name === bundleData.internal_style_name &&
          existing.component_quantity === bundleData.component_quantity &&
          existing.component_price === bundleData.component_price

        if (isSame) {
          skipped.push({
            row: rowNum,
            name: `${productCode} → ${componentProductCode}`,
            reason: "No changes detected",
          })
          continue
        }

        // Update existing bundle component
        const { error } = await supabaseAdmin
          .from("bundle_reference")
          .update(bundleData)
          .eq("id", existing.id)

        if (error) {
          errors.push({ row: rowNum, field: "", message: error.message })
        } else {
          successCount++
        }
      } else {
        // Insert new bundle component
        const { error } = await supabaseAdmin
          .from("bundle_reference")
          .insert([bundleData])

        if (error) {
          errors.push({ row: rowNum, field: "", message: error.message })
        } else {
          successCount++
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      errors.push({ row: rowNum, field: "", message })
    }
  }

  return { successCount, errorCount: errors.length, skippedCount: skipped.length, errors, skipped }
}
