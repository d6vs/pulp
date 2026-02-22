import { useState, useEffect, useCallback } from "react"
import { getCategories } from "@/lib/actions/master-data"
import { getItemMaster } from "../actions"
import type { Category } from "@/types/common"
import { filterIndividualCategories } from "@/types/common"

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
        setCategories(filterIndividualCategories(categoriesResult.data))
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
