import React, { useState } from "react"
import dynamic from "next/dynamic"
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

export default function DashboardPage() {
  const { user } = useAuth()
  const [analysisResults, setAnalysisResults] = useState<AnalysisResultData | null>(null)
  const [analysisCompleted, setAnalysisCompleted] = useState(false)
  
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  const handleAnalysisComplete = (completed: boolean) => {
    setAnalysisCompleted(completed)
  }

  const handleSetResults = (results: AnalysisResultData) => {
    setAnalysisResults(results)
  }

  const handleNewAnalysis = () => {
    setAnalysisResults(null)
    setAnalysisCompleted(false)
  }
  
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#DAF3DA] to-[#E7F0E7]">
      <Sidebar />
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-5xl mx-auto text-center">
          <h1 className="text-3xl font-semibold text-foreground mb-8 text-center">
            {greeting}{user ? `, ${user.fname}` : ""}
          </h1>
          
          {!analysisCompleted && (
            <FileUpload 
              setResults={handleSetResults}
              onAnalysisComplete={handleAnalysisComplete}
            />
          )}

          {analysisCompleted && analysisResults && (
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
          )}
        </div>
      </main>
    </div>
  )
}
