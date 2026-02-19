"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AutocompleteInput } from "@/components/ui/autocomplete-input"
import { toast } from "sonner"
import { Plus, X, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { createProduct } from "../actions"
import { isBundleSchema, generateSKU } from "@/app/purchase-orders/types"
import { getSizesByCategoryAndPrint } from "@/app/purchase-orders/actions"
import { generateItemMaster } from "@/app/item-master/actions"

type Category = {
  id: string
  category_name: string
  category_code: string | null
  sku_schema: number
  size_in_product_name: boolean
  product_name_prefix: string | null
}

type Print = {
  id: string
  official_print_name: string
  print_code: string | null
}

type Size = {
  id: string
  size_name: string
}

type AddProductTabProps = {
  categories: Category[]
  prints: Print[]
  sizes: Size[]
  onProductAdded: () => void
}

type SizeProductData = {
  sizeId: string
  sizeName: string
  costPrice: string
  mrp: string
}

export function AddProductTab({ categories, prints, sizes, onProductAdded }: AddProductTabProps) {
  const [categoryInput, setCategoryInput] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [printInput, setPrintInput] = useState("")
  const [selectedPrints, setSelectedPrints] = useState<Print[]>([])
  const [sizeProducts, setSizeProducts] = useState<SizeProductData[]>([])
  const [material, setMaterial] = useState("")
  const [brand, setBrand] = useState("Orange Sugar")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingSizeIds, setExistingSizeIds] = useState<Set<string>>(new Set())
  const [isCheckingProducts, setIsCheckingProducts] = useState(false)
  const [hasCheckedProducts, setHasCheckedProducts] = useState(false)
  const [addToItemMaster, setAddToItemMaster] = useState(false)

  const isBundle = selectedCategory ? isBundleSchema(selectedCategory.sku_schema) : false

  // Generate SKU preview for a specific size
  const getSkuPreview = (size: { id: string; size_name: string }) => {
    if (!selectedCategory || selectedPrints.length === 0) return ""
    const categoryCode = selectedCategory.category_code || selectedCategory.category_name.replace(/\s+/g, "")
    const printCodes = selectedPrints.map((p) => p.print_code || p.official_print_name.replace(/\s+/g, ""))
    return generateSKU(selectedCategory.sku_schema, categoryCode, printCodes, size.size_name)
  }

  const resetExistingCheck = () => {
    setExistingSizeIds(new Set())
    setHasCheckedProducts(false)
  }

  const handlePrintSelect = (print: Print) => {
    resetExistingCheck()
    if (isBundle) {
      setSelectedPrints((prev) => {
        const exists = prev.find((p) => p.id === print.id)
        if (exists) return prev.filter((p) => p.id !== print.id)
        return [...prev, print]
      })
      setPrintInput("")
    } else {
      setSelectedPrints([print])
      setPrintInput(print.official_print_name)
    }
  }

  const handleRemovePrint = (printId: string) => {
    resetExistingCheck()
    setSelectedPrints((prev) => prev.filter((p) => p.id !== printId))
  }

  const handleCheckProducts = async () => {
    if (!selectedCategory || selectedPrints.length === 0) return
    setIsCheckingProducts(true)
    const result = await getSizesByCategoryAndPrint(selectedCategory.id, selectedPrints[0].id)
    if (result.data) {
      setExistingSizeIds(new Set(result.data.map((s: { id: string }) => s.id)))
    }
    setHasCheckedProducts(true)
    setIsCheckingProducts(false)
  }

  const handleSizeToggle = (size: Size) => {
    setSizeProducts((prev) => {
      const exists = prev.find((s) => s.sizeId === size.id)
      if (exists) {
        return prev.filter((s) => s.sizeId !== size.id)
      }
      return [...prev, {
        sizeId: size.id,
        sizeName: size.size_name,
        costPrice: "",
        mrp: "",
      }]
    })
  }

  // Generate product name based on category naming convention
  // product_name_prefix already contains " |" at the end (e.g., "T-shirt |")
  const generateProductName = (sizeName: string): string => {
    if (!selectedCategory || selectedPrints.length === 0) return ""

    // Use prefix from DB (already has " |") or fallback to category name with " |"
    const prefix = selectedCategory.product_name_prefix || `${selectedCategory.category_name} |`
    const printNames = selectedPrints.map((p) => p.official_print_name).join(" & ")

    if (selectedCategory.size_in_product_name) {
      return `${prefix} ${printNames} ${sizeName}`
    }
    return `${prefix} ${printNames}`
  }

  const handleSizeProductChange = (sizeId: string, field: keyof SizeProductData, value: string) => {
    setSizeProducts((prev) =>
      prev.map((sp) => (sp.sizeId === sizeId ? { ...sp, [field]: value } : sp))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCategory) {
      toast.error("Please select a category")
      return
    }
    if (selectedPrints.length === 0) {
      toast.error("Please select print name(s)")
      return
    }
    if (sizeProducts.length === 0) {
      toast.error("Please select at least one size")
      return
    }

    setIsSubmitting(true)
    try {
      // Create a product for each selected size
      const results = await Promise.all(
        sizeProducts.map((sp) => {
          const sku = getSkuPreview({ id: sp.sizeId, size_name: sp.sizeName })
          const productName = generateProductName(sp.sizeName)
          const mrpValue = sp.mrp ? parseFloat(sp.mrp) : null

          return createProduct({
            category_id: selectedCategory.id,
            size_id: sp.sizeId,
            print_id: selectedPrints[0]?.id ?? null,
            product_code: sku,
            name: productName,
            base_price: mrpValue, // Base price = MRP
            cost_price: sp.costPrice ? parseFloat(sp.costPrice) : null,
            mrp: mrpValue,
            hsn_code: null,
            material: material.trim() || null,
            color: null,
            brand: brand.trim() || null,
          })
        })
      )

      const errors = results.filter((r) => r.error)
      if (errors.length > 0) {
        toast.error(`Failed to add some products: ${errors.map((e) => e.error).join(", ")}`)
      } else {
        if (addToItemMaster) {
          const sizeIds = sizeProducts.map((sp) => sp.sizeId)
          const imResult = await generateItemMaster(
            selectedCategory.id,
            selectedCategory.category_name,
            selectedPrints[0].id,
            selectedPrints[0].official_print_name,
            sizeIds
          )
          if (imResult.errorCount > 0) {
            toast.warning(`${imResult.successCount} added to Item Master, ${imResult.errorCount} failed`)
          } else {
            toast.success(`${sizeProducts.length} product(s) added & ${imResult.successCount} pushed to Item Master`)
          }
        } else {
          toast.success(`${sizeProducts.length} product(s) added successfully!`)
        }
        // Reset form
        setCategoryInput("")
        setSelectedCategory(null)
        setPrintInput("")
        setSelectedPrints([])
        setSizeProducts([])
        setMaterial("")
        setAddToItemMaster(false)
        onProductAdded()
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedPrintIds = new Set(selectedPrints.map((p) => p.id))
  const availablePrintOptions = isBundle
    ? prints.filter((p) => !selectedPrintIds.has(p.id)).map((p) => p.official_print_name)
    : prints.map((p) => p.official_print_name)

  return (
    <>
      <Card className="border-0 shadow-lg lg:col-span-2">
        <CardHeader className="border-b bg-white">
          <CardTitle className="text-lg font-semibold">Add New Product</CardTitle>
          <CardDescription className="text-sm">Create a new product with SKU</CardDescription>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Category</Label>
              <AutocompleteInput
                value={categoryInput}
                onChange={setCategoryInput}
                onSelect={(value) => {
                  const cat = categories.find((c) => c.category_name === value)
                  if (cat) {
                    setSelectedCategory(cat)
                    setCategoryInput(value)
                    // Reset prints and existing check when category changes
                    setSelectedPrints([])
                    setPrintInput("")
                    resetExistingCheck()
                  }
                }}
                options={categories.map((c) => c.category_name)}
                placeholder="Search category..."
              />
            </div>

            {/* Print Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Print Name {isBundle && <span className="text-orange-600">(Select multiple)</span>}
              </Label>
              <AutocompleteInput
                value={printInput}
                onChange={setPrintInput}
                onSelect={(value) => {
                  const print = prints.find((p) => p.official_print_name === value)
                  if (print) handlePrintSelect(print)
                }}
                options={availablePrintOptions}
                placeholder={isBundle ? "Search and add prints..." : "Search print..."}
              />
            </div>

            {/* Selected Prints Tags (for bundles) */}
            {isBundle && selectedPrints.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedPrints.map((print, index) => (
                  <span
                    key={print.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 text-orange-800 text-sm font-medium"
                  >
                    <span className="text-orange-500 text-xs font-bold">{index + 1}.</span>
                    {print.official_print_name}
                    <button
                      type="button"
                      onClick={() => handleRemovePrint(print.id)}
                      className="ml-0.5 hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Size Selection */}
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Select Sizes <span className="text-orange-600">(Multiple)</span>
                </Label>
                {selectedCategory && selectedPrints.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCheckProducts}
                  disabled={isCheckingProducts}
                  className="text-xs text-gray-500 hover:text-orange-600"
                >
                  {isCheckingProducts ? (
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
                {sizes.map((size) => {
                  const isSelected = sizeProducts.some((s) => s.sizeId === size.id)
                  const isExisting = existingSizeIds.has(size.id)
                  const isNew = hasCheckedProducts && !isExisting
                  return (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => handleSizeToggle(size)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                        isSelected
                          ? "bg-orange-500 text-white border-orange-500"
                          : isExisting
                          ? "bg-green-100 text-green-700 border-green-400 hover:border-green-500"
                          : isNew
                          ? "bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-400"
                          : "bg-white text-gray-700 border-gray-300 hover:border-orange-300"
                      }`}
                    >
                      {size.size_name}{isNew ? " (new)" : isExisting ? " (exists)" : ""}
                    </button>
                  )
                })}
              </div>
              {hasCheckedProducts && (
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-green-100 border border-green-400 inline-block" />
                    Exists in reference
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-50 border border-dashed border-amber-300 inline-block" />
                    Will be created
                  </span>
                </div>
              )}
            </div>

            {/* Per-Size Product Details */}
            {sizeProducts.length > 0 && (
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Product Details per Size
                </Label>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {sizeProducts.map((sp) => (
                    <div
                      key={sp.sizeId}
                      className="p-3 rounded-lg border border-gray-200 bg-gray-50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded">
                          {sp.sizeName}
                        </span>
                        {selectedCategory && selectedPrints.length > 0 && (
                          <span className="text-xs font-mono text-gray-500">
                            SKU: {getSkuPreview({ id: sp.sizeId, size_name: sp.sizeName })}
                          </span>
                        )}
                      </div>

                      {/* Auto-generated Product Name Preview */}
                      {selectedCategory && selectedPrints.length > 0 && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Name:</span>{" "}
                          <span className="text-gray-800">{generateProductName(sp.sizeName)}</span>
                        </div>
                      )}

                      {/* Prices */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-600">Cost Price</Label>
                          <Input
                            type="number"
                            step="1"
                            placeholder="0"
                            value={sp.costPrice}
                            onChange={(e) => handleSizeProductChange(sp.sizeId, "costPrice", e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-600">MRP</Label>
                          <Input
                            type="number"
                            step="1"
                            placeholder="0"
                            value={sp.mrp}
                            onChange={(e) => handleSizeProductChange(sp.sizeId, "mrp", e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Material */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Material</Label>
              <Input
                type="text"
                placeholder="e.g., 100% Cotton"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Brand */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Brand</Label>
              <Input
                type="text"
                placeholder="e.g., Orange Sugar"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="addToItemMaster"
                checked={addToItemMaster}
                onCheckedChange={(checked) => setAddToItemMaster(checked === true)}
              />
              <label
                htmlFor="addToItemMaster"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Add to Item Master
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold bg-orange-600 hover:bg-orange-700"
              disabled={isSubmitting || sizeProducts.length === 0}
            >
              <Plus className="h-5 w-5 mr-2" />
              {isSubmitting
                ? `Adding ${sizeProducts.length} Product(s)...`
                : `Add ${sizeProducts.length > 0 ? sizeProducts.length : ""} Product${sizeProducts.length !== 1 ? "s" : ""}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
