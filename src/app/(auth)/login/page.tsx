"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle, Eye, EyeOff, ArrowLeft, Circle, Check } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const supabase = createClient()

  const validateEmail = (email: string) => {
    const allowedDomains = ["@orangesugar.in", "@abhinavdev.in.net", "@gmail.com"]
    return allowedDomains.some(domain => email.toLowerCase().endsWith(domain))
  }

  // Password validation rules
  const passwordRules = [
    { label: "At least 6 characters", test: (p: string) => p.length >= 6 },
    { label: "At least 1 uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "At least 1 special character (!@#$%^&*)", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
  ]

  const isPasswordValid = passwordRules.every(rule => rule.test(password))

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      toast.error("Only @orangesugar.in email addresses are allowed")
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password")
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Please check your email and confirm your account first")
        } else {
          toast.error(error.message)
        }
      } else {
        toast.success("Signed in successfully!")
        window.location.href = "/"
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      toast.error("Only @orangesugar.in email addresses are allowed")
      return
    }

    if (!isPasswordValid) {
      toast.error("Please meet all password requirements")
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("This email is already registered. Try signing in.")
        } else {
          toast.error(error.message)
        }
      } else {
        setEmailSent(true)
        toast.success("Check your email for the confirmation link!")
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h1>
          <p className="text-sm text-gray-500 mb-1">We sent a confirmation link to</p>
          <p className="text-sm font-medium text-gray-900 mb-6">{email}</p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setEmailSent(false)
              setIsSignUp(false)
              setPassword("")
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">
          {isSignUp ? "Create account" : "Welcome back"}
        </h1>
        <p className="text-sm text-gray-500">
          {isSignUp ? "Sign up to get started" : "Sign in to your account"}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@orangesugar.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-10 bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-10 pr-10 bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {isSignUp && password.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {passwordRules.map((rule, index) => {
                const passed = rule.test(password)
                return (
                  <div key={index} className="flex items-center gap-2">
                    {passed ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-gray-300" />
                    )}
                    <span className={`text-xs ${passed ? "text-green-600" : "text-gray-500"}`}>
                      {rule.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-10 bg-orange-600 hover:bg-orange-700"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isSignUp ? "Creating..." : "Signing in..."}
            </>
          ) : (
            isSignUp ? "Create account" : "Sign in"
          )}
        </Button>
      </form>

      {/* Toggle */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setPassword("")
          }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {isSignUp ? (
            <>Already have an account? <span className="text-orange-600 font-medium">Sign in</span></>
          ) : (
            <>New to Pulp? <span className="text-orange-600 font-medium">Sign up</span></>
          )}
        </button>
      </div>
    </div>
  )
}
