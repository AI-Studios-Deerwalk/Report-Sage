"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { ArrowLeft, Eye, EyeOff, Mail, Lock, Shield, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AdminLoginFormProps {
  onSubmit?: (email: string, password: string) => void
  onBackClick?: () => void
  error?: string
  isSubmitting?: boolean
  successMessage?: string
}
// Admin Login Form
export function AdminLoginForm({ onSubmit, onBackClick, error, isSubmitting = false, successMessage }: AdminLoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(email, password)
  }

  const handleBackClick = () => {
    onBackClick?.()
  }

  const isFormValid = email.trim() && password.trim()

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Geometric patterns */}
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-blue-200/30 rotate-12 animate-spin"
             style={{ animationDuration: "20s", animationDirection: "reverse" }}></div>
        
        <div className="absolute top-1/4 right-16 w-24 h-24 border-2 border-indigo-300/40 -rotate-45 animate-pulse"
             style={{ animationDuration: "3s" }}></div>

        {/* Floating elements */}
        <div className="absolute top-1/3 left-1/4 w-16 h-16 rounded-full bg-gradient-to-r from-blue-300/20 to-indigo-300/20 animate-bounce"
             style={{ animationDuration: "4s" }}>
          <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-400/30 to-indigo-400/30 animate-pulse"></div>
        </div>

        {/* Security-themed elements */}
        <div className="absolute bottom-1/4 right-1/3 w-12 h-12 rounded-full bg-gradient-to-r from-slate-300/25 to-blue-300/25 animate-bounce"
             style={{ animationDuration: "3.5s", animationDelay: "1s" }}>
          <div className="w-full h-full rounded-full bg-gradient-to-r from-slate-400/35 to-blue-400/35 animate-pulse"></div>
        </div>

        {/* Particle system */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/30 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Back button */}
      <Button
        variant="ghost"
        className="absolute top-6 left-6 text-slate-600 hover:text-slate-800 hover:bg-white/50 p-3 h-auto w-auto rounded-xl transition-all duration-200 z-10"
        onClick={handleBackClick}
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>

      {/* Main admin login card */}
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-2xl z-10">
        <CardHeader className="text-center py-6 px-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Admin Access
          </h1>
          <p className="text-sm text-slate-600">
            Secure administrator login
          </p>
        </CardHeader>

        <CardContent className="px-8 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Admin Email
              </Label>
              <div className="relative">
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="Enter admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className={`border-2 transition-all duration-200 h-12 text-sm pl-4 pr-4 rounded-xl ${
                    focusedField === "email"
                      ? "border-blue-500 focus:ring-4 focus:ring-blue-100"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  required
                />
                {focusedField === "email" && (
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none animate-pulse"></div>
                )}
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Admin Password
              </Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className={`border-2 transition-all duration-200 h-12 text-sm pl-4 pr-12 rounded-xl ${
                    focusedField === "password"
                      ? "border-blue-500 focus:ring-4 focus:ring-blue-100"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {focusedField === "password" && (
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none animate-pulse"></div>
                )}
              </div>
            </div>

            {/* Success message */}
            {successMessage && (
              <Alert className="border-emerald-200 bg-emerald-50">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <AlertDescription className="text-emerald-800">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Error message */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Login button */}
            <Button
              type="submit"
              className={`w-full h-12 text-sm font-medium rounded-xl transition-all duration-200 ${
                isFormValid
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              }`}
              disabled={isSubmitting || !isFormValid}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Authenticating...
                </div>
              ) : (
                "Access Admin Panel"
              )}
            </Button>

            {/* Security notice */}
            <div className="text-center pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                <Shield className="w-3 h-3 inline mr-1" />
                Secure administrator access only
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminLoginPage() {
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const router = useRouter()

  const handleSubmit = async (email: string, password: string) => {
    setIsLoading(true)
    setError("")

    try {
      // Call admin login API with proper base URL
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Admin authentication failed' }))
        throw new Error(errorData.detail || 'Admin authentication failed')
      }

      const data = await response.json()

      // Store admin token
      localStorage.setItem('adminToken', data.access_token)
      localStorage.setItem('adminData', JSON.stringify(data.admin))

      // Redirect to admin dashboard
      router.push("/admin/dashboard")
      
    } catch (err: any) {
      console.error('Admin login error:', err)
      
      // Handle different types of errors
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError("Cannot connect to server. Please make sure the backend is running on http://localhost:8000")
      } else if (err.message.includes('<!DOCTYPE')) {
        setError("Server returned HTML instead of JSON. Please check if the backend is running correctly.")
      } else {
        setError(err.message || "Admin login failed. Please check your credentials.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackClick = () => {
    router.push("/")
  }

  return (
    <AdminLoginForm
      onSubmit={handleSubmit}
      onBackClick={handleBackClick}
      error={error}
      isSubmitting={isLoading}
      successMessage={successMessage}
    />
  )
}
