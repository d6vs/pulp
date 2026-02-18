"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, Download } from "lucide-react"
import { toast } from "sonner"
import { deleteBundleItemMasterByDate } from "../actions"
import { exportToXLSXFromJSON } from "@/lib/exportToXLSX"

type BundleItemMaster = {
  id: string
  category_code: string | null
  product_code: string | null
  name: string | null
  description: string | null
  scan_identifier: string | null
  length_mm: number | null
  width_mm: number | null
  height_mm: number | null
  weight_gms: number | null
  ean: string | null
  upc: string | null
  isbn: string | null
  color: string | null
  brand: string | null
  size: string | null
  requires_customization: boolean | null
  min_order_size: number | null
  tax_type_code: string | null
  gst_tax_type_code: string | null
  hsn_code: string | null
  tags: string | null
  tat: string | null
  image_url: string | null
  product_page_url: string | null
  item_detail_fields: string | null
  cost_price: number | null
  mrp: number | null
  base_price: number | null
  enabled: boolean | null
  resync_inventory: boolean | null
  type: string | null
  scan_type: string | null
  component_product_code: string | null
  component_quantity: number | null
  component_price: number | null
  batch_group_code: string | null
  dispatch_expiry_tolerance: number | null
  shelf_life: number | null
  tax_calculation_type: string | null
  expirable: boolean | null
  determine_expiry_from: string | null
  grn_expiry_tolerance: number | null
  return_expiry_tolerance: number | null
  expiry_date: string | null
  sku_type: string | null
  material: string | null
  style: string | null
  created_at: string
  updated_at: string | null
}

interface BundleItemMasterTableProps {
  bundleItemMasterData: BundleItemMaster[]
  selectedDate: string
  onDataChanged: () => Promise<void>
}

