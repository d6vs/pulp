"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AutocompleteInput } from "@/components/ui/autocomplete-input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Loader2, X, Minus } from "lucide-react"
import { toast } from "sonner"
import { generateBundleItemMaster, checkBundleExistsInReference } from "@/app/bundle-item-master/actions"
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

type AddBundleTabProps = {
  bundleCategories: Category[]
  individualCategories: Category[]
  onBundleAdded: () => void
}

export function AddBundleTab({
  bundleCategories,
  individualCategories,
  onBundleAdded,
}: AddBundleTabProps) {
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

  // Checkbox for adding to bundle_item_master
  const [addToBundleItemMaster, setAddToBundleItemMaster] = useState(false)

  // Bundle reference check state
  const [isCheckingReference, setIsCheckingReference] = useState(false)
  const [, setExistingBundles] = useState<string[]>([])
  const [missingBundles, setMissingBundles] = useState<string[]>([])
  const [hasCheckedReference, setHasCheckedReference] = useState(false)

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
  // Format: "Category | Prints | Size" - size is the last part
  const unavailableSizeNames = useMemo(() => {
    return new Set(
      missingBundles.map((bundle) => {
        const parts = bundle.split(" | ")
        return parts[parts.length - 1] // Last part is the size
      })
    )
  }, [missingBundles])

  // Check if bundle exists in reference table
  const checkBundleExists = async () => {
    if (!selectedBundleCategory) return

    const productsWithPrints = bundleProducts.filter((p) => p.print !== null && p.category !== null)
    if (productsWithPrints.length === 0) {
      setHasCheckedReference(false)
      setExistingBundles([])
      setMissingBundles([])
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
        setHasCheckedReference(false)
        setExistingBundles([])
        setMissingBundles([])
        return
      }

      const result = await checkBundleExistsInReference(
        selectedBundleCategory.category_name,
        individualProducts,
        sizeNames
      )

      setHasCheckedReference(true)
      // Extract product codes from the full reference data
      setExistingBundles((result.existingBundles || []).map((b) => b.productCode))
      setMissingBundles(result.missingBundles || [])
    } catch (error) {
      console.error("Error checking bundle reference:", error)
      setHasCheckedReference(false)
      setExistingBundles([])
      setMissingBundles([])
    } finally {
      setIsCheckingReference(false)
    }
  }

  // Reset bundle check state when products change
  useEffect(() => {
    setHasCheckedReference(false)
    setExistingBundles([])
    setMissingBundles([])
  }, [selectedBundleCategory, bundleProducts, finalSizesOptions])

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

  const resetForm = () => {
    setBundleCategoryInput("")
    setSelectedBundleCategory(null)
    setBundleProducts([])
    setSelectedFinalSizes([])
    setNextProductId(1)
    setAddToBundleItemMaster(false)
    setHasCheckedReference(false)
    setExistingBundles([])
    setMissingBundles([])
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
        quantity: p.quantity,
      }))
      const sizeNames = selectedFinalSizes.map((s) => s.size_name)

      const result = await generateBundleItemMaster(
        selectedBundleCategory.id,
        selectedBundleCategory.category_name,
        individualProducts,
        sizeNames,
        addToBundleItemMaster,
        true // Create bundle_reference if missing (this is Product Setup)
      )

      if (result.error) {
        toast.error(result.error)
      } else if (addToBundleItemMaster) {
        // Checkbox checked - adding to bundle_item_master
        if (result.errorCount > 0) {
          // Log the actual errors for debugging
          const failedResults = result.results?.filter((r: { error: string | null }) => r.error) || []
          console.error("Failed bundle insertions:", failedResults)
          toast.warning(`${result.addedToMasterCount} added to Item Master, ${result.errorCount} failed`)
        } else {
          toast.success(`${result.addedToMasterCount} bundle item(s) added to Item Master`)
          resetForm()
          onBundleAdded()
        }
      } else {
        // Checkbox unchecked - only creating bundle_reference
        const existedCount = result.existedCount ?? 0
        const createdCount = result.createdCount ?? 0

        if (existedCount > 0 && createdCount === 0) {
          toast.info(`All ${existedCount} bundle(s) already exist in reference`)
        } else if (existedCount > 0) {
          toast.warning(`${createdCount} created, ${existedCount} already existed`)
          resetForm()
          onBundleAdded()
        } else {
          toast.success(`${createdCount} bundle(s) created successfully`)
          resetForm()
          onBundleAdded()
        }
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Create Bundle</CardTitle>
        <CardDescription>
          Create a new bundle by selecting a bundle category and adding individual products
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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

            {/* Add Another Product Button */}
            <Button
              type="button"
              variant="outline"
              onClick={addBundleProduct}
              className="w-full mt-3 border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-orange-300 hover:text-orange-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        )}

        {/* Final Sizes Selection - Shows all common sizes */}
        {bundleProducts.filter((p) => p.print !== null).length >= 1 && finalSizesOptions.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Select Sizes</h3>
              {!hasCheckedReference && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={checkBundleExists}
                  disabled={isCheckingReference}
                  className="text-xs text-gray-500 hover:text-orange-600"
                >
                  {isCheckingReference ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "Check which exist in reference"
                  )}
                </Button>
              )}
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
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all relative ${
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

            {/* Legend after check */}
            {hasCheckedReference && (
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-green-100 border border-green-300"></span>
                  Exists in reference
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300"></span>
                  Will be created
                </span>
              </div>
            )}
          </div>
        )}

        {/* Checkbox and Submit Button */}
        {selectedBundleCategory && bundleProducts.filter((p) => p.print !== null).length >= 1 && (
          <div className="space-y-4">
            {/* Add to Bundle Item Master Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="addToBundleItemMaster"
                checked={addToBundleItemMaster}
                onCheckedChange={(checked) => setAddToBundleItemMaster(checked === true)}
              />
              <label
                htmlFor="addToBundleItemMaster"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Add to Bundle Item Master (for today)
              </label>
            </div>

            <Button
              type="button"
              onClick={handleSubmit}
              className="w-full h-12 text-base font-semibold bg-orange-600 hover:bg-orange-700"
              disabled={isSubmitting || selectedFinalSizes.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {addToBundleItemMaster ? "Creating & Adding..." : "Creating..."}
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  {addToBundleItemMaster
                    ? `Create & Add ${selectedFinalSizes.length > 0 ? `${selectedFinalSizes.length} ` : ""}Bundle${selectedFinalSizes.length !== 1 ? "s" : ""}`
                    : `Create ${selectedFinalSizes.length > 0 ? `${selectedFinalSizes.length} ` : ""}Bundle${selectedFinalSizes.length !== 1 ? "s" : ""}`}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
