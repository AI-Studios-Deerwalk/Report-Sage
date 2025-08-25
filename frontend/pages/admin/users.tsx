import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/AdminLayout";

import { 
  Users, 
  UserPlus, 
  UserX, 
  Trash2, 
  Search,
  MoreHorizontal,
  Eye,
  Mail,
  Activity,
  CheckCircle,
  RefreshCw
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
  is_blocked?: boolean
  created_at: string
}

export default function AdminUsersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [error, setError] = useState("")
  const [userStats, setUserStats] = useState({
    total_users: 0,
    new_users_month: 0,
    blocked_users: 0,
    verified_users: 0,
    recent_users_7d: 0,
    verification_rate: 0
  })
  const router = useRouter();

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (!adminToken || !adminData) {
      router.push('/admin/login');
      return;
    }

    // Fetch data when component mounts
    fetchUsersData();
    setIsLoading(false);
  }, []); // Remove router dependency to prevent unnecessary API calls

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
        case "new":
          const currentMonth = new Date();
          currentMonth.setDate(1);
          currentMonth.setHours(0, 0, 0, 0);
          filtered = filtered.filter(user => new Date(user.created_at) >= currentMonth)
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
  }, [users, searchTerm, statusFilter])

  const fetchUsersData = async () => {
    try {
      setIsFetchingData(true);
      setError(""); // Clear any previous errors
      const adminToken = localStorage.getItem('adminToken')
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      console.log('API Base URL:', API_BASE_URL)

      if (!adminToken) {
        console.error('No admin token found')
        setError('No admin token found')
        return
      }
      console.log('Admin token found, length:', adminToken.length)

      // Fetch users
      console.log('Fetching users from:', `${API_BASE_URL}/api/v1/admin/users`)
      const usersResponse = await fetch(`${API_BASE_URL}/api/v1/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      
      if (usersResponse.ok) {
        const userData = await usersResponse.json()
        console.log('Users data received:', userData)
        setUsers(userData)
        setFilteredUsers(userData)
      } else {
        console.error('Failed to fetch users:', usersResponse.status, usersResponse.statusText)
        setError(`Failed to fetch users: ${usersResponse.status} ${usersResponse.statusText}`)
      }

      // Fetch user stats
      console.log('Fetching stats from:', `${API_BASE_URL}/api/v1/admin/users/stats`)
      const statsResponse = await fetch(`${API_BASE_URL}/api/v1/admin/users/stats`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        console.log('User stats received:', statsData)
        setUserStats(statsData)
      } else {
        console.error('Failed to fetch user stats:', statsResponse.status, statsResponse.statusText)
        setError(`Failed to fetch user stats: ${statsResponse.status} ${statsResponse.statusText}`)
      }

    } catch (err: any) {
      console.error('Error fetching users data:', err)
      setError(err.message)
    } finally {
      setIsFetchingData(false);
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
      fetchUsersData()
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
      fetchUsersData()
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
      fetchUsersData()
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
      fetchUsersData()
    } catch (err: any) {
      setError(err.message)
    }
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>User Management - DWIT Academia</title>
        <meta name="description" content="User management for DWIT Academia" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <AdminLayout currentPage="users" key={router.asPath}>
        <div className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
                <p className="text-slate-600">Manage system users and their access</p>
              </div>
            </div>
            <Button 
              onClick={fetchUsersData}
              disabled={isFetchingData}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetchingData ? 'animate-spin' : ''}`} />
              {isFetchingData ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

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
                <div className="text-3xl font-bold text-slate-900">
                  {isFetchingData ? (
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  ) : (
                    userStats.total_users
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">All registered users</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">New Users {new Date().toLocaleDateString('en-US', { month: 'long' })}</CardTitle>
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {isFetchingData ? (
                    <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  ) : (
                    userStats.new_users_month
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">This month</p>
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
                <div className="text-3xl font-bold text-red-600">
                  {isFetchingData ? (
                    <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  ) : (
                    userStats.blocked_users
                  )}
                </div>
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
                <div className="text-3xl font-bold text-indigo-600">
                  {isFetchingData ? (
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  ) : (
                    `${(userStats.verification_rate || 0).toFixed(1)}%`
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">Email verified</p>
              </CardContent>
            </Card>
          </div>

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
                  <option value="new">New This Month</option>
                  <option value="blocked">Blocked</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
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
                                <UserPlus className="h-4 w-4 mr-2" />
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
        </div>
      </AdminLayout>
    </>
  );
}
