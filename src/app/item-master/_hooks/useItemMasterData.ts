import { useState, useEffect, useCallback } from "react"
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
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [categoriesResult, itemMasterResult] = await Promise.all([
        getCategories(),
        getItemMaster(),
      ])

      if (categoriesResult.data) {
        setCategories(categoriesResult.data.filter((c) => ![3, 4, 5].includes(c.sku_schema)))
      }

      if (itemMasterResult.data) {
        setItemMasterData(itemMasterResult.data)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetchItemMaster = useCallback(async () => {
    const result = await getItemMaster()
    if (result.data) {
      setItemMasterData(result.data)
    }
  }, [])

  return {
    categories,
    itemMasterData,
    isLoading,
    refetchItemMaster,
  }
}
