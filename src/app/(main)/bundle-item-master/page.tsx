"use client"

import { useBundleItemMasterData } from "./_hooks/useBundleItemMasterData"
import { BundleDetailsForm } from "./_components/BundleDetailsForm"
import { BundleItemMasterTable } from "./_components/BundleItemMasterTable"

export default function BundleItemMasterPage() {
  const {
    bundleCategories,
    individualCategories,
    bundleItemMasterData,
    isLoading,
    refetchBundleItemMaster,
  } = useBundleItemMasterData()
  
  const todayIST = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
  
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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bundle Item Master</h1>
          <p className="text-sm text-gray-500">Create and manage bundle item master</p>
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
          selectedDate={todayIST}
          onDataChanged={refetchBundleItemMaster}
        />
      </div>
    </div>
  )
}
