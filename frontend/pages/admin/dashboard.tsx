import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import EnhancedAdminDashboard from "../../components/EnhancedAdminDashboard";

export default function AdminDashboardPage() {
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

    // Set admin data for display
    try {
      const parsedAdminData = JSON.parse(adminData);
      // You can use parsedAdminData.email here if needed
    } catch (e) {
      console.error('Error parsing admin data:', e);
    }

    setIsLoading(false);
  }, [router]);

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
      
      <EnhancedAdminDashboard />
    </>
  );
}
