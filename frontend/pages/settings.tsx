import React from "react";
import Head from "next/head";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Settings from "@/components/Settings";
import { Sidebar } from "@/components/Sidebar";

export default function SettingsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Settings - Report Rage</title>
        <meta
          name="description"
          content="Manage your account settings and preferences"
        />
      </Head>

      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Settings />
        </main>
      </div>
    </ProtectedRoute>
  );
}
