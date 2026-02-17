"use client"

import { useState } from "react"
import { usePurchaseOrderData } from "./_hooks/usePurchaseOrderData"
import { OrderFormInputs } from "./_components/OrderFormInputs"
import { OrderSummaryCard } from "./_components/OrderSummaryCard"
import { TodaysOrdersList } from "./_components/TodaysOrdersList"
import { toast } from "sonner"
import type { Category, Print, SizeQuantity } from "./types"
import { isBundleSchema } from "./types"
import { createPurchaseOrder, getPrintsByCategory, getSizesByCategoryAndPrint, getProductSKU } from "./actions"

export default function PurchaseOrdersPage() {
  const {
    categories,
    prints,
    sizes,
    purchaseOrders,
    selectedDate,
    setSelectedDate,
    isLoading,
    refetchPurchaseOrders,
  } = usePurchaseOrderData()

  // Form state
  const [categoryInput, setCategoryInput] = useState("")
  const [printInput, setPrintInput] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedPrints, setSelectedPrints] = useState<Print[]>([])
  const [filteredPrints, setFilteredPrints] = useState<Print[]>([])
  const [filteredSizes, setFilteredSizes] = useState<{ id: string; size_name: string }[]>([])
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set())
  const [sizeQuantities, setSizeQuantities] = useState<SizeQuantity[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingSizes, setIsLoadingSizes] = useState(false)

  const isBundle = selectedCategory ? isBundleSchema(selectedCategory.sku_schema) : false

  // Fetch prints when category changes
  const handleCategorySelect = async (category: Category | null) => {
    setSelectedCategory(category)
    // Reset print and size selection
    setSelectedPrints([])
    setPrintInput("")
    setFilteredPrints([])
    setFilteredSizes([])
    setSelectedSizes(new Set())
    setSizeQuantities([])

    if (category) {
      const printsResult = await getPrintsByCategory(category.id)
      if (printsResult.data) {
        setFilteredPrints(printsResult.data)
      }
    }
  }

  // Handle print selection — single or multi based on bundle type
  const handlePrintSelect = async (print: Print) => {
    let newPrints: Print[]
    if (isBundle) {
      // Toggle print in array for bundles
      const exists = selectedPrints.find((p) => p.id === print.id)
      newPrints = exists
        ? selectedPrints.filter((p) => p.id !== print.id)
        : [...selectedPrints, print]
      setPrintInput("")
    } else {
      // Single select for non-bundles
      newPrints = [print]
      setPrintInput(print.official_print_name)
    }
    setSelectedPrints(newPrints)

    // Reset sizes and fetch new sizes based on category + print
    setSelectedSizes(new Set())
    setSizeQuantities([])
    setFilteredSizes([])

    if (selectedCategory && newPrints.length > 0) {
      setIsLoadingSizes(true)
      const printIds = newPrints.map((p) => p.id)
      const sizesResult = await getSizesByCategoryAndPrint(selectedCategory.id, printIds)
      if (sizesResult.data) {
        setFilteredSizes(sizesResult.data)
      }
      setIsLoadingSizes(false)
    }
  }

  // Remove a print from selected prints (for bundles)
  const handleRemovePrint = async (printId: string) => {
    const newPrints = selectedPrints.filter((p) => p.id !== printId)
    setSelectedPrints(newPrints)

    // Reset sizes and fetch new sizes based on category + remaining prints
    setSelectedSizes(new Set())
    setSizeQuantities([])
    setFilteredSizes([])

    if (selectedCategory && newPrints.length > 0) {
      setIsLoadingSizes(true)
      const printIds = newPrints.map((p) => p.id)
      const sizesResult = await getSizesByCategoryAndPrint(selectedCategory.id, printIds)
      if (sizesResult.data) {
        setFilteredSizes(sizesResult.data)
      }
      setIsLoadingSizes(false)
    }
  }

  // Handle size selection toggle
  const handleSizeToggle = async (sizeName: string) => {
    const isRemoving = selectedSizes.has(sizeName)

    if (isRemoving) {
      setSelectedSizes((prev) => {
        const newSet = new Set(prev)
        newSet.delete(sizeName)
        return newSet
      })
      setSizeQuantities((prevQty) => prevQty.filter((sq) => sq.size !== sizeName))
    } else {
      // Find size record to get sizeId
      const sizeRecord = filteredSizes.find((s) => s.size_name === sizeName)
      const sizeId = sizeRecord?.id || null

      // Fetch SKU and cost_price from database
      let sku: string | null = null
      let costPrice: number = 0
      if (selectedCategory && selectedPrints.length > 0) {
        const printIds = selectedPrints.map((p) => p.id)
        const skuResult = await getProductSKU(selectedCategory.id, printIds, sizeId)
        sku = skuResult.data?.sku || null
        costPrice = skuResult.data?.cost_price || 0
      }

      setSelectedSizes((prev) => new Set(prev).add(sizeName))
      setSizeQuantities((prevQty) => {
        if (prevQty.some((sq) => sq.size === sizeName)) {
          return prevQty
        }
        return [...prevQty, { size: sizeName, sizeId, quantity: 1, cost_price: costPrice, sku }]
      })
    }
  }

  // Handle quantity changes
  const handleQuantityChange = (sizeName: string, delta: number) => {
    setSizeQuantities((prev) =>
      prev.map((sq) => (sq.size === sizeName ? { ...sq, quantity: Math.max(1, sq.quantity + delta) } : sq))
    )
  }

  const handleQuantityInput = (sizeName: string, value: string) => {
    // Allow empty string for clearing input
    if (value === "") {
      setSizeQuantities((prev) => prev.map((sq) => (sq.size === sizeName ? { ...sq, quantity: 0 } : sq)))
      return
    }
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setSizeQuantities((prev) => prev.map((sq) => (sq.size === sizeName ? { ...sq, quantity: numValue } : sq)))
    }
  }

  const handleCostPriceChange = (sizeName: string, value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setSizeQuantities((prev) => prev.map((sq) => (sq.size === sizeName ? { ...sq, cost_price: numValue } : sq)))
    } else if (value === "") {
      setSizeQuantities((prev) => prev.map((sq) => (sq.size === sizeName ? { ...sq, cost_price: 0 } : sq)))
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedCategory || selectedPrints.length === 0) {
      toast.error("Please select category and print name(s)")
      return
    }

    if (sizeQuantities.length === 0) {
      toast.error("Please select at least one size")
      return
    }

    const hasInvalidQuantity = sizeQuantities.some((sq) => sq.quantity < 1)
    if (hasInvalidQuantity) {
      toast.error("Please enter a valid quantity for all sizes (must be at least 1)")
      return
    }

    const hasInvalidCostPrice = sizeQuantities.some((sq) => sq.cost_price <= 0)
    if (hasInvalidCostPrice) {
      toast.error("Please enter a valid cost price for all sizes (must be greater than 0)")
      return
    }

    setIsSubmitting(true)

    try {
      const printNames = selectedPrints.map((p) => p.official_print_name).join(", ")

      // Validate all sizes have SKUs
      const missingSku = sizeQuantities.find((sq) => !sq.sku)
      if (missingSku) {
        toast.error(`Product not found for size "${missingSku.size}". Please ensure the product exists in the database.`)
        setIsSubmitting(false)
        return
      }

      // Build orders using SKU from sizeQuantities
      const orders = sizeQuantities.map((sizeQty) => ({
        sku: sizeQty.sku!,
        category: selectedCategory.category_name,
        print_name: printNames,
        size: sizeQty.size,
        cost_price: sizeQty.cost_price,
        quantity: sizeQty.quantity,
        po_date: selectedDate,
      }))

      const results = await Promise.all(orders.map((order) => createPurchaseOrder(order)))

      const hasErrors = results.some((result) => result.error)
      if (hasErrors) {
        toast.error("Some orders failed to create. Please check the console for details.")
        console.error("Failed orders:", results.filter((r) => r.error))
      } else {
        toast.success(`Successfully created ${sizeQuantities.length} purchase order(s)`)

        // Reset form
        setCategoryInput("")
        setPrintInput("")
        setSelectedCategory(null)
        setSelectedPrints([])
        setFilteredPrints([])
        setFilteredSizes([])
        setSelectedSizes(new Set())
        setSizeQuantities([])

        // Refetch orders
        await refetchPurchaseOrders()
      }
    } catch (error) {
      console.error("Error creating purchase orders:", error)
      toast.error("Failed to create purchase orders")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading purchase order data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Date Selector */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-sm text-gray-500">Create and manage purchase orders</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">PO Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Top Section - Form and Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OrderFormInputs
            categories={categories}
            prints={filteredPrints}
            sizes={filteredSizes}
            categoryInput={categoryInput}
            setCategoryInput={setCategoryInput}
            printInput={printInput}
            setPrintInput={setPrintInput}
            selectedCategory={selectedCategory}
            setSelectedCategory={handleCategorySelect}
            selectedPrints={selectedPrints}
            onPrintSelect={handlePrintSelect}
            onRemovePrint={handleRemovePrint}
            isBundle={isBundle}
            selectedSizes={Array.from(selectedSizes)}
            onSizeToggle={handleSizeToggle}
            isLoadingSizes={isLoadingSizes}
          />

          <OrderSummaryCard
            sizeQuantities={sizeQuantities}
            onQuantityChange={handleQuantityChange}
            onQuantityInput={handleQuantityInput}
            onCostPriceChange={handleCostPriceChange}
            onRemoveSize={(sizeName) => {
              setSelectedSizes((prev) => {
                const newSet = new Set(prev)
                newSet.delete(sizeName)
                return newSet
              })
              setSizeQuantities((prev) => prev.filter((sq) => sq.size !== sizeName))
            }}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Bottom Section - Today's Orders List */}
        <TodaysOrdersList
          purchaseOrders={purchaseOrders}
          categories={categories}
          prints={prints}
          sizes={sizes}
          selectedDate={selectedDate}
          onRefetch={refetchPurchaseOrders}
        />
      </div>
    </div>
  )
}
