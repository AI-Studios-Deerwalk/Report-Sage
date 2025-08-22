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
  TrendingUp,
  Database
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  is_blocked?: boolean
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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
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
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-slate-500">Super Admin Control Panel</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="hidden md:flex">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <div className="flex items-center space-x-3 bg-slate-100 px-4 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-slate-700">
                  {adminData?.email}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm border border-slate-200/50 p-1 rounded-xl shadow-lg">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="activities" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
              <Activity className="h-4 w-4 mr-2" />
              Activities
            </TabsTrigger>
            <TabsTrigger value="system" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
              <Server className="h-4 w-4 mr-2" />
              System
            </TabsTrigger>
            <TabsTrigger value="tools" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
              <Settings className="h-4 w-4 mr-2" />
              Tools
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            {/* System Health Overview */}
            {systemHealth && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Server className="h-5 w-5 text-blue-600" />
                    <span>System Health Overview</span>
                    <Badge variant={systemHealth.is_healthy ? "default" : "destructive"}>
                      {systemHealth.is_healthy ? "Healthy" : "Warning"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">CPU Usage</span>
                        <span className="font-medium">{systemHealth.cpu_usage.toFixed(1)}%</span>
                      </div>
                      <Progress value={systemHealth.cpu_usage} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Memory Usage</span>
                        <span className="font-medium">{systemHealth.memory_usage.toFixed(1)}%</span>
                      </div>
                      <Progress value={systemHealth.memory_usage} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Disk Usage</span>
                        <span className="font-medium">{systemHealth.disk_usage.toFixed(1)}%</span>
                      </div>
                      <Progress value={systemHealth.disk_usage} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Search and Filters */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
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
                    onClick={fetchDashboardData}
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
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Activity className="h-4 w-4 mr-2" />
                                View Activity
                              </DropdownMenuItem>
                              <Separator />
                              {!user.is_email_verified && (
                                <DropdownMenuItem onClick={() => handleVerifyUser(user.uid)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Verify Email
                                </DropdownMenuItem>
                              )}
                              {user.is_blocked ? (
                                <DropdownMenuItem 
                                  onClick={() => handleUnblockUser(user.uid)}
                                  className="text-green-600"
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Unblock User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => handleBlockUser(user.uid)}
                                  className="text-red-600"
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Block User
                                </DropdownMenuItem>
                              )}
                              <Separator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteUser(user.uid)}
                                className="text-red-600"
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
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span>User Activity Log</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-slate-900">{activity.action_description}</h4>
                          <Badge variant="outline" className="text-xs">
                            {activity.action_type}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(activity.created_at)}
                          </span>
                          {activity.ip_address && (
                            <span className="flex items-center">
                              <Globe className="h-3 w-3 mr-1" />
                              {activity.ip_address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            {systemHealth && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Metrics */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Cpu className="h-5 w-5 text-blue-600" />
                      <span>System Metrics</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-slate-600">CPU Usage</span>
                          <span className="font-medium">{systemHealth.cpu_usage.toFixed(1)}%</span>
                        </div>
                        <Progress value={systemHealth.cpu_usage} className="h-3" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-slate-600">Memory Usage</span>
                          <span className="font-medium">{systemHealth.memory_usage.toFixed(1)}%</span>
                        </div>
                        <Progress value={systemHealth.memory_usage} className="h-3" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-slate-600">Disk Usage</span>
                          <span className="font-medium">{systemHealth.disk_usage.toFixed(1)}%</span>
                        </div>
                        <Progress value={systemHealth.disk_usage} className="h-3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Application Metrics */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <span>Application Metrics</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{systemHealth.total_users}</div>
                        <div className="text-sm text-slate-600">Total Users</div>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{systemHealth.active_users_24h}</div>
                        <div className="text-sm text-slate-600">Active (24h)</div>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="text-sm text-slate-600 mb-2">System Status</div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${systemHealth.is_healthy ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <span className="text-sm font-medium">
                          {systemHealth.status_message}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span>Email Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Send emails to individual users or bulk emails to multiple users.</p>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    <Mail className="h-4 w-4 mr-2" />
                    Manage Emails
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-green-600" />
                    <span>Database Tools</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Database maintenance, backups, and optimization tools.</p>
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Database Tools
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <span>Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Advanced analytics and reporting tools for insights.</p>
                  <Button variant="outline" className="w-full">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
