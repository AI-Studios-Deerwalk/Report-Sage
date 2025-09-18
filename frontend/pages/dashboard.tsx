import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
// const Sidebar = dynamic(() => import("@/components/Sidebar").then(m => m.Sidebar), { ssr: false })

import { FileUpload } from "@/components/Upload";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";

interface AnalysisItem {
  type: string;
  message: string;
  page_number?: number;
}

interface AnalysisResultData {
  analysis_results: AnalysisItem[];
  summary_data?: {
    summary: {
      total_sections: number;
      present: number;
      partially_present: number;
      missing: number;
      score: number;
      quality: string;
    };
  };
  file_name: string;
  archive_id?: number;
}

// Local storage keys
const STORAGE_KEYS = {
  ANALYSIS_RESULTS: "analysis_results",
  ANALYSIS_COMPLETED: "analysis_completed",
};

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Check for archive_id in URL parameters (for direct links to results)
  useEffect(() => {
    const { archive_id } = router.query;

    if (archive_id && typeof archive_id === "string") {
      // Navigate to sequential analysis page if archive_id is provided
      router.push(
        `/sequential-analysis?archive_id=${archive_id}&file_name=${encodeURIComponent(
          "document.pdf"
        )}`
      );
    } else {
      // Check if there's a recent upload in localStorage
      const recentUpload = localStorage.getItem("recent_upload");
      if (recentUpload) {
        try {
          const uploadData = JSON.parse(recentUpload);
          if (uploadData.archive_id && uploadData.file_name) {
            // Only auto-load if explicitly requested via URL parameter
            const { auto_load } = router.query;
            if (auto_load === "true") {
              // Navigate to sequential analysis page
              router.push(
                `/sequential-analysis?archive_id=${
                  uploadData.archive_id
                }&file_name=${encodeURIComponent(uploadData.file_name)}`
              );
            } else {
              // Show upload page with option to continue previous analysis
              setShowUpload(true);
            }
          }
        } catch (error) {
          localStorage.removeItem("recent_upload");
          setShowUpload(true);
        }
      } else {
        // Default to showing upload page
        setShowUpload(true);
      }
    }
  }, [router.query]);

  const handleSetResults = (results: AnalysisResultData) => {
    // The Upload component now handles its own navigation
    // This function is kept for backward compatibility but shouldn't be called
  };

  const handleNewAnalysis = () => {
    setShowUpload(true);
    // Clear recent upload from localStorage
    localStorage.removeItem("recent_upload");
    // Clear URL parameters
    router.replace("/dashboard", undefined, { shallow: true });
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Please Login
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to upload files.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex flex-1 w-full">
        {showUpload && <FileUpload setResults={handleSetResults} />}
      </main>
      <div className="fixed bottom-0 right-0 backdrop-blur-sm p-4 rounded-md">
        <p className="text-sm text-gray-600">
          Academia can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
