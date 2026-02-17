"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Minus, Package, X } from "lucide-react"
import type { SizeQuantity } from "../types"

type OrderSummaryCardProps = {
  sizeQuantities: SizeQuantity[]
  onQuantityChange: (sizeName: string, delta: number) => void
  onQuantityInput: (sizeName: string, value: string) => void
  onCostPriceChange: (sizeName: string, value: string) => void
  onRemoveSize: (sizeName: string) => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function OrderSummaryCard({
  sizeQuantities,
  onQuantityChange,
  onQuantityInput,
  onCostPriceChange,
  onRemoveSize,
  onSubmit,
  isSubmitting,
}: OrderSummaryCardProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-white">
        <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
        <CardDescription className="text-sm">
          {sizeQuantities.length > 0
            ? `${sizeQuantities.length} size${sizeQuantities.length !== 1 ? 's' : ''} selected`
            : 'No sizes selected'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 bg-white">
        {sizeQuantities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">Select sizes to see order summary</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Order Items */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {sizeQuantities.map((sizeQty) => (
                  <div
                    key={sizeQty.size}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-3"
                  >
                    {/* Header with Size and SKU */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                        <span className="text-orange-700 font-bold text-xs">{sizeQty.size}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-gray-500 truncate">
                          {sizeQty.sku || <span className="text-red-500">Product not found</span>}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveSize(sizeQty.size)}
                        className="p-1 rounded-md hover:bg-gray-200 text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Quantity and Cost Price Controls */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Quantity */}
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">Quantity</Label>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onQuantityChange(sizeQty.size, -1)}
                            className="h-8 w-8 p-0"
                            disabled={sizeQty.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="text"
                            value={sizeQty.quantity || ""}
                            onChange={(e) => onQuantityInput(sizeQty.size, e.target.value)}
                            className="w-full h-8 text-center font-medium"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onQuantityChange(sizeQty.size, 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Cost Price */}
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">Cost Price (₹)</Label>
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          placeholder="0"
                          value={sizeQty.cost_price || ""}
                          onChange={(e) => onCostPriceChange(sizeQty.size, e.target.value)}
                          className="h-8 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="button"
              onClick={onSubmit}
              className="w-full h-12 text-base font-semibold bg-orange-600 hover:bg-orange-700"
              disabled={isSubmitting || sizeQuantities.length === 0}
            >
              {isSubmitting
                ? `Adding ${sizeQuantities.length} item(s)...`
                : `Add ${sizeQuantities.length} item${sizeQuantities.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
