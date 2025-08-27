"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { faqAPI } from "@/lib/api"

interface FAQItem {
  fid: number
  question: string
  answer: string
  priority: string | null
  created_at: string
  updated_at: string | null
}

export function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([])
  const [faqData, setFaqData] = useState<FAQItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortByPriority, setSortByPriority] = useState(true)

  useEffect(() => {
    const loadFAQs = async () => {
      try {
        setIsLoading(true)
        // Fetch FAQs with priority sorting enabled on the backend
        const response = await faqAPI.getFaqs({ 
          page: 1, 
          page_size: 100, 
          sort_by_priority: sortByPriority 
        })
        const faqs = response.data.items || response.data
        
        // Debug: Log the full response and FAQs
        console.log('Full API Response:', response)
        console.log('FAQs data:', faqs)
        console.log('FAQs with priority sorting:', faqs.map((faq: FAQItem) => ({
          fid: faq.fid,
          question: faq.question.substring(0, 50) + '...',
          priority: faq.priority
        })))
        
        // Backend now handles priority sorting, so we can use the data directly
        setFaqData(faqs)
      } catch (err: any) {
        console.error('Error loading FAQs:', err)
        setError('Failed to load FAQs. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    loadFAQs()
  }, [sortByPriority])

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
            <HelpCircle className="w-8 h-8 text-emerald-600 mt-1" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-snug">
              Frequently Asked Questions
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Find answers to common questions about creating your account and using our platform.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading FAQs...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* FAQ Items */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {faqData.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No FAQs available at the moment.</p>
              </div>
            ) : (
              faqData.map((item, index) => (
            <Card
              key={index}
              className="bg-white/95 backdrop-blur-sm border-0 rounded-2xl overflow-hidden hover:shadow-lg duration-200 hover:shadow-emerald-800/10 hover:scale-105 "
            > 
              <CardContent className="p-0">
                                 <button
                   onClick={() => toggleItem(index)}
                   className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50/50 transition-colors duration-200"
                 >
                   <div className="flex items-center gap-3 flex-1">
                     <h3 className="text-lg font-semibold text-gray-900">{item.question}</h3>
                   </div>
                   <div className="flex-shrink-0">
                     {openItems.includes(index) ? (
                       <ChevronUp className="w-5 h-5 text-emerald-600 transition-transform duration-200" />
                     ) : (
                       <ChevronDown className="w-5 h-5 text-gray-400 transition-transform duration-200" />
                     )}
                   </div>
                 </button>

                <div
                  className={`px-6 overflow-hidden transition-[max-height] duration-300 ${
                    openItems.includes(item.fid - 1) ? "max-h-[1000px]" : "max-h-0"
                  }`}
                >
                  <div className="border-t border-gray-100 pt-5">
                    <p className="text-gray-600 leading-relaxed pb-6">{item.answer}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
              ))
            )}
          </div>
        )}

        {/* Contact section */}
        <Card className="mt-8 rounded-2xl backdrop-blur-md">
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
