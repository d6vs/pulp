"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Edit2, Trash2, X, Check, Download, AlertCircle } from "lucide-react"
import { AutocompleteInput } from "@/components/ui/autocomplete-input"
import { toast } from "sonner"
import { exportToXLSXFromArray } from "@/lib/exportToXLSX"
import type { Category, Print, Size, PurchaseOrder } from "../types"
import { updatePurchaseOrder, deletePurchaseOrder, deletePurchaseOrdersByDate } from "../actions"

type TodaysOrdersListProps = {
  purchaseOrders: PurchaseOrder[]
  categories: Category[]
  prints: Print[]
  sizes: Size[]
  selectedDate: string
  onRefetch: () => void
}

export function TodaysOrdersList({
  purchaseOrders,
  categories,
  prints,
  sizes,
  selectedDate,
  onRefetch,
}: TodaysOrdersListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    categoryInput: "",
    printInput: "",
    selectedCategory: null as Category | null,
    selectedPrint: null as Print | null,
    selectedSize: "",
    quantity: "",
    costPrice: "",
  })

  const handleEdit = (order: PurchaseOrder) => {
    const category = categories.find((c) => c.category_name === order.category)
    const print = prints.find((p) => p.official_print_name === order.print_name)

    setEditingId(order.id)
    setEditForm({
      categoryInput: order.category,
      printInput: order.print_name,
      selectedCategory: category || null,
      selectedPrint: print || null,
      selectedSize: order.size,
      quantity: order.quantity.toString(),
      costPrice: order.cost_price.toString(),
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({
      categoryInput: "",
      printInput: "",
      selectedCategory: null,
      selectedPrint: null,
      selectedSize: "",
      quantity: "",
      costPrice: "",
    })
  }

  const handleSaveEdit = async (orderId: string) => {
    if (!editForm.selectedCategory || !editForm.selectedPrint || !editForm.selectedSize) {
      toast.error("Please select category, print, and size")
      return
    }

    const printCode =
      editForm.selectedPrint.print_code || editForm.selectedPrint.official_print_name.replace(/\s+/g, "")
    const categoryCode =
      editForm.selectedCategory.category_code || editForm.selectedCategory.category_name.replace(/\s+/g, "")
    const sizeCode = editForm.selectedSize === "Standard" ? "" : `_${editForm.selectedSize}`

    const sku =
      editForm.selectedCategory.sku_schema === 2
        ? `${categoryCode}_${printCode}${sizeCode}`
        : `${printCode}_${categoryCode}${sizeCode}`

    const result = await updatePurchaseOrder(orderId, {
      sku,
      category: editForm.selectedCategory.category_name,
      print_name: editForm.selectedPrint.official_print_name,
      size: editForm.selectedSize,
      quantity: parseInt(editForm.quantity),
      cost_price: parseFloat(editForm.costPrice),
    })

    if (result.error) {
      toast.error(`Error updating order: ${result.error}`)
      return
    }

    toast.success("Order updated successfully")
    handleCancelEdit()
    onRefetch()
  }

  const handleDelete = async (orderId: string) => {
    toast.promise(
      async () => {
        const result = await deletePurchaseOrder(orderId)
        if (result.error) {
          throw new Error(result.error)
        }
        onRefetch()
      },
      {
        loading: "Deleting order...",
        success: "Order deleted successfully",
        error: (err) => `Error: ${err.message}`,
      }
    )
  }

  const handleDeleteAllOrders = async () => {
    toast.promise(
      async () => {
        const result = await deletePurchaseOrdersByDate(selectedDate)
        if (result.error) {
          throw new Error(result.error)
        }
        onRefetch()
        return result.deletedCount
      },
      {
        loading: "Deleting all orders...",
        success: (count) => `Successfully deleted ${count} order(s)`,
        error: (err) => `Error: ${err.message}`,
      }
    )
  }

  const handleDownloadXLSX = () => {
    if (purchaseOrders.length === 0) {
      toast.error("No orders to download")
      return
    }

    const headers = ["Item SKU code", "Quantity", "Cost Price", "Discount", "Tax Class"]
    const rows = purchaseOrders.map((order) => [
      order.sku,
      order.quantity,
      order.cost_price,
      order.discount,
      order.tax_class || 5
    ])

    exportToXLSXFromArray(headers, rows, {
      filename: `purchase_orders_${selectedDate}.csv`,
      sheetName: "Purchase Orders",
    })
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">This Order</CardTitle>
            <CardDescription className="text-sm">
              {purchaseOrders.length} order{purchaseOrders.length !== 1 ? "s" : ""} for {selectedDate}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadXLSX}
              disabled={purchaseOrders.length === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Create PO
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={purchaseOrders.length === 0}
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete PO
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete All Orders</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete all {purchaseOrders.length} order(s) for {selectedDate}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAllOrders}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 bg-white">
        {purchaseOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No orders for this date</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">#</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">SKU</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Category</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Print</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Size</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Quantity</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Cost Price</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((order, idx) => {
                  const isEditing = editingId === order.id

                  if (isEditing) {
                    return (
                      <tr key={order.id} className="border-b bg-orange-50">
                        <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <p className="font-mono text-xs text-gray-600">{order.sku}</p>
                        </td>
                        <td className="px-3 py-2" style={{ minWidth: "200px" }}>
                          <AutocompleteInput
                            value={editForm.categoryInput}
                            onChange={(value) => {
                              setEditForm((prev) => ({
                                ...prev,
                                categoryInput: value,
                              }))
                            }}
                            onSelect={(value) => {
                              const category = categories.find((c) => c.category_name === value)
                              setEditForm((prev) => ({
                                ...prev,
                                categoryInput: value,
                                selectedCategory: category || null,
                              }))
                            }}
                            options={categories.map((c) => c.category_name)}
                            placeholder="Select category"
                          />
                        </td>
                        <td className="px-3 py-2" style={{ minWidth: "200px" }}>
                          <AutocompleteInput
                            value={editForm.printInput}
                            onChange={(value) => {
                              setEditForm((prev) => ({
                                ...prev,
                                printInput: value,
                              }))
                            }}
                            onSelect={(value) => {
                              const print = prints.find((p) => p.official_print_name === value)
                              setEditForm((prev) => ({
                                ...prev,
                                printInput: value,
                                selectedPrint: print || null,
                              }))
                            }}
                            options={prints.map((p) => p.official_print_name)}
                            placeholder="Select print"
                          />
                        </td>
                        <td className="px-3 py-2" style={{ minWidth: "150px" }}>
                          <select
                            value={editForm.selectedSize}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, selectedSize: e.target.value }))}
                            className="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="">Select size</option>
                            {sizes.map((size) => (
                              <option key={size.id} value={size.size_name}>
                                {size.size_name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2" style={{ minWidth: "120px" }}>
                          <Input
                            type="number"
                            min="1"
                            value={editForm.quantity}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, quantity: e.target.value }))}
                            className="h-9"
                          />
                        </td>
                        <td className="px-3 py-2" style={{ minWidth: "120px" }}>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editForm.costPrice}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, costPrice: e.target.value }))}
                            className="h-9"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2 whitespace-nowrap">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(order.id)}
                              className="gap-1 bg-orange-600 hover:bg-orange-700 h-8 px-2"
                            >
                              <Check className="h-3 w-3" />
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                              className="gap-1 h-8 px-2"
                            >
                              <X className="h-3 w-3" />
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-700 whitespace-nowrap">{order.sku}</td>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{order.category}</td>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{order.print_name}</td>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{order.size}</td>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{order.quantity}</td>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">₹{order.cost_price.toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2 whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(order)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4 text-blue-600" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Trash2 className="h-4 w-4 text-orange-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Order</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this order? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(order.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
