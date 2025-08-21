"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { ArrowLeft, Mail, CheckCircle, Loader2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { OTPVerification } from "./verifyOTP"
import { authAPI, OTPPurpose } from "@/lib/api"

type ForgotPasswordStep = 'email' | 'otp' | 'success'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<ForgotPasswordStep>('email')
  const [email, setEmail] = useState("")
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)
  const [userId, setUserId] = useState<number | null>(null)

  const router = useRouter()

  // Initialize state from localStorage if available (for page refresh)
  useEffect(() => {
    const storedCountdown = localStorage.getItem('forgotPasswordCountdown')
    const storedStartTime = localStorage.getItem('forgotPasswordStartTime')
    const storedEmail = localStorage.getItem('forgotPasswordEmail')
    const storedUserId = localStorage.getItem('forgotPasswordUserId')
    const storedStep = localStorage.getItem('forgotPasswordStep')
    
    // Restore email if available
    if (storedEmail) {
      setEmail(storedEmail)
    }
    
    // Restore user ID if available
    if (storedUserId) {
      setUserId(parseInt(storedUserId))
    }
    
    // Restore step if available
    if (storedStep && (storedStep === 'otp' || storedStep === 'success')) {
      setStep(storedStep as ForgotPasswordStep)
    }
    
    // Restore countdown if available
    if (storedCountdown && storedStartTime) {
      const startTime = parseInt(storedStartTime)
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const remaining = Math.max(0, 120 - elapsed)
      
      setResendCooldown(remaining)
      
      // If countdown has already expired, clear localStorage
      if (remaining <= 0) {
        localStorage.removeItem('forgotPasswordCountdown')
        localStorage.removeItem('forgotPasswordStartTime')
        localStorage.removeItem('forgotPasswordStep')
      }
    }
  }, [])

  // Check for email in URL params and auto-send if requested (only if not restoring from localStorage)
  useEffect(() => {
    const { email: urlEmail, autoSend } = router.query
    const isRestoringFromStorage = localStorage.getItem('forgotPasswordStep')
    
    if (urlEmail && typeof urlEmail === 'string' && !isRestoringFromStorage) {
      setEmail(urlEmail)
      if (autoSend === 'true') {
        handleRequestReset(urlEmail)
      }
    }
  }, [router.query])

  // Handle resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        const newValue = resendCooldown - 1
        setResendCooldown(newValue)
        
        // Update localStorage with new countdown value
        localStorage.setItem('forgotPasswordCountdown', newValue.toString())
        
        // Clear localStorage when countdown reaches 0
        if (newValue <= 0) {
          localStorage.removeItem('forgotPasswordCountdown')
          localStorage.removeItem('forgotPasswordStartTime')
          localStorage.removeItem('forgotPasswordStep')
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const handleRequestReset = async (emailToUse: string = email) => {
    setIsSubmitting(true)
    setError("")

    try {
      const response = await authAPI.requestPasswordReset(emailToUse)
      console.log("Password reset requested:", response.data)
      
      if (response.data.user_id) {
        setUserId(response.data.user_id)
        // Store user ID in localStorage
        localStorage.setItem('forgotPasswordUserId', response.data.user_id.toString())
      }
      
      
      setResendCooldown(120) // Start 120-second countdown
      
      // Store all necessary data in localStorage
      localStorage.setItem('forgotPasswordCountdown', '120')
      localStorage.setItem('forgotPasswordStartTime', Date.now().toString())
      localStorage.setItem('forgotPasswordEmail', emailToUse)
      localStorage.setItem('forgotPasswordStep', 'otp')
      
      setStep('otp')
    } catch (err: any) {
      console.error("Password reset request failed:", err)
      setError(err.response?.data?.detail || "Failed to send reset email. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOtpSubmit = async (otp: string) => {
    setIsSubmitting(true)
    setError("")

    try {
      if (userId) {
        await authAPI.verifyOtp(userId, otp, OTPPurpose.FORGOT_PASSWORD)
        
        // Store email and OTP in localStorage for the reset password step
        localStorage.setItem('forgotPasswordEmail', email)
        localStorage.setItem('forgotPasswordOtpCode', otp)
        
        // Update step in localStorage
        localStorage.setItem('forgotPasswordStep', 'success')
        
        // Clear countdown localStorage
        localStorage.removeItem('forgotPasswordCountdown')
        localStorage.removeItem('forgotPasswordStartTime')
        
        setStep('success')
      } else {
        setError("User ID not found. Please try again.")
      }
    } catch (err: any) {
      console.error("OTP verification failed:", err)
      setError(err.response?.data?.detail || "Invalid OTP. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return

    setIsSubmitting(true)
    setError("")

    try {
      if (userId) {
        await authAPI.resendOtp(userId, OTPPurpose.FORGOT_PASSWORD)
        
        // Reset countdown to 120 seconds
        setResendCooldown(120)
        
        // Store countdown in localStorage
        localStorage.setItem('forgotPasswordCountdown', '120')
        localStorage.setItem('forgotPasswordStartTime', Date.now().toString())
        
        // Show success message
        
        
        // Clear any previous errors
        setError("")
        
        console.log("OTP resent successfully")
      } else {
        // If no userId, try to request a new reset
        console.log("No userId found, requesting new password reset")
        await handleRequestReset()
      }
    } catch (err: any) {
      console.error("Resend OTP failed:", err)
      setError(err.response?.data?.detail || "Failed to resend OTP. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackToLogin = () => {
    // Clear all forgot password localStorage data
    localStorage.removeItem('forgotPasswordCountdown')
    localStorage.removeItem('forgotPasswordStartTime')
    localStorage.removeItem('forgotPasswordStep')
    localStorage.removeItem('forgotPasswordEmail')
    localStorage.removeItem('forgotPasswordUserId')
    localStorage.removeItem('forgotPasswordOtpCode')
    
    router.push("/login")
  }

  const handleResetPassword = () => {
    // Clear all forgot password localStorage data except email and OTP code
    localStorage.removeItem('forgotPasswordCountdown')
    localStorage.removeItem('forgotPasswordStartTime')
    localStorage.removeItem('forgotPasswordStep')
    localStorage.removeItem('forgotPasswordUserId')
    
    router.push("/reset-password")
  }

  const isEmailValid = email.trim() && email.includes("@")

  if (step === 'otp') {
    return (
      <OTPVerification
        email={email}
        onSubmit={handleOtpSubmit}
        onBack={() => {
          // Clear OTP-related localStorage when going back
          localStorage.removeItem('forgotPasswordCountdown')
          localStorage.removeItem('forgotPasswordStartTime')
          localStorage.removeItem('forgotPasswordStep')
          localStorage.removeItem('forgotPasswordUserId')
          setResendCooldown(0)
          setStep('email')
        }}
        onResend={handleResendOtp}
        showBackButton={true}
        isSubmitting={isSubmitting}
        error={error}
        successMessage={successMessage}
        resendCooldown={resendCooldown}
        forPurpose={OTPPurpose.FORGOT_PASSWORD}
      />
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-2xl z-10">
          <CardHeader className="text-center py-8 px-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              OTP Verified Successfully!
            </h1>
            <p className="text-gray-600 text-base leading-relaxed">
              Your email has been verified. You can now proceed to reset your password.
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8 space-y-4">
            <Button
              onClick={handleResetPassword}
              className="w-full h-12 text-sm font-medium rounded-xl transition-all duration-200 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Reset Password
            </Button>
            
            <Button
              variant="outline"
              onClick={handleBackToLogin}
              className="w-full h-12 text-sm font-medium rounded-xl transition-all duration-200 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-800"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
      <Button
        variant="ghost"
        className="absolute top-6 left-6 text-gray-600 hover:text-gray-800 hover:bg-white/50 p-3 h-auto w-auto rounded-xl transition-all duration-200 z-10"
        onClick={handleBackToLogin}
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>

      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-2xl z-10">
        <CardHeader className="text-center py-6 px-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Recover Your Password
          </h1>
          <p className="text-sm text-gray-600">
            Enter your email address and we'll send you a verification code to reset your password.
          </p>
        </CardHeader>

        <CardContent className="px-8 pb-6 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Student Email
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="Enter your student email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                className={`border-2 transition-all duration-200 h-12 text-sm pl-4 pr-4 rounded-xl ${
                  focusedField === "email"
                    ? "border-blue-500 focus:ring-4 focus:ring-blue-100"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                required
              />
              {focusedField === "email" && (
                <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none animate-pulse"></div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-4 rounded-xl flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-4 rounded-xl flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              {successMessage}
            </div>
          )}

          <Button
            onClick={() => handleRequestReset()}
            disabled={!isEmailValid || isSubmitting}
            className={`w-full h-12 text-sm font-medium rounded-xl transition-all duration-200 ${
              isEmailValid && !isSubmitting
                ? "bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </div>
            ) : (
              "Send Reset Code"
            )}
          </Button>

          <div className="text-center pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Remember your password?{" "}
              <button
                type="button"
                className="text-teal-600 hover:text-teal-700 font-medium transition-colors duration-200 hover:underline"
                onClick={handleBackToLogin}
              >
                Back to login
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
