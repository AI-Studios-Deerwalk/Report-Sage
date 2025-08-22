import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/AdminLayout";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  BarChart3,
  CheckCircle,
  HelpCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

interface AdminData {
  aid: number
  email: string
  is_active: boolean
}

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([])
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
  const router = useRouter();

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (!adminToken || !adminData) {
      router.push('/admin/login');
      return;
    }

    // Set admin data for display
    try {
      const parsedAdminData = JSON.parse(adminData);
      setAdminData(parsedAdminData);
    } catch (e) {
      console.error('Error parsing admin data:', e);
    }

    // Only fetch data if we're actually on the dashboard page
    if (router.pathname === '/admin/dashboard') {
      fetchDashboardData();
    }
    setIsLoading(false);
  }, []); // Remove router dependency to prevent unnecessary API calls

  const fetchDashboardData = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

      if (!adminToken) {
        console.error('No admin token found')
        return
      }

      // Fetch users
      const usersResponse = await fetch(`${API_BASE_URL}/api/v1/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      
      if (usersResponse.ok) {
        const userData = await usersResponse.json()
        setUsers(userData)
      } else {
        console.error('Failed to fetch users:', usersResponse.status, usersResponse.statusText)
      }

      // Fetch user stats
      const statsResponse = await fetch(`${API_BASE_URL}/api/v1/admin/users/stats`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setUserStats(statsData)
      } else {
        console.error('Failed to fetch user stats:', statsResponse.status, statsResponse.statusText)
      }

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err)
      setError(err.message)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - DWIT Academia</title>
        <meta name="description" content="Admin dashboard for DWIT Academia" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <AdminLayout currentPage="overview" key={router.asPath}>
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Welcome to Admin Dashboard</h2>
            <p className="text-lg text-slate-600 mb-8">Manage your system and users efficiently</p>
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

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>User Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">Manage users, view profiles, and control access.</p>
                <button 
                  onClick={() => router.push('/admin/users')}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2 px-4 rounded-lg transition-all duration-200"
                >
                  Manage Users
                </button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span>Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">View detailed analytics and system performance.</p>
                <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-2 px-4 rounded-lg transition-all duration-200">
                  View Analytics
                </button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <span>System Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">Monitor system health and performance metrics.</p>
                <button className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white py-2 px-4 rounded-lg transition-all duration-200">
                  System Status
                </button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HelpCircle className="h-5 w-5 text-orange-600" />
                  <span>FAQ Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">Manage frequently asked questions and help content.</p>
                <button 
                  onClick={() => router.push('/admin/faqs')}
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white py-2 px-4 rounded-lg transition-all duration-200"
                >
                  Manage FAQs
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
