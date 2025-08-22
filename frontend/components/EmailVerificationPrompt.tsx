"use client"

import React, { useState } from "react"
import { useRouter } from "next/router"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, Mail, Shield, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { OTPPurpose } from "@/lib/api"

interface EmailVerificationPromptProps {
  userEmail: string
}

export function EmailVerificationPrompt({ userEmail }: EmailVerificationPromptProps) {
  const router = useRouter()
  const { user, resendOTP } = useAuth()
  const { toast } = useToast()
  const [isSending, setIsSending] = useState(false)

  const handleVerifyNow = async () => {
    if (!user) return

    setIsSending(true)
    try {
      // Send OTP email
      await resendOTP(parseInt(user.uid), OTPPurpose.VERIFICATION)
      
      // Store verification data in localStorage for the OTP page
      localStorage.setItem('pendingVerificationUserId', user.uid)
      localStorage.setItem('pendingVerificationEmail', userEmail)
      
      // Show success toast
      toast({
        title: "Verification email sent",
        description: "A verification email with OTP has been sent to your inbox.",
      })
      
      // Redirect to OTP verification page
      router.push(`/verify-otp?userId=${user.uid}&email=${encodeURIComponent(userEmail)}`)
    } catch (error: any) {
      toast({
        title: "Failed to send verification email",
        description: error.message || "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="w-full border-2 border-dashed border-orange-300 bg-white transition-colors">
        <div className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-orange-100 rounded-full">
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Email Verification Required
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Please verify your email address to upload and analyze PDF files
              </p>
            </div>
            
            <Alert className="max-w-md">
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Verification email will be sent to: <strong>{userEmail}</strong>
              </AlertDescription>
            </Alert>

            <div className="mt-4">
              <Button 
                onClick={handleVerifyNow}
                disabled={isSending}
                className="bg-orange-600 hover:bg-orange-700 text-white px-8"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Email...
                  </>
                ) : (
                  "Verify Now"
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
