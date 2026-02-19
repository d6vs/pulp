"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AutocompleteInput } from "@/components/ui/autocomplete-input"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getPrintsByCategory, getSizesByCategoryAndPrint } from "../../purchase-orders/actions"
import { generateItemMaster } from "../actions"
import { SelectionPreview } from "./SelectionPreview"

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

type Category = {
  id: string
  category_name: string
  category_code: string | null
  sku_schema: number
  hsn_code: string | null
}

interface ItemDetailsFormProps {
  categories: Category[]
  onItemsAdded: () => Promise<void>
}

export function ItemDetailsForm({ categories, onItemsAdded }: ItemDetailsFormProps) {
  const [prints, setPrints] = useState<Print[]>([])
  const [sizes, setSizes] = useState<Size[]>([])

  const [categoryInput, setCategoryInput] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [printInput, setPrintInput] = useState("")
  const [selectedPrint, setSelectedPrint] = useState<Print | null>(null)
  const [selectedSizes, setSelectedSizes] = useState<Size[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingSizes, setIsLoadingSizes] = useState(false)

  const handleCategorySelect = async (category: Category | null) => {
    setSelectedCategory(category)
    setPrintInput("")
    setSelectedPrint(null)
    setSelectedSizes([])
    setPrints([])
    setSizes([])

    if (category) {
      const printsResult = await getPrintsByCategory(category.id)
      if (printsResult.data) setPrints(printsResult.data)
    }
  }

  const handlePrintSelect = async (print: Print | null) => {
    setSelectedPrint(print)
    setSelectedSizes([])
    setSizes([])

    if (selectedCategory && print) {
      setIsLoadingSizes(true)
      const sizesResult = await getSizesByCategoryAndPrint(selectedCategory.id, print.id)
      if (sizesResult.data) setSizes(sizesResult.data)
      setIsLoadingSizes(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedCategory) {
      toast.error("Please select a category")
      return
    }
    if (!selectedPrint) {
      toast.error("Please select a print")
      return
    }
    if (selectedSizes.length === 0) {
      toast.error("Please select at least one size")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await generateItemMaster(
        selectedCategory.id,
        selectedCategory.category_name,
        selectedPrint.id,
        selectedPrint.official_print_name,
        selectedSizes.map((s) => s.id)
      )

      if (result.error) {
        toast.error(result.error)
      } else if (result.errorCount > 0) {
        const failedDetails = result.results
          ?.filter((r: { error: string | null }) => r.error)
          .map((r: { error: string | null }) => r.error)
          .join("; ")
        toast.warning(`${result.successCount} items added, ${result.errorCount} failed: ${failedDetails}`)
      } else {
        toast.success(`${result.successCount} item(s) added to Item Master`)
        setCategoryInput("")
        setSelectedCategory(null)
        setPrintInput("")
        setSelectedPrint(null)
        setSelectedSizes([])
        setPrints([])
        setSizes([])
        await onItemsAdded()
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-white">
          <CardTitle className="text-lg font-semibold">Item Details</CardTitle>
          <CardDescription className="text-sm">Select category, print, and size</CardDescription>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <div className="space-y-4">
            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Category
              </Label>
              <AutocompleteInput
                value={categoryInput}
                onChange={setCategoryInput}
                onSelect={(value) => {
                  const cat = categories.find((c) => c.category_name === value)
                  if (cat) {
                    setCategoryInput(value)
                    handleCategorySelect(cat)
                  }
                }}
                options={categories.map((c) => c.category_name)}
                placeholder="Search category..."
              />
              {selectedCategory && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-mono">
                    {selectedCategory.category_code}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                    Type {selectedCategory.sku_schema}
                  </span>
                  {selectedCategory.hsn_code && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                      HSN: {selectedCategory.hsn_code}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Print */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Print
              </Label>
              <AutocompleteInput
                value={printInput}
                onChange={setPrintInput}
                onSelect={(value) => {
                  const print = prints.find((p) => p.official_print_name === value)
                  if (print) {
                    setPrintInput(value)
                    handlePrintSelect(print)
                  }
                }}
                options={prints.map((p) => p.official_print_name)}
                placeholder={selectedCategory ? "Search print..." : "Select category first"}
                disabled={!selectedCategory}
              />
              {selectedPrint && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-mono">
                    {selectedPrint.print_code}
                  </span>
                  {selectedPrint.color && (
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                      {selectedPrint.color}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Select Sizes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Select Sizes
              </Label>
              {isLoadingSizes ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                  <span className="ml-2 text-sm text-gray-500">Loading sizes...</span>
                </div>
              ) : !selectedPrint ? (
                <p className="text-sm text-gray-400 py-2">Select print first</p>
              ) : sizes.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">No sizes available for this category and print</p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {sizes.map((size) => {
                    const isSelected = selectedSizes.some((s) => s.id === size.id)
                    return (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSizes(selectedSizes.filter((s) => s.id !== size.id))
                          } else {
                            setSelectedSizes([...selectedSizes, size])
                          }
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                          isSelected
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-white text-gray-700 border-gray-300 hover:border-orange-300 hover:bg-orange-50"
                        }`}
                      >
                        {size.size_name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="button"
              onClick={handleSubmit}
              className="w-full h-11 text-base font-semibold bg-orange-600 hover:bg-orange-700"
              disabled={isSubmitting || !selectedCategory || !selectedPrint || selectedSizes.length === 0}
            >
              <Plus className="h-5 w-5 mr-2" />
              {isSubmitting
                ? `Adding ${selectedSizes.length} item(s)...`
                : `Add ${selectedSizes.length > 0 ? selectedSizes.length : ""} Item${selectedSizes.length !== 1 ? "s" : ""} to Item Master`}
            </Button>
          </div>
        </CardContent>
      </Card>

      <SelectionPreview
        selectedCategory={selectedCategory}
        selectedPrint={selectedPrint}
        selectedSizes={selectedSizes}
      />
    </div>
  )
}
