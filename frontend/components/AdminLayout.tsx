"use client"

import { useState } from "react"
import { useRouter } from "next/router"
import AdminSidebar from "./AdminSidebar"
import { cn } from "@/lib/utils"

interface AdminLayoutProps {
  children: React.ReactNode
  currentPage: string
}

export default function AdminLayout({ children, currentPage }: AdminLayoutProps) {
  const [activeSection, setActiveSection] = useState(currentPage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const router = useRouter()

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    
    // Navigate to appropriate page based on section
    switch (section) {
      case "overview":
        router.push('/admin/dashboard')
        break
      case "users":
        router.push('/admin/users')
        break
      case "faqs":
        router.push('/admin/faqs')
        break
      case "system":
        router.push('/admin/system')
        break
      case "tools":
        router.push('/admin/tools')
        break
      default:
        break
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        isSidebarCollapsed ? "ml-16" : "ml-64"
      )}>
        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
