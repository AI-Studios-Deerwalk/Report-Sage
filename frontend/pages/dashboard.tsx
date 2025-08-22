import React from "react"
import dynamic from "next/dynamic"
const Sidebar = dynamic(() => import("@/components/Sidebar").then(m => m.Sidebar), { ssr: false })
import { FileUpload } from "@/components/Upload"
import { EmailVerificationPrompt } from "@/components/EmailVerificationPrompt"
import { useAuth } from "@/contexts/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"

export default function DashboardPage() {
  const { user } = useAuth()
  
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gradient-to-b from-[#DAF3DA] to-[#E7F0E7]">
        <Sidebar />
        <main className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-5xl mx-auto text-center">
            <h1 className="text-3xl font-semibold text-foreground mb-8 text-center">{greeting}{user ? `, ${user.fname}` : ""}</h1>
            
            {/* Show email verification prompt if user is not verified, otherwise show file upload */}
            {user && !user.is_email_verified ? (
              <EmailVerificationPrompt userEmail={user.email} />
            ) : (
              <FileUpload />
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
