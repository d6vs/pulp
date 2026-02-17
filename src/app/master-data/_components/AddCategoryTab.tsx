"use client"

import { useState } from "react"
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
import { Plus, Package, Search, Pencil, Trash2, Check, X } from "lucide-react"
import { createCategory, updateCategory, deleteCategory, getCategoryProductCount } from "../actions"
import { SearchableList } from "@/components/ui/searchable-list"

type Category = {
  id: string
  category_name: string
  category_code: string | null
  sku_schema: number
  hsn_code: string | null
  size_in_product_name: boolean
  product_name_prefix: string | null
}

const SKU_SCHEMAS = [
  { value: 0, label: "Type 0", example: "PrintcodeCategorycode_Size" },
  { value: 1, label: "Type 1", example: "Printcode_Categorycode_Size" },
  { value: 2, label: "Type 2", example: "Categorycode_PrintCode_Size" },
  { value: 3, label: "Type 3 (Bundle)", example: "Print_Print_Categorycode_Size" },
  { value: 4, label: "Type 4 (Bundle)", example: "Categorycode_Print_Print_Size" },
  { value: 5, label: "Type 5 (Bundle)", example: "Categorycode_Print_Print" },
  { value: 6, label: "Type 6", example: "Categorycode_Print" },
]

type AddCategoryTabProps = {
  categories: Category[]
  onCategoryAdded: () => void
}

