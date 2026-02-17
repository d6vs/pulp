"use client"

import { useState, useEffect, useCallback } from "react"
import { getCategories } from "@/app/purchase-orders/actions"
import { getBundleItemMaster } from "../actions"

type Category = {
  id: string
  category_name: string
  category_code: string | null
  sku_schema: number
  hsn_code: string | null
  category_type: string | null
}

type BundleItemMaster = {
  id: string
  category_code: string | null
  product_code: string | null
  name: string | null
  description: string | null
  scan_identifier: string | null
  length_mm: number | null
  width_mm: number | null
  height_mm: number | null
  weight_gms: number | null
  ean: string | null
  upc: string | null
  isbn: string | null
  color: string | null
  brand: string | null
  size: string | null
  requires_customization: boolean | null
  min_order_size: number | null
  tax_type_code: string | null
  gst_tax_type_code: string | null
  hsn_code: string | null
  tags: string | null
  tat: string | null
  image_url: string | null
  product_page_url: string | null
  item_detail_fields: string | null
  cost_price: number | null
  mrp: number | null
  base_price: number | null
  enabled: boolean | null
  resync_inventory: boolean | null
  type: string | null
  scan_type: string | null
  component_product_code: string | null
  component_quantity: number | null
  component_price: number | null
  batch_group_code: string | null
  dispatch_expiry_tolerance: number | null
  shelf_life: number | null
  tax_calculation_type: string | null
  expirable: boolean | null
  determine_expiry_from: string | null
  grn_expiry_tolerance: number | null
  return_expiry_tolerance: number | null
  expiry_date: string | null
  sku_type: string | null
  material: string | null
  style: string | null
  created_at: string
  updated_at: string | null
}

export function useBundleItemMasterData() {
  const [bundleCategories, setBundleCategories] = useState<Category[]>([])
  const [individualCategories, setIndividualCategories] = useState<Category[]>([])
  const [bundleItemMasterData, setBundleItemMasterData] = useState<BundleItemMaster[]>([])
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [categoriesResult, itemMasterResult] = await Promise.all([
        getCategories(),
        getBundleItemMaster(selectedDate),
      ])

      if (categoriesResult.data) {
        // Filter for bundle categories by category_type (case-insensitive)
        const bundleCats = categoriesResult.data.filter(
          (c: Category) => c.category_type?.toLowerCase().trim() === "bundle"
        )
        setBundleCategories(bundleCats)

        // Filter for individual categories (non-Bundle)
        const individualCats = categoriesResult.data.filter(
          (c: Category) => c.category_type?.toLowerCase().trim() !== "bundle"
        )
        setIndividualCategories(individualCats)
      }

      if (itemMasterResult.data) {
        setBundleItemMasterData(itemMasterResult.data)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetchBundleItemMaster = async () => {
    const result = await getBundleItemMaster(selectedDate)
    if (result.data) {
      setBundleItemMasterData(result.data)
    }
  }

  return {
    bundleCategories,
    individualCategories,
    bundleItemMasterData,
    selectedDate,
    setSelectedDate,
    isLoading,
    refetchBundleItemMaster,
  }
}
