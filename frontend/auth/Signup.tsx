"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/router"
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"

interface SignupFormProps {
  onSubmit?: (formData: FormData) => void
  onBackClick?: () => void
  onLoginClick?: () => void
  error?: string
  isSubmitting?: boolean
}

interface FormData {
  firstName: string
  lastName: string
  studentEmail: string
  password: string
  confirmPassword: string
  phoneNumber: string
  validationError?: string
}

export function SignupForm({ onSubmit, onBackClick, onLoginClick, error, isSubmitting = false }: SignupFormProps) {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    studentEmail: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Ensure value is a string and handle phone number specially
    let processedValue = value || ""
    
    if (name === "phoneNumber") {
      // Only allow digits for phone number
      processedValue = processedValue.replace(/\D/g, '')
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }))
  }

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate password strength
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      onSubmit?.({ ...formData, validationError: passwordValidation.message })
      return
    }

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      onSubmit?.({ ...formData, validationError: "Passwords do not match" })
      return
    }

    // Validate phone number format
    if (formData.phoneNumber && !/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      onSubmit?.({ ...formData, validationError: "Please enter a valid 10-digit phone number" })
      return
    }

    onSubmit?.(formData)
  }

  const handleBackClick = () => {
    onBackClick?.()
  }

  const handleLoginClick = () => {
    onLoginClick?.()
  }

  const isFormValid =
    (formData.firstName?.trim() || "") &&
    (formData.lastName?.trim() || "") &&
    (formData.studentEmail?.trim() || "") &&
    (formData.password?.trim() || "") &&
    (formData.confirmPassword?.trim() || "") &&
    (formData.phoneNumber?.trim() || "")

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
      {/* Animated floating geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large floating hexagons */}
        <div
          className="absolute top-10 left-10 w-32 h-32 border-2 border-emerald-200/30 rotate-12 animate-spin"
          style={{
            clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
            animationDuration: "20s",
            animationDirection: "reverse",
          }}
        ></div>

        <div
          className="absolute top-1/4 right-16 w-24 h-24 border-2 border-teal-300/40 -rotate-45 animate-pulse"
          style={{
            clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
            animationDuration: "3s",
          }}
        ></div>

        {/* Floating orbs with inner glow */}
        <div
          className="absolute top-1/3 left-1/4 w-16 h-16 rounded-full bg-gradient-to-r from-emerald-300/20 to-teal-300/20 animate-bounce"
          style={{ animationDuration: "4s", animationDelay: "0s" }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-r from-emerald-400/30 to-teal-400/30 animate-pulse"></div>
        </div>

        <div
          className="absolute bottom-1/4 right-1/3 w-12 h-12 rounded-full bg-gradient-to-r from-green-300/25 to-emerald-300/25 animate-bounce"
          style={{ animationDuration: "3.5s", animationDelay: "1s" }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-r from-green-400/35 to-emerald-400/35 animate-pulse"></div>
        </div>

        {/* Morphing blob shapes */}
        <div className="absolute top-16 right-1/4 w-40 h-40 opacity-20">
          <div
            className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full animate-pulse"
            style={{
              borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
              animation: "morph 8s ease-in-out infinite",
            }}
          ></div>
        </div>

        <div className="absolute bottom-20 left-1/5 w-32 h-32 opacity-15">
          <div
            className="w-full h-full bg-gradient-to-tr from-teal-400 to-green-400 rounded-full animate-pulse"
            style={{
              borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
              animation: "morph 6s ease-in-out infinite reverse",
            }}
          ></div>
        </div>

        {/* Particle system - floating dots */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400/30 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}

        {/* Cosmic rays/lines */}
        <div className="absolute top-0 left-1/4 w-px h-32 bg-gradient-to-b from-transparent via-emerald-300/50 to-transparent transform rotate-12 animate-pulse"></div>
        <div
          className="absolute top-1/3 right-1/5 w-px h-24 bg-gradient-to-b from-transparent via-teal-300/40 to-transparent transform -rotate-45 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/3 w-px h-20 bg-gradient-to-b from-transparent via-green-300/45 to-transparent transform rotate-75 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        {/* Constellation pattern */}
        <div className="absolute top-1/5 left-1/2 w-1 h-1 bg-emerald-400/60 rounded-full animate-twinkle"></div>
        <div
          className="absolute top-1/4 left-1/2 w-1 h-1 bg-teal-400/60 rounded-full animate-twinkle"
          style={{ animationDelay: "0.5s" }}
        ></div>
        <div
          className="absolute top-1/3 left-1/2 w-1 h-1 bg-green-400/60 rounded-full animate-twinkle"
          style={{ animationDelay: "1s" }}
        ></div>

        {/* Connecting lines for constellation */}
        <svg className="absolute top-1/5 left-1/2 w-8 h-16 opacity-30">
          <line
            x1="2"
            y1="0"
            x2="2"
            y2="16"
            stroke="url(#emeraldGradient)"
            strokeWidth="0.5"
            className="animate-pulse"
          />
          <line
            x1="2"
            y1="16"
            x2="2"
            y2="32"
            stroke="url(#emeraldGradient)"
            strokeWidth="0.5"
            className="animate-pulse"
            style={{ animationDelay: "0.5s" }}
          />
          <defs>
            <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(52 211 153 / 0.6)" />
              <stop offset="100%" stopColor="rgb(20 184 166 / 0.6)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Spiral galaxy effect */}
        <div className="absolute top-1/2 left-1/6 w-20 h-20 opacity-10">
          <div
            className="w-full h-full border-2 border-emerald-400 rounded-full animate-spin"
            style={{ animationDuration: "15s" }}
          >
            <div
              className="w-3/4 h-3/4 border border-teal-400 rounded-full m-2 animate-spin"
              style={{ animationDuration: "10s", animationDirection: "reverse" }}
            >
              <div
                className="w-1/2 h-1/2 border border-green-400 rounded-full m-3 animate-spin"
                style={{ animationDuration: "5s" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Energy waves */}
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 opacity-20">
          <div
            className="w-full h-full border-2 border-emerald-300 rounded-full animate-ping"
            style={{ animationDuration: "4s" }}
          ></div>
          <div
            className="absolute inset-2 border border-teal-300 rounded-full animate-ping"
            style={{ animationDuration: "4s", animationDelay: "1s" }}
          ></div>
          <div
            className="absolute inset-4 border border-green-300 rounded-full animate-ping"
            style={{ animationDuration: "4s", animationDelay: "2s" }}
          ></div>
        </div>
      </div>

      {/* Custom CSS animations */}
      <style jsx>{`
        @keyframes morph {
          0%, 100% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          }
          50% {
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
          }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
      `}</style>

      {/* Back button */}
      <Button
        variant="ghost"
        className="absolute top-6 left-6 text-gray-600 hover:text-gray-800 hover:bg-white/50 p-3 h-auto w-auto rounded-xl transition-all duration-200 z-10"
        onClick={handleBackClick}
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>

      {/* Main signup card */}
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-2xl z-10">
        <CardHeader className="text-center py-4 px-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Create Account
          </h1>
        </CardHeader>

        <CardContent className="px-8 pb-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* First Name and Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  First Name
                </Label>
                <div className="relative">
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="e.g Ason"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField("firstName")}
                    onBlur={() => setFocusedField(null)}
                    className={`border-2 transition-all duration-200 h-12 text-sm pl-4 pr-4 rounded-xl ${
                      focusedField === "firstName"
                        ? "border-blue-500 focus:ring-4 focus:ring-blue-100"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    required
                  />
                  {focusedField === "firstName" && (
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none animate-pulse"></div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Last Name
                </Label>
                <div className="relative">
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="e.g Gautam"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField("lastName")}
                    onBlur={() => setFocusedField(null)}
                    className={`border-2 transition-all duration-200 h-12 text-sm pl-4 pr-4 rounded-xl ${
                      focusedField === "lastName"
                        ? "border-blue-500 focus:ring-4 focus:ring-blue-100"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    required
                  />
                  {focusedField === "lastName" && (
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>

            {/* Student Email */}
            <div className="space-y-1">
              <Label htmlFor="studentEmail" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Student Email
              </Label>
              <div className="relative">
                <Input
                  id="studentEmail"
                  name="studentEmail"
                  type="email"
                  placeholder="Enter your student email"
                  value={formData.studentEmail}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField("studentEmail")}
                  onBlur={() => setFocusedField(null)}
                  className={`border-2 transition-all duration-200 h-12 text-sm pl-4 pr-4 rounded-xl ${
                    focusedField === "studentEmail"
                      ? "border-blue-500 focus:ring-4 focus:ring-blue-100"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  required
                />
                {focusedField === "studentEmail" && (
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none animate-pulse"></div>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
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
              <p className="text-xs text-gray-500">
                Password must be at least 8 characters with uppercase, lowercase, and numbers.
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
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

            {/* Phone Number */}
            <div className="space-y-1">
              <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {/* Nepal Flag */}
                  <div className="flex items-center space-x-2">
                    <img
                      src="/nepalflag.png"
                      alt="Nepal Flag"
                      className="w-5 h-4 object-contain border border-gray-300 rounded-sm"
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <span className="text-sm text-gray-600">+977</span>
                  </div>
                </div>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="9815076935"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField("phoneNumber")}
                  onBlur={() => setFocusedField(null)}
                  className={`border-2 transition-all duration-200 h-12 text-sm pl-20 pr-4 rounded-xl ${
                    focusedField === "phoneNumber"
                      ? "border-blue-500 focus:ring-4 focus:ring-blue-100"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  required
                />
                {focusedField === "phoneNumber" && (
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none animate-pulse"></div>
                )}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-4 rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                {error}
              </div>
            )}

            {/* Sign up button */}
            <Button
              type="submit"
              className={`w-full h-12 text-sm font-medium rounded-xl transition-all duration-200 ${
                isFormValid
                  ? "bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={isSubmitting || !isFormValid}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating account...
                </div>
              ) : (
                "Create Account"
              )}
            </Button>

            {/* Login link */}
            <div className="text-center pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-teal-600 hover:text-teal-700 font-medium transition-colors duration-200 hover:underline"
                  onClick={handleLoginClick}
                >
                  Log in
                </button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignupPage() {
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()

  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError("")

    try {
      // Validate form data before sending
      if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.studentEmail?.trim() || !formData.password?.trim() || !formData.phoneNumber?.trim()) {
        throw new Error("All fields are required")
      }

      // Call the actual registration function from AuthContext
      const registrationResult = await register({
        email: formData.studentEmail.trim(),
        password: formData.password,
        fname: formData.firstName.trim(),
        lname: formData.lastName.trim(),
        phone_number: formData.phoneNumber.trim()
      })
      
      // If registration is successful, redirect to OTP verification
      const userId = registrationResult.user_id
      if (!userId) {
        throw new Error("Registration successful but user ID not received")
      }
      
      console.log('✅ Registration successful, redirecting to OTP verification')
      router.push(`/verify-otp?user_id=${userId}&email=${encodeURIComponent(formData.studentEmail.trim())}`)
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || "Signup failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackClick = () => {
    router.push("/")
  }

  const handleLoginClick = () => {
    router.push("/login")
  }

  return (
    <SignupForm
      onSubmit={handleSubmit}
      onBackClick={handleBackClick}
      onLoginClick={handleLoginClick}
      error={error}
      isSubmitting={isLoading}
    />
  )
}
