"use client"

import { useItemMasterData } from "./_hooks/useItemMasterData"
import { ItemDetailsForm } from "./_components/ItemDetailsForm"
import { ItemMasterTable } from "./_components/ItemMasterTable"

export default function ItemMasterPage() {
  const {
    categories,
    itemMasterData,
    selectedDate,
    setSelectedDate,
    isLoading,
    refetchItemMaster,
  } = useItemMasterData()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Date Selector */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Item Master</h1>
            <p className="text-sm text-gray-500">Create and manage item master</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <ItemDetailsForm categories={categories} onItemsAdded={refetchItemMaster} />

        <ItemMasterTable
          itemMasterData={itemMasterData}
          selectedDate={selectedDate}
          onDataChanged={refetchItemMaster}
        />
      </div>
    </div>
  )
}
