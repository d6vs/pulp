"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Plus, Package, Search, Pencil, Trash2, Check, X } from "lucide-react"
import { createPrint, updatePrint, deletePrint } from "../actions"
import { SearchableList } from "@/components/ui/searchable-list"

type Print = {
  id: string
  official_print_name: string
  print_code: string | null
  color: string | null
}

type AddPrintTabProps = {
  prints: Print[]
  onPrintAdded: () => void
}

export function AddPrintTab({ prints, onPrintAdded }: AddPrintTabProps) {
  const [printName, setPrintName] = useState("")
  const [printCode, setPrintCode] = useState("")
  const [printColor, setPrintColor] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Real-time validation
  const nameExists = printName.trim() !== "" &&
    prints.some((p) => p.official_print_name.toLowerCase() === printName.trim().toLowerCase())
  const codeExists = printCode.trim() !== "" &&
    prints.some((p) => p.print_code?.toLowerCase() === printCode.trim().toLowerCase())
  const hasValidationError = nameExists || codeExists

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editCode, setEditCode] = useState("")
  const [editColor, setEditColor] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Edit validation (exclude current item being edited)
  const editNameExists = editName.trim() !== "" && editingId !== null &&
    prints.some((p) => p.id !== editingId && p.official_print_name.toLowerCase() === editName.trim().toLowerCase())
  const editCodeExists = editCode.trim() !== "" && editingId !== null &&
    prints.some((p) => p.id !== editingId && p.print_code?.toLowerCase() === editCode.trim().toLowerCase())
  const hasEditValidationError = editNameExists || editCodeExists

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Print | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!printName.trim() || !printCode.trim()) {
      toast.error("Please fill in both print name and print code")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createPrint({
        official_print_name: printName.trim(),
        print_code: printCode.trim(),
        color: printColor.trim() || null,
      })

      if (result.error) {
        toast.error(`Failed to add print: ${result.error}`)
      } else {
        toast.success("Print added successfully!")
        setPrintName("")
        setPrintCode("")
        setPrintColor("")
        onPrintAdded()
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEdit = (print: Print) => {
    setEditingId(print.id)
    setEditName(print.official_print_name)
    setEditCode(print.print_code || "")
    setEditColor(print.color || "")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditCode("")
    setEditColor("")
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim() || !editCode.trim()) {
      toast.error("Please fill in both fields")
      return
    }

    setIsSaving(true)
    try {
      const result = await updatePrint(id, {
        official_print_name: editName.trim(),
        print_code: editCode.trim(),
        color: editColor.trim() || null,
      })

      if (result.error) {
        toast.error(`Failed to update: ${result.error}`)
      } else {
        toast.success("Print updated successfully!")
        cancelEdit()
        onPrintAdded()
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      const result = await deletePrint(deleteTarget.id)

      if (result.error) {
        toast.error(`Failed to delete: ${result.error}`)
      } else {
        toast.success("Print deleted successfully!")
        onPrintAdded()
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const filteredPrints = prints.filter((print) => {
    const query = searchQuery.toLowerCase()
    return (
      print.official_print_name.toLowerCase().includes(query) ||
      print.print_code?.toLowerCase().includes(query)
    )
  })

  return (
    <>
      {/* Left Column - Add New Print */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-white">
          <CardTitle className="text-lg font-semibold">Add New Print</CardTitle>
          <CardDescription className="text-sm">Create a new print with code</CardDescription>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Print Name
              </Label>
              <Input
                type="text"
                placeholder="e.g., Floral Garden"
                value={printName}
                onChange={(e) => setPrintName(e.target.value)}
                className={`h-10 ${nameExists ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
              {nameExists && (
                <p className="text-xs text-red-500">Print name already exists</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Print Code
              </Label>
              <Input
                type="text"
                placeholder="e.g., FLG"
                value={printCode}
                onChange={(e) => setPrintCode(e.target.value.toUpperCase())}
                className={`h-10 ${codeExists ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
              {codeExists ? (
                <p className="text-xs text-red-500">Print code already exists</p>
              ) : (
                <p className="text-xs text-gray-500">Short code for the print (will be used in SKU)</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Color
              </Label>
              <Input
                type="text"
                placeholder="e.g., Blue, Red, Multi"
                value={printColor}
                onChange={(e) => setPrintColor(e.target.value)}
                className="h-10"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold bg-orange-600 hover:bg-orange-700 !mt-4"
              disabled={isSubmitting || hasValidationError}
            >
              <Plus className="h-5 w-5 mr-2" />
              {isSubmitting ? "Adding Print..." : "Add Print"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Right Column - Existing Prints */}
      <SearchableList
        title="Existing Prints"
        count={prints.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name or code..."
        emptyIcon={<Package className="h-8 w-8 text-gray-400" />}
        emptyMessage="No prints added yet"
      >
        {filteredPrints.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No prints found matching &quot;{searchQuery}&quot;</p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto p-4 space-y-2">
            {filteredPrints.map((print, index) => (
              <div
                key={print.id}
                className="p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-colors"
              >
                {editingId === print.id ? (
                  <div className="space-y-2">
                    <div>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Print name"
                        className={`h-8 text-sm ${editNameExists ? "border-red-500" : ""}`}
                      />
                      {editNameExists && (
                        <p className="text-xs text-red-500 mt-1">Print name already exists</p>
                      )}
                    </div>
                    <div>
                      <Input
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                        placeholder="Print code"
                        className={`h-8 text-sm ${editCodeExists ? "border-red-500" : ""}`}
                      />
                      {editCodeExists && (
                        <p className="text-xs text-red-500 mt-1">Print code already exists</p>
                      )}
                    </div>
                    <Input
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      placeholder="Color"
                      className="h-8 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 bg-orange-600 hover:bg-orange-700"
                        onClick={() => handleUpdate(print.id)}
                        disabled={isSaving || hasEditValidationError}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        onClick={cancelEdit}
                        disabled={isSaving}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-xs font-semibold text-gray-400 mt-1">#{index + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{print.official_print_name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-mono">
                            {print.print_code}
                          </span>
                          {print.color && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                              {print.color}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(print)}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(print)}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SearchableList>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Print</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.official_print_name}&quot;? This may fail if products reference this print.
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
