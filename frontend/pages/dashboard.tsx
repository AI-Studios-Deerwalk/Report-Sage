import React from "react"
import dynamic from "next/dynamic"
const Sidebar = dynamic(() => import("@/components/Sidebar").then(m => m.Sidebar), { ssr: false })
import { FileUpload } from "@/components/Upload"
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
            
            <FileUpload />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
