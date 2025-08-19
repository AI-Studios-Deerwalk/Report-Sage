import React, { useState } from "react"
import dynamic from "next/dynamic"
const Sidebar = dynamic(() => import("@/components/Sidebar").then(m => m.Sidebar), { ssr: false })
import { FileUpload } from "@/components/Upload"
import ResultDisplay from "@/components/ResultDisplay"
import { useAuth } from "@/contexts/AuthContext"

export default function DashboardPage() {
  const { user } = useAuth()
  const [results, setResults] = useState(null)
  const [analysisCompleted, setAnalysisCompleted] = useState(false)
  
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  
  const handleAnalysisComplete = (completed: boolean) => {
    setAnalysisCompleted(completed)
  }
  
  const handleNewAnalysis = () => {
    setResults(null)
    setAnalysisCompleted(false)
  }
  
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#DAF3DA] to-[#E7F0E7]">
      <Sidebar />
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-5xl mx-auto text-center">
          <h1 className="text-3xl font-semibold text-foreground mb-8 text-center">{greeting}{user ? `, ${user.fname}` : ""}</h1>
          
          {!analysisCompleted && (
            <FileUpload 
              setResults={setResults} 
              onAnalysisComplete={handleAnalysisComplete}
            />
          )}
          
          {analysisCompleted && (
            <div className="space-y-6">
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Analysis Complete!</h3>
                <p className="text-green-700 mb-4">Your document has been analyzed successfully.</p>
                <button 
                  onClick={handleNewAnalysis}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Analyze Another Document
                </button>
              </div>
              
              <ResultDisplay results={results} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
