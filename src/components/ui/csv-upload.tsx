"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, Download, FileText, AlertCircle, CheckCircle2, X, Loader2 } from "lucide-react"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { parseCSV, downloadTemplate, CSV_TEMPLATES, type TemplateType } from "@/lib/csv-templates"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type ImportError = {
  row: number
  field: string
  message: string
}

type ImportSkipped = {
  row: number
  name: string
  reason: string
}

type ImportResult = {
  successCount: number
  errorCount: number
  skippedCount: number
  errors: ImportError[]
  skipped: ImportSkipped[]
}

type CSVUploadProps = {
  templateType: TemplateType
  onImport: (data: Record<string, unknown>[]) => Promise<ImportResult>
  onSuccess?: () => void
  title?: string
  description?: string
}

export function CSVUpload({
  templateType,
  onImport,
  onSuccess,
  title = "Import from CSV",
  description,
}: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<Record<string, unknown>[]>([])
  const [parseErrors, setParseErrors] = useState<ImportError[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const template = CSV_TEMPLATES[templateType]

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile && droppedFile.name.endsWith(".csv")) {
        processFile(droppedFile)
      } else {
        toast.error("Please upload a CSV file")
      }
    },
    [templateType]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        processFile(selectedFile)
      }
    },
    [templateType]
  )

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile)
    setImportResult(null)
    setParseErrors([])

    try {
      const text = await selectedFile.text()
      const { data, errors } = parseCSV(text, templateType)
      setParsedData(data)
      setParseErrors(errors)

      if (errors.length > 0) {
        toast.warning(`Found ${errors.length} validation error(s) in CSV`)
      } else if (data.length > 0) {
        toast.success(`Parsed ${data.length} row(s) successfully`)
      }
    } catch (error) {
      console.error("Error parsing CSV:", error)
      toast.error("Failed to parse CSV file")
      setFile(null)
    }
  }

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error("No data to import")
      return
    }

    setIsImporting(true)
    try {
      const result = await onImport(parsedData)
      setImportResult(result)

      if (result.errorCount === 0 && result.skippedCount === 0) {
        toast.success(`Successfully imported ${result.successCount} record(s)`)
        onSuccess?.()
        resetState()
      } else if (result.errorCount === 0 && result.skippedCount > 0) {
        // Some skipped, no errors
        if (result.successCount > 0) {
          toast.success(
            `Imported ${result.successCount} record(s), ${result.skippedCount} unchanged`
          )
          onSuccess?.()
        } else {
          toast.info(`No changes: ${result.skippedCount} record(s) already up to date`)
        }
      } else if (result.successCount > 0) {
        toast.warning(
          `Imported ${result.successCount} record(s), ${result.errorCount} failed${result.skippedCount > 0 ? `, ${result.skippedCount} unchanged` : ""}`
        )
        onSuccess?.()
      } else {
        toast.error(`Import failed: ${result.errorCount} error(s)`)
      }
    } catch (error) {
      console.error("Import error:", error)
      toast.error("An error occurred during import")
    } finally {
      setIsImporting(false)
    }
  }

  const resetState = () => {
    setFile(null)
    setParsedData([])
    setParseErrors([])
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const allErrors = [...parseErrors, ...(importResult?.errors || [])]

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-white">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Upload className="h-5 w-5 text-orange-600" />
          {title}
        </CardTitle>
        <CardDescription className="text-sm">
          {description || template?.description || `Upload a CSV file to import ${templateType}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 bg-white space-y-4">
        {/* Download Template Button */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Need a template? Download one with example data.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadTemplate(templateType)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
        </div>

        {/* Drop Zone */}
        {!file && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragging
                ? "border-orange-500 bg-orange-50"
                : "border-gray-300 hover:border-orange-400 hover:bg-gray-50"
            )}
          >
            <FileText className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">
              Drop your CSV file here or click to browse
            </p>
            <p className="text-xs text-gray-500 mt-1">Only .csv files are accepted</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* File Selected State */}
        {file && (
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {parsedData.length} row(s) parsed
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetState}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Preview Table */}
            {parsedData.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <p className="text-sm font-medium text-gray-700">
                    Preview (first 5 rows)
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">
                          #
                        </th>
                        {template?.headers.map((header) => (
                          <th
                            key={header}
                            className={cn(
                              "px-3 py-2 text-left font-medium",
                              template.required.includes(header)
                                ? "text-orange-700"
                                : "text-gray-600"
                            )}
                          >
                            {header}
                            {template.required.includes(header) && "*"}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {parsedData.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                          {template?.headers.map((header) => (
                            <td
                              key={header}
                              className="px-3 py-2 text-gray-900 max-w-[150px] truncate"
                            >
                              {String(row[header] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.length > 5 && (
                  <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500">
                    ... and {parsedData.length - 5} more row(s)
                  </div>
                )}
              </div>
            )}

            {/* Errors Display */}
            {allErrors.length > 0 && (
              <div className="border border-red-200 rounded-lg overflow-hidden">
                <div className="bg-red-50 px-4 py-2 border-b border-red-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm font-medium text-red-700">
                    {allErrors.length} Error(s) Found
                  </p>
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-red-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-red-700">
                          Row
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-red-700">
                          Field
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-red-700">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-100">
                      {allErrors.map((error, idx) => (
                        <tr key={idx} className="hover:bg-red-50">
                          <td className="px-3 py-2 text-red-800">{error.row}</td>
                          <td className="px-3 py-2 text-red-800 font-mono">
                            {error.field || "-"}
                          </td>
                          <td className="px-3 py-2 text-red-800">{error.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Skipped Records Display */}
            {importResult && importResult.skippedCount > 0 && (
              <div className="border border-amber-200 rounded-lg overflow-hidden">
                <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-medium text-amber-700">
                    {importResult.skippedCount} Record(s) Unchanged
                  </p>
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-amber-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-amber-700">
                          Row
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-amber-700">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-amber-700">
                          Reason
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                      {importResult.skipped.map((item, idx) => (
                        <tr key={idx} className="hover:bg-amber-50">
                          <td className="px-3 py-2 text-amber-800">{item.row}</td>
                          <td className="px-3 py-2 text-amber-800 font-medium">
                            {item.name}
                          </td>
                          <td className="px-3 py-2 text-amber-800">{item.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Import Result Success */}
            {importResult && importResult.successCount > 0 && importResult.errorCount === 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm text-green-700">
                  Successfully imported {importResult.successCount} record(s)
                  {importResult.skippedCount > 0 && `, ${importResult.skippedCount} unchanged`}
                </p>
              </div>
            )}

            {/* Import Button */}
            <Button
              onClick={handleImport}
              disabled={isImporting || parsedData.length === 0 || parseErrors.length > 0}
              className="w-full h-11 text-base font-semibold bg-orange-600 hover:bg-orange-700"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Import {parsedData.length} Record(s)
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
