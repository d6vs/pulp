"use client"

import { useItemMasterData } from "./_hooks/useItemMasterData"
import { ItemDetailsForm } from "./_components/ItemDetailsForm"
import { ItemMasterTable } from "./_components/ItemMasterTable"

export default function ItemMasterPage() {
  const {
    categories,
    itemMasterData,
    isLoading,
    refetchItemMaster,
  } = useItemMasterData()

  const todayIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split("T")[0]

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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Item Master</h1>
          <p className="text-sm text-gray-500">Create and manage item master</p>
        </div>

        <ItemDetailsForm categories={categories} onItemsAdded={refetchItemMaster} />

        <ItemMasterTable
          itemMasterData={itemMasterData}
          selectedDate={todayIST}
          onDataChanged={refetchItemMaster}
        />
      </div>
    </div>
  )
}
