"use client"

import { useState, useEffect, useMemo } from "react"
import { SearchableList } from "@/components/ui/searchable-list"
import { Boxes, ChevronLeft, ChevronRight } from "lucide-react"

const PAGE_SIZE = 100

type BundleReference = {
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
}

export function ExistingBundlesList({ bundles }: ExistingBundlesListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setCurrentPage(1)
    }, 150)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const filtered = useMemo(() => {
    if (!debouncedQuery) return bundles
    const q = debouncedQuery.toLowerCase()
    return bundles.filter((b) =>
      b.product_code?.toLowerCase().includes(q) ||
      b.name?.toLowerCase().includes(q) ||
      b.category_code?.toLowerCase().includes(q) ||
      b.size?.toLowerCase().includes(q) ||
      b.component_product_code?.toLowerCase().includes(q) ||
      b.internal_style_name?.toLowerCase().includes(q)
    )
  }, [bundles, debouncedQuery])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const startIdx = (currentPage - 1) * PAGE_SIZE
  const paginated = filtered.slice(startIdx, startIdx + PAGE_SIZE)

  return (
    <SearchableList
      title="Existing Bundles"
      count={bundles.length}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search by code, name, size, style..."
      emptyIcon={<Boxes className="h-8 w-8 text-gray-400" />}
      emptyMessage="No bundles created yet"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr>
              {["Cat. Code", "Product Code", "Name", "Size", "Base", "Cost", "MRP", "Component Code", "Style", "Qty", "Comp. Price"].map((h) => (
                <th key={h} className="px-2 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.map((b, i) => (
              <tr key={startIdx + i} className="hover:bg-gray-50">
                <td className="px-2 py-1.5 font-mono text-gray-600">{b.category_code ?? "—"}</td>
                <td className="px-2 py-1.5 font-mono text-gray-800 font-medium">{b.product_code}</td>
                <td className="px-2 py-1.5 text-gray-700 max-w-[140px] truncate">{b.name ?? "—"}</td>
                <td className="px-2 py-1.5 text-gray-700">{b.size ?? "—"}</td>
                <td className="px-2 py-1.5 text-right text-gray-700">{b.base_price ?? "—"}</td>
                <td className="px-2 py-1.5 text-right text-gray-700">{b.cost_price ?? "—"}</td>
                <td className="px-2 py-1.5 text-right text-gray-700">{b.mrp ?? "—"}</td>
                <td className="px-2 py-1.5 font-mono text-gray-600">{b.component_product_code ?? "—"}</td>
                <td className="px-2 py-1.5 text-gray-700">{b.internal_style_name ?? "—"}</td>
                <td className="px-2 py-1.5 text-center text-gray-700">{b.component_quantity ?? "—"}</td>
                <td className="px-2 py-1.5 text-right text-gray-700">{b.component_price ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && debouncedQuery && (
          <p className="text-center text-sm text-gray-400 py-6">No bundles match your search</p>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50">
          <span className="text-xs text-gray-500">
            Showing {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, filtered.length)} of {filtered.length}
            {debouncedQuery && ` (filtered from ${bundles.length})`}
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
  )
}
