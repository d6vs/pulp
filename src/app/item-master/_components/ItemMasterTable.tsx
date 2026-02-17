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
import { Boxes, Download, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { exportToXLSXFromArray } from "@/lib/exportToXLSX"
import { deleteItemMasterByDate } from "../actions"
import { ITEM_MASTER_COLUMNS, ITEM_MASTER_HEADERS } from "../constants"

interface ItemMasterTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemMasterData: any[]
  selectedDate: string
  onDataChanged: () => Promise<void>
}

export function ItemMasterTable({ itemMasterData, selectedDate, onDataChanged }: ItemMasterTableProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  console.log("Rendering ItemMasterTable with data:", itemMasterData)
  const handleDownload = () => {
    if (itemMasterData.length === 0) {
      toast.error("No data to download")
      return
    }

    const rows = itemMasterData.map((item) =>
      ITEM_MASTER_COLUMNS.map((col) => item[col] ?? "")
    )

    exportToXLSXFromArray(ITEM_MASTER_HEADERS, rows, {
      filename: `Item_Master_${selectedDate}.xlsx`,
      sheetName: "Item Master",
    })
  }

  const handleDeleteAll = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteItemMasterByDate(selectedDate)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Deleted ${result.deletedCount} item(s)`)
        await onDataChanged()
      }
    } catch (error) {
      console.error("Error deleting:", error)
      toast.error("Failed to delete item master")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="border-0 shadow-lg min-w-0 max-w-full overflow-hidden">
      <CardHeader className="border-b bg-white flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">
            Item Master Data
            {itemMasterData.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({itemMasterData.length} items)
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-sm">Items for {selectedDate}</CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={itemMasterData.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download Item Master
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting || itemMasterData.length === 0}
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
                  Are you sure you want to delete all {itemMasterData.length} item(s) for {selectedDate}? This action cannot be undone.
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
      </CardHeader>
      <CardContent className="p-0 bg-white">
        {itemMasterData.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Boxes className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No items in Item Master for {selectedDate}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">#</th>
                  {ITEM_MASTER_HEADERS.map((header, i) => (
                    <th
                      key={i}
                      className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itemMasterData.map((item, rowIdx) => (
                  <tr key={item.id || rowIdx} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500">{rowIdx + 1}</td>
                    {ITEM_MASTER_COLUMNS.map((col, colIdx) => (
                      <td key={colIdx} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                        {item[col] ?? ""}
                      </td>
                    ))}
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
