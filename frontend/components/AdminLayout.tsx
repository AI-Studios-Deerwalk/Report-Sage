"use client"

import { useState } from "react"
import { useRouter } from "next/router"
import AdminSidebar from "./AdminSidebar"
import { cn } from "@/lib/utils"
import { hasAdminPermission } from "@/lib/adminAuth"

interface AdminLayoutProps {
  children: React.ReactNode
  currentPage: string
}

export default function AdminLayout({ children, currentPage }: AdminLayoutProps) {
  const [activeSection, setActiveSection] = useState(currentPage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const router = useRouter()

  // Get admin data directly from localStorage
  const adminData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('adminData') || '{}') : {}

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
      case "issues":
        router.push('/admin/issues')
        break
      case "system":
        router.push('/admin/system')
        break
      case "tools":
        // Check if admin has permission to access config
        if (hasAdminPermission('config')) {
          router.push('/admin/tools')
        } else {
          // Redirect non-super admins to dashboard
          router.push('/admin/dashboard')
          // Reset active section to overview
          setActiveSection('overview')
        }
        break
      case "document-config":
        // Check if admin has permission to access config
        if (hasAdminPermission('config')) {
          router.push('/admin/document-config')
        } else {
          // Redirect non-super admins to dashboard
          router.push('/admin/dashboard')
          // Reset active section to overview
          setActiveSection('overview')
        }
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
        adminData={adminData}
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
