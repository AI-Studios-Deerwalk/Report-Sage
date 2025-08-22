"use client"

import { useState } from "react"
import { useRouter } from "next/router"
import { 
  Users, 
  UserCheck, 
  UserX, 
  Trash2, 
  LogOut, 
  Shield, 
  BarChart3,
  Activity,
  Cpu,
  Server,
  Settings,
  Bell,
  Download,
  Upload,
  CheckCircle,
  RefreshCw,
  Clock,
  Globe,
  Send,
  Database,
  TrendingUp,
  Home,
  FileText,
  AlertTriangle,
  Mail,
  UserCog,
  Database as DatabaseIcon,
  BarChart,
  Cog,
  HelpCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface AdminSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  badge?: string | number
  subItems?: Omit<SidebarItem, 'subItems'>[]
}

export default function AdminSidebar({ 
  activeSection, 
  onSectionChange, 
  isCollapsed = false,
  onToggleCollapse 
}: AdminSidebarProps) {
  const router = useRouter()

  const sidebarItems: SidebarItem[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <Home className="h-5 w-5" />
    },
    {
      id: "users",
      label: "User Management",
      icon: <Users className="h-5 w-5" />,
      subItems: [
        { id: "all-users", label: "All Users", icon: <Users className="h-4 w-4" /> },
        { id: "active-users", label: "Active Users", icon: <UserCheck className="h-4 w-4" /> },
        { id: "blocked-users", label: "Blocked Users", icon: <UserX className="h-4 w-4" /> },
        { id: "user-verification", label: "Verification", icon: <CheckCircle className="h-4 w-4" /> }
      ]
    },
    {
      id: "activities",
      label: "Activities",
      icon: <Activity className="h-5 w-5" />,
      subItems: [
        { id: "user-activities", label: "User Activities", icon: <Activity className="h-4 w-4" /> },
        { id: "system-logs", label: "System Logs", icon: <FileText className="h-4 w-4" /> },
        { id: "security-events", label: "Security Events", icon: <AlertTriangle className="h-4 w-4" /> }
      ]
    },
    {
      id: "system",
      label: "System",
      icon: <Server className="h-5 w-5" />,
      subItems: [
        { id: "system-health", label: "System Health", icon: <Cpu className="h-4 w-4" /> },
        { id: "performance", label: "Performance", icon: <BarChart3 className="h-4 w-4" /> },
        { id: "database", label: "Database", icon: <DatabaseIcon className="h-4 w-4" /> }
      ]
    },
    {
      id: "tools",
      label: "Tools",
      icon: <Settings className="h-5 w-5" />,
      subItems: [
        { id: "email-management", label: "Email Management", icon: <Mail className="h-4 w-4" /> },
        { id: "database-tools", label: "Database Tools", icon: <Database className="h-4 w-4" /> },
        { id: "analytics", label: "Analytics", icon: <TrendingUp className="h-4 w-4" /> },
        { id: "system-settings", label: "System Settings", icon: <Cog className="h-4 w-4" /> }
      ]
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell className="h-5 w-5" />,
      badge: "3"
    }
  ]

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminData')
    router.push('/admin/login')
  }

  const renderSidebarItem = (item: SidebarItem, isSubItem = false) => {
    const isActive = activeSection === item.id
    const hasSubItems = item.subItems && item.subItems.length > 0
    
    return (
      <div key={item.id}>
        <button
          onClick={() => onSectionChange(item.id)}
          className={cn(
            "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group",
            isActive 
              ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg" 
              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
            isSubItem ? "ml-4 text-sm" : "font-medium"
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
        
        {/* Render sub-items if they exist */}
        {hasSubItems && !isCollapsed && (
          <div className="ml-4 mt-1 space-y-1">
            {item.subItems!.map((subItem) => renderSidebarItem(subItem, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      "bg-white border-r border-slate-200 flex flex-col transition-all duration-300",
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
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {sidebarItems.map((item) => renderSidebarItem(item))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        {!isCollapsed && (
          <div className="text-center mb-3">
            <Badge variant="outline" className="text-xs">
              Super Admin
            </Badge>
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
