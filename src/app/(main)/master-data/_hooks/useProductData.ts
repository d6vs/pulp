import { useState, useEffect, useCallback } from "react"
import { getProducts, getBundleReferences } from "../actions"
import { getCategories, getPrints, getSizes } from "@/lib/actions/master-data"
import type { Category, Print, Size, Product, BundleReference } from "@/types/common"
import { filterBundleCategories, filterNonBundleCategories } from "@/types/common"

export function useProductData() {
  const [prints, setPrints] = useState<Print[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [bundleCategories, setBundleCategories] = useState<Category[]>([])
  const [individualCategories, setIndividualCategories] = useState<Category[]>([])
  const [sizes, setSizes] = useState<Size[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [bundleReferences, setBundleReferences] = useState<BundleReference[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [printsResult, categoriesResult, sizesResult, productsResult, bundleRefsResult] = await Promise.all([
        getPrints(),
        getCategories(),
        getSizes(),
        getProducts(),
        getBundleReferences(),
      ])

      if (printsResult.data) setPrints(printsResult.data)
      if (categoriesResult.data) {
        setCategories(categoriesResult.data)
        setBundleCategories(filterBundleCategories(categoriesResult.data))
        setIndividualCategories(filterNonBundleCategories(categoriesResult.data))
      }
      if (sizesResult.data) setSizes(sizesResult.data)
      if (productsResult.data) setProducts(productsResult.data as Product[])
      if (bundleRefsResult.data) setBundleReferences(bundleRefsResult.data as BundleReference[])
    } catch (error) {
      console.error("Error fetching product data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Memoized refetch functions for realtime subscriptions
  const refetchPrints = useCallback(async () => {
    const result = await getPrints()
    if (result.data) setPrints(result.data)
  }, [])

  const refetchCategories = useCallback(async () => {
    const result = await getCategories()
    if (result.data) {
      setCategories(result.data)
      setBundleCategories(filterBundleCategories(result.data))
      setIndividualCategories(filterNonBundleCategories(result.data))
    }
  }, [])

  const refetchSizes = useCallback(async () => {
    const result = await getSizes()
    if (result.data) setSizes(result.data)
  }, [])

  const refetchProducts = useCallback(async () => {
    const result = await getProducts()
    if (result.data) setProducts(result.data as Product[])
  }, [])

  const refetchBundleReferences = useCallback(async () => {
    const result = await getBundleReferences()
    if (result.data) setBundleReferences(result.data as BundleReference[])
  }, [])

  return {
    prints,
    categories,
    bundleCategories,
    individualCategories,
    sizes,
    products,
    bundleReferences,
    isLoading,
    refetchPrints,
    refetchCategories,
    refetchSizes,
    refetchProducts,
    refetchBundleReferences,
  }
}
