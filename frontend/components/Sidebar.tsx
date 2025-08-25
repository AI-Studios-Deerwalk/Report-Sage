import React, { useState, useEffect } from "react"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Archive, Plus, ChevronLeft, ChevronRight, User, LogOut, Settings, HelpCircle, AlertTriangle, FileText, ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react"
import { useRouter } from "next/router"
import { useAuth } from "@/contexts/AuthContext"
import { archiveAPI } from "@/lib/api"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ArchiveItem {
  id: number
  file_name: string
  processing_status: string
  created_at: string
}

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
  
  const [archives, setArchives] = useState<ArchiveItem[]>([])
  const [loadingArchives, setLoadingArchives] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [editingArchive, setEditingArchive] = useState<ArchiveItem | null>(null)
  const [newFileName, setNewFileName] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [archiveToDelete, setArchiveToDelete] = useState<ArchiveItem | null>(null)

  const { user, logout } = useAuth()
  const router = useRouter()

  // Fetch archives when component mounts
  useEffect(() => {
    if (user) {
      fetchArchives()
    }
  }, [user])

  const fetchArchives = async () => {
    if (loadingArchives) return
    
    setLoadingArchives(true)
    try {
      const response = await archiveAPI.getArchives({ limit: 50 })
      setArchives(response.data.archives || [])
    } catch (error) {
      console.error('Failed to fetch archives:', error)
      setArchives([])
    } finally {
      setLoadingArchives(false)
    }
  }

  const handleRename = (archive: ArchiveItem) => {
    setEditingArchive(archive)
    setNewFileName(archive.file_name)
    setRenameDialogOpen(true)
  }

  const handleRenameSubmit = async () => {
    if (!editingArchive || !newFileName.trim()) return
    
    try {
      
      // Call API to rename the archive
      const response = await archiveAPI.updateArchive(editingArchive.id, { file_name: newFileName.trim() })
      
      // Update local state
      setArchives(archives.map(arch => 
        arch.id === editingArchive.id 
          ? { ...arch, file_name: newFileName.trim() }
          : arch
      ))
      
      setRenameDialogOpen(false)
      setEditingArchive(null)
      setNewFileName("")
      
    } catch (error: any) {
      console.error('Failed to rename archive:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      
      let errorMessage = 'Failed to rename archive. Please try again.'
      if (error.response?.data?.detail) {
        // Handle validation errors (422) which come as an array
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((err: any) => err.msg).join(', ')
        } else {
          errorMessage = error.response.data.detail
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      alert(errorMessage)
    }
  }

  const handleDelete = async (archive: ArchiveItem) => {
    setArchiveToDelete(archive)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!archiveToDelete) return
    
    try {
      // Call API to delete the archive
      await archiveAPI.deleteArchive(archiveToDelete.id)
      
      // Remove from local state
      setArchives(archives.filter(arch => arch.id !== archiveToDelete.id))
      
      // Close dialog and reset state
      setDeleteDialogOpen(false)
      setArchiveToDelete(null)
      
    } catch (error) {
      console.error('Failed to delete archive:', error)
      alert('Failed to delete archive. Please try again.')
    }
  }

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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return 'Unknown'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600'
      case 'processing':
        return 'text-yellow-600'
      case 'failed':
        return 'text-red-600'
      case 'pending':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div
      className={`${collapsed ? "w-16 p-2" : "w-64 p-4"} sticky top-0 shrink-0 flex flex-col h-screen overflow-hidden bg-[#F9FCF9] border-r border-sidebar-border transition-all duration-200`}
    >
      {/* Top Section - Brand + Collapse/Expand Toggle */}
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <div className="px-1">
            <Image
              src="/Logo.png"
              alt="Report Rage Logo"
              width={50}
              height={50}
              className="object-contain"
            />
          </div>
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
             <div className="mt-3 mb-3 border-t border-sidebar-border" />

      {/* Middle Section - Navigation */}
      <nav className="flex-1 space-y-1">
        {/* New Submission / Dashboard */}
        <TooltipProvider>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard')}
                  className={`w-full justify-center gap-3 ${(router.pathname === '/dashboard' || router.pathname === '/results') ? '!bg-gray-200 !text-gray-800 hover:!bg-gray-300' : 'text-sidebar-foreground hover:!bg-gray-100'}`}
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
              className={`w-full justify-start gap-3 ${(router.pathname === '/dashboard' || router.pathname === '/results') ? '!bg-gray-200 !text-gray-800 hover:!bg-gray-300' : 'text-sidebar-foreground hover:!bg-gray-100'}`}
            >
              <Plus className="h-4 w-4" />
              <span className="text-xs">New Submission</span>
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
                  className={`w-full justify-center gap-3 ${router.pathname === '/settings' ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'text-sidebar-foreground hover:bg-gray-100'}`}
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
              className={`w-full justify-start gap-3 ${router.pathname === '/settings' ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'text-sidebar-foreground hover:bg-gray-100'}`}
            >
              <Settings className="h-4 w-4" />
              <span className="text-xs">Settings</span>
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
                  className={`w-full justify-center gap-3 ${router.pathname === '/faqs' ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'text-sidebar-foreground hover:bg-gray-100'}`}
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
              className={`w-full justify-start gap-3 ${router.pathname === '/faqs' ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'text-sidebar-foreground hover:bg-gray-100'}`}
            >
              <HelpCircle className="h-4 w-4" />
              <span className="text-xs">FAQs</span>
            </Button>
          )}
        </TooltipProvider>

        {/* Issue a Report */}
        <TooltipProvider>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/issue-report')}
                  className={`w-full justify-center gap-3 ${router.pathname === '/issue-report' ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'text-sidebar-foreground hover:bg-gray-100'}`}
                >
                  <AlertTriangle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Issue a Report</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              onClick={() => router.push('/issue-report')}
              className={`w-full justify-start gap-3 ${router.pathname === '/issue-report' ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'text-sidebar-foreground hover:bg-gray-100'}`}
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">Issue a Report</span>
            </Button>
          )}
        </TooltipProvider>

                 {/* Archive Lists with Submenu */}
         <div className="space-y-0.5">
           <TooltipProvider>
             {collapsed ? (
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Button
                     variant="ghost"
                     className={`w-full justify-center gap-3 ${router.pathname === '/archive' ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'text-sidebar-foreground hover:bg-gray-100'}`}
                   >
                     <Archive className="h-4 w-4" />
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent side="right">Archive Lists</TooltipContent>
               </Tooltip>
             ) : (
               <div className="flex items-center gap-3 px-3 py-2 text-sidebar-foreground">
                 <Archive className="h-4 w-4" />
                 <span className="text-xs">Archive Lists</span>
               </div>
             )}
           </TooltipProvider>

                       {/* Archive Submenu - Always Visible */}
            {!collapsed && (
                             <div className="ml-6 space-y-0.5 max-h-80 pb-2 overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                             {loadingArchives ? (
                 <div className="px-3 py-1 text-[10px] text-gray-500">Loading archives...</div>
               ) : archives.length === 0 ? (
                 <div className="px-3 py-1 text-[10px] text-gray-500">No archives found</div>
              ) : (
                                 archives.map((archive) => (
                                       <div
                      key={archive.id}
                      className="group flex items-center justify-between rounded-md px-3 py-1 text-sm hover:bg-gray-100 transition-colors"
                    >
                                           <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                              onClick={() => router.push(`/archive/${archive.id}`)}
                            >
                              <FileText className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <span className="truncate text-[10px] text-gray-700">
                                {archive.file_name}
                              </span>
                            </div>
                          </TooltipTrigger>
                                                     <TooltipContent side="top" className="text-[10px] px-2 py-1 bg-white border border-gray-200">
                             {(() => {
                               try {
                                 const date = new Date(archive.created_at)
                                 const today = new Date()
                                 const yesterday = new Date(today)
                                 yesterday.setDate(yesterday.getDate() - 1)
                                 
                                 if (date.toDateString() === today.toDateString()) {
                                   return 'Today'
                                 } else if (date.toDateString() === yesterday.toDateString()) {
                                   return 'Yesterday'
                                 } else {
                                   return date.toLocaleDateString('en-GB', {
                                     day: '2-digit',
                                     month: '2-digit',
                                     year: 'numeric'
                                   })
                                 }
                               } catch {
                                 return 'Unknown date'
                               }
                             })()}
                           </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                     
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                         <Button
                           variant="ghost"
                           size="sm"
                           className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                           onClick={(e) => e.stopPropagation()}
                         >
                           <MoreHorizontal className="h-3 w-3" />
                         </Button>
                       </DropdownMenuTrigger>
                                               <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem 
                            onClick={() => handleRename(archive)}
                            className="dropdown-menu-item cursor-pointer"
                          >
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(archive)}
                            className="dropdown-menu-item delete cursor-pointer text-red-600 focus:text-red-600"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                   </div>
                 ))
              )}
            </div>
          )}
                 </div>
       </nav>

               {/* Rename Dialog */}
        <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <DialogContent className="sm:max-w-[425px] z-[9999] bg-white shadow-2xl border-2 border-gray-300">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-gray-900">Rename Archive</DialogTitle>
              <DialogDescription className="text-gray-600">
                Enter a new name for "{editingArchive?.file_name || 'archive'}"
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="filename" className="text-right font-medium text-gray-700">
                  Filename
                </Label>
                <Input
                  id="filename"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="col-span-3 border-2 border-blue-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                  placeholder="Enter new filename"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setRenameDialogOpen(false)
                setEditingArchive(null)
                setNewFileName("")
              }}>
                Cancel
              </Button>
              <Button 
                 onClick={handleRenameSubmit} 
                 disabled={!newFileName.trim() || newFileName.trim() === editingArchive?.file_name} 
                 className="bg-blue-700 hover:bg-blue-800 text-white"
               >
                 Rename
               </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="sm:max-w-[425px] bg-white shadow-2xl border-2 border-gray-300">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-semibold text-gray-900">Delete Archive</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                Are you sure you want to delete "{archiveToDelete?.file_name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-2">
              <AlertDialogCancel 
                onClick={() => {
                  setDeleteDialogOpen(false)
                  setArchiveToDelete(null)
                }}
                className="hover:bg-gray-300 hover:text-gray-900"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

       {/* Bottom Section - Logout then User Profile with divider */}
      <div className="space-y-1 pt-3 border-sidebar-border">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full ${collapsed ? "justify-center" : "justify-start"} gap-3 text-red-600 hover:bg-red-50`}
            >
              <LogOut className="h-4 w-4" />
              <span className={`${collapsed ? "hidden" : "inline"} text-xs`}>Logout</span>
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
            <h3 className="text-xs font-medium text-sidebar-foreground truncate">{fullName}</h3>
            {roleLabel && (
              <p className="text-[10px] text-sidebar-foreground/70 truncate">{roleLabel}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
