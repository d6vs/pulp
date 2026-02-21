"use server"

import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"

// Fixed defaults for item master
const FIXED_DEFAULTS = {
  length_mm: 210,
  width_mm: 180,
  height_mm: 20,
  isbn: "1",
  brand: "Orange Sugar",
}

export async function generateItemMaster(
  categoryId: string,
  categoryName: string,
  printId: string,
  printName: string,
  sizeIds: string[]
) {
  try {
    const results: { productCode: string; error: string | null }[] = []

    for (const sizeId of sizeIds) {
      // Find the product matching category + print + size
      const { data: products, error: productsError } = await supabaseAdmin
        .from("products")
        .select("id, product_code, name, color, hsn_code, cost_price, base_price, mrp, material")
        .eq("category_id", categoryId)
        .eq("size_id", sizeId)
        .eq("print_id", printId)

      if (productsError) {
        console.error(`[ItemMaster] DB error for category=${categoryId}, size=${sizeId}:`, productsError.message)
        results.push({ productCode: "", error: productsError.message })
        continue
      }

      if (!products || products.length === 0) {
        console.error(`[ItemMaster] No product found for category=${categoryId}, size=${sizeId}, print=${printId}`)
        results.push({ productCode: "", error: `No product found for this category/print/size combination` })
        continue
      }

      const matchedProduct = products[0]

      // Get size name
      const { data: sizeData } = await supabaseAdmin
        .from("sizes")
        .select("size_name")
        .eq("id", sizeId)
        .single()

      // Get weight
      const { data: weightData } = await supabaseAdmin
        .from("product_weights")
        .select("weight")
        .eq("category_id", categoryId)
        .eq("size_id", sizeId)
        .maybeSingle()

      // Insert into item_master
      const { error: insertError } = await supabaseAdmin
        .from("item_master")
        .upsert(
          {
            category_code: categoryName,
            product_code: matchedProduct.product_code,
            name: matchedProduct.name,
            color: matchedProduct.color || null,
            size: sizeData?.size_name || null,
            weight_gms: weightData?.weight || null,
            hsn_code: matchedProduct.hsn_code || null,
            cost_price: matchedProduct.cost_price || null,
            base_price: matchedProduct.base_price || null,
            mrp: matchedProduct.mrp || null,
            material: matchedProduct.material || null,
            style: printName,
            length_mm: FIXED_DEFAULTS.length_mm,
            width_mm: FIXED_DEFAULTS.width_mm,
            height_mm: FIXED_DEFAULTS.height_mm,
            isbn: FIXED_DEFAULTS.isbn,
            brand: FIXED_DEFAULTS.brand,
            product_id: matchedProduct.id,
            is_visible: true,
          },
          { onConflict: "product_code" }
        )

      if (insertError) {
        results.push({ productCode: matchedProduct.product_code, error: insertError.message })
      } else {
        results.push({ productCode: matchedProduct.product_code, error: null })
      }
    }

    const successCount = results.filter((r) => !r.error).length
    const errorCount = results.filter((r) => r.error).length

    return { successCount, errorCount, results, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { successCount: 0, errorCount: 0, results: [], error: "Something went wrong while creating items. Please try again." }
  }
}

export async function getItemMaster() {
  try {
    const { data, error } = await supabaseAdmin
      .from("item_master")
      .select("*")
      .eq("is_visible", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching item master:", error)
      return { data: null, error: error.message }
    }
    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Unable to load items. Please refresh the page and try again." }
  }
}

export async function deleteItemMasterByDate() {
  try {
    const { data, error } = await supabaseAdmin
      .from("item_master")
      .update({ is_visible: false })
      .eq("is_visible", true)
      .select()

    if (error) {
      console.error("Error hiding item master:", error)
      return { deletedCount: 0, error: error.message }
    }

    return { deletedCount: data?.length || 0, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { deletedCount: 0, error: "Unable to hide items. Please try again." }
  }
}
