"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Plus, Ruler, Search } from "lucide-react"
import { createSize } from "../actions"
import { SearchableList } from "@/components/ui/searchable-list"

type Size = {
  id: string
  size_name: string
}

type AddSizeTabProps = {
  sizes: Size[]
  onSizeAdded: () => void
}

export function AddSizeTab({ sizes, onSizeAdded }: AddSizeTabProps) {
  const [sizeName, setSizeName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sizeName.trim()) {
      toast.error("Please enter a size name")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createSize({
        size_name: sizeName.trim(),
      })

      if (result.error) {
        toast.error(`Failed to add size: ${result.error}`)
      } else {
        toast.success("Size added successfully!")
        setSizeName("")
        onSizeAdded()
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredSizes = sizes.filter((size) => {
    const query = searchQuery.toLowerCase()
    return size.size_name.toLowerCase().includes(query)
  })

  return (
    <>
      {/* Left Column - Add New Size */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-white">
          <CardTitle className="text-lg font-semibold">Add New Size</CardTitle>
          <CardDescription className="text-sm">Create a new product size</CardDescription>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Size Name
              </Label>
              <Input
                type="text"
                placeholder="e.g., 3-4Y"
                value={sizeName}
                onChange={(e) => setSizeName(e.target.value)}
                className="h-10"
              />
              <p className="text-xs text-gray-500">Enter the size (e.g., 0-3M, 3-6M, Standard)</p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold bg-orange-600 hover:bg-orange-700"
              disabled={isSubmitting}
            >
              <Plus className="h-5 w-5 mr-2" />
              {isSubmitting ? "Adding Size..." : "Add Size"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Right Column - Existing Sizes */}
      <SearchableList
        title="Existing Sizes"
        count={sizes.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search sizes..."
        emptyIcon={<Ruler className="h-8 w-8 text-gray-400" />}
        emptyMessage="No sizes added yet"
      >
        {filteredSizes.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No sizes found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto p-4">
            <div className="grid grid-cols-3 gap-2">
              {filteredSizes.map((size) => (
                <div
                  key={size.id}
                  className="p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-colors text-center"
                >
                  <p className="text-sm font-medium text-gray-900">{size.size_name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </SearchableList>
    </>
  )
}
