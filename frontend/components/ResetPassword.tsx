"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { ArrowLeft, Shield, Eye, EyeOff, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { authAPI } from "@/lib/api"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [validationError, setValidationError] = useState("")
  const [email, setEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")

  const router = useRouter()

  useEffect(() => {
    // Get data from localStorage or URL params
    const storedEmail = localStorage.getItem('forgotPasswordEmail')
    const storedOtpCode = localStorage.getItem('forgotPasswordOtpCode')
    
    if (storedEmail && storedOtpCode) {
      setEmail(storedEmail)
      setOtpCode(storedOtpCode)
    } else {
      // If no data, redirect to forgot password
      router.push("/forgot-password")
    }
  }, [router])

  const validatePassword = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 8) {
      return { isValid: false, message: "Password must be at least 8 characters long" }
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: "Password must contain at least one uppercase letter" }
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: "Password must contain at least one lowercase letter" }
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: "Password must contain at least one number" }
    }
    return { isValid: true, message: "" }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setError("")
    setValidationError("")

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      setValidationError(passwordValidation.message)
      return
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match")
      return
    }

    if (!email || !otpCode) {
      setError("Invalid session. Please start the password reset process again.")
      return
    }

    setIsSubmitting(true)

    try {
      await authAPI.resetPassword(email, password, otpCode)
      
      // Clear stored data
      localStorage.removeItem('forgotPasswordEmail')
      localStorage.removeItem('forgotPasswordOtpCode')
      
      // Redirect to login with success message
      router.push("/login?resetSuccess=true")
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reset password. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    router.push("/forgot-password")
  }

  const isFormValid = password.trim() && confirmPassword.trim() && password === confirmPassword

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
      <Button
        variant="ghost"
        className="absolute top-6 left-6 text-gray-600 hover:text-gray-800 hover:bg-white/50 p-3 h-auto w-auto rounded-xl transition-all duration-200 z-10"
        onClick={handleBack}
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>

      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-2xl z-10">
        <CardHeader className="text-center py-6 px-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Reset Password
          </h1>
          <p className="text-sm text-gray-600">
            Enter your new password below
          </p>
        </CardHeader>

        <CardContent className="px-8 pb-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className={`border-2 transition-all duration-200 h-12 text-sm pl-4 pr-12 rounded-xl ${
                    focusedField === "password"
                      ? "border-blue-500 focus:ring-4 focus:ring-blue-100"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {focusedField === "password" && (
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none animate-pulse"></div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 8 characters with uppercase, lowercase, and numbers.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField(null)}
                  className={`border-2 transition-all duration-200 h-12 text-sm pl-4 pr-12 rounded-xl ${
                    focusedField === "confirmPassword"
                      ? "border-blue-500 focus:ring-4 focus:ring-blue-100"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {focusedField === "confirmPassword" && (
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none animate-pulse"></div>
                )}
              </div>
            </div>

            {validationError && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-4 rounded-xl flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                {validationError}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-4 rounded-xl flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`w-full h-12 text-sm font-medium rounded-xl transition-all duration-200 ${
                isFormValid && !isSubmitting
                  ? "bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Resetting...
                </div>
              ) : (
                "Reset Password"
              )}
            </Button>

            <div className="text-center pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Remember your password?{" "}
                <button
                  type="button"
                  className="text-teal-600 hover:text-teal-700 font-medium transition-colors duration-200 hover:underline"
                  onClick={handleBack}
                >
                  Back to login
                </button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
