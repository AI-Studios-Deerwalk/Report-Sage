import React, { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/router"
const Sidebar = dynamic(() => import("@/components/Sidebar").then(m => m.Sidebar), { ssr: false })
import { FileUpload } from "@/components/Upload"
import { AnalysisResults } from "@/components/AnalysisResults"
import { useAuth } from "@/contexts/AuthContext"

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
  
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  // Load analysis results from localStorage on component mount
  useEffect(() => {
    try {
      // Check if we have analysis results in localStorage
      const storedResults = localStorage.getItem(STORAGE_KEYS.ANALYSIS_RESULTS)
      const storedCompleted = localStorage.getItem(STORAGE_KEYS.ANALYSIS_COMPLETED)
      
      if (storedResults && storedCompleted === 'true') {
        try {
          const parsedResults = JSON.parse(storedResults)
          setAnalysisResults(parsedResults)
          setAnalysisCompleted(true)
        } catch (error) {
          console.error('Error parsing stored analysis results:', error)
          // Clear invalid data
          localStorage.removeItem(STORAGE_KEYS.ANALYSIS_RESULTS)
          localStorage.removeItem(STORAGE_KEYS.ANALYSIS_COMPLETED)
        }
      }
    } catch (error) {
      console.warn('localStorage not available:', error)
      // Continue without localStorage - user will need to re-upload if they refresh
    }
  }, [])

  // Check for archive_id in URL parameters (for direct links to results)
  useEffect(() => {
    const { archive_id } = router.query
    
    if (archive_id && typeof archive_id === 'string' && !analysisResults) {
      // Load results from archive if we have an archive_id in URL
      loadResultsFromArchive(archive_id)
    }
  }, [router.query, analysisResults])

  // Update URL when analysis results are displayed
  useEffect(() => {
    if (analysisCompleted && analysisResults?.archive_id) {
      // Update URL to include archive_id for sharing/bookmarking
      router.replace(`/dashboard?archive_id=${analysisResults.archive_id}`, undefined, { shallow: true })
    } else if (!analysisCompleted) {
      // Clear archive_id from URL when no results are displayed
      router.replace('/dashboard', undefined, { shallow: true })
    }
  }, [analysisCompleted, analysisResults?.archive_id, router])

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
        
        // Store in localStorage
        try {
          localStorage.setItem(STORAGE_KEYS.ANALYSIS_RESULTS, JSON.stringify(results))
          localStorage.setItem(STORAGE_KEYS.ANALYSIS_COMPLETED, 'true')
        } catch (error) {
          console.warn('Failed to save to localStorage:', error)
        }
      }
    } catch (error) {
      console.error('Error loading results from archive:', error)
    }
  }

  const handleAnalysisComplete = (completed: boolean) => {
    setAnalysisCompleted(completed)
    try {
      localStorage.setItem(STORAGE_KEYS.ANALYSIS_COMPLETED, completed.toString())
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }

  const handleSetResults = (results: AnalysisResultData) => {
    setAnalysisResults(results)
    // Store results in localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.ANALYSIS_RESULTS, JSON.stringify(results))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }

  const handleNewAnalysis = () => {
    setAnalysisResults(null)
    setAnalysisCompleted(false)
    // Clear localStorage
    try {
      localStorage.removeItem(STORAGE_KEYS.ANALYSIS_RESULTS)
      localStorage.removeItem(STORAGE_KEYS.ANALYSIS_COMPLETED)
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }
  }
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex flex-1 w-full">
        {!analysisCompleted && (
          <FileUpload 
            setResults={handleSetResults}
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}

        {analysisCompleted && analysisResults && (
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
    </div>
  )
}
