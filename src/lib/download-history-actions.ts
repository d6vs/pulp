"use server"

import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"
import { createClient } from "@/lib/supabase/server"

export type DownloadType = "purchase_orders" | "item_master" | "bundle_item_master"

export type DownloadHistoryEntry = {
  id: string
  filename: string
  download_type: DownloadType
  created_at: string
}

export async function addDownloadHistory(filename: string, downloadType: DownloadType) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: "User not authenticated" }
    }

    const { data, error } = await supabaseAdmin
      .from("download_history")
      .insert([{ user_id: user.id, filename, download_type: downloadType }])
      .select()
      .single()

    if (error) {
      console.error("Error adding download history:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Failed to add download history" }
  }
}

export async function getDownloadHistory(downloadType: DownloadType) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: [], error: "User not authenticated" }
    }

    const { data, error } = await supabaseAdmin
      .from("download_history")
      .select("id, filename, download_type, created_at")
      .eq("user_id", user.id)
      .eq("download_type", downloadType)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching download history:", error)
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: [], error: "Failed to fetch download history" }
  }
}

export async function clearDownloadHistory(downloadType: DownloadType) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    const { error } = await supabaseAdmin
      .from("download_history")
      .delete()
      .eq("user_id", user.id)
      .eq("download_type", downloadType)

    if (error) {
      console.error("Error clearing download history:", error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { success: false, error: "Failed to clear download history" }
  }
}
