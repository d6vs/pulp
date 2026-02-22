type TabType = "print" | "category" | "size" | "weight" | "product" | "bundle"

type TabConfig = {
  id: TabType
  label: string
  icon: React.ComponentType<{ className?: string }>
}

type TabNavigationProps = {
  tabs: TabConfig[]
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex gap-2 border-b border-gray-200">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
