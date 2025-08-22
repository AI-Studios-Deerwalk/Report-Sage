"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: "How do I create an account?",
    answer:
      "Simply click on the 'Create Account' button and fill in your details including your name, student email, password, and phone number. You'll receive an OTP for verification.",
  },
  {
    question: "What are the password requirements?",
    answer:
      "Your password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number for security.",
  },
  {
    question: "Can I use any email address?",
    answer:
      "We require a valid student email address for registration. This helps us verify your student status and provide appropriate services.",
  },
  {
    question: "Is my personal information secure?",
    answer:
      "Yes, we take data security seriously. All your personal information is encrypted and stored securely. We never share your data with third parties without your consent.",
  },
  {
    question: "What if I forget my password?",
    answer:
      "You can reset your password by clicking the 'Forgot Password' link on the login page. We'll send a reset link to your registered email address.",
  },
  {
    question: "How do I verify my phone number?",
    answer:
      "After registration, you'll receive an OTP (One-Time Password) via SMS to verify your phone number. Enter this code to complete your account setup.",
  },
  {
    question: "Can I change my information later?",
    answer:
      "Yes, you can update your profile information, including your name and phone number, from your account settings after logging in.",
  },
  {
    question: "What if I don't receive the verification code?",
    answer:
      "If you don't receive the OTP within a few minutes, check your spam folder or try requesting a new code. Make sure your phone number is entered correctly.",
  },
]

export function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
      {/* Animated floating geometric shapes - same as signup page */}
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
      `}</style>

      {/* Main FAQ container */}
      <div className="w-full max-w-4xl z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4 pt-8">
            <HelpCircle className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about creating your account and using our platform.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqData.map((item, index) => (
            <Card
              key={index}
              className="bg-white/95 backdrop-blur-sm shadow-lg border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl"
            >
              <CardContent className="p-0">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50/50 transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">{item.question}</h3>
                  <div className="flex-shrink-0">
                    {openItems.includes(index) ? (
                      <ChevronUp className="w-5 h-5 text-emerald-600 transition-transform duration-200" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 transition-transform duration-200" />
                    )}
                  </div>
                </button>

                {openItems.includes(index) && (
                  <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-200">
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact section */}
        <Card className="mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 border-0 rounded-2xl">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Still have questions?</h3>
            <p className="text-gray-600 mb-4">Can't find the answer you're looking for? We're here to help.</p>
            <button className="bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              Contact Support
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
