import { useState, useEffect, useCallback } from "react"
import { getPrints, getCategories, getSizes, getProducts } from "../actions"
import { useRealtimeSubscription, useRefreshOnFocus } from "@/hooks/useRealtimeSubscription"

type Print = {
  id: string
  official_print_name: string
  print_code: string | null
  color: string | null
}

type Category = {
  id: string
  category_name: string
  category_code: string | null
  sku_schema: number
  hsn_code: string | null
  size_in_product_name: boolean
  product_name_prefix: string | null
  category_type: string | null
}

type Size = {
  id: string
  size_name: string
}

type Product = {
  id: string
  product_code: string
  name: string
  product_categories: { category_name: string } | null
  sizes: { size_name: string } | null
}

export function useProductData() {
  const [prints, setPrints] = useState<Print[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [bundleCategories, setBundleCategories] = useState<Category[]>([])
  const [individualCategories, setIndividualCategories] = useState<Category[]>([])
  const [sizes, setSizes] = useState<Size[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [printsResult, categoriesResult, sizesResult, productsResult] = await Promise.all([
        getPrints(),
        getCategories(),
        getSizes(),
        getProducts(),
      ])

      if (printsResult.data) setPrints(printsResult.data)
      if (categoriesResult.data) {
        setCategories(categoriesResult.data)
        // Filter bundle categories
        const bundleCats = categoriesResult.data.filter(
          (c: Category) => c.category_type?.toLowerCase().trim() === "bundle"
        )
        setBundleCategories(bundleCats)
        // Filter individual categories (non-bundle)
        const individualCats = categoriesResult.data.filter(
          (c: Category) => c.category_type?.toLowerCase().trim() !== "bundle"
        )
        setIndividualCategories(individualCats)
      }
      if (sizesResult.data) setSizes(sizesResult.data)
      if (productsResult.data) setProducts(productsResult.data)
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
      const bundleCats = result.data.filter(
        (c: Category) => c.category_type?.toLowerCase().trim() === "bundle"
      )
      setBundleCategories(bundleCats)
      const individualCats = result.data.filter(
        (c: Category) => c.category_type?.toLowerCase().trim() !== "bundle"
      )
      setIndividualCategories(individualCats)
    }
  }, [])

  const refetchSizes = useCallback(async () => {
    const result = await getSizes()
    if (result.data) setSizes(result.data)
  }, [])

  const refetchProducts = useCallback(async () => {
    const result = await getProducts()
    if (result.data) setProducts(result.data)
  }, [])

  // Real-time subscriptions: auto-refresh when data changes
  useRealtimeSubscription({
    table: "prints_name",
    onAnyChange: refetchPrints,
  })

  useRealtimeSubscription({
    table: "product_categories",
    onAnyChange: refetchCategories,
  })

  useRealtimeSubscription({
    table: "sizes",
    onAnyChange: refetchSizes,
  })

  useRealtimeSubscription({
    table: "products",
    onAnyChange: refetchProducts,
  })

  // Also refresh when user returns to this tab
  useRefreshOnFocus(fetchData)

  return {
    prints,
    categories,
    bundleCategories,
    individualCategories,
    sizes,
    products,
    isLoading,
    refetchPrints,
    refetchCategories,
    refetchSizes,
    refetchProducts,
  }
}
