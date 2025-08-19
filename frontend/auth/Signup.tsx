"use client"

import type React from "react"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validatePassword = (password: string): { isValid: boolean, message: string } => {
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
    
    onSubmit?.(formData)
  }

  const handleBackClick = () => {
    onBackClick?.()
  }

  const handleLoginClick = () => {
    onLoginClick?.()
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

      {/* Main signup card */}
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

          <h1 className="text-xl font-semibold text-gray-900 mb-1">Welcome!</h1>
          <p className="text-gray-600 text-xs">Please enter your details</p>
        </CardHeader>

        <CardContent className="py-2">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* First Name and Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-xs text-gray-700">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="e.g Joshua"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName" className="text-xs text-gray-700">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="e.g Matthews"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-9 text-sm"
                />
              </div>
            </div>

            {/* Student Email */}
            <div className="space-y-1">
              <Label htmlFor="studentEmail" className="text-xs text-gray-700">
                Student Email
              </Label>
              <Input
                id="studentEmail"
                name="studentEmail"
                type="email"
                placeholder="e.g abc@student.wolk.edu.ng"
                value={formData.studentEmail}
                onChange={handleInputChange}
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
                name="password"
                type="password"
                placeholder="e.g Fxsefez01"
                value={formData.password}
                onChange={handleInputChange}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-9 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 8 characters with uppercase, lowercase, and numbers.
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-xs text-gray-700">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="e.g Fxsefez01"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-9 text-sm"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <Label htmlFor="phoneNumber" className="text-xs text-gray-700">
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="e.g 9815076834"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-9 text-sm"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded">
                {error}
              </div>
            )}
            
            {/* Sign up button */}
            <Button 
              type="submit" 
              className="w-full bg-black hover:bg-gray-800 text-white py-2 mt-3 text-sm h-9"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Sign up"}
            </Button>

            {/* Login link */}
            <p className="text-center text-xs text-gray-600 mt-2">
              Already have an account?{" "}
              <button
                type="button"
                className="text-[#3AC4C4] hover:text-[#3AC4C4] font-medium"
                onClick={handleLoginClick}
              >
                Log in
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
