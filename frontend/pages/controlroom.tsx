import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function ControlRoomPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if admin is already logged in
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (adminToken && adminData) {
      // If already logged in, go to admin dashboard
      router.push('/admin/dashboard');
    } else {
      // If not logged in, go to admin login
      router.push('/admin/login');
    }
  }, [router]);

  return (
    <>
      <Head>
        <title>Admin Control Room - DWIT Academia</title>
        <meta name="description" content="Admin control room access" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Accessing control room...</p>
        </div>
      </div>
    </>
  );
}
