"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ArrowLeft, Shield, CheckCircle, Loader2 } from "lucide-react"
import Head from "next/head"
import { OTPPurpose } from "@/lib/api"

interface OTPVerificationProps {
  email?: string
  onSubmit?: (otp: string) => void
  onBack?: () => void
  onResend?: () => void
  showBackButton?: boolean
  isSubmitting?: boolean
  error?: string
  successMessage?: string
  resendCooldown?: number
  onSuccess?: () => void
  forPurpose?: OTPPurpose
}

export function OTPVerification({
  email = "user@example.com",
  onSubmit,
  onBack,
  onResend,
  showBackButton = true,
  isSubmitting = false,
  error = "",
  successMessage = "",
  resendCooldown = 0,
  onSuccess,
  forPurpose = OTPPurpose.VERIFICATION,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationStep, setVerificationStep] = useState<'verifying' | 'success' | 'redirecting'>('verifying')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return // Prevent multiple characters

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

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
    if (resendCooldown > 0) return // Don't allow resend if cooldown is active

    if (onResend) {
      onResend()
    }
  }

  const handleLogin = () => {
    const otpValue = otp.join("")
    if (otpValue.length === 6) {
      console.log("OTP submitted:", otpValue)
      setIsVerifying(true)
      setVerificationStep('verifying')

      // Step 1: Show "Verifying..." for 2 seconds
      setTimeout(() => {
        setVerificationStep('success')
        
        // Step 2: Show "Successfully verified" for 1 second
        setTimeout(() => {
          setVerificationStep('redirecting')
          
          // Step 3: Show "Redirecting to login page" and call onSubmit
          setTimeout(() => {
            setIsVerifying(false)
            if (onSubmit) {
              onSubmit(otpValue)
            }
          }, 1000) // 1 second for redirecting message
        }, 1000) // 1 second for success message
      }, 2000) // 2 seconds for verifying
    }
  }

  const isOtpComplete = otp.every((digit) => digit !== "")

  const getTitle = () => {
    switch (forPurpose) {
      case OTPPurpose.VERIFICATION:
        return "Verify Email"
      case OTPPurpose.FORGOT_PASSWORD:
        return "Verify OTP"
      default:
        return "Verify OTP"
    }
  }

  const getSuccessMessage = () => {
    switch (forPurpose) {
      case OTPPurpose.VERIFICATION:
        return "Account Successfully Verified!"
      case OTPPurpose.FORGOT_PASSWORD:
        return "OTP Verified Successfully!"
      default:
        return "Successfully Verified!"
    }
  }

  const getRedirectMessage = () => {
    switch (forPurpose) {
      case OTPPurpose.VERIFICATION:
        return "Redirecting to login page..."
      case OTPPurpose.FORGOT_PASSWORD:
        return "Proceeding to password reset..."
      default:
        return "Redirecting..."
    }
  }

  if (isVerifying) {
    return (
      <>
        <Head>
          <title>Verifying OTP - DWIT Academia</title>
          <meta name="description" content="Verifying your One-Time Password" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

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
          `}</style>

          <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-2xl z-10 animate-in zoom-in-95 duration-500">
            <CardHeader className="text-center py-8 px-8">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                  {verificationStep === 'verifying' ? (
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  ) : (
                    <CheckCircle className="w-10 h-10 text-white" />
                  )}
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {verificationStep === 'verifying' && 'Verifying OTP...'}
                {verificationStep === 'success' && getSuccessMessage()}
                {verificationStep === 'redirecting' && getSuccessMessage()}
              </h1>
              <p className="text-gray-600 text-base leading-relaxed">
                {verificationStep === 'verifying' && 'Please wait while we verify your code...'}
                {verificationStep === 'success' && 'Your verification was successful.'}
                {verificationStep === 'redirecting' && getRedirectMessage()}
              </p>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  {verificationStep === 'verifying' && 'Verifying your OTP...'}
                  {verificationStep === 'success' && 'Verification successful!'}
                  {verificationStep === 'redirecting' && 'Please wait while we redirect you...'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Verify OTP - DWIT Academia</title>
        <meta name="description" content="Verify your account with the One-Time Password sent to your phone" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

          <div className="absolute top-0 left-1/4 w-px h-32 bg-gradient-to-b from-transparent via-emerald-300/50 to-transparent transform rotate-12 animate-pulse"></div>
          <div
            className="absolute top-1/3 right-1/5 w-px h-24 bg-gradient-to-b from-transparent via-teal-300/40 to-transparent transform -rotate-45 animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-1/4 left-1/3 w-px h-20 bg-gradient-to-b from-transparent via-green-300/45 to-transparent transform rotate-75 animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>

          <div className="absolute top-1/5 left-1/2 w-1 h-1 bg-emerald-400/60 rounded-full animate-twinkle"></div>
          <div
            className="absolute top-1/4 left-1/2 w-1 h-1 bg-teal-400/60 rounded-full animate-twinkle"
            style={{ animationDelay: "0.5s" }}
          ></div>
          <div
            className="absolute top-1/3 left-1/2 w-1 h-1 bg-green-400/60 rounded-full animate-twinkle"
            style={{ animationDelay: "1s" }}
          ></div>

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

        {showBackButton && (
          <Button
            variant="ghost"
            className="absolute top-6 left-6 text-gray-600 hover:text-gray-800 hover:bg-white/50 p-3 h-auto w-auto rounded-xl transition-all duration-200 z-10"
            onClick={onBack}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
        )}

        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-2xl z-10">
          <CardHeader className="text-center py-6 px-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {getTitle()}
            </h1>
            <p className="text-sm text-gray-600">
              Enter OTP sent to <span className="font-medium text-emerald-600">{email}</span>
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-6 space-y-6">
            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <div key={index} className="relative">
                  <input
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onFocus={() => setFocusedIndex(index)}
                    onBlur={() => setFocusedIndex(null)}
                    className={`w-12 h-12 text-center text-lg font-semibold border-2 transition-all duration-200 rounded-xl ${
                      focusedIndex === index
                        ? "border-blue-500 focus:ring-4 focus:ring-blue-100"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  />
                  {focusedIndex === index && (
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none animate-pulse"></div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center space-y-2">
              <button
                onClick={handleResendOTP}
                disabled={resendCooldown > 0 || isSubmitting}
                className={`text-sm font-medium disabled:cursor-not-allowed transition-colors duration-200 hover:underline ${
                  resendCooldown > 0 || isSubmitting
                    ? resendCooldown <= 30
                      ? "text-red-500"
                      : resendCooldown <= 60
                      ? "text-orange-500"
                      : "text-gray-500"
                    : "text-teal-600 hover:text-teal-700"
                }`}
              >
                {isSubmitting 
                  ? "Sending..."
                  : resendCooldown > 0
                  ? `Resend OTP in ${Math.floor(resendCooldown / 60)}:${(resendCooldown % 60).toString().padStart(2, "0")}`
                  : "Resend OTP"}
              </button>
              {resendCooldown === 0 && (
                <p className="text-xs text-red-500 mt-1">OTP has expired. Please resend to get a new code.</p>
              )}
              {resendCooldown > 0 && resendCooldown <= 30 && (
                <p className="text-xs text-red-500 mt-1">OTP expires soon!</p>
              )}
              {resendCooldown > 30 && resendCooldown <= 60 && (
                <p className="text-xs text-orange-500 mt-1">OTP will expire soon!</p>
              )}
          
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-4 rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-4 rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                {successMessage}
              </div>
            )}

            <Button
              onClick={handleLogin}
              disabled={!isOtpComplete || isSubmitting || isVerifying}
              className={`w-full h-12 text-sm font-medium rounded-xl transition-all duration-200 ${
                isOtpComplete && !isSubmitting && !isVerifying
                  ? "bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSubmitting || isVerifying ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isVerifying ? "Verifying..." : "Submitting..."}
                </div>
              ) : (
                getTitle()
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
