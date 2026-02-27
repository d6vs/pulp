"use server"

import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"
import { createClient } from "@/lib/supabase/server"

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
    // Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabaseAdmin
      .from("purchase_orders")
      .insert([{ ...purchaseOrder, user_id: user?.id || null }])
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

export async function getPurchaseOrdersByDate() {
  try {
    const { data, error } = await supabaseAdmin
      .from("purchase_orders")
      .select("*")
      .eq("is_visible", true)
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

export async function deletePurchaseOrdersByDate() {
  try {
    const { data, error } = await supabaseAdmin
      .from("purchase_orders")
      .update({ is_visible: false })
      .eq("is_visible", true)
      .select()

    if (error) {
      console.error("Error hiding purchase orders:", error)
      return { data: null, error: error.message, deletedCount: 0 }
    }

    return { data, error: null, deletedCount: data?.length || 0 }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to hide purchase orders", deletedCount: 0 }
  }
}