export function AddCategoryTab({ categories, onCategoryAdded }: AddCategoryTabProps) {
  const [categoryName, setCategoryName] = useState("")
  const [categoryCode, setCategoryCode] = useState("")
  const [skuSchema, setSkuSchema] = useState(1)
  const [hsnCode, setHsnCode] = useState("")
  const [sizeInProductName, setSizeInProductName] = useState(false)
  const [productNamePrefix, setProductNamePrefix] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Real-time validation
  const nameExists = categoryName.trim() !== "" &&
    categories.some((c) => c.category_name.toLowerCase() === categoryName.trim().toLowerCase())
  const codeExists = categoryCode.trim() !== "" &&
    categories.some((c) => c.category_code?.toLowerCase() === categoryCode.trim().toLowerCase())
  const hasValidationError = nameExists || codeExists

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editCode, setEditCode] = useState("")
  const [editSchema, setEditSchema] = useState(1)
  const [editHsn, setEditHsn] = useState("")
  const [editSizeInProductName, setEditSizeInProductName] = useState(false)
  const [editProductNamePrefix, setEditProductNamePrefix] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Edit validation (exclude current item being edited)
  const editNameExists = editName.trim() !== "" && editingId !== null &&
    categories.some((c) => c.id !== editingId && c.category_name.toLowerCase() === editName.trim().toLowerCase())
  const editCodeExists = editCode.trim() !== "" && editingId !== null &&
    categories.some((c) => c.id !== editingId && c.category_code?.toLowerCase() === editCode.trim().toLowerCase())
  const hasEditValidationError = editNameExists || editCodeExists

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteProductCount, setDeleteProductCount] = useState<number>(0)
  const [isCheckingDelete, setIsCheckingDelete] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryName.trim() || !categoryCode.trim()) {
      toast.error("Please fill in both category name and category code")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createCategory({
        category_name: categoryName.trim(),
        category_code: categoryCode.trim(),
        sku_schema: skuSchema,
        hsn_code: hsnCode.trim() || null,
        size_in_product_name: sizeInProductName,
        product_name_prefix: productNamePrefix.trim() || null,
      })

      if (result.error) {
        toast.error(`Failed to add category: ${result.error}`)
      } else {
        toast.success("Category added successfully!")
        setCategoryName("")
        setCategoryCode("")
        setSkuSchema(1)
        setHsnCode("")
        setSizeInProductName(false)
        setProductNamePrefix("")
        onCategoryAdded()
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEdit = (category: Category) => {
    setEditingId(category.id)
    setEditName(category.category_name)
    setEditCode(category.category_code || "")
    setEditSchema(category.sku_schema)
    setEditHsn(category.hsn_code || "")
    setEditSizeInProductName(category.size_in_product_name)
    setEditProductNamePrefix(category.product_name_prefix || "")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditCode("")
    setEditSchema(1)
    setEditHsn("")
    setEditSizeInProductName(false)
    setEditProductNamePrefix("")
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim() || !editCode.trim()) {
      toast.error("Please fill in both fields")
      return
    }

    setIsSaving(true)
    try {
      const result = await updateCategory(id, {
        category_name: editName.trim(),
        category_code: editCode.trim(),
        sku_schema: editSchema,
        hsn_code: editHsn.trim() || null,
        size_in_product_name: editSizeInProductName,
        product_name_prefix: editProductNamePrefix.trim() || null,
      })

      if (result.error) {
        toast.error(`Failed to update: ${result.error}`)
      } else {
        toast.success("Category updated successfully!")
        cancelEdit()
        onCategoryAdded()
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClick = async (category: Category) => {
    setIsCheckingDelete(true)
    setDeleteTarget(category)

    // Check how many products use this category
    const { count } = await getCategoryProductCount(category.id)
    setDeleteProductCount(count)
    setIsCheckingDelete(false)
  }

  const handleDelete = async (forceDelete: boolean = false) => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      const result = await deleteCategory(deleteTarget.id, forceDelete)

      if (result.error) {
        toast.error(result.error)
      } else if (result.hasProducts && !forceDelete) {
        // This shouldn't happen since we pre-check, but handle it just in case
        toast.error(result.message || "This category has products. Please delete them first.")
      } else {
        const message = forceDelete && deleteProductCount > 0
          ? `Category and ${deleteProductCount} product${deleteProductCount === 1 ? "" : "s"} deleted successfully!`
          : "Category deleted successfully!"
        toast.success(message)
        onCategoryAdded()
        setDeleteTarget(null)
        setDeleteProductCount(0)
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Something unexpected happened. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteTarget(null)
    setDeleteProductCount(0)
  }

  const filteredCategories = categories.filter((category) => {
    const query = searchQuery.toLowerCase()
    return (
      category.category_name.toLowerCase().includes(query) ||
      category.category_code?.toLowerCase().includes(query)
    )
  })

  return (
    <>
      {/* Left Column - Add New Category */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-white">
          <CardTitle className="text-lg font-semibold">Add New Category</CardTitle>
          <CardDescription className="text-sm">Create a new product category with code</CardDescription>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Category Name
              </Label>
              <Input
                type="text"
                placeholder="e.g., Dresses"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className={`h-10 ${nameExists ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
              {nameExists && (
                <p className="text-xs text-red-500">Category name already exists</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Category Code
              </Label>
              <Input
                type="text"
                placeholder="e.g., DSS"
                value={categoryCode}
                onChange={(e) => setCategoryCode(e.target.value.toUpperCase())}
                className={`h-10 ${codeExists ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
              {codeExists ? (
                <p className="text-xs text-red-500">Category code already exists</p>
              ) : (
                <p className="text-xs text-gray-500">Short code for the category (will be used in SKU)</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                SKU Schema Type
              </Label>
              <select
                value={skuSchema}
                onChange={(e) => setSkuSchema(parseInt(e.target.value))}
                className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {SKU_SCHEMAS.map((schema) => (
                  <option key={schema.value} value={schema.value}>
                    {schema.label} — {schema.example}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                HSN Code
              </Label>
              <Input
                type="text"
                placeholder="e.g., 6104"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                className="h-10"
              />
              <p className="text-xs text-gray-500">Harmonized System Nomenclature code for tax purposes</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Product Name Prefix
              </Label>
              <Input
                type="text"
                placeholder="e.g., Cotton Bib"
                value={productNamePrefix}
                onChange={(e) => setProductNamePrefix(e.target.value)}
                className="h-10"
              />
              <p className="text-xs text-gray-500">The base name used in product names (before print names and size)</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sizeInProductName"
                checked={sizeInProductName}
                onChange={(e) => setSizeInProductName(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <Label htmlFor="sizeInProductName" className="text-sm text-gray-700 cursor-pointer">
                Add size to product name
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold bg-orange-600 hover:bg-orange-700"
              disabled={isSubmitting || hasValidationError}
            >
              <Plus className="h-5 w-5 mr-2" />
              {isSubmitting ? "Adding Category..." : "Add Category"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Right Column - Existing Categories */}
      <SearchableList
        title="Existing Categories"
        count={categories.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name or code..."
        emptyIcon={<Package className="h-8 w-8 text-gray-400" />}
        emptyMessage="No categories added yet"
      >
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No categories found matching &quot;{searchQuery}&quot;</p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto p-4 space-y-2">
            {filteredCategories.map((category, index) => (
              <div
                key={category.id}
                className="p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-colors"
              >
                {editingId === category.id ? (
                  <div className="space-y-2">
                    <div>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Category name"
                        className={`h-8 text-sm ${editNameExists ? "border-red-500" : ""}`}
                      />
                      {editNameExists && (
                        <p className="text-xs text-red-500 mt-1">Category name already exists</p>
                      )}
                    </div>
                    <div>
                      <Input
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                        placeholder="Category code"
                        className={`h-8 text-sm ${editCodeExists ? "border-red-500" : ""}`}
                      />
                      {editCodeExists && (
                        <p className="text-xs text-red-500 mt-1">Category code already exists</p>
                      )}
                    </div>
                    <select
                      value={editSchema}
                      onChange={(e) => setEditSchema(parseInt(e.target.value))}
                      className="w-full h-8 px-2 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {SKU_SCHEMAS.map((schema) => (
                        <option key={schema.value} value={schema.value}>
                          {schema.label} — {schema.example}
                        </option>
                      ))}
                    </select>
                    <Input
                      value={editHsn}
                      onChange={(e) => setEditHsn(e.target.value)}
                      placeholder="HSN Code"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={editProductNamePrefix}
                      onChange={(e) => setEditProductNamePrefix(e.target.value)}
                      placeholder="Product Name Prefix"
                      className="h-8 text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editSizeInProductName}
                        onChange={(e) => setEditSizeInProductName(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-xs text-gray-600">Add size to product name</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 bg-orange-600 hover:bg-orange-700"
                        onClick={() => handleUpdate(category.id)}
                        disabled={isSaving || hasEditValidationError}
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
                        <p className="text-sm font-medium text-gray-900">{category.category_name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-mono">
                            {category.category_code}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                            Type {category.sku_schema}
                          </span>
                          {category.hsn_code && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                              HSN: {category.hsn_code}
                            </span>
                          )}
                          {category.product_name_prefix && (
                            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                              Prefix: {category.product_name_prefix}
                            </span>
                          )}
                          {category.size_in_product_name && (
                            <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                              Size in name
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(category)}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(category)}
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
      <AlertDialog open={!!deleteTarget} onOpenChange={cancelDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isCheckingDelete ? "Checking..." : deleteProductCount > 0 ? "Category Has Products" : "Delete Category"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {isCheckingDelete ? (
                  <p>Please wait while we check if this category is being used...</p>
                ) : deleteProductCount > 0 ? (
                  <>
                    <p>
                      <strong>&quot;{deleteTarget?.category_name}&quot;</strong> is currently used by{" "}
                      <strong className="text-red-600">{deleteProductCount} product{deleteProductCount === 1 ? "" : "s"}</strong>.
                    </p>
                    <p>You have two options:</p>
                    <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
                      <li><strong>Delete All</strong> — Remove all {deleteProductCount} products and the category</li>
                      <li><strong>Cancel</strong> — Go back and manually review/delete products first</li>
                    </ul>
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
                      ⚠️ Deleting products cannot be undone. Make sure you don&apos;t need these products anymore.
                    </div>
                  </>
                ) : (
                  <p>Are you sure you want to delete &quot;{deleteTarget?.category_name}&quot;? This action cannot be undone.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting || isCheckingDelete}>Cancel</AlertDialogCancel>
            {!isCheckingDelete && deleteProductCount > 0 ? (
              <AlertDialogAction
                onClick={() => handleDelete(true)}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : `Delete All (${deleteProductCount + 1} items)`}
              </AlertDialogAction>
            ) : !isCheckingDelete ? (
              <AlertDialogAction
                onClick={() => handleDelete(false)}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
