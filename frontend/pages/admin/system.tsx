import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/AdminLayout";
import { 
  Server, 
  Cpu, 
  Database, 
  BarChart3,
  Activity,
  Shield,
  CheckCircle,
  AlertTriangle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default function AdminSystemPage() {
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
          <p className="text-slate-600">Loading system page...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>System Management - DWIT Academia</title>
        <meta name="description" content="System management for DWIT Academia" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <AdminLayout currentPage="system" key={router.asPath}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Server className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">System Management</h1>
              <p className="text-slate-600">Monitor and manage system health</p>
            </div>
          </div>

          {/* System Health Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">CPU Usage</CardTitle>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Cpu className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">45%</div>
                <Progress value={45} className="mt-2" />
                <p className="text-xs text-slate-500 mt-1">Normal load</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Memory Usage</CardTitle>
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Activity className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">62%</div>
                <Progress value={62} className="mt-2" />
                <p className="text-xs text-slate-500 mt-1">8.2GB / 13.2GB</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Database Status</CardTitle>
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Database className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">All connections active</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">System Status</CardTitle>
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Healthy
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">All systems operational</p>
              </CardContent>
            </Card>
          </div>

          {/* System Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span>Performance Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Response Time</span>
                    <span className="font-medium">245ms</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Uptime</span>
                    <span className="font-medium">99.9%</span>
                  </div>
                  <Progress value={99} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Error Rate</span>
                    <span className="font-medium">0.1%</span>
                  </div>
                  <Progress value={1} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span>Recent Alerts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">System backup completed</p>
                      <p className="text-xs text-green-600">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Database optimization</p>
                      <p className="text-xs text-blue-600">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">High memory usage detected</p>
                      <p className="text-xs text-yellow-600">3 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle>System Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-4 border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Database className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">Database Backup</h3>
                      <p className="text-sm text-slate-600">Create system backup</p>
                    </div>
                  </div>
                </button>
                <button className="p-4 border-2 border-slate-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Activity className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">System Restart</h3>
                      <p className="text-sm text-slate-600">Restart services</p>
                    </div>
                  </div>
                </button>
                <button className="p-4 border-2 border-slate-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">Performance Report</h3>
                      <p className="text-sm text-slate-600">Generate report</p>
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </>
  );
}
