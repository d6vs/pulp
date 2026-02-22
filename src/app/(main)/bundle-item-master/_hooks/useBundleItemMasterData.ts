"use client"

import { useState, useEffect, useCallback } from "react"
import { getCategories } from "@/lib/actions/master-data"
import { getBundleItemMaster } from "../actions"
import type { Category, BundleItemMaster } from "@/types/common"
import { filterBundleCategories, filterNonBundleCategories } from "@/types/common"

export function useBundleItemMasterData() {
  const [bundleCategories, setBundleCategories] = useState<Category[]>([])
  const [individualCategories, setIndividualCategories] = useState<Category[]>([])
  const [bundleItemMasterData, setBundleItemMasterData] = useState<BundleItemMaster[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [categoriesResult, itemMasterResult] = await Promise.all([
        getCategories(),
        getBundleItemMaster(),
      ])

      if (categoriesResult.data) {
        setBundleCategories(filterBundleCategories(categoriesResult.data))
        setIndividualCategories(filterNonBundleCategories(categoriesResult.data))
      }

      if (itemMasterResult.data) {
        setBundleItemMasterData(itemMasterResult.data)
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

  const refetchBundleItemMaster = useCallback(async () => {
    const result = await getBundleItemMaster()
    if (result.data) {
      setBundleItemMasterData(result.data)
    }
  }, [])

  return {
    bundleCategories,
    individualCategories,
    bundleItemMasterData,
    isLoading,
    refetchBundleItemMaster,
  }
}
