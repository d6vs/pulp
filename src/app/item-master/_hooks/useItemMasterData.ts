import { useState, useEffect } from "react"
import { getCategories } from "../../master-data/actions"
import { getItemMaster } from "../actions"

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
        if (categoriesResult.data) setCategories(categoriesResult.data)
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

  const refetchItemMaster = async () => {
    const result = await getItemMaster(selectedDate)
    if (result.data) {
      setItemMasterData(result.data)
    }
  }

  return {
    categories,
    itemMasterData,
    selectedDate,
    setSelectedDate,
    isLoading,
    refetchItemMaster,
  }
}
