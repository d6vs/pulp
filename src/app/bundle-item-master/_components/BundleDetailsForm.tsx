"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AutocompleteInput } from "@/components/ui/autocomplete-input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2, X, ChevronDown, ChevronUp, Minus } from "lucide-react"
import { toast } from "sonner"
import { addBundlesToItemMasterFromReference, checkBundleExistsInReference, generateBundleItemMaster, BundleReferenceData } from "../actions"
import { getPrintsByCategory, getSizesByCategoryAndPrint } from "@/app/purchase-orders/actions"

type Category = {
  id: string
  category_name: string
  category_code: string | null
  sku_schema: number
  hsn_code: string | null
  category_type: string | null
}

type Print = {
  id: string
  official_print_name: string
  print_code: string | null
  color: string | null
}

type Size = {
  id: string
  size_name: string
}

type BundleProduct = {
  id: number
  category: Category | null
  categoryInput: string
  print: Print | null
  printInput: string
  prints: Print[]
  sizes: Size[]
  quantity: number
  isLoadingPrints: boolean
  isLoadingSizes: boolean
}

interface BundleDetailsFormProps {
  bundleCategories: Category[]
  individualCategories: Category[]
  onItemsAdded: () => Promise<void>
}

export function BundleDetailsForm({
  bundleCategories,
  individualCategories,
  onItemsAdded,
}: BundleDetailsFormProps) {
  // Bundle section expanded state
  const [isBundleSectionOpen, setIsBundleSectionOpen] = useState(false)

  // Bundle category state
  const [bundleCategoryInput, setBundleCategoryInput] = useState("")
  const [selectedBundleCategory, setSelectedBundleCategory] = useState<Category | null>(null)

  // Dynamic bundle products
  const [bundleProducts, setBundleProducts] = useState<BundleProduct[]>([])
  const [nextProductId, setNextProductId] = useState(1)

  // Final sizes selection
  const [selectedFinalSizes, setSelectedFinalSizes] = useState<Size[]>([])

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Bundle reference check state
  const [isCheckingReference, setIsCheckingReference] = useState(false)
  const [hasCheckedReference, setHasCheckedReference] = useState(false)
  const [missingBundles, setMissingBundles] = useState<string[]>([])
  const [existingBundles, setExistingBundles] = useState<BundleReferenceData[]>([])

  // Bundle creation configuration (for missing bundles)
  const [selectedPrintsForName, setSelectedPrintsForName] = useState<string[]>([])
  const [selectedPrintsForSKU, setSelectedPrintsForSKU] = useState<string[]>([])

  // Get unique prints from selected products
  const uniquePrints = useMemo(() => {
    const productsWithPrints = bundleProducts.filter((p) => p.print !== null)
    const prints = new Map<string, { code: string; name: string }>()

    productsWithPrints.forEach((p) => {
      if (p.print && p.print.print_code) {
        prints.set(p.print.print_code, {
          code: p.print.print_code,
          name: p.print.official_print_name,
        })
      }
    })

    return Array.from(prints.values())
  }, [bundleProducts])

  // Calculate intersection of sizes from all products
  const finalSizesOptions = useMemo(() => {
    const productsWithSizes = bundleProducts.filter((p) => p.sizes.length > 0)

    if (productsWithSizes.length === 0) return []
    if (productsWithSizes.length === 1) return productsWithSizes[0].sizes

    let intersection = productsWithSizes[0].sizes
    for (let i = 1; i < productsWithSizes.length; i++) {
      const currentSizeNames = new Set(productsWithSizes[i].sizes.map((s) => s.size_name))
      intersection = intersection.filter((s) => currentSizeNames.has(s.size_name))
    }
    return intersection
  }, [bundleProducts])

  // Extract unavailable size names from missingBundles
  const unavailableSizeNames = useMemo(() => {
    return new Set(
      missingBundles.map((bundle) => {
        const parts = bundle.split(" | ")
        return parts[parts.length - 1]
      })
    )
  }, [missingBundles])

  // Check if bundle exists in reference table
  const checkBundleExists = async () => {
    if (!selectedBundleCategory) return

    const productsWithPrints = bundleProducts.filter((p) => p.print !== null && p.category !== null)
    if (productsWithPrints.length === 0) {
      setHasCheckedReference(false)
      setMissingBundles([])
      setExistingBundles([])
      return
    }

    setIsCheckingReference(true)
    try {
      const individualProducts = productsWithPrints.map((p) => ({
        categoryName: p.category!.category_name,
        categoryCode: p.category!.category_code || "",
        printName: p.print!.official_print_name,
        printCode: p.print!.print_code || "",
      }))

      const sizeNames = finalSizesOptions.map((s) => s.size_name)

      if (sizeNames.length === 0) {
        setHasCheckedReference(false)
        setMissingBundles([])
        setExistingBundles([])
        return
      }

      const result = await checkBundleExistsInReference(
        selectedBundleCategory.category_name,
        individualProducts,
        sizeNames
      )

      setHasCheckedReference(true)
      setMissingBundles(result.missingBundles || [])
      setExistingBundles(result.existingBundles || [])

      // Initialize print selections with all prints if there are missing bundles
      if ((result.missingBundles || []).length > 0) {
        const allPrintCodes = uniquePrints.map((p) => p.code)
        setSelectedPrintsForName(allPrintCodes)
        setSelectedPrintsForSKU(allPrintCodes)
      }
    } catch (error) {
      console.error("Error checking bundle reference:", error)
      setHasCheckedReference(false)
      setMissingBundles([])
      setExistingBundles([])
    } finally {
      setIsCheckingReference(false)
    }
  }

  // Reset bundle check state when products change
  useEffect(() => {
    setHasCheckedReference(false)
    setMissingBundles([])
    setExistingBundles([])
    setSelectedPrintsForName([])
    setSelectedPrintsForSKU([])
  }, [selectedBundleCategory, bundleProducts, finalSizesOptions])

  const handleOpenBundleSection = () => {
    setIsBundleSectionOpen(true)
  }

  const handleCloseBundleSection = () => {
    setIsBundleSectionOpen(false)
    setBundleCategoryInput("")
    setSelectedBundleCategory(null)
    setBundleProducts([])
    setSelectedFinalSizes([])
    setHasCheckedReference(false)
    setMissingBundles([])
    setExistingBundles([])
    setSelectedPrintsForName([])
    setSelectedPrintsForSKU([])
  }

  const handleBundleCategorySelect = (category: Category | null) => {
    setSelectedBundleCategory(category)
    setBundleProducts([])
    setSelectedFinalSizes([])
  }

  const addBundleProduct = () => {
    const newProduct: BundleProduct = {
      id: nextProductId,
      category: null,
      categoryInput: "",
      print: null,
      printInput: "",
      prints: [],
      sizes: [],
      quantity: 1,
      isLoadingPrints: false,
      isLoadingSizes: false,
    }
    setBundleProducts([...bundleProducts, newProduct])
    setNextProductId(nextProductId + 1)
    setSelectedFinalSizes([])
  }

  const removeBundleProduct = (productId: number) => {
    setBundleProducts(bundleProducts.filter((p) => p.id !== productId))
    setSelectedFinalSizes([])
  }

  const updateBundleProduct = (productId: number, updates: Partial<BundleProduct>) => {
    setBundleProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...updates } : p))
    )
  }

  const handleProductCategorySelect = async (productId: number, category: Category | null) => {
    updateBundleProduct(productId, {
      category,
      categoryInput: category?.category_name || "",
      print: null,
      printInput: "",
      prints: [],
      sizes: [],
      isLoadingPrints: true,
    })
    setSelectedFinalSizes([])

    if (category) {
      const printsResult = await getPrintsByCategory(category.id)
      updateBundleProduct(productId, {
        prints: printsResult.data || [],
        isLoadingPrints: false,
      })
    } else {
      updateBundleProduct(productId, { isLoadingPrints: false })
    }
  }

  const handleProductPrintSelect = async (productId: number, print: Print | null, category: Category | null) => {
    updateBundleProduct(productId, {
      print,
      printInput: print?.official_print_name || "",
      sizes: [],
      isLoadingSizes: true,
    })
    setSelectedFinalSizes([])

    if (category && print) {
      const sizesResult = await getSizesByCategoryAndPrint(category.id, print.id)
      updateBundleProduct(productId, {
        sizes: sizesResult.data || [],
        isLoadingSizes: false,
      })
    } else {
      updateBundleProduct(productId, { isLoadingSizes: false })
    }
  }

  const handleFinalSizeToggle = (size: Size) => {
    setSelectedFinalSizes((prev) => {
      const exists = prev.some((s) => s.id === size.id)
      if (exists) return prev.filter((s) => s.id !== size.id)
      return [...prev, size]
    })
  }

  const handleSubmit = async () => {
    if (!selectedBundleCategory) {
      toast.error("Please select a bundle category")
      return
    }

    const productsWithPrints = bundleProducts.filter((p) => p.print !== null)
    if (productsWithPrints.length < 1) {
      toast.error("Please add at least 1 product with print")
      return
    }

    if (selectedFinalSizes.length === 0) {
      toast.error("Please select at least one final size")
      return
    }

    // Validate print selections if there are missing bundles
    if (hasCheckedReference && missingBundles.length > 0) {
      if (selectedPrintsForName.length === 0) {
        toast.error("Please select at least one print for the bundle name")
        return
      }
      if (selectedPrintsForSKU.length === 0) {
        toast.error("Please select at least one print for the bundle SKU")
        return
      }
    }

    setIsSubmitting(true)
    try {
      const individualProducts = productsWithPrints.map((p) => ({
        categoryId: p.category!.id,
        categoryCode: p.category!.category_code || "",
        printId: p.print!.id,
        printCode: p.print!.print_code || "",
        printName: p.print!.official_print_name,
        quantity: p.quantity,
      }))

      const selectedSizeNames = selectedFinalSizes.map((s) => s.size_name)

      // Check which bundles exist in reference
      const checkProducts = productsWithPrints.map((p) => ({
        categoryName: p.category!.category_name,
        categoryCode: p.category!.category_code || "",
        printName: p.print!.official_print_name,
        printCode: p.print!.print_code || "",
      }))

      const checkResult = await checkBundleExistsInReference(
        selectedBundleCategory.category_name,
        checkProducts,
        selectedSizeNames
      )

      let totalAdded = 0
      let totalErrors = 0

      // If some bundles exist in reference, add them
      if (checkResult.existingBundles.length > 0) {
        const result = await addBundlesToItemMasterFromReference(
          checkResult.existingBundles,
          individualProducts,
          selectedBundleCategory.id
        )

        if (result.error) {
          toast.error(result.error)
          setIsSubmitting(false)
          return
        }

        totalAdded += result.addedToMasterCount || 0
        totalErrors += result.errorCount || 0
      }

      // If some bundles are missing, create them in reference AND add to item master
      if (checkResult.missingBundles.length > 0) {
        // Extract size names from missing bundles
        const missingSizeNames = checkResult.missingBundles.map((bundle) => {
          const parts = bundle.split(" | ")
          return parts[parts.length - 1]
        })

        const createResult = await generateBundleItemMaster(
          selectedBundleCategory.id,
          selectedBundleCategory.category_name,
          individualProducts,
          missingSizeNames,
          true, // addToBundleItemMaster
          true, // createReferenceIfMissing
          selectedPrintsForName, // custom prints for name
          selectedPrintsForSKU // custom prints for SKU
        )

        if (createResult.error) {
          toast.error(createResult.error)
        } else {
          totalAdded += createResult.addedToMasterCount || 0
          totalErrors += createResult.errorCount || 0
        }
      }

      if (totalErrors > 0) {
        toast.warning(`${totalAdded} items added, ${totalErrors} failed`)
      } else {
        toast.success(`${totalAdded} bundle item(s) added to Item Master`)
        handleCloseBundleSection()
        await onItemsAdded()
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Not opened yet - show button
  if (!isBundleSectionOpen) {
    return (
      <Button
        onClick={handleOpenBundleSection}
        className="w-full h-14 text-lg font-semibold bg-orange-600 hover:bg-orange-700 shadow-lg"
      >
        <Plus className="h-6 w-6 mr-2" />
        Add Bundle Category
      </Button>
    )
  }

  return (
    <Card className="border-0 shadow-lg overflow-visible">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 bg-orange-600 text-white cursor-pointer"
        onClick={() => setIsBundleSectionOpen(!isBundleSectionOpen)}
      >
        <h2 className="text-lg font-semibold">Add Bundle Category</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleCloseBundleSection()
            }}
            className="text-white hover:bg-orange-700 h-8 px-2"
          >
            <X className="h-4 w-4" />
          </Button>
          {isBundleSectionOpen ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </div>

      <CardContent className="p-6 space-y-6 bg-white overflow-visible">
        {/* Bundle Category Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Bundle Category</Label>
          <AutocompleteInput
            value={bundleCategoryInput}
            onChange={setBundleCategoryInput}
            onSelect={(value) => {
              const cat = bundleCategories.find((c) => c.category_name === value)
              if (cat) {
                setBundleCategoryInput(value)
                handleBundleCategorySelect(cat)
              }
            }}
            options={bundleCategories.map((c) => c.category_name)}
            placeholder="Search bundle category..."
          />
          {selectedBundleCategory && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded font-mono">
                {selectedBundleCategory.category_code}
              </span>
              {selectedBundleCategory.hsn_code && (
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                  HSN: {selectedBundleCategory.hsn_code}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Individual Products Section */}
        {selectedBundleCategory && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Individual Product Details</h3>

            <div className="space-y-3">
              {bundleProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">
                      Product {index + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBundleProduct(product.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
                    {/* Category */}
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Category</Label>
                      <AutocompleteInput
                        value={product.categoryInput}
                        onChange={(value) => updateBundleProduct(product.id, { categoryInput: value })}
                        onSelect={(value) => {
                          const cat = individualCategories.find((c) => c.category_name === value)
                          if (cat) handleProductCategorySelect(product.id, cat)
                        }}
                        options={individualCategories.map((c) => c.category_name)}
                        placeholder="Select category..."
                      />
                    </div>

                    {/* Print */}
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Print</Label>
                      {product.isLoadingPrints ? (
                        <div className="flex items-center h-10 px-3">
                          <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                          <span className="ml-2 text-sm text-gray-400">Loading...</span>
                        </div>
                      ) : (
                        <AutocompleteInput
                          value={product.printInput}
                          onChange={(value) => updateBundleProduct(product.id, { printInput: value })}
                          onSelect={(value) => {
                            const print = product.prints.find((p) => p.official_print_name === value)
                            if (print) handleProductPrintSelect(product.id, print, product.category)
                          }}
                          options={product.prints.map((p) => p.official_print_name)}
                          placeholder={product.category ? "Select print..." : "Select category first"}
                          disabled={!product.category}
                        />
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Qty</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateBundleProduct(product.id, { quantity: Math.max(1, product.quantity - 1) })}
                          className="h-10 w-8 p-0"
                          disabled={product.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{product.quantity}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateBundleProduct(product.id, { quantity: product.quantity + 1 })}
                          className="h-10 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Sizes Preview */}
                  {product.print && (
                    <div className="mt-3">
                      <Label className="text-xs text-gray-500">Available Sizes</Label>
                      {product.isLoadingSizes ? (
                        <div className="flex items-center mt-1">
                          <Loader2 className="h-3 w-3 animate-spin text-orange-500" />
                          <span className="ml-1 text-xs text-gray-400">Loading...</span>
                        </div>
                      ) : product.sizes.length === 0 ? (
                        <p className="text-xs text-gray-400 mt-1">No sizes available</p>
                      ) : (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.sizes.map((size) => (
                            <span
                              key={size.id}
                              className="px-2 py-0.5 text-xs rounded bg-white text-gray-600 border border-gray-200"
                            >
                              {size.size_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addBundleProduct}
              className="w-full mt-3 border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-orange-300 hover:text-orange-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Product
            </Button>
          </div>
        )}

        {/* Final Sizes Selection */}
        {bundleProducts.filter((p) => p.print !== null).length >= 1 && finalSizesOptions.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Select Sizes</h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {finalSizesOptions.map((size) => {
                const isSelected = selectedFinalSizes.some((s) => s.id === size.id)
                const isUnavailable = hasCheckedReference && unavailableSizeNames.has(size.size_name)
                const isExisting = hasCheckedReference && !unavailableSizeNames.has(size.size_name)

                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => handleFinalSizeToggle(size)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                      isSelected
                        ? "bg-orange-500 text-white border-orange-500"
                        : isUnavailable
                        ? "bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-400"
                        : isExisting
                        ? "bg-green-50 text-green-700 border-green-300 hover:border-green-400"
                        : "bg-white text-gray-700 border-gray-300 hover:border-orange-300"
                    }`}
                  >
                    {size.size_name}
                    {hasCheckedReference && !isSelected && (
                      <span className={`ml-1 text-xs ${isUnavailable ? "text-amber-500" : "text-green-500"}`}>
                        {isUnavailable ? "(new)" : "(exists)"}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {hasCheckedReference && (
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-green-50 border border-green-300 inline-block" />
                  Exists in reference
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-amber-50 border border-amber-300 inline-block" />
                  Will be created
                </span>
              </div>
            )}
          </div>
        )}

        {/* Check Reference Button */}
        {bundleProducts.filter((p) => p.print !== null).length >= 1 && finalSizesOptions.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={checkBundleExists}
            disabled={isCheckingReference}
            className="w-full h-12 text-base font-semibold border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400"
          >
            {isCheckingReference ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              "Check which exist in reference"
            )}
          </Button>
        )}

        {/* Print Configuration for Missing Bundles */}
        {hasCheckedReference && missingBundles.length > 0 && (
          <div className="border-t border-gray-200 pt-4 space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-800 mb-1">
                ⚠ Configure New Bundle
              </p>
              <p className="text-xs text-amber-700">
                Select which prints to include in the bundle name and SKU
              </p>
            </div>

            {/* Print Selection for Name */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Prints in Bundle Name</Label>
              <Select
                onValueChange={(value) => {
                  if (!selectedPrintsForName.includes(value)) {
                    setSelectedPrintsForName((prev) => [...prev, value])
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select prints to include in name..." />
                </SelectTrigger>
                <SelectContent>
                  {uniquePrints
                    .filter((print) => !selectedPrintsForName.includes(print.code))
                    .map((print) => (
                      <SelectItem key={`name-${print.code}`} value={print.code}>
                        {print.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {/* Selected prints badges */}
              {selectedPrintsForName.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedPrintsForName.map((code) => {
                    const print = uniquePrints.find((p) => p.code === code)
                    return (
                      <Badge
                        key={`badge-name-${code}`}
                        variant="secondary"
                        className="pl-2.5 pr-1 py-1 text-sm"
                      >
                        {print?.name}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPrintsForName((prev) => prev.filter((c) => c !== code))
                          }}
                          className="ml-1.5 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Print Selection for SKU */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Prints in SKU Code</Label>
              <Select
                onValueChange={(value) => {
                  if (!selectedPrintsForSKU.includes(value)) {
                    setSelectedPrintsForSKU((prev) => [...prev, value])
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select prints to include in SKU..." />
                </SelectTrigger>
                <SelectContent>
                  {uniquePrints
                    .filter((print) => !selectedPrintsForSKU.includes(print.code))
                    .map((print) => (
                      <SelectItem key={`sku-${print.code}`} value={print.code}>
                        <span className="font-mono">{print.code}</span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {/* Selected prints badges */}
              {selectedPrintsForSKU.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedPrintsForSKU.map((code) => {
                    const print = uniquePrints.find((p) => p.code === code)
                    return (
                      <Badge
                        key={`badge-sku-${code}`}
                        variant="outline"
                        className="pl-2.5 pr-1 py-1 text-sm font-mono"
                      >
                        {print?.code}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPrintsForSKU((prev) => prev.filter((c) => c !== code))
                          }}
                          className="ml-1.5 hover:bg-gray-200 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        {selectedBundleCategory && bundleProducts.filter((p) => p.print !== null).length >= 1 && (
          <Button
            type="button"
            onClick={handleSubmit}
            className="w-full h-12 text-base font-semibold bg-orange-600 hover:bg-orange-700"
            disabled={isSubmitting || selectedFinalSizes.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Add {selectedFinalSizes.length} Bundle{selectedFinalSizes.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
