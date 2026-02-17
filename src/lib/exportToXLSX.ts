import * as XLSX from "xlsx"
import { toast } from "sonner"

type ExportOptions = {
  filename: string
  sheetName: string
  showSuccessToast?: boolean
}

/**
 * Export data to XLSX using array of arrays format
 * @param headers - Array of column headers
 * @param rows - Array of arrays containing row data
 * @param options - Export options (filename, sheetName, showSuccessToast)
 */
export function exportToXLSXFromArray(
  headers: string[],
  rows: unknown[][],
  options: ExportOptions
) {
  try {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, options.sheetName)

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = options.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    if (options.showSuccessToast !== false) {
      toast.success("File downloaded successfully")
    }
  } catch (error) {
    console.error("Error exporting to XLSX:", error)
    toast.error("Failed to download file")
  }
}

/**
 * Export data to XLSX using JSON format
 * @param data - Array of objects to export
 * @param options - Export options (filename, sheetName, showSuccessToast)
 */
export function exportToXLSXFromJSON(
  data: Record<string, unknown>[],
  options: ExportOptions
) {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName)

    XLSX.writeFile(workbook, options.filename)

    if (options.showSuccessToast !== false) {
      toast.success("File downloaded successfully")
    }
  } catch (error) {
    console.error("Error exporting to XLSX:", error)
    toast.error("Failed to download file")
  }
}
