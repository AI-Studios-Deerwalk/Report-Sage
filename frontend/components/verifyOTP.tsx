"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Head from "next/head"

interface OTPVerificationProps {
  phoneNumber?: string
  onSubmit?: (otp: string) => void
  onBack?: () => void
  showBackButton?: boolean
}

export function OTPVerification({
  phoneNumber = "+977 9841874625",
  onSubmit,
  onBack,
  showBackButton = true,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isResendDisabled, setIsResendDisabled] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return // Prevent multiple characters

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleResendOTP = () => {
    setIsResendDisabled(true)
    // Simulate API call
    setTimeout(() => {
      setIsResendDisabled(false)
    }, 30000) // 30 seconds cooldown
  }

  const handleLogin = () => {
    const otpValue = otp.join("")
    if (otpValue.length === 6) {
      console.log("OTP submitted:", otpValue)
      onSubmit?.(otpValue)
    }
  }

  const isOtpComplete = otp.every((digit) => digit !== "")

  return (
    <>
      <Head>
        <title>Verify OTP - Report Rage</title>
        <meta name="description" content="Verify your account with the One-Time Password sent to your phone" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Back button */}
      {showBackButton && (
        <button onClick={onBack} className="absolute top-6 left-6 p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
      )}

      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="p-0">
          {/* Header with illustration */}
          <div className="bg-gray-900 rounded-t-lg p-6 flex justify-center">
            <div className="w-32 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center relative overflow-hidden">
              {/* 3D Books illustration placeholder */}
              <div className="relative">
                <div className="w-16 h-12 bg-blue-400 rounded transform -rotate-12 absolute -left-2"></div>
                <div className="w-16 h-12 bg-blue-500 rounded transform rotate-6 absolute left-1"></div>
                <div className="w-16 h-12 bg-blue-600 rounded transform -rotate-3 absolute left-4"></div>
                {/* Pen */}
                <div className="w-1 h-8 bg-white rounded-full absolute right-2 top-2 transform rotate-45"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full absolute right-1 top-1"></div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Verify with OTP</h1>
            <p className="text-sm text-gray-600">
              Enter OTP sent to <span className="font-medium">{phoneNumber}</span>
            </p>
          </div>

          {/* OTP Input Fields */}
          <div className="flex justify-center gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              />
            ))}
          </div>

          {/* Resend OTP */}
          <div className="text-center">
            <button
              onClick={handleResendOTP}
              disabled={isResendDisabled}
              className="text-green-600 text-sm font-medium hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Resend OTP
            </button>
          </div>

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            disabled={!isOtpComplete}
            className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Login
          </Button>
        </CardContent>
      </Card>
    </div>
    </>
  )
}
