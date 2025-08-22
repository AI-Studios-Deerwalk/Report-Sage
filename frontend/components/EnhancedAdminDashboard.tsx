"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { 
  Users, 
  UserCheck, 
  UserX, 
  Trash2, 
  LogOut, 
  Shield, 
  BarChart3,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  AlertTriangle,
  Mail,
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
  Menu
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
import { Progress } from "@/components/ui/progress"
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

interface UserActivity {
  id: number
  user_id: number
  action_type: string
  action_description: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

interface SystemHealth {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  active_connections: number
  total_users: number
  active_users_24h: number
  is_healthy: boolean
  status_message: string
  timestamp: string
}

interface AdminData {
  aid: number
  email: string
  is_active: boolean
}

export default function EnhancedAdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    blocked: 0,
    verified: 0,
    recent_7d: 0,
    verification_rate: 0
  })
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [recentActivities, setRecentActivities] = useState<UserActivity[]>([])

  const router = useRouter()

  // Sidebar navigation items
  const sidebarItems = [
    { id: "overview", label: "Overview", icon: <Home className="h-5 w-5" /> },
    { id: "users", label: "User Management", icon: <Users className="h-5 w-5" /> },
    { id: "activities", label: "Activities", icon: <Activity className="h-5 w-5" /> },
    { id: "system", label: "System", icon: <Server className="h-5 w-5" /> },
    { id: "tools", label: "Tools", icon: <Settings className="h-5 w-5" /> }
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
      case "activities":
        router.push('/admin/activities')
        break
      case "system":
        router.push('/admin/system')
        break
      case "tools":
        router.push('/admin/tools')
        break
      default:
        router.push('/admin/dashboard')
    }
  }

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

    fetchDashboardData()
  }, [])

  useEffect(() => {
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

  const fetchDashboardData = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      
      // Fetch users
      const usersResponse = await fetch(`${API_BASE_URL}/api/v1/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      if (usersResponse.ok) {
        const userData = await usersResponse.json()
        setUsers(userData)
        setFilteredUsers(userData)
      }

      // Fetch user stats
      const statsResponse = await fetch(`${API_BASE_URL}/api/v1/admin/users/stats`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setUserStats(statsData)
      }

      // Fetch system health
      const healthResponse = await fetch(`${API_BASE_URL}/api/v1/admin/system/health`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        setSystemHealth(healthData)
      }

      // Fetch recent activities
      const activitiesResponse = await fetch(`${API_BASE_URL}/api/v1/admin/activities/recent?limit=20`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json()
        setRecentActivities(activitiesData)
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

      // Update local state
      setUsers(users.map(user => 
        user.uid === userId ? { ...user, is_blocked: true, is_active: false } : user
      ))
      
      // Refresh data
      fetchDashboardData()
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

      // Update local state
      setUsers(users.map(user => 
        user.uid === userId ? { ...user, is_blocked: false, is_active: true } : user
      ))
      
      // Refresh data
      fetchDashboardData()
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

      // Update local state
      setUsers(users.map(user => 
        user.uid === userId ? { ...user, is_email_verified: true } : user
      ))
      
      // Refresh data
      fetchDashboardData()
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

      // Remove from local state
      setUsers(users.filter(user => user.uid !== userId))
      
      // Refresh data
      fetchDashboardData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminData')
    router.push('/admin/login')
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
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Admin Dashboard</h2>
          <p className="text-slate-600">Preparing your super admin experience...</p>
        </div>
      </div>
    )
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
                  ${activeTab === item.id 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' 
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }
                `}
              >
                <div className={`
                  flex-shrink-0
                  ${activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}
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

      {/* Main Content */}
      <div className="lg:ml-64">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Dashboard Content */}
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Welcome to Admin Dashboard</h2>
            <p className="text-lg text-slate-600 mb-8">Use the sidebar navigation to access different admin sections</p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Users</CardTitle>
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{userStats.total}</div>
                  <p className="text-xs text-slate-500 mt-1">All registered users</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Active Users</CardTitle>
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <UserCheck className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{userStats.active}</div>
                  <p className="text-xs text-slate-500 mt-1">Currently active</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Blocked Users</CardTitle>
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                    <UserX className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{userStats.blocked}</div>
                  <p className="text-xs text-slate-500 mt-1">Currently blocked</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Verification Rate</CardTitle>
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-indigo-600">{userStats.verification_rate.toFixed(1)}%</div>
                  <p className="text-xs text-slate-500 mt-1">Email verified</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
