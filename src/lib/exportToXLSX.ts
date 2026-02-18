import { toast } from "sonner"

type ExportOptions = {
  filename: string
  sheetName?: string
  showSuccessToast?: boolean
}

function escapeCSVValue(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Export data to CSV using array of arrays format
 */
export function exportToXLSXFromArray(
  headers: string[],
  rows: unknown[][],
  options: ExportOptions
) {
  try {
    const csvRows = [headers, ...rows].map((row) =>
      row.map(escapeCSVValue).join(",")
    )
    const csvContent = csvRows.join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
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
    console.error("Error exporting to CSV:", error)
    toast.error("Failed to download file")
  }
}

/**
 * Export data to CSV using JSON format
 */
export function exportToXLSXFromJSON(
  data: Record<string, unknown>[],
  options: ExportOptions
) {
  try {
    if (!data.length) {
      toast.error("No data to export")
      return
    }

    const headers = Object.keys(data[0])
    const rows = data.map((obj) => headers.map((h) => obj[h]))
    const csvRows = [headers, ...rows].map((row) =>
      row.map(escapeCSVValue).join(",")
    )
    const csvContent = csvRows.join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
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
    console.error("Error exporting to CSV:", error)
    toast.error("Failed to download file")
  }
}
