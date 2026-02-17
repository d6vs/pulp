import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pulp",
  description: "Inventory and order management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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
                  {/* Add user menu, notifications, etc. here later */}
                </div>
              </div>
            </header>
            <div className="flex-1 p-6">{children}</div>
          </main>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
