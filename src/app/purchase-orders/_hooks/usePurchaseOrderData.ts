import { useState, useEffect, useCallback } from "react"
import { getCategories, getPrints, getSizes, getPurchaseOrdersByDate } from "../actions"
import type { Category, Print, Size, PurchaseOrder } from "../types"

export function usePurchaseOrderData() {
  const [categories, setCategories] = useState<Category[]>([])
  const [prints, setPrints] = useState<Print[]>([])
  const [sizes, setSizes] = useState<Size[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch master data and purchase orders
  useEffect(() => {
    async function fetchMasterData() {
      setIsLoading(true)
      try {
        const [categoriesResult, printsResult, sizesResult, ordersResult] = await Promise.all([
          getCategories(),
          getPrints(),
          getSizes(),
          getPurchaseOrdersByDate(),
        ])

        if (categoriesResult.data) setCategories(categoriesResult.data.filter((c) => ![3, 4, 5].includes(c.sku_schema)))
        if (printsResult.data) setPrints(printsResult.data)
        if (sizesResult.data) setSizes(sizesResult.data)
        if (ordersResult.data) setPurchaseOrders(ordersResult.data)
      } catch (error) {
        console.error("Error fetching master data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMasterData()
  }, [])

  const refetchPurchaseOrders = useCallback(async () => {
    const result = await getPurchaseOrdersByDate()
    if (result.data) {
      setPurchaseOrders(result.data)
    }
  }, [])

  return {
    categories,
    prints,
    sizes,
    purchaseOrders,
    isLoading,
    refetchPurchaseOrders,
  }
}
