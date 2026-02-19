"use client"

import { useState } from "react"
import { Tag, Package, Ruler, Weight, ShoppingBag, Boxes } from "lucide-react"
import { useProductData } from "./_hooks/useProductData"
import { TabNavigation } from "./_components/TabNavigation"
import { AddPrintTab } from "./_components/AddPrintTab"
import { AddCategoryTab } from "./_components/AddCategoryTab"
import { AddSizeTab } from "./_components/AddSizeTab"
import { UpdateWeightTab } from "./_components/UpdateWeightTab"
import { AddProductTab } from "./_components/AddProductTab"
import { ExistingProductsList } from "./_components/ExistingProductsList"
import { ExistingBundlesList } from "./_components/ExistingBundlesList"

type TabType = "print" | "category" | "size" | "weight" | "product" | "bundle"

const TABS = [
  { id: "print" as TabType, label: "Add Print", icon: Tag },
  { id: "category" as TabType, label: "Add Category", icon: Package },
  { id: "size" as TabType, label: "Add Size", icon: Ruler },
  { id: "weight" as TabType, label: "Add Weight", icon: Weight },
  { id: "product" as TabType, label: "Add Product", icon: ShoppingBag },
  { id: "bundle" as TabType, label: "Bundles", icon: Boxes },
]

export default function ProductSetupPage() {
  const [activeTab, setActiveTab] = useState<TabType>("print")
  const {
    prints,
    categories,
    sizes,
    products,
    bundleReferences,
    isLoading,
    refetchPrints,
    refetchCategories,
    refetchSizes,
    refetchProducts,
  } = useProductData()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Setup</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage prints, categories, sizes, and product weights
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <TabNavigation tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeTab === "print" && (
            <AddPrintTab prints={prints} onPrintAdded={refetchPrints} />
          )}

          {activeTab === "category" && (
            <AddCategoryTab categories={categories} onCategoryAdded={refetchCategories} />
          )}

          {activeTab === "size" && (
            <AddSizeTab sizes={sizes} onSizeAdded={refetchSizes} />
          )}

          {activeTab === "weight" && (
            <UpdateWeightTab categories={categories} sizes={sizes} />
          )}

          {activeTab === "product" && (
            <div className="lg:col-span-2 space-y-6">
              <AddProductTab
                categories={categories}
                prints={prints}
                sizes={sizes}
                onProductAdded={refetchProducts}
              />
              <ExistingProductsList products={products} />
            </div>
          )}

          {activeTab === "bundle" && (
            <div className="lg:col-span-2">
              <ExistingBundlesList bundles={bundleReferences} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
