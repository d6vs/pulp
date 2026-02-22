"use server"

import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"
import { sortSizesByCustomOrder } from "@/lib/size-utils"

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
