"use client"

import { useBundleItemMasterData } from "./_hooks/useBundleItemMasterData"
import { BundleDetailsForm } from "./_components/BundleDetailsForm"
import { BundleItemMasterTable } from "./_components/BundleItemMasterTable"

export default function BundleItemMasterPage() {
  const {
    bundleCategories,
    individualCategories,
    bundleItemMasterData,
    selectedDate,
    setSelectedDate,
    isLoading,
    refetchBundleItemMaster,
  } = useBundleItemMasterData()

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
      <div className="max-w-full mx-auto space-y-6">
        {/* Header with Date Selector */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bundle Item Master</h1>
            <p className="text-sm text-gray-500">Create and manage bundle item master</p>
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

        {/* Bundle Details Form */}
        <BundleDetailsForm
          bundleCategories={bundleCategories}
          individualCategories={individualCategories}
          onItemsAdded={refetchBundleItemMaster}
        />

        {/* Bundle Items Table */}
        <BundleItemMasterTable
          bundleItemMasterData={bundleItemMasterData}
          selectedDate={selectedDate}
          onDataChanged={refetchBundleItemMaster}
        />
      </div>
    </div>
  )
}
