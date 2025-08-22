import React, { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Archive, Plus, ChevronLeft, ChevronRight, User, LogOut, Settings, HelpCircle } from "lucide-react"
import { useRouter } from "next/router"
import { useAuth } from "@/contexts/AuthContext"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

export function Sidebar() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false
      const stored = localStorage.getItem('sidebar:collapsed')
      return stored === 'true'
    } catch (_) {
      return false
    }
  })
  const { user, logout } = useAuth()
  const router = useRouter()

  // If no user, don't render the sidebar (this shouldn't happen with ProtectedRoute)
  if (!user) {
    return null
  }

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v
      try {
        localStorage.setItem('sidebar:collapsed', String(next))
      } catch (_) {
        // ignore
      }
      return next
    })
  }

  const fullName = `${user.fname} ${user.lname}`
  const roleLabel = user.email.toLowerCase().includes('deerwalk.edu.np') ? 'DWIT User' : 'User'
  const initials = (() => {
    const source = fullName.trim()
    if (!source) return "U"
    const parts = source.split(" ").filter(Boolean)
    const first = parts[0]?.[0] ?? "U"
    const second = parts.length > 1 ? parts[1]?.[0] : ""
    return `${first}${second}`.toUpperCase()
  })()

  return (
    <div
      className={`${collapsed ? "w-16 p-2" : "w-64 p-4"} sticky top-0 shrink-0 flex flex-col h-screen overflow-hidden bg-[#F9FCF9] border-r border-sidebar-border transition-all duration-200`}
    >
      {/* Top Section - Brand + Collapse/Expand Toggle */}
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <div className="px-1 text-xl font-semibold tracking-wide text-slate-700">DA</div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className="h-8 w-8 rounded-md border border-sidebar-border bg-white text-slate-700 shadow-sm hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-200 transition-all"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-slate-600" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-slate-600" />
          )}
        </Button>
      </div>
      <div className="mt-4 mb-4 border-t border-sidebar-border" />

      {/* Middle Section - Navigation */}
      <nav className="flex-1 space-y-2">
        {/* New Submission / Dashboard */}
        <TooltipProvider>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard')}
                  className={`w-full justify-center gap-3 ${(router.pathname === '/dashboard' || router.pathname === '/results') ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'text-sidebar-foreground hover:bg-gray-100'}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">New Submission</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className={`w-full justify-start gap-3 ${(router.pathname === '/dashboard' || router.pathname === '/results') ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'text-sidebar-foreground hover:bg-gray-100'}`}
            >
              <Plus className="h-4 w-4" />
              <span>New Submission</span>
            </Button>
          )}
        </TooltipProvider>

        {/* Archive */}
        <TooltipProvider>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/archive')}
                  className={`w-full justify-center gap-3 ${router.pathname === '/archive' ? 'bg-gray-100' : 'text-sidebar-foreground hover:bg-gray-100'}`}
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Archive</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              onClick={() => router.push('/archive')}
              className={`w-full justify-start gap-3 ${router.pathname === '/archive' ? 'bg-gray-100' : 'text-sidebar-foreground hover:bg-gray-100'}`}
            >
              <Archive className="h-4 w-4" />
              <span>Archive</span>
            </Button>
          )}
        </TooltipProvider>

        {/* Settings */}
        <TooltipProvider>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/settings')}
                  className={`w-full justify-center gap-3 ${router.pathname === '/settings' ? 'bg-gray-100' : 'text-sidebar-foreground hover:bg-gray-100'}`}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              onClick={() => router.push('/settings')}
              className={`w-full justify-start gap-3 ${router.pathname === '/settings' ? 'bg-gray-100' : 'text-sidebar-foreground hover:bg-gray-100'}`}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Button>
          )}
        </TooltipProvider>

        {/* FAQs */}
        <TooltipProvider>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/faqs')}
                  className={`w-full justify-center gap-3 ${router.pathname === '/faqs' ? 'bg-gray-100' : 'text-sidebar-foreground hover:bg-gray-100'}`}
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">FAQs</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              onClick={() => router.push('/faqs')}
              className={`w-full justify-start gap-3 ${router.pathname === '/faqs' ? 'bg-gray-100' : 'text-sidebar-foreground hover:bg-gray-100'}`}
            >
              <HelpCircle className="h-4 w-4" />
              <span>FAQs</span>
            </Button>
          )}
        </TooltipProvider>
      </nav>

      {/* Bottom Section - Logout then User Profile with divider */}
      <div className="space-y-2 pt-4 border-sidebar-border">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full ${collapsed ? "justify-center" : "justify-start"} gap-3 text-red-600 hover:bg-red-50`}
            >
              <LogOut className="h-4 w-4" />
              <span className={`${collapsed ? "hidden" : "inline"}`}>Logout</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="sm:max-w-[380px] bg-[#e5e7eb] text-gray-900">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                You will be logged out of your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="hover:!bg-gray-300 hover:!text-gray-900">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => { logout(); router.push('/login') }}
              >
                Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="border-t border-sidebar-border" />

        {/* User Profile */}
        <div className={`flex items-center gap-3 p-2 ${collapsed ? "justify-center" : ""}`}>
          <Avatar className="h-8 w-8 rounded-full border-2 border-sidebar-border">
            <AvatarImage src="/professional-headshot.png" alt={fullName} />
            <AvatarFallback className="flex h-full w-full items-center justify-center rounded-full">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className={`${collapsed ? "hidden" : "block"} min-w-0`}>
            <h3 className="text-sm font-medium text-sidebar-foreground truncate">{fullName}</h3>
            {roleLabel && (
              <p className="text-xs text-sidebar-foreground/70 truncate">{roleLabel}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
