"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Weight, Search, Trash2, Pencil, Check, X } from "lucide-react"
import { getProductWeights, upsertProductWeight, deleteProductWeight } from "../actions"
import { SearchableList } from "@/components/ui/searchable-list"

type Category = {
  id: string
  category_name: string
  category_code: string | null
}

type Size = {
  id: string
  size_name: string
}

type ProductWeight = {
  id: string
  category_id: string
  size_id: string
  weight?: number
  product_categories: { category_name: string } | null
  sizes: { size_name: string } | null
}

type UpdateWeightTabProps = {
  categories: Category[]
  sizes: Size[]
}

type SelectedSizeWeight = {
  sizeId: string
  sizeName: string
  weight: string
}

export function UpdateWeightTab({ categories, sizes }: UpdateWeightTabProps) {
  const [weightCategory, setWeightCategory] = useState("")
  const [selectedSizeWeights, setSelectedSizeWeights] = useState<SelectedSizeWeight[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Weights list
  const [weights, setWeights] = useState<ProductWeight[]>([])
  const [isLoadingWeights, setIsLoadingWeights] = useState(true)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editWeight, setEditWeight] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<ProductWeight | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch weights on mount
  useEffect(() => {
    fetchWeights()
  }, [])

  const fetchWeights = async () => {
    setIsLoadingWeights(true)
    const result = await getProductWeights()
    if (result.data) {
      setWeights(result.data)
    }
    setIsLoadingWeights(false)
  }

  const handleSizeToggle = (size: Size) => {
    setSelectedSizeWeights((prev) => {
      const exists = prev.find((s) => s.sizeId === size.id)
      if (exists) {
        return prev.filter((s) => s.sizeId !== size.id)
      }
      return [...prev, { sizeId: size.id, sizeName: size.size_name, weight: "" }]
    })
  }

  const handleSizeWeightChange = (sizeId: string, weight: string) => {
    setSelectedSizeWeights((prev) =>
      prev.map((s) => (s.sizeId === sizeId ? { ...s, weight } : s))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!weightCategory) {
      toast.error("Please select a category")
      return
    }

    if (selectedSizeWeights.length === 0) {
      toast.error("Please select at least one size")
      return
    }

    // Validate all weights
    const invalidWeights = selectedSizeWeights.filter((s) => {
      const val = parseFloat(s.weight)
      return isNaN(val) || val <= 0
    })

    if (invalidWeights.length > 0) {
      toast.error(`Please enter valid weights (greater than 0) for all selected sizes`)
      return
    }

    setIsSubmitting(true)
    try {
      const results = await Promise.all(
        selectedSizeWeights.map((s) =>
          upsertProductWeight({
            category_id: weightCategory,
            size_id: s.sizeId,
            weight_grams: parseFloat(s.weight),
          })
        )
      )

      const errors = results.filter((r) => r.error)
      if (errors.length > 0) {
        toast.error(`Failed to save some weights: ${errors.map((e) => e.error).join(", ")}`)
      } else {
        const updatedCount = results.filter((r) => r.updated).length
        const addedCount = results.length - updatedCount
        const messages = []
        if (addedCount > 0) messages.push(`${addedCount} added`)
        if (updatedCount > 0) messages.push(`${updatedCount} updated`)
        toast.success(`Weights saved successfully! (${messages.join(", ")})`)
        setWeightCategory("")
        setSelectedSizeWeights([])
        fetchWeights()
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEdit = (w: ProductWeight) => {
    setEditingId(w.id)
    setEditWeight(String(w.weight ?? 0))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditWeight("")
  }

  const handleUpdate = async (w: ProductWeight) => {
    const weightValue = parseFloat(editWeight)
    if (isNaN(weightValue) || weightValue <= 0) {
      toast.error("Please enter a valid weight greater than 0")
      return
    }

    setIsSaving(true)
    try {
      const result = await upsertProductWeight({
        category_id: w.category_id,
        size_id: w.size_id,
        weight_grams: weightValue,
      })

      if (result.error) {
        toast.error(`Failed to update: ${result.error}`)
      } else {
        toast.success("Weight updated successfully!")
        cancelEdit()
        fetchWeights()
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      const result = await deleteProductWeight(deleteTarget.id)

      if (result.error) {
        toast.error(`Failed to delete: ${result.error}`)
      } else {
        toast.success("Weight deleted successfully!")
        fetchWeights()
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const filteredWeights = weights.filter((w) => {
    const query = searchQuery.toLowerCase()
    const categoryName = w.product_categories?.category_name?.toLowerCase() || ""
    const sizeName = w.sizes?.size_name?.toLowerCase() || ""
    return categoryName.includes(query) || sizeName.includes(query)
  })

  return (
    <>
      {/* Left Column - Update Weight */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-white">
          <CardTitle className="text-lg font-semibold">Add Product Weights</CardTitle>
          <CardDescription className="text-sm">Set weights for multiple sizes at once</CardDescription>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Category
              </Label>
              <select
                value={weightCategory}
                onChange={(e) => {
                  setWeightCategory(e.target.value)
                  setSelectedSizeWeights([])
                }}
                className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
              >
                <option value="">Select category...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            {weightCategory && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Select Sizes
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {sizes.map((size) => {
                      const isSelected = selectedSizeWeights.some((s) => s.sizeId === size.id)
                      return (
                        <button
                          key={size.id}
                          type="button"
                          onClick={() => handleSizeToggle(size)}
                          className={`p-2 rounded-lg border-2 transition-all text-sm font-medium ${
                            isSelected
                              ? "border-orange-500 bg-orange-50 text-orange-700"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          {size.size_name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {selectedSizeWeights.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Enter Weights (grams)
                    </Label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {selectedSizeWeights.map((sizeWeight) => (
                        <div key={sizeWeight.sizeId} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700 w-20">
                            {sizeWeight.sizeName}
                          </span>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            placeholder="Weight in grams"
                            value={sizeWeight.weight}
                            onChange={(e) => handleSizeWeightChange(sizeWeight.sizeId, e.target.value)}
                            className="h-9 flex-1"
                          />
                          <span className="text-sm text-gray-500">g</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold bg-orange-600 hover:bg-orange-700"
              disabled={isSubmitting || selectedSizeWeights.length === 0}
            >
              <Weight className="h-5 w-5 mr-2" />
              {isSubmitting ? "Saving..." : `Save ${selectedSizeWeights.length > 0 ? selectedSizeWeights.length : ""} Weight${selectedSizeWeights.length !== 1 ? "s" : ""}`}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Right Column - Existing Weights */}
      <SearchableList
        title="Existing Weights"
        count={weights.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by category or size..."
        emptyIcon={<Weight className="h-8 w-8 text-gray-400" />}
        emptyMessage="No weights added yet"
      >
        {isLoadingWeights ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-500">Loading weights...</p>
          </div>
        ) : filteredWeights.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              {searchQuery ? `No weights found matching "${searchQuery}"` : "No weights added yet"}
            </p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto p-4 space-y-2">
            {filteredWeights.map((w, index) => (
              <div
                key={w.id}
                className="p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-colors"
              >
                {editingId === w.id ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">
                      {w.product_categories?.category_name} - {w.sizes?.size_name}
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editWeight}
                        onChange={(e) => setEditWeight(e.target.value)}
                        placeholder="Weight in grams"
                        className="h-8 text-sm flex-1"
                      />
                      <span className="text-sm text-gray-500">g</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 bg-orange-600 hover:bg-orange-700"
                        onClick={() => handleUpdate(w)}
                        disabled={isSaving}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        onClick={cancelEdit}
                        disabled={isSaving}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-xs font-semibold text-gray-400 mt-1">#{index + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {w.product_categories?.category_name || "Unknown Category"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {w.sizes?.size_name || "Unknown Size"}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                            {w.weight ?? 0}g
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(w)}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(w)}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SearchableList>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Weight</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the weight for &quot;{deleteTarget?.product_categories?.category_name}&quot; - &quot;{deleteTarget?.sizes?.size_name}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
