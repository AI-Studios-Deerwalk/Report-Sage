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
  severity: string
  category?: string
  page_number?: number
  section?: string
}

interface AnalysisResultData {
  suggestions: AnalysisItem[]
  warnings: AnalysisItem[]
  errors: AnalysisItem[]
  file_name: string
  analysis_content?: string
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
    }
  }, [router.query])

  const loadResultsFromArchive = async (archiveId: string) => {
    try {
      const { archiveAPI } = await import('@/lib/api')
      const response = await archiveAPI.getArchive(parseInt(archiveId))
      const archive = response.data
      
      if (archive.processing_status === 'completed') {
        const results = {
          suggestions: archive.suggestions || [],
          warnings: archive.warnings || [],
          errors: archive.errors || [],
          analysis_content: archive.analysis_content || '',
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
    setAnalysisCompleted(completed)
    setShowUpload(false)
  }

  const handleSetResults = (results: AnalysisResultData) => {
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
              
              {/* Button to start new analysis */}
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleNewAnalysis}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                >
                  Analyze Another Document
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