export function BundleItemMasterTable({
  bundleItemMasterData,
  selectedDate,
  onDataChanged,
}: BundleItemMasterTableProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteAll = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteBundleItemMasterByDate(selectedDate)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Deleted ${result.deletedCount} item(s)`)
        await onDataChanged()
      }
    } catch (error) {
      console.error("Error deleting:", error)
      toast.error("Failed to delete bundle item master")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownloadXLSX = () => {
    if (bundleItemMasterData.length === 0) {
      toast.error("No data to download")
      return
    }

    // Prepare data for export
    const exportData = bundleItemMasterData.map((item) => ({
      "Category Code": item.category_code || "",
      "Product Code": item.product_code || "",
      "Name": item.name || "",
      "Description": item.description || "",
      "Scan Identifier": item.scan_identifier || "",
      "Length (mm)": item.length_mm || "",
      "Width (mm)": item.width_mm || "",
      "Height (mm)": item.height_mm || "",
      "Weight (gms)": item.weight_gms || "",
      "EAN": item.ean || "",
      "UPC": item.upc || "",
      "ISBN": item.isbn || "",
      "Color": item.color || "",
      "Brand": item.brand || "",
      "Size": item.size || "",
      "Requires Customization": item.requires_customization !== null ? (item.requires_customization ? "TRUE" : "FALSE") : "",
      "Min Order Size": item.min_order_size || "",
      "Tax Type Code": item.tax_type_code || "",
      "GST Tax Type Code": item.gst_tax_type_code || "",
      "HSN Code": item.hsn_code || "",
      "Tags": item.tags || "",
      "TAT": item.tat || "",
      "Image Url": item.image_url || "",
      "Product Page URL": item.product_page_url || "",
      "Item Detail Fields": item.item_detail_fields || "",
      "Cost Price": item.cost_price || "",
      "MRP": item.mrp || "",
      "Base Price": item.base_price || "",
      "Enabled": item.enabled !== null ? (item.enabled ? "TRUE" : "FALSE") : "",
      "Resync Inventory": item.resync_inventory !== null ? (item.resync_inventory ? "TRUE" : "FALSE") : "",
      "Type": item.type || "",
      "Scan Type": item.scan_type || "",
      "Component Product Code": item.component_product_code || "",
      "Component Quantity": item.component_quantity || "",
      "Component Price": item.component_price || "",
      "Batch Group Code": item.batch_group_code || "",
      "Dispatch Expiry Tolerance": item.dispatch_expiry_tolerance || "",
      "Shelf Life": item.shelf_life || "",
      "Tax Calculation Type": item.tax_calculation_type || "",
      "Expirable": item.expirable !== null ? (item.expirable ? "TRUE" : "FALSE") : "",
      "Determine Expiry From": item.determine_expiry_from || "",
      "GRN Expiry Tolerance": item.grn_expiry_tolerance || "",
      "Return Expiry Tolerance": item.return_expiry_tolerance || "",
      "Expiry Date": item.expiry_date || "",
      "SKU Type": item.sku_type || "",
    }))

    exportToXLSXFromJSON(exportData, {
      filename: `bundle_item_master_${selectedDate}.csv`,
      sheetName: "Bundle Item Master",
    })
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Bundle Items ({bundleItemMasterData.length})
            </CardTitle>
            <CardDescription className="text-sm">
              Items added on {selectedDate}
            </CardDescription>
          </div>
          {bundleItemMasterData.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadXLSX}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Bundle Item Master
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isDeleting}
                    className="gap-2 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeleting ? "Deleting..." : "Delete All"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete All Items</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete all {bundleItemMasterData.length} bundle item(s) for {selectedDate}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAll}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 bg-white">
        {bundleItemMasterData.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p>No bundle items found for {selectedDate}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Category Code*</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Product Code*</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Name*</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Description</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Scan Identifier</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Length (mm)</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Width (mm)</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Height (mm)</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Weight (gms)</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">EAN</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">UPC</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">ISBN</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Color</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Brand</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Size</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Requires Customization</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Min Order Size</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Tax Type Code</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">GST Tax Type Code</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">HSN Code</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Tags</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">TAT</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Image Url</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Product Page URL</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Item Detail Fields</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Cost Price</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">MRP</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Base Price</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Enabled</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Resync Inventory</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Scan Type</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Component Product Code</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Component Quantity</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Component Price</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Batch Group Code</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Dispatch Expiry Tolerance</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Shelf Life</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Tax Calculation Type</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Expirable</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Determine Expiry From</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">GRN Expiry Tolerance</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Return Expiry Tolerance</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Expiry Date</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">SKU Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bundleItemMasterData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs text-gray-700">{item.category_code || ""}</td>
                    <td className="px-3 py-2 text-xs font-mono text-gray-900">{item.product_code || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.name || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.description || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.scan_identifier || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.length_mm || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.width_mm || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.height_mm || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.weight_gms || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.ean || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.upc || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.isbn || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.color || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.brand || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.size || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.requires_customization !== null ? (item.requires_customization ? "TRUE" : "FALSE") : ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.min_order_size || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.tax_type_code || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.gst_tax_type_code || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.hsn_code || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.tags || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.tat || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.image_url || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.product_page_url || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.item_detail_fields || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.cost_price || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.mrp || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.base_price || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.enabled !== null ? (item.enabled ? "TRUE" : "FALSE") : ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.resync_inventory !== null ? (item.resync_inventory ? "TRUE" : "FALSE") : ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.type || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.scan_type || ""}</td>
                    <td className="px-3 py-2 text-xs font-mono text-gray-700">{item.component_product_code || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.component_quantity || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.component_price || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.batch_group_code || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.dispatch_expiry_tolerance || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.shelf_life || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.tax_calculation_type || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.expirable !== null ? (item.expirable ? "TRUE" : "FALSE") : ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.determine_expiry_from || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.grn_expiry_tolerance || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.return_expiry_tolerance || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.expiry_date || ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.sku_type || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
