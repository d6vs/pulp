"use client"

import { useState, useEffect, useMemo } from "react"
import { SearchableList } from "@/components/ui/searchable-list"
import { ShoppingBag, ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
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
import { deleteProduct } from "../actions"

const PAGE_SIZE = 50

type Product = {
  id: string
  product_code: string | null
  name: string | null
  color: string | null
  base_price: number | null
  cost_price: number | null
  mrp: number | null
  product_categories: { category_name: string; category_code: string | null } | { category_name: string; category_code: string | null }[] | null
  sizes: { size_name: string } | { size_name: string }[] | null
  prints_name: { official_print_name: string } | { official_print_name: string }[] | null
}

type ExistingProductsListProps = {
  products: Product[]
  onDeleted: () => void
}

export function ExistingProductsList({ products, onDeleted }: ExistingProductsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setCurrentPage(1)
    }, 150)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const filtered = useMemo(() => {
    if (!debouncedQuery) return products
    const q = debouncedQuery.toLowerCase()
    return products.filter((p) => {
      const catData = Array.isArray(p.product_categories) ? p.product_categories[0] : p.product_categories
      const sizeData = Array.isArray(p.sizes) ? p.sizes[0] : p.sizes
      const printData = Array.isArray(p.prints_name) ? p.prints_name[0] : p.prints_name
      return (
        p.product_code?.toLowerCase().includes(q) ||
        p.name?.toLowerCase().includes(q) ||
        catData?.category_code?.toLowerCase().includes(q) ||
        catData?.category_name?.toLowerCase().includes(q) ||
        printData?.official_print_name?.toLowerCase().includes(q) ||
        sizeData?.size_name?.toLowerCase().includes(q)
      )
    })
  }, [products, debouncedQuery])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const startIdx = (currentPage - 1) * PAGE_SIZE
  const paginated = filtered.slice(startIdx, startIdx + PAGE_SIZE)

  const confirmDelete = products.find((p) => p.id === confirmId)

  const handleDelete = async () => {
    if (!confirmId) return
    setIsDeleting(true)
    try {
      const result = await deleteProduct(confirmId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Product deleted")
        setConfirmId(null)
        onDeleted()
      }
    } catch {
      toast.error("Failed to delete product")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <SearchableList
        title="Existing Products"
        count={products.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by code, name, print, size..."
        emptyIcon={<ShoppingBag className="h-8 w-8 text-gray-400" />}
        emptyMessage="No products added yet"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                {["Cat. Code", "Print", "Size", "Product Code", "Name", "Color", "Base", "Cost", "MRP", ""].map((h, i) => (
                  <th key={i} className="px-2 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((p, i) => {
                const catData = Array.isArray(p.product_categories) ? p.product_categories[0] : p.product_categories
                const sizeData = Array.isArray(p.sizes) ? p.sizes[0] : p.sizes
                const printData = Array.isArray(p.prints_name) ? p.prints_name[0] : p.prints_name
                return (
                  <tr key={startIdx + i} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5 font-mono text-gray-600">{catData?.category_code ?? "—"}</td>
                    <td className="px-2 py-1.5 text-gray-700">{printData?.official_print_name ?? "—"}</td>
                    <td className="px-2 py-1.5 text-gray-700">{sizeData?.size_name ?? "—"}</td>
                    <td className="px-2 py-1.5 font-mono text-gray-800 font-medium">{p.product_code ?? "—"}</td>
                    <td className="px-2 py-1.5 text-gray-700 max-w-[140px] truncate">{p.name ?? "—"}</td>
                    <td className="px-2 py-1.5 text-gray-700">{p.color ?? "—"}</td>
                    <td className="px-2 py-1.5 text-right text-gray-700">{p.base_price ?? "—"}</td>
                    <td className="px-2 py-1.5 text-right text-gray-700">{p.cost_price ?? "—"}</td>
                    <td className="px-2 py-1.5 text-right text-gray-700">{p.mrp ?? "—"}</td>
                    <td className="px-2 py-1.5">
                      <button
                        onClick={() => setConfirmId(p.id)}
                        className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && debouncedQuery && (
            <p className="text-center text-sm text-gray-400 py-6">No products match your search</p>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">
              Showing {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, filtered.length)} of {filtered.length}
              {debouncedQuery && ` (filtered from ${products.length})`}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <span className="text-xs text-gray-600 px-1">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </SearchableList>

      <AlertDialog open={!!confirmId} onOpenChange={(open) => { if (!open) setConfirmId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-mono font-semibold">{confirmDelete?.product_code}</span>? This cannot be undone.
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
