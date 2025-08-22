import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Trash2, 
  LogOut, 
  Shield, 
  Search,
  MoreHorizontal,
  Eye,
  Mail,
  Activity,
  CheckCircle,
  Download,
  Upload,
  RefreshCw,
  Clock,
  Globe,
  ArrowLeft,
  Menu,
  BarChart3,
  Server
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

interface User {
  uid: number
  email: string
  fname: string
  lname: string
  phone_number?: string
  is_active: boolean
  is_email_verified: boolean
  is_blocked: boolean
  created_at: string
}

interface AdminData {
  aid: number
  email: string
  is_active: boolean
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false)

  const router = useRouter()

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken')
    const adminDataStr = localStorage.getItem('adminData')
    
    if (!adminToken || !adminDataStr) {
      router.push('/admin/login')
      return
    }

    try {
      setAdminData(JSON.parse(adminDataStr))
    } catch (e) {
      router.push('/admin/login')
      return
    }

    fetchUsers()
  }, [])

  useEffect(() => {
    // Update selected user if it exists in the updated users array
    if (selectedUser) {
      const updatedUser = users.find(u => u.uid === selectedUser.uid)
      if (updatedUser && (
        updatedUser.is_blocked !== selectedUser.is_blocked ||
        updatedUser.is_active !== selectedUser.is_active ||
        updatedUser.is_email_verified !== selectedUser.is_email_verified
      )) {
        setSelectedUser(updatedUser)
      }
    }
    
    // Filter users based on search term and status
    let filtered = users
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lname.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (statusFilter !== "all") {
      switch (statusFilter) {
        case "active":
          filtered = filtered.filter(user => user.is_active && !user.is_blocked)
          break
        case "blocked":
          filtered = filtered.filter(user => user.is_blocked)
          break
        case "verified":
          filtered = filtered.filter(user => user.is_email_verified)
          break
        case "unverified":
          filtered = filtered.filter(user => !user.is_email_verified)
          break
      }
    }
    
    setFilteredUsers(filtered)
  }, [searchTerm, statusFilter, users])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      const adminToken = localStorage.getItem('adminToken')
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      
      if (response.ok) {
               const userData = await response.json()
       setUsers(userData)
        setFilteredUsers(userData)
      } else {
        const errorText = await response.text()
        throw new Error(`Failed to fetch users: ${response.status} ${errorText}`)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBlockUser = async (userId: number) => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/block/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })

      if (!response.ok) {
        throw new Error('Failed to block user')
      }

      // Update local state immediately for better UX
      const updatedUsers = users.map(user => 
        user.uid === userId ? { ...user, is_blocked: true, is_active: false } : user
      )
      setUsers(updatedUsers)
      
      // Also update filtered users if needed
      setFilteredUsers(prev => prev.map((user: User) => 
        user.uid === userId ? { ...user, is_blocked: true, is_active: false } : user
      ))
      
      // Fetch fresh data from server
      fetchUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUnblockUser = async (userId: number) => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/unblock/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })

      if (!response.ok) {
        throw new Error('Failed to unblock user')
      }

      // Update local state immediately for better UX
      const updatedUsers = users.map(user => 
        user.uid === userId ? { ...user, is_blocked: false, is_active: true } : user
      )
      setUsers(updatedUsers)
      
      // Also update filtered users if needed
      setFilteredUsers(prev => prev.map((user: User) => 
        user.uid === userId ? { ...user, is_blocked: false, is_active: true } : user
      ))
      
      // Fetch fresh data from server
      fetchUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleVerifyUser = async (userId: number) => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/verify/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })

      if (!response.ok) {
        throw new Error('Failed to verify user')
      }

      // Update local state immediately for better UX
      const updatedUsers = users.map(user => 
        user.uid === userId ? { ...user, is_email_verified: true } : user
      )
      setUsers(updatedUsers)
      
      // Also update filtered users if needed
      setFilteredUsers(prev => prev.map((user: User) => 
        user.uid === userId ? { ...user, is_email_verified: true } : user
      ))
      
      // Fetch fresh data from server
      fetchUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const adminToken = localStorage.getItem('adminToken')
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/delete/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      setUsers(users.filter(user => user.uid !== userId))
      fetchUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminData')
    router.push('/admin/login')
  }

  const handleViewUserDetails = async (user: User) => {
    // Get the most current user data from the users array
    const currentUser = users.find(u => u.uid === user.uid) || user
    
    // Force refresh user data from server to ensure consistency
    try {
      await fetchUsers()
      // After fetching, get the most up-to-date user data
      const refreshedUser = users.find(u => u.uid === user.uid) || currentUser
      setSelectedUser(refreshedUser)
      setIsUserDetailModalOpen(true)
    } catch (error) {
      // Fallback to current data if refresh fails
      setSelectedUser(currentUser)
      setIsUserDetailModalOpen(true)
    }
  }

  const closeUserDetailModal = () => {
    setIsUserDetailModalOpen(false)
    setSelectedUser(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Users...</h2>
          <p className="text-slate-600">Fetching user data...</p>
        </div>
      </div>
    )
  }

  // Sidebar navigation items
  const sidebarItems = [
    { id: "overview", label: "Overview", icon: <Shield className="h-5 w-5" /> },
    { id: "users", label: "User Management", icon: <Users className="h-5 w-5" /> },
    { id: "system", label: "System", icon: <Server className="h-5 w-5" /> },
  ]

  const handleSidebarItemClick = (itemId: string) => {
    setMobileSidebarOpen(false)
    
    // Navigate to different pages based on selection
    switch (itemId) {
      case "overview":
        router.push('/admin/dashboard')
        break
      case "users":
        router.push('/admin/users')
        break
      case "system":
        router.push('/admin/system')
        break
      default:
        router.push('/admin/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full bg-white border-r border-slate-200 flex flex-col shadow-xl">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Admin Panel
                </h2>
                <p className="text-xs text-slate-500">Control Room</p>
              </div>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSidebarItemClick(item.id)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group
                  ${item.id === "users" 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' 
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }
                `}
              >
                <div className={`
                  flex-shrink-0
                  ${item.id === "users" ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}
                `}>
                  {item.icon}
                </div>
                <span className="flex-1">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-200 space-y-2">
            <div className="text-center mb-3">
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                Super Admin
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileSidebarOpen(true)}
          className="bg-white shadow-lg"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">User Management</h1>
            <p className="text-slate-600">Manage and monitor all registered users in the system</p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}



          {/* Search and Filters */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-11 px-4 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
                <Button 
                  onClick={fetchUsers}
                  className="h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>

              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">User</TableHead>
                    <TableHead className="font-semibold text-slate-700">Email</TableHead>
                    <TableHead className="font-semibold text-slate-700">Phone</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Verified</TableHead>
                    <TableHead className="font-semibold text-slate-700">Joined</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.uid} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.fname[0]}{user.lname[0]}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{user.fname} {user.lname}</div>
                            <div className="text-sm text-slate-500">ID: {user.uid}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-slate-900">{user.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-slate-600">{user.phone_number || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={user.is_blocked ? "destructive" : user.is_active ? "default" : "secondary"}
                            className="px-3 py-1"
                          >
                            {user.is_blocked ? "Blocked" : user.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.is_email_verified ? "default" : "secondary"}
                          className="px-3 py-1"
                        >
                          {user.is_email_verified ? "Verified" : "Unverified"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-slate-600">{formatDate(user.created_at)}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                                                                                                           <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem 
                                onClick={() => handleViewUserDetails(user)}
                                className="hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors duration-150"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                             <DropdownMenuItem className="hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors duration-150">
                               <Mail className="h-4 w-4 mr-2" />
                               Send Email
                             </DropdownMenuItem>
                             <DropdownMenuItem className="hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors duration-150">
                               <Activity className="h-4 w-4 mr-2" />
                               View Activity
                             </DropdownMenuItem>
                             <Separator />
                             {!Boolean(user.is_email_verified) && (
                               <DropdownMenuItem 
                                 onClick={() => handleVerifyUser(user.uid)}
                                 className="hover:bg-green-50 hover:text-green-700 cursor-pointer transition-colors duration-150"
                               >
                                 <CheckCircle className="h-4 w-4 mr-2" />
                                 Verify Email
                               </DropdownMenuItem>
                             )}
                             {Boolean(user.is_blocked) ? (
                               <DropdownMenuItem 
                                 onClick={() => handleUnblockUser(user.uid)}
                                 className="text-green-600 hover:bg-green-50 hover:text-green-700 cursor-pointer transition-colors duration-150"
                               >
                                 <UserCheck className="h-4 w-4 mr-2" />
                                 Unblock User
                               </DropdownMenuItem>
                             ) : (
                               <DropdownMenuItem 
                                 onClick={() => handleBlockUser(user.uid)}
                                 className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer transition-colors duration-150"
                               >
                                 <UserX className="h-4 w-4 mr-2" />
                                 Block User
                               </DropdownMenuItem>
                             )}
                             <Separator />
                             <DropdownMenuItem 
                               onClick={() => handleDeleteUser(user.uid)}
                               className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer transition-colors duration-150"
                             >
                               <Trash2 className="h-4 w-4 mr-2" />
                               Delete User
                             </DropdownMenuItem>
                           </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No users found</h3>
                  <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </CardContent>
                     </Card>
         </div>
       </div>

                               {/* User Details Modal */}
         {isUserDetailModalOpen && selectedUser && (
           <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
                           {/* Modal Header */}
              <div className="p-5 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {selectedUser.fname[0]}{selectedUser.lname[0]}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {selectedUser.fname} {selectedUser.lname}
                      </h2>
                      <p className="text-sm text-slate-600">User ID: {selectedUser.uid}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeUserDetailModal}
                    className="h-7 w-7 p-0 hover:bg-slate-100"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>

                                                       {/* Modal Content */}
                               <div className="p-6">
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   {/* Left Column */}
                   <div className="space-y-6">
                     {/* Basic Information */}
                     <div>
                       <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
                       <div className="space-y-3">
                         <div className="space-y-1">
                           <label className="text-xs font-medium text-slate-600">First Name</label>
                           <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg text-sm">{selectedUser.fname}</p>
                         </div>
                         <div className="space-y-1">
                           <label className="text-xs font-medium text-slate-600">Last Name</label>
                           <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg text-sm">{selectedUser.lname}</p>
                         </div>
                         <div className="space-y-1">
                           <label className="text-xs font-medium text-slate-600">Email Address</label>
                           <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg text-sm">{selectedUser.email}</p>
                         </div>
                         <div className="space-y-1">
                           <label className="text-xs font-medium text-slate-600">Phone Number</label>
                           <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg text-sm">
                             {selectedUser.phone_number || 'Not provided'}
                           </p>
                         </div>
                       </div>
                     </div>

                     {/* Account Details */}
                     <div>
                       <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Details</h3>
                       <div className="space-y-3">
                         <div className="space-y-1">
                           <label className="text-xs font-medium text-slate-600">Date Joined</label>
                           <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg text-sm">
                             {formatDate(selectedUser.created_at)}
                           </p>
                         </div>
                         <div className="space-y-1">
                           <label className="text-xs font-medium text-slate-600">Account Age</label>
                           <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg text-sm">
                             {(() => {
                               const created = new Date(selectedUser.created_at)
                               const now = new Date()
                               const diffTime = Math.abs(now.getTime() - created.getTime())
                               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                               return `${diffDays} day${diffDays !== 1 ? 's' : ''}`
                             })()}
                           </p>
                         </div>
                       </div>
                     </div>
                   </div>

                   {/* Right Column */}
                   <div className="space-y-6">
                     {/* Account Status */}
                     <div>
                       <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Status</h3>
                       <div className="space-y-3">
                         <div className="space-y-1">
                           <label className="text-xs font-medium text-slate-600">Account Status</label>
                           <Badge 
                             variant={selectedUser.is_blocked ? "destructive" : selectedUser.is_active ? "default" : "secondary"}
                             className="px-3 py-1 text-xs"
                           >
                             {selectedUser.is_blocked ? "Blocked" : selectedUser.is_active ? "Active" : "Inactive"}
                           </Badge>
                           
                         </div>
                         <div className="space-y-1">
                           <label className="text-xs font-medium text-slate-600">Email Verification</label>
                           <Badge 
                             variant={selectedUser.is_email_verified ? "default" : "secondary"}
                             className="px-3 py-1 text-xs"
                           >
                             {selectedUser.is_email_verified ? "Verified" : "Unverified"}
                           </Badge>
                         </div>
                         <div className="space-y-1">
                           <label className="text-xs font-medium text-slate-600">User ID</label>
                           <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg font-mono text-sm">
                             #{selectedUser.uid}
                           </p>
                         </div>
                       </div>
                     </div>

                                          {/* Quick Actions */}
                     <div>
                                               <div className="mb-4">
                          <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
                        </div>
                       <div className="space-y-3">
                         
                         
                         {!Boolean(selectedUser.is_email_verified) && (
                           <Button
                             onClick={() => {
                               handleVerifyUser(selectedUser.uid)
                               closeUserDetailModal()
                             }}
                             className="w-full bg-green-600 hover:bg-green-700 text-white py-2 text-sm"
                           >
                             <CheckCircle className="h-4 w-4 mr-2" />
                             Verify Email
                           </Button>
                         )}

                                                   {selectedUser.is_blocked ? (
                           <Button
                             onClick={() => {
                               handleUnblockUser(selectedUser.uid)
                               closeUserDetailModal()
                             }}
                             variant="outline"
                             className="w-full border-green-300 text-green-600 hover:bg-green-50 py-2 text-sm"
                           >
                             <UserCheck className="h-4 w-4 mr-2" />
                             Unblock User
                           </Button>
                         ) : (
                           <Button
                             onClick={() => {
                               handleBlockUser(selectedUser.uid)
                               closeUserDetailModal()
                             }}
                             variant="outline"
                             className="w-full border-red-300 text-red-600 hover:bg-red-50 py-2 text-sm"
                           >
                             <UserX className="h-4 w-4 mr-2" />
                             Block User
                           </Button>
                         )}
                         <Button
                           onClick={() => {
                             handleDeleteUser(selectedUser.uid)
                             closeUserDetailModal()
                           }}
                           variant="outline"
                           className="w-full border-red-300 text-red-600 hover:bg-red-50 py-2 text-sm"
                         >
                           <Trash2 className="h-4 w-4 mr-2" />
                           Delete User
                         </Button>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>

                           {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={closeUserDetailModal}
                    className="px-4 py-2 text-sm"
                  >
                    Close
                  </Button>
                </div>
              </div>
           </div>
         </div>
       )}
     </div>
   )
 }
