"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Boxes, ChevronLeft, ChevronRight, Trash2, Search, Package, AlertTriangle } from "lucide-react"
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
import { deleteBundleReference, deleteBundleReferences } from "../actions"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 100

type BundleReference = {
  id: string
  category_code: string | null
  product_code: string
  name: string | null
  size: string | null
  base_price: number | null
  cost_price: number | null
  mrp: number | null
  component_product_code: string | null
  internal_style_name: string | null
  component_quantity: number | null
  component_price: number | null
}

type ExistingBundlesListProps = {
  bundles: BundleReference[]
  onDeleted: () => void
}

const formatPrice = (price: number | null) => {
  if (price === null) return "—"
  return `₹${price.toLocaleString("en-IN")}`
}

export function ExistingBundlesList({ bundles, onDeleted }: ExistingBundlesListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)


  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setCurrentPage(1)
    }, 150)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Compute valid deletedIds - filter out IDs that no longer exist in bundles
  const validDeletedIds = useMemo(() => {
    const bundleIds = new Set(bundles.map(b => b.id))
    return deletedIds.filter(id => bundleIds.has(id))
  }, [bundles, deletedIds])

  const filtered = useMemo(() => {
    const notDeleted = bundles.filter((b) => !validDeletedIds.includes(b.id))
    if (!debouncedQuery) return notDeleted
    const q = debouncedQuery.toLowerCase()
    return notDeleted.filter((b) =>
      b.product_code?.toLowerCase().includes(q) ||
      b.name?.toLowerCase().includes(q) ||
      b.category_code?.toLowerCase().includes(q) ||
      b.size?.toLowerCase().includes(q) ||
      b.component_product_code?.toLowerCase().includes(q) ||
      b.internal_style_name?.toLowerCase().includes(q)
    )
  }, [bundles, debouncedQuery, validDeletedIds])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const startIdx = (currentPage - 1) * PAGE_SIZE
  const paginated = filtered.slice(startIdx, startIdx + PAGE_SIZE)
  const confirmBundle = bundles.find((b) => b.id === confirmId)
  const totalCount = bundles.length - validDeletedIds.length

  // Compute valid selectedIds - only keep IDs that exist in filtered bundles
  const validSelectedIds = useMemo(() => {
    const filteredIds = new Set(filtered.map(b => b.id))
    const valid = new Set<string>()
    selectedIds.forEach(id => {
      if (filteredIds.has(id)) valid.add(id)
    })
    return valid
  }, [filtered, selectedIds])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (validSelectedIds.size === paginated.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginated.map(b => b.id)))
    }
  }

  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(validSelectedIds)
    if (idsToDelete.length === 0) return

    setDeletedIds(prev => [...prev, ...idsToDelete])
    setSelectedIds(new Set())
    setShowBulkDeleteConfirm(false)

    try {
      const result = await deleteBundleReferences(idsToDelete)
      if (result.error) {
        setDeletedIds(prev => prev.filter(id => !idsToDelete.includes(id)))
        toast.error(result.error)
      } else {
        toast.success(`Successfully deleted ${idsToDelete.length} bundle reference(s)`)
        onDeleted()
      }
    } catch {
      setDeletedIds(prev => prev.filter(id => !idsToDelete.includes(id)))
      toast.error("Failed to delete bundle references")
    }
  }

  const handleDelete = async () => {
    if (!confirmId) return
    const idToDelete = confirmId

    setDeletedIds(prev => [...prev, idToDelete])
    setConfirmId(null)

    try {
      const result = await deleteBundleReference(idToDelete)
      if (result.error) {
        setDeletedIds(prev => prev.filter(id => id !== idToDelete))
        toast.error(result.error)
      } else {
        toast.success("Bundle reference deleted successfully")
        onDeleted()
      }
    } catch {
      setDeletedIds(prev => prev.filter(id => id !== idToDelete))
      toast.error("Failed to delete bundle reference")
    }
  }

  const isAllSelected = paginated.length > 0 && validSelectedIds.size === paginated.length
  const isSomeSelected = validSelectedIds.size > 0 && validSelectedIds.size < paginated.length

  return (
    <>
      <Card className="border-0 shadow-lg overflow-hidden">
        {/* Header */}
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Boxes className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Bundle References
                </CardTitle>
                <p className="text-sm text-gray-500 mt-0.5">
                  {totalCount} {totalCount === 1 ? "component" : "components"} total
                </p>
              </div>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bundles..."
                className="pl-9 h-10 bg-white border-gray-200 focus:border-orange-300 focus:ring-orange-200"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {totalCount === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No bundles yet</h3>
              <p className="text-sm text-gray-500 text-center max-w-sm">
                Import bundle references using the CSV upload above to get started.
              </p>
            </div>
          ) : (
            <>
              {/* Selection Action Bar */}
              <div
                className={cn(
                  "flex items-center justify-between px-6 py-3 bg-orange-50 border-b border-orange-100 transition-all duration-200",
                  validSelectedIds.size > 0 ? "opacity-100" : "opacity-0 h-0 py-0 overflow-hidden"
                )}
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                    {validSelectedIds.size} selected
                  </Badge>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Clear selection
                  </button>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="bg-red-600 hover:bg-red-700 shadow-sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200">
                      <th className="w-12 px-4 py-3">
                        <Checkbox
                          checked={isAllSelected}
                          ref={(el) => {
                            if (el) {
                              (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate = isSomeSelected
                            }
                          }}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all"
                          className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product Code</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Size</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Base</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Cost</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">MRP</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Component</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Style</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                      <th className="w-12 px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginated.map((b, i) => {
                      const isSelected = validSelectedIds.has(b.id)
                      return (
                        <tr
                          key={b.id}
                          className={cn(
                            "group transition-colors duration-150",
                            isSelected
                              ? "bg-orange-50/70 hover:bg-orange-50"
                              : i % 2 === 0
                              ? "bg-white hover:bg-gray-50/70"
                              : "bg-gray-50/30 hover:bg-gray-50/70"
                          )}
                        >
                          <td className="px-4 py-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelect(b.id)}
                              aria-label={`Select ${b.product_code}`}
                              className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              {b.category_code ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm font-medium text-gray-900">
                              {b.product_code}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-700 max-w-[180px] truncate block" title={b.name ?? undefined}>
                              {b.name ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs font-normal">
                              {b.size ?? "—"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-gray-600 tabular-nums">
                              {formatPrice(b.base_price)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-gray-600 tabular-nums">
                              {formatPrice(b.cost_price)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-medium text-gray-900 tabular-nums">
                              {formatPrice(b.mrp)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-gray-600">
                              {b.component_product_code ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">
                              {b.internal_style_name ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                              {b.component_quantity ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-gray-600 tabular-nums">
                              {formatPrice(b.component_price)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setConfirmId(b.id)}
                              className="p-1.5 rounded-md text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* No Results */}
                {filtered.length === 0 && debouncedQuery && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Search className="h-8 w-8 text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">
                      No bundles match &quot;<span className="font-medium">{debouncedQuery}</span>&quot;
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {filtered.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-medium">{startIdx + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(startIdx + PAGE_SIZE, filtered.length)}</span> of{" "}
                    <span className="font-medium">{filtered.length}</span> results
                    {debouncedQuery && (
                      <span className="text-gray-400"> (filtered from {bundles.length})</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 px-3"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={cn(
                              "w-8 h-8 rounded-md text-sm font-medium transition-colors",
                              currentPage === pageNum
                                ? "bg-orange-600 text-white"
                                : "text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 px-3"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Single Delete Dialog */}
      <AlertDialog open={!!confirmId} onOpenChange={(open) => { if (!open) setConfirmId(null) }}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-center">Delete Bundle Component</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This will permanently delete the component row:
              <span className="block mt-2 p-2 bg-gray-100 rounded-md font-mono text-sm text-gray-800">
                {confirmBundle?.product_code} → {confirmBundle?.component_product_code}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel className="sm:w-32">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="sm:w-32 bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-center">Delete {validSelectedIds.size} Components</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">{validSelectedIds.size}</span> selected
              bundle component{validSelectedIds.size !== 1 ? "s" : ""}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel className="sm:w-32">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="sm:w-32 bg-red-600 hover:bg-red-700"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
