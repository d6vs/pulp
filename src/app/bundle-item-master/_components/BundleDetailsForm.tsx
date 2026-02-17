"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AutocompleteInput } from "@/components/ui/autocomplete-input"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, X, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { addBundlesToItemMasterFromReference, checkBundleExistsInReference, BundleReferenceData } from "../actions"
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
  const [bundleExistsInReference, setBundleExistsInReference] = useState<boolean | null>(null)
  const [missingBundles, setMissingBundles] = useState<string[]>([])
  const [existingBundles, setExistingBundles] = useState<BundleReferenceData[]>([])

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

  // Check if bundle exists in reference table
  const checkBundleExists = async () => {
    if (!selectedBundleCategory) return

    const productsWithPrints = bundleProducts.filter((p) => p.print !== null && p.category !== null)
    if (productsWithPrints.length === 0) {
      setBundleExistsInReference(null)
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

      // Get all available size names from finalSizesOptions
      const sizeNames = finalSizesOptions.map((s) => s.size_name)

      if (sizeNames.length === 0) {
        setBundleExistsInReference(null)
        setMissingBundles([])
        setExistingBundles([])
        return
      }

      const result = await checkBundleExistsInReference(
        selectedBundleCategory.category_name,
        individualProducts,
        sizeNames
      )

      setBundleExistsInReference(result.exists)
      setMissingBundles(result.missingBundles || [])
      setExistingBundles(result.existingBundles || [])
    } catch (error) {
      console.error("Error checking bundle reference:", error)
      setBundleExistsInReference(null)
      setMissingBundles([])
      setExistingBundles([])
    } finally {
      setIsCheckingReference(false)
    }
  }

  // Reset bundle check state when products change (but don't auto-check)
  useEffect(() => {
    setBundleExistsInReference(null)
    setMissingBundles([])
    setExistingBundles([])
  }, [selectedBundleCategory, bundleProducts, finalSizesOptions])

  const handleOpenBundleSection = () => {
    setIsBundleSectionOpen(true)
  }

  const handleCloseBundleSection = () => {
    setIsBundleSectionOpen(false)
    // Reset everything
    setBundleCategoryInput("")
    setSelectedBundleCategory(null)
    setBundleProducts([])
    setSelectedFinalSizes([])
    setBundleExistsInReference(null)
    setMissingBundles([])
    setExistingBundles([])
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
      const sizesResult = await getSizesByCategoryAndPrint(category.id, [print.id])
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

    setIsSubmitting(true)
    try {
      // Build individual products array with all required details
      const individualProducts = productsWithPrints.map((p) => ({
        categoryId: p.category!.id,
        categoryCode: p.category!.category_code || "",
        printId: p.print!.id,
        printCode: p.print!.print_code || "",
        printName: p.print!.official_print_name,
      }))

      const selectedSizeNames = selectedFinalSizes.map((s) => s.size_name)

      // Auto-check reference if user skipped the check button
      let bundlesToAdd = existingBundles.filter((b) => selectedSizeNames.includes(b.sizeName))

      if (bundlesToAdd.length === 0) {
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

        if (!checkResult.exists || checkResult.existingBundles.length === 0) {
          const missing = checkResult.missingBundles?.join(", ") || "unknown"
          toast.error(`Bundle not found in reference: ${missing}. Create it first in Product Setup.`)
          setIsSubmitting(false)
          return
        }

        bundlesToAdd = checkResult.existingBundles
        // Update state so UI reflects the check result
        setBundleExistsInReference(true)
        setExistingBundles(checkResult.existingBundles)
      }

      // Use existing reference data directly - no SKU regeneration needed!
      const result = await addBundlesToItemMasterFromReference(bundlesToAdd, individualProducts, selectedBundleCategory.id)

      if (result.error) {
        toast.error(result.error)
      } else if (result.errorCount > 0) {
        // Log the actual errors for debugging
        const failedResults = result.results?.filter((r: { error: string | null }) => r.error) || []
        console.error("Failed bundle insertions:", failedResults)
        toast.warning(`${result.addedToMasterCount} items added, ${result.errorCount} failed`)
      } else {
        toast.success(`${result.addedToMasterCount} bundle item(s) added to Item Master`)
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

        {/* Divider */}
        {selectedBundleCategory && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Individual Product Details</h3>

            {/* Product List */}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

            {/* Add Another Product Button */}
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
        {bundleProducts.filter((p) => p.print !== null).length >= 1 && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Final Sizes (Common)</h3>
            {finalSizesOptions.length === 0 ? (
              <p className="text-sm text-gray-400">No common sizes found</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {finalSizesOptions.map((size) => {
                  const isSelected = selectedFinalSizes.some((s) => s.id === size.id)
                  return (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => handleFinalSizeToggle(size)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                        isSelected
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white text-gray-700 border-gray-300 hover:border-orange-300"
                      }`}
                    >
                      {size.size_name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Check Bundle Button */}
        {selectedBundleCategory && bundleProducts.filter((p) => p.print !== null).length >= 1 && finalSizesOptions.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={checkBundleExists}
            className="w-full"
            disabled={isCheckingReference}
          >
            {isCheckingReference ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : bundleExistsInReference === true ? (
              <span className="text-green-600">✓ Bundle exists in reference</span>
            ) : (
              "Check if Bundle Exists"
            )}
          </Button>
        )}

        {/* Bundle Reference Warning */}
        {bundleExistsInReference === false && missingBundles.length > 0 && (
          <div className="border border-amber-300 bg-amber-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-800">Bundle Not Found in Reference</h4>
                <p className="text-sm text-amber-700 mt-1">
                  The following bundle SKU(s) do not exist in the bundle reference table. Please create them first in Product Setup.
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {missingBundles.map((sku) => (
                    <span key={sku} className="px-2 py-1 text-xs font-mono bg-amber-100 text-amber-800 rounded">
                      {sku}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-amber-600 mt-3">
                  Go to <span className="font-semibold">Product Setup → Create Bundle</span> tab to create the bundle first.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Checking Reference Loading */}
        {isCheckingReference && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking bundle reference...
          </div>
        )}

        {/* Submit Button */}
        {selectedBundleCategory && bundleProducts.filter((p) => p.print !== null).length >= 1 && (
          <Button
            type="button"
            onClick={handleSubmit}
            className="w-full h-12 text-base font-semibold bg-orange-600 hover:bg-orange-700"
            disabled={isSubmitting || selectedFinalSizes.length === 0 || bundleExistsInReference !== true}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Add {selectedFinalSizes.length > 0 ? `${selectedFinalSizes.length} ` : ""}Bundle Item{selectedFinalSizes.length !== 1 ? "s" : ""} to Item Master
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
