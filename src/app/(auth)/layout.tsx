import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login | Pulp",
  description: "Sign in to your account",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Subtle dot pattern background */}
      <div className="fixed inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

      {/* Content */}
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <span className="text-xl font-semibold text-gray-900">Pulp</span>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-[380px]">
          {children}
        </div>

        {/* Footer */}
        <p className="mt-8 text-sm text-gray-400">
          Pulp - Inventory Management
        </p>
      </div>
    </div>
  )
}
