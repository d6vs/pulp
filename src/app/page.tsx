import Link from "next/link"
import { ShoppingCart, Boxes, Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const sections = [
  {
    title: "Purchase Orders",
    description: "Create and manage daily purchase orders. Add items with SKU, quantity, cost price, and export as CSV.",
    href: "/purchase-orders",
    icon: ShoppingCart,
  },
  {
    title: "Item Master",
    description: "Generate item master data by selecting category, print, and sizes. Download as XLSX for Unicommerce import.",
    href: "/item-master",
    icon: Boxes,
  },
  {
    title: "Product Setup",
    description: "Manage prints, categories, sizes, weights, and products. Configure SKU schemas and product details.",
    href: "/master-data",
    icon: Package,
  },
]

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-5rem)]  flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Reports Pro</h1>
          <p className="text-gray-500">Inventory management and reporting system</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sections.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                    <section.icon className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {section.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
