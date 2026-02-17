"use client"

import { useEffect, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { toast } from "sonner"

// Create a client-side Supabase client for realtime
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
        toast.info(messages[event], {
          description: "The list has been refreshed.",
          duration: 3000,
        })
      }
    },
    [table, onInsert, onUpdate, onDelete, onAnyChange, showToasts, toastMessages]
  )

  useEffect(() => {
    const channel = supabaseClient
      .channel(`${table}-changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema,
          table,
        },
        (payload) => {
          handleChange(payload.eventType as RealtimeEvent, payload.new as Record<string, unknown>)
        }
      )
      .subscribe()

    return () => {
      supabaseClient.removeChannel(channel)
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
