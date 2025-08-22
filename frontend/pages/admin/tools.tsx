import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/AdminLayout";
import { 
  Settings, 
  Mail, 
  Database, 
  BarChart3,
  TrendingUp,
  Cog,
  Download,
  Upload,
  FileText,
  Shield,
  Users,
  Bell
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AdminToolsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (!adminToken || !adminData) {
      router.push('/admin/login');
      return;
    }

    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading tools page...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Tools - DWIT Academia</title>
        <meta name="description" content="Admin tools for DWIT Academia" />
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
              <h1 className="text-2xl font-bold text-slate-900">Admin Tools</h1>
              <p className="text-slate-600">Access powerful administrative tools</p>
            </div>
          </div>

          {/* Tools Grid */}
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

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Cog className="h-5 w-5 text-orange-600" />
                  <span>System Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">Configure system-wide settings and preferences.</p>
                <Button variant="outline" className="w-full">
                  <Cog className="h-4 w-4 mr-2" />
                  System Settings
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5 text-indigo-600" />
                  <span>Data Export</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">Export user data, reports, and system information.</p>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-teal-600" />
                  <span>Data Import</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">Import user data, configurations, and system settings.</p>
                <Button variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-red-600" />
                  <span>Report Generator</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">Generate comprehensive reports and analytics.</p>
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Reports
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-yellow-600" />
                  <span>Security Tools</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">Security monitoring, audit logs, and access control.</p>
                <Button variant="outline" className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  Security Tools
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-pink-600" />
                  <span>User Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">Advanced user management and bulk operations.</p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/admin/users')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-cyan-600" />
                  <span>Notification Center</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">Manage system notifications and alerts.</p>
                <Button variant="outline" className="w-full">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Database className="h-6 w-6 text-blue-600" />
                  <span className="text-sm">Backup System</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                  <span className="text-sm">Generate Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Mail className="h-6 w-6 text-purple-600" />
                  <span className="text-sm">Send Notification</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Settings className="h-6 w-6 text-orange-600" />
                  <span className="text-sm">System Config</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </>
  );
}
