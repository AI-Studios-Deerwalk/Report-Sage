"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/router"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"

interface LoginFormProps {
  onSubmit?: (email: string, password: string) => void
  onBackClick?: () => void
  onSignupClick?: () => void
  error?: string
  isSubmitting?: boolean
}

export function LoginForm({ onSubmit, onBackClick, onSignupClick, error, isSubmitting = false }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(email, password)
  }

  const handleBackClick = () => {
    onBackClick?.()
  }

  const handleSignupClick = () => {
    onSignupClick?.()
  }

  return (
    <div className="min-h-screen bg-[#E7F0E7] flex items-center justify-center p-2">
      {/* Back button */}
      <Button
        variant="ghost"
        className="absolute top-4 left-4 text-gray-600 hover:text-gray-800 p-4 h-auto w-auto rounded-lg"
        onClick={handleBackClick}
      >
        <ArrowLeft className="h-8 w-8" />
      </Button>

      {/* Main login card */}
      <Card className="w-full max-w-md bg-white shadow-lg">
        <CardHeader className="text-center py-2">
          {/* Illustration placeholder */}
          <div className="mx-auto mb-2 w-24 h-16 bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="relative">
              {/* Books illustration */}
              <div className="w-12 h-10 bg-blue-500 rounded transform -rotate-12 absolute -left-2"></div>
              <div className="w-12 h-10 bg-blue-400 rounded transform rotate-6"></div>
              <div className="w-12 h-10 bg-blue-300 rounded transform -rotate-3 absolute top-1 left-1"></div>
              {/* Pen */}
              <div className="w-1 h-6 bg-white rounded-full absolute -top-2 right-2 transform rotate-45"></div>
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full absolute -top-3 right-1"></div>
            </div>
          </div>

          <h1 className="text-xl font-semibold text-gray-900 mb-1">Welcome</h1>
          <p className="text-gray-600 text-xs">Please enter your credentials</p>
        </CardHeader>

        <CardContent className="py-2">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs text-gray-700">
                Student Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g abc@student.wolk.edu.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-9 text-sm"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-9 text-sm"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded">
                {error}
              </div>
            )}
            
            {/* Login button */}
            <Button 
              type="submit" 
              className="w-full bg-black hover:bg-gray-800 text-white py-2 mt-3 text-sm h-9"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Log in"}
            </Button>

            {/* Signup link */}
            <p className="text-center text-xs text-gray-600 mt-2">
              Don't have an account?{" "}
              <button
                type="button"
                className="text-[#3AC4C4] hover:text-[#3AC4C4] font-medium"
                onClick={handleSignupClick}
              >
                Sign up
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (email: string, password: string) => {
    setIsLoading(true)
    setError("")

    try {
      await login(email, password)
      // Redirect to dashboard after successful login
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackClick = () => {
    router.push("/")
  }

  const handleSignupClick = () => {
    router.push("/signup")
  }

  return (
    <LoginForm
      onSubmit={handleSubmit}
      onBackClick={handleBackClick}
      onSignupClick={handleSignupClick}
      error={error}
      isSubmitting={isLoading}
    />
  )
}
