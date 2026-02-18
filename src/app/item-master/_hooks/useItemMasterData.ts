import { useState, useEffect, useCallback } from "react"
import { getCategories } from "../../master-data/actions"
import { getItemMaster } from "../actions"
import { useRealtimeSubscription, useRefreshOnFocus } from "@/hooks/useRealtimeSubscription"

type Category = {
  id: string
  category_name: string
  category_code: string | null
  sku_schema: number
  hsn_code: string | null
}

export function useItemMasterData() {
  const [categories, setCategories] = useState<Category[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [itemMasterData, setItemMasterData] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date()
    const istOffset = 5.5 * 60 * 60 * 1000
    const istDate = new Date(now.getTime() + istOffset)
    return istDate.toISOString().split("T")[0]
  })
  const [isLoading, setIsLoading] = useState(true)

  // Fetch master data
  useEffect(() => {
    async function fetchMasterData() {
      setIsLoading(true)
      try {
        const categoriesResult = await getCategories()
        if (categoriesResult.data) setCategories(categoriesResult.data.filter((c) => ![3, 4, 5].includes(c.sku_schema)))
      } catch (error) {
        console.error("Error fetching master data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMasterData()
  }, [])

  // Fetch item master when date changes
  useEffect(() => {
    async function fetchItemMaster() {
      const result = await getItemMaster(selectedDate)
      if (result.data) {
        setItemMasterData(result.data)
      }
    }
    fetchItemMaster()
  }, [selectedDate])

  const refetchItemMaster = useCallback(async () => {
    const result = await getItemMaster(selectedDate)
    if (result.data) {
      setItemMasterData(result.data)
    }
  }, [selectedDate])

  // Real-time subscription: auto-refresh when data changes
  useRealtimeSubscription({
    table: "item_master",
    onAnyChange: refetchItemMaster,
  })

  // Refresh when user returns to this tab
  useRefreshOnFocus(refetchItemMaster)

  return {
    categories,
    itemMasterData,
    selectedDate,
    setSelectedDate,
    isLoading,
    refetchItemMaster,
  }
}
