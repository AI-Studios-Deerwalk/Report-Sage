import React, { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/router"
// const Sidebar = dynamic(() => import("@/components/Sidebar").then(m => m.Sidebar), { ssr: false })

import { FileUpload } from "@/components/Upload"
import { AnalysisResults } from "@/components/AnalysisResults"
import { useAuth } from "@/contexts/AuthContext"
import { Sidebar } from "@/components/Sidebar"

interface AnalysisItem {
  type: string
  message: string
  page_number?: number
}

interface AnalysisResultData {
  analysis_results: AnalysisItem[]
  summary_data?: {
    summary: {
      total_sections: number
      present: number
      partially_present: number
      missing: number
      score: number
      quality: string
    }
  }
  file_name: string
  archive_id?: number
}

// Local storage keys
const STORAGE_KEYS = {
  ANALYSIS_RESULTS: 'analysis_results',
  ANALYSIS_COMPLETED: 'analysis_completed'
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [analysisResults, setAnalysisResults] = useState<AnalysisResultData | null>(null)
  const [analysisCompleted, setAnalysisCompleted] = useState(false)
  const [showUpload, setShowUpload] = useState(true)
  
  // Debug logging for state changes
  useEffect(() => {
    console.log('Dashboard state changed:', {
      analysisResults: !!analysisResults,
      analysisCompleted,
      showUpload,
      resultsCount: analysisResults?.analysis_results?.length || 0
    })
  }, [analysisResults, analysisCompleted, showUpload])
  
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  // Check for archive_id in URL parameters (for direct links to results)
  useEffect(() => {
    const { archive_id } = router.query
    
    if (archive_id && typeof archive_id === 'string') {
      // Only load results from archive if explicitly requested via URL
      loadResultsFromArchive(archive_id)
      setShowUpload(false)
    } else {
      // Default to showing upload page
      setShowUpload(true)
      setAnalysisResults(null)
      setAnalysisCompleted(false)
      
      // Check if there are any recently completed analyses that might not have been displayed
      checkForRecentCompletedAnalysis()
    }
  }, [router.query])
  
  const checkForRecentCompletedAnalysis = async () => {
    try {
      console.log('Checking for recent completed analysis...')
      const { archiveAPI } = await import('@/lib/api')
      const response = await archiveAPI.getArchives({ limit: 5 }) // Get last 5 archives
      const archives = response.data.archives || response.data
      
      // Look for the most recent completed analysis
      const recentCompleted = archives.find((archive: any) => 
        archive.processing_status === 'completed' && 
        archive.created_at && 
        new Date(archive.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
      )
      
      if (recentCompleted && !analysisResults) {
        console.log('Found recent completed analysis, loading results...', recentCompleted)
        const results = {
          analysis_results: recentCompleted.analysis_results || [],
          summary_data: recentCompleted.summary_data || null,
          file_name: recentCompleted.file_name,
          archive_id: recentCompleted.id
        }
        
        setAnalysisResults(results)
        setAnalysisCompleted(true)
        setShowUpload(false)
        
        // Show success toast
        const { toast } = await import('@/hooks/use-toast')
        toast({
          title: "Analysis Found!",
          description: `Found completed analysis for "${recentCompleted.file_name}".`,
          variant: "default",
        })
      } else if (recentCompleted && analysisResults) {
        // Already showing results
        const { toast } = await import('@/hooks/use-toast')
        toast({
          title: "Already Showing Results",
          description: "Analysis results are already being displayed.",
          variant: "default",
        })
      } else {
        // No completed analysis found
        const { toast } = await import('@/hooks/use-toast')
        toast({
          title: "No Recent Analysis",
          description: "No completed analysis found in the last 24 hours.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.log('Error checking for recent analysis:', error)
      const { toast } = await import('@/hooks/use-toast')
      toast({
        title: "Check Failed",
        description: "Unable to check for recent analysis. Please try again later.",
        variant: "destructive",
      })
    }
  }

  const loadResultsFromArchive = async (archiveId: string) => {
    try {
      const { archiveAPI } = await import('@/lib/api')
      const response = await archiveAPI.getArchive(parseInt(archiveId))
      const archive = response.data
      
      if (archive.processing_status === 'completed') {
        const results = {
          analysis_results: archive.analysis_results || [],
          summary_data: archive.summary_data || null,
          file_name: archive.file_name,
          archive_id: archive.id
        }
        
        setAnalysisResults(results)
        setAnalysisCompleted(true)
        setShowUpload(false)
      }
    } catch (error) {
      console.error('Error loading results from archive:', error)
      // If loading fails, show upload page
      setShowUpload(true)
    }
  }

  const handleAnalysisComplete = (completed: boolean) => {
    console.log('Dashboard: handleAnalysisComplete called with:', completed)
    setAnalysisCompleted(completed)
    setShowUpload(false)
  }

  const handleSetResults = (results: AnalysisResultData) => {
    console.log('Dashboard: handleSetResults called with:', results)
    setAnalysisResults(results)
    setShowUpload(false)
  }

  const handleNewAnalysis = () => {
    setAnalysisResults(null)
    setAnalysisCompleted(false)
    setShowUpload(true)
    // Clear URL parameters
    router.replace('/dashboard', undefined, { shallow: true })
  }
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex flex-1 w-full">
        {showUpload && (
          <FileUpload 
            setResults={handleSetResults}
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}

        {!showUpload && analysisCompleted && analysisResults && (
          <div className="w-full max-w-5xl mx-auto text-center p-8">
            <h1 className="text-3xl font-semibold text-foreground mb-8 text-center">
              {greeting}{user ? `, ${user.fname}` : ""}
            </h1>
            
            <div className="space-y-6">
              <AnalysisResults results={analysisResults} />
              
              {/* Buttons to start new analysis or check for completed analysis */}
              <div className="flex justify-center gap-4 mt-8">
                <button
                  onClick={handleNewAnalysis}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                >
                  Analyze Another Document
                </button>
                <button
                  onClick={checkForRecentCompletedAnalysis}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                >
                  Check for Recent Analysis
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <div className="fixed bottom-0 right-0 backdrop-blur-sm p-4 rounded-md" >
        <p className="text-sm text-gray-600">
          Academia can make mistakes. Check important info.
        </p>
      </div>
    </div>
  )
}
