import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/AdminLayout";
import EmailConfigForm from "../../components/EmailConfigForm";
import CreateAdminForm from "../../components/CreateAdminForm";
import { 
  Settings, 
  Mail,
  Shield,
  AlertTriangle,
  ArrowLeft,
  Users,
  Database,
  UserPlus
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAdminData, hasAdminPermission } from "@/lib/adminAuth"

interface AdminData {
  aid: number
  email: string
  is_active: boolean
  is_superadmin: boolean
}

export default function AdminToolsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    console.log('useEffect running, selectedConfig:', selectedConfig);
    
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      console.log('No admin token found, redirecting to login');
      router.push('/admin/login');
      return;
    }

    // Get admin data and check permissions
    const adminData = getAdminData();
    if (!adminData) {
      console.log('No admin data found, redirecting to login');
      router.push('/admin/login');
      return;
    }

    console.log('Admin data found:', adminData);
    setAdminData(adminData);
    
    // Check if admin has permission to access config
    if (!hasAdminPermission('config')) {
      console.log('No config permission, redirecting to dashboard');
      // Redirect non-super admins to dashboard
      router.push('/admin/dashboard');
      return;
    }

    console.log('All checks passed, setting loading to false');
    setIsLoading(false);
  }, []); // Remove router dependency to prevent re-runs

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading config page...</p>
        </div>
      </div>
    );
  }

  // Double-check super admin access
  if (!hasAdminPermission('config')) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-4">You need super admin privileges to access this page.</p>
          <button 
            onClick={() => router.push('/admin/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render Email Config Form
  if (selectedConfig === 'email') {
    return (
      <>
        <Head>
          <title>Email Config - DWIT Academia</title>
          <meta name="description" content="Email configuration for DWIT Academia" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        
        <AdminLayout currentPage="tools" key={router.asPath}>
          <div className="space-y-6">
            {/* Header with back button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  console.log('Back button clicked, setting selectedConfig to null');
                  console.log('Current selectedConfig before:', selectedConfig);
                  setSelectedConfig(null);
                  console.log('selectedConfig set to null, should re-render main page');
                }}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Config
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Email Configuration</h1>
                <p className="text-slate-600">Configure email settings and SMTP configuration</p>
              </div>
            </div>

            {/* Super Admin Notice */}
            <Alert className="border-blue-200 bg-blue-50">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                You are accessing this page as a Super Administrator. Only super admins can modify email configurations.
              </AlertDescription>
            </Alert>

            {/* Email Configuration */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span>Email Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmailConfigForm />
              </CardContent>
            </Card>
          </div>
        </AdminLayout>
      </>
    );
  }

  // Render Create Admin Form
  if (selectedConfig === 'create-admin') {
    return (
      <>
        <Head>
          <title>Create Admin - DWIT Academia</title>
          <meta name="description" content="Create admin accounts for DWIT Academia" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        
        <AdminLayout currentPage="tools" key={router.asPath}>
          <div className="space-y-6">
            {/* Header with back button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  console.log('Back button clicked, setting selectedConfig to null');
                  console.log('Current selectedConfig before:', selectedConfig);
                  setSelectedConfig(null);
                  console.log('selectedConfig set to null, should re-render main page');
                }}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Config
              </button>
            </div>
            
            <CreateAdminForm />
          </div>
        </AdminLayout>
      </>
    );
  }



  // Main config selection page
  console.log('Rendering main config page, selectedConfig:', selectedConfig);
  return (
    <>
      <Head>
        <title>Admin Config - DWIT Academia</title>
        <meta name="description" content="Admin configuration for DWIT Academia" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <AdminLayout currentPage="tools" key={router.asPath}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Config</h1>
              <p className="text-slate-600">Configure system settings and configurations</p>
            </div>
          </div>

          {/* Super Admin Notice */}
          <Alert className="border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              You are accessing this page as a Super Administrator. Only super admins can modify system configurations.
            </AlertDescription>
          </Alert>

          {/* Configuration Menu */}
          <div className="space-y-6">
            {/* Email Configuration Menu Item */}
            <div 
              className="group relative bg-white border border-slate-200 rounded-2xl p-8 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              onClick={() => setSelectedConfig('email')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                    <Mail className="h-8 w-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      Email Configuration
                    </h3>
                    <p className="text-slate-600 leading-relaxed max-w-md">
                      Configure SMTP settings and email templates for system notifications and automated communications.
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full group-hover:bg-blue-600 transition-all duration-300"></div>
                  <div className="w-1.5 h-1.5 bg-blue-300 rounded-full group-hover:bg-blue-500 transition-all duration-300 delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-blue-200 rounded-full group-hover:bg-blue-400 transition-all duration-300 delay-200"></div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">System</span>
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-100">Notifications</span>
                  <span className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-full text-sm font-medium border border-slate-100">SMTP</span>
                </div>
                <div className="text-slate-300 group-hover:text-blue-500 transition-colors duration-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Admin Config Menu Item */}
            <div 
              className="group relative bg-white border border-slate-200 rounded-2xl p-8 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-50 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              onClick={() => setSelectedConfig('create-admin')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                    <UserPlus className="h-8 w-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Admin Management
                    </h3>
                    <p className="text-slate-600 leading-relaxed max-w-md">
                      Create and manage admin accounts with granular role assignments and permission controls.
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full group-hover:bg-emerald-600 transition-all duration-300"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full group-hover:bg-emerald-500 transition-all duration-300 delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-200 rounded-full group-hover:bg-emerald-400 transition-all duration-300 delay-200"></div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-100">User Management</span>
                  <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-100">Permissions</span>
                  <span className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-full text-sm font-medium border border-slate-100">Roles</span>
                </div>
                <div className="text-slate-300 group-hover:text-emerald-500 transition-colors duration-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
