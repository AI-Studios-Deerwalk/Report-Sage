import Head from "next/head";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FaChevronDown } from "react-icons/fa";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <ProtectedRoute>
      <Head>
        <title>Settings - Report Rage</title>
        <meta name="description" content="Manage your account settings and preferences" />
      </Head>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-[#0f5288]">REPORT RAGE</h1>
                {/* Removed secondary breadcrumb text from navbar for a cleaner look */}
              </div>
              
              <div className="flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900">
                      <span className="hidden sm:inline font-semibold">{user?.fname} {user?.lname}</span>
                      <FaChevronDown className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-1">
                    <DropdownMenuLabel className="px-3 py-2 text-sm text-gray-700">
                      <div className="truncate font-medium">{user?.email}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => router.push("/dashboard")} className="px-3 py-2 focus:bg-gray-100">
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout} className="px-3 py-2 text-red-600 focus:bg-red-50 focus:text-red-700">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
            </div>
            
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      View and manage your personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">First Name</label>
                          <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            {user?.fname || "Not available"}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Last Name</label>
                          <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            {user?.lname || "Not available"}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Email Address</label>
                          <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            {user?.email || "Not available"}
                          </div>
                        </div>
                        

                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-end">
                        <Button variant="outline" className="mr-2">Cancel</Button>
                        <Button disabled>Save Changes</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="account">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>
                      Manage your account preferences and security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Account settings coming soon.</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Control how and when you receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Notification settings coming soon.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}


