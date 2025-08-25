"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { 
  Users, 
  LogOut, 
  Shield, 
  BarChart3,
  Server,
  Settings,
  HelpCircle,
  ListOrdered,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { hasAdminPermission } from "@/lib/adminAuth"
import { adminAPI } from "@/lib/api"

interface AdminData {
  email?: string
}

interface AdminSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  adminData?: AdminData | null
  onUnreadCountChange?: (count: number) => void
}

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  badge?: string | number
  requiresSuperAdmin?: boolean
}

export default function AdminSidebar({  
  activeSection, 
  onSectionChange, 
  isCollapsed = false,
  onToggleCollapse,
  adminData,
  onUnreadCountChange
}: AdminSidebarProps) {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState<number>(0)

  // Fetch unread issue count
  const fetchUnreadCount = async () => {
    try {
      const response = await adminAPI.getUnreadCount()
      const count = response.data.unread_count
      setUnreadCount(count)
      // Notify parent component of unread count change
      if (onUnreadCountChange) {
        onUnreadCountChange(count)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  useEffect(() => {
    fetchUnreadCount()
    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Expose refresh function to parent component
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshAdminSidebarUnreadCount = fetchUnreadCount
    }
  }, [])

  const allSidebarItems: SidebarItem[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      id: "users",
      label: "User Management",
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: "faqs",
      label: "FAQ Management",
      icon: <HelpCircle className="h-4 w-4" />,
    },
    {
      id: "issues",
      label: "Issue Reports",
      icon: <AlertTriangle className="h-4 w-4" />,
      badge: unreadCount > 0 ? unreadCount.toString() : undefined
    },
    {
      id: "system",
      label: "System",
      icon: <Server className="h-4 w-4" />,
    },
    {
      id: "tools",
      label: "Config",
      icon: <Settings className="h-5 w-5" />,
      requiresSuperAdmin: true
    }
  ]

  // Filter sidebar items based on admin permissions
  const sidebarItems = allSidebarItems.filter(item => {
    if (item.requiresSuperAdmin) {
      return hasAdminPermission('config')
    }
    return true
  })

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminData')
    router.push('/admin/login')
  }

  const renderSidebarItem = (item: SidebarItem) => {
    const isActive = activeSection === item.id
    
    return (
      <button
        key={item.id}
        onClick={() => onSectionChange(item.id)}
        className={cn(
          "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group font-medium",
          isActive 
            ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg" 
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
        )}
      >
        <div className={cn(
          "flex-shrink-0",
          isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"
        )}>
          {item.icon}
        </div>
        {!isCollapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <Badge 
                variant={isActive ? "secondary" : "default"}
                className="ml-auto text-xs"
              >
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </button>
    )
  }

  return (
    <div className={cn(
      "bg-white border-r border-slate-200 flex flex-col transition-all duration-300 h-screen overflow-hidden fixed left-0 top-0",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Admin Panel
              </h2>
              <p className="text-xs text-slate-500">Control Room</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-hidden">
        <div className="h-full flex flex-col justify-start">
          {sidebarItems.map((item) => renderSidebarItem(item))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        {!isCollapsed && adminData?.email && (
          <div className="text-center mb-3 space-y-2">
            <div className="text-xs text-slate-500">
              {adminData.email}
            </div>
          </div>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className={cn(
            "w-full text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200",
            isCollapsed && "px-2"
          )}
        >
          <LogOut className={cn("h-4 w-4", isCollapsed ? "" : "mr-2")} />
          {!isCollapsed && "Logout"}
        </Button>
      </div>
    </div>
  )
}
