"use client"

import {
  ShoppingCart,
  Package,
  ChevronRight,
  Boxes,
  PackagePlus,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

const menuItems = [
  {
    title: "Purchase Orders",
    url: "/purchase-orders",
    icon: ShoppingCart,
  },
  {
    title: "Item Master",
    url: "/item-master",
    icon: Boxes,
  },
  {
    title: "Bundle Item Master",
    url: "/bundle-item-master",
    icon: PackagePlus,
  },
  {
    title: "Product Setup",
    url: "/master-data",
    icon: Package,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="flex h-16 flex-row items-center border-b px-6 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-md">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-base font-bold leading-none text-gray-900">
              Pulp
            </span>
            <span className="mt-1 text-xs text-gray-500">Inventory</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 group-data-[collapsible=icon]:px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                    >
                      <Link
                        href={item.url}
                        className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 ${
                          isActive
                            ? "!bg-orange-500 !text-white shadow-sm hover:!bg-orange-600"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : ""}`} />
                        <span className="flex-1 group-data-[collapsible=icon]:hidden">{item.title}</span>
                        {isActive && (
                          <ChevronRight className="h-4 w-4 opacity-70 text-white group-data-[collapsible=icon]:hidden" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t px-6 py-4 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <p className="text-xs text-gray-500 group-data-[collapsible=icon]:hidden">
            © 2026 Reports System
          </p>
          <SidebarTrigger />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
