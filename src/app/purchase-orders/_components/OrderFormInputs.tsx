"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AutocompleteInput } from "@/components/ui/autocomplete-input"
import { X, Loader2 } from "lucide-react"
import type { Category, Print, Size } from "../types"

type OrderFormInputsProps = {
  categories: Category[]
  prints: Print[]
  sizes: Size[]
  categoryInput: string
  setCategoryInput: (value: string) => void
  printInput: string
  setPrintInput: (value: string) => void
  selectedCategory: Category | null
  setSelectedCategory: (category: Category | null) => void | Promise<void>
  selectedPrints: Print[]
  onPrintSelect: (print: Print) => void
  onRemovePrint: (printId: string) => void
  isBundle: boolean
  selectedSizes: string[]
  onSizeToggle: (sizeName: string) => void
  isLoadingSizes?: boolean
}

export function OrderFormInputs({
  categories,
  prints,
  sizes,
  categoryInput,
  setCategoryInput,
  printInput,
  setPrintInput,
  selectedCategory,
  setSelectedCategory,
  selectedPrints,
  onPrintSelect,
  onRemovePrint,
  isBundle,
  selectedSizes,
  onSizeToggle,
  isLoadingSizes = false,
}: OrderFormInputsProps) {
  // Filter out already selected prints from autocomplete options (for bundles)
  const selectedPrintIds = new Set(selectedPrints.map((p) => p.id))
  const availablePrintOptions = isBundle
    ? prints.filter((p) => !selectedPrintIds.has(p.id)).map((p) => p.official_print_name)
    : prints.map((p) => p.official_print_name)

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-white">
        <CardTitle className="text-lg font-semibold">Create New Order</CardTitle>
        <CardDescription className="text-sm">Select product details and sizes</CardDescription>
      </CardHeader>
      <CardContent className="p-6 bg-white space-y-6">
        {/* Product Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Category</Label>
            <AutocompleteInput
              value={categoryInput}
              onChange={setCategoryInput}
              onSelect={(value) => {
                const category = categories.find((c) => c.category_name === value)
                if (category) {
                  setSelectedCategory(category)
                  setCategoryInput(value)
                }
              }}
              options={categories.map((c) => c.category_name)}
              placeholder="Search category..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Print Name {isBundle && <span className="text-orange-600">(Select multiple)</span>}
            </Label>
            <AutocompleteInput
              value={printInput}
              onChange={setPrintInput}
              onSelect={(value) => {
                const print = prints.find((p) => p.official_print_name === value)
                if (print) {
                  onPrintSelect(print)
                }
              }}
              options={availablePrintOptions}
              placeholder={isBundle ? "Search and add prints..." : "Search print..."}
            />
          </div>
        </div>

        {/* Selected Prints Tags (for bundles) */}
        {isBundle && selectedPrints.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Selected Prints ({selectedPrints.length})
            </Label>
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
                    onClick={() => onRemovePrint(print.id)}
                    className="ml-0.5 hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Size Selection */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Select Sizes
          </Label>
          {isLoadingSizes ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              <span className="ml-2 text-sm text-gray-500">Loading sizes...</span>
            </div>
          ) : selectedPrints.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">Select a print first to see available sizes</p>
          ) : sizes.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No sizes available for this selection</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {sizes.map((size) => {
                const selected = selectedSizes.includes(size.size_name)
                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => onSizeToggle(size.size_name)}
                    className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                      selected
                        ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {size.size_name}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
