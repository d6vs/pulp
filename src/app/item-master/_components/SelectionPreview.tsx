"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Boxes } from "lucide-react"

type Category = {
  id: string
  category_name: string
  category_code: string | null
  sku_schema: number
  hsn_code: string | null
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

interface SelectionPreviewProps {
  selectedCategory: Category | null
  selectedPrint: Print | null
  selectedSizes: Size[]
}

export function SelectionPreview({ selectedCategory, selectedPrint, selectedSizes }: SelectionPreviewProps) {
  const isEmpty = !selectedCategory && !selectedPrint && selectedSizes.length === 0

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-white">
        <CardTitle className="text-lg font-semibold">Selection Preview</CardTitle>
        <CardDescription className="text-sm">View your current selection</CardDescription>
      </CardHeader>
      <CardContent className="p-6 bg-white">
        {isEmpty ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Boxes className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-gray-500">Select category, print, and size to see preview</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedCategory && (
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Category</p>
                <p className="text-sm font-medium text-gray-900">{selectedCategory.category_name}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-mono">
                    {selectedCategory.category_code}
                  </span>
                  {selectedCategory.hsn_code && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                      HSN: {selectedCategory.hsn_code}
                    </span>
                  )}
                </div>
              </div>
            )}

            {selectedPrint && (
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Print</p>
                <p className="text-sm font-medium text-gray-900">{selectedPrint.official_print_name}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-mono">
                    {selectedPrint.print_code}
                  </span>
                  {selectedPrint.color && (
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                      {selectedPrint.color}
                    </span>
                  )}
                </div>
              </div>
            )}

            {selectedSizes.length > 0 && (
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Sizes ({selectedSizes.length})
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedSizes.map((size) => (
                    <span
                      key={size.id}
                      className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded font-medium"
                    >
                      {size.size_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
