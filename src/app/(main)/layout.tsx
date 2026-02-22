import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { UserInfo } from "@/components/auth";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex min-h-screen flex-1 flex-col bg-gray-50/40 min-w-0 overflow-x-hidden">
        <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-white px-6 shadow-sm">
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Inventory Management
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <UserInfo />
            </div>
          </div>
        </header>
        <div className="flex-1 p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
