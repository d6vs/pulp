import { useState, useEffect, useCallback } from "react"
import { getCategories, getPrints, getSizes, getPurchaseOrdersByDate } from "../actions"
import type { Category, Print, Size, PurchaseOrder } from "../types"
import { useRealtimeSubscription, useRefreshOnFocus } from "@/hooks/useRealtimeSubscription"

export function usePurchaseOrderData() {
  const [categories, setCategories] = useState<Category[]>([])
  const [prints, setPrints] = useState<Print[]>([])
  const [sizes, setSizes] = useState<Size[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [selectedDate, setSelectedDate] = useState(() => {
    // Get current date in IST (UTC+5:30)
    const now = new Date()
    const istOffset = 5.5 * 60 * 60 * 1000 // 5 hours 30 minutes in milliseconds
    const istDate = new Date(now.getTime() + istOffset)
    return istDate.toISOString().split("T")[0]
  })
  const [isLoading, setIsLoading] = useState(true)

  // Fetch master data
  useEffect(() => {
    async function fetchMasterData() {
      setIsLoading(true)
      try {
        const [categoriesResult, printsResult, sizesResult] = await Promise.all([
          getCategories(),
          getPrints(),
          getSizes(),
        ])

        if (categoriesResult.data) setCategories(categoriesResult.data)
        if (printsResult.data) setPrints(printsResult.data)
        if (sizesResult.data) setSizes(sizesResult.data)
      } catch (error) {
        console.error("Error fetching master data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMasterData()
  }, [])

  // Fetch purchase orders when date changes
  useEffect(() => {
    async function fetchPurchaseOrders() {
      const result = await getPurchaseOrdersByDate(selectedDate)
      if (result.data) {
        setPurchaseOrders(result.data)
      }
    }
    fetchPurchaseOrders()
  }, [selectedDate])

  const refetchPurchaseOrders = useCallback(async () => {
    const result = await getPurchaseOrdersByDate(selectedDate)
    if (result.data) {
      setPurchaseOrders(result.data)
    }
  }, [selectedDate])

  const refetchMasterData = useCallback(async () => {
    const [categoriesResult, printsResult, sizesResult] = await Promise.all([
      getCategories(),
      getPrints(),
      getSizes(),
    ])
    if (categoriesResult.data) setCategories(categoriesResult.data)
    if (printsResult.data) setPrints(printsResult.data)
    if (sizesResult.data) setSizes(sizesResult.data)
  }, [])

  // Real-time subscription: auto-refresh when another user adds/updates/deletes orders
  useRealtimeSubscription({
    table: "purchase_orders",
    onAnyChange: refetchPurchaseOrders,
    showToasts: true,
    toastMessages: {
      insert: "New order added by another user",
      update: "Order updated by another user",
      delete: "Order deleted by another user",
    },
  })

  // Also listen for master data changes
  useRealtimeSubscription({
    table: "product_categories",
    onAnyChange: refetchMasterData,
    showToasts: false,
  })

  useRealtimeSubscription({
    table: "prints_name",
    onAnyChange: refetchMasterData,
    showToasts: false,
  })

  // Refresh when user returns to this tab
  useRefreshOnFocus(refetchPurchaseOrders)

  return {
    categories,
    prints,
    sizes,
    purchaseOrders,
    selectedDate,
    setSelectedDate,
    isLoading,
    refetchPurchaseOrders,
  }
}
