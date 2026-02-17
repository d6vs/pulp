"use client"

import { useEffect, useCallback } from "react"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { toast } from "sonner"

// Lazy singleton - only create client when actually needed (at runtime, not build time)
let supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null

  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      console.warn("[Realtime] Supabase credentials not configured")
      return null
    }

    supabaseClient = createClient(url, key)
  }

  return supabaseClient
}

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE"

type UseRealtimeSubscriptionOptions = {
  table: string
  schema?: string
  onInsert?: (payload: Record<string, unknown>) => void
  onUpdate?: (payload: Record<string, unknown>) => void
  onDelete?: (payload: Record<string, unknown>) => void
  onAnyChange?: () => void
  showToasts?: boolean
  toastMessages?: {
    insert?: string
    update?: string
    delete?: string
  }
}

/**
 * Hook to subscribe to real-time changes on a Supabase table
 *
 * Usage:
 * ```tsx
 * useRealtimeSubscription({
 *   table: "bundle_item_master",
 *   onAnyChange: () => refetchData(),
 *   showToasts: true,
 *   toastMessages: {
 *     insert: "New bundle added by another user",
 *     delete: "A bundle was deleted"
 *   }
 * })
 * ```
 */
export function useRealtimeSubscription({
  table,
  schema = "public",
  onInsert,
  onUpdate,
  onDelete,
  onAnyChange,
  showToasts = false,
  toastMessages = {},
}: UseRealtimeSubscriptionOptions) {
  const handleChange = useCallback(
    (event: RealtimeEvent, payload: Record<string, unknown>) => {
      // Call specific handlers
      if (event === "INSERT" && onInsert) onInsert(payload)
      if (event === "UPDATE" && onUpdate) onUpdate(payload)
      if (event === "DELETE" && onDelete) onDelete(payload)

      // Call generic handler
      if (onAnyChange) onAnyChange()

      // Show toast notifications
      if (showToasts) {
        const messages = {
          INSERT: toastMessages.insert || `New ${table} record added`,
          UPDATE: toastMessages.update || `${table} record updated`,
          DELETE: toastMessages.delete || `${table} record deleted`,
        }
        toast(messages[event], {
          description: "The list has been refreshed.",
          duration: 3000,
          style: {
            background: "#FFF7ED",
            border: "1px solid #FB923C",
            color: "#C2410C",
          },
        })
      }
    },
    [table, onInsert, onUpdate, onDelete, onAnyChange, showToasts, toastMessages]
  )

  useEffect(() => {
    const client = getSupabaseClient()
    if (!client) {
      console.warn(`[Realtime] Supabase client not available, skipping subscription to ${table}`)
      return
    }

    console.log(`[Realtime] Subscribing to ${table}...`)

    const channel = client
      .channel(`${table}-changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema,
          table,
        },
        (payload) => {
          console.log(`[Realtime] Event received on ${table}:`, payload.eventType)
          handleChange(payload.eventType as RealtimeEvent, payload.new as Record<string, unknown>)
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] ${table} subscription status:`, status)
        if (status === "SUBSCRIBED") {
          console.log(`[Realtime] Successfully subscribed to ${table}`)
        } else if (status === "CHANNEL_ERROR") {
          console.error(`[Realtime] Error subscribing to ${table}`)
        }
      })

    return () => {
      console.log(`[Realtime] Unsubscribing from ${table}`)
      client.removeChannel(channel)
    }
  }, [table, schema, handleChange])
}

/**
 * Hook to refresh data when the browser tab regains focus
 * Useful as a fallback when realtime isn't enough
 */
export function useRefreshOnFocus(refreshFn: () => void) {
  useEffect(() => {
    const handleFocus = () => {
      refreshFn()
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [refreshFn])
}
