import React, { useEffect, useState } from "react"
import dynamic from "next/dynamic"
const Sidebar = dynamic(() => import("@/components/Sidebar").then(m => m.Sidebar), { ssr: false })
import { AnalysisResults } from "@/components/AnalysisResults"
import { useRouter } from "next/router"

interface BackendResultItem {
  text: string
  page: number
}

interface BackendResults {
  categorized_results?: {
    errors?: BackendResultItem[]
    warnings?: BackendResultItem[]
    suggestions?: BackendResultItem[]
  }
  total_pages_analyzed?: number
  overall_summary?: string
  fileName?: string
  analysisStartTime?: number
  pages_extracted?: number
  pages_analyzed?: number
  analysis_time_ms?: number
}

interface AnalysisItem {
  id: string
  message: string
  page_number?: number
}

export default function ResultsPage() {
	const [results, setResults] = useState<any>(null)
	const router = useRouter()
	
	const handleBackToUpload = () => {
		// Clear stored results and go back to dashboard
		localStorage.removeItem("analysisResults")
		router.push('/dashboard')
	}

	useEffect(() => {
		try {
			const stored = localStorage.getItem("analysisResults")
			if (stored) {
				const backendResults: BackendResults = JSON.parse(stored)
				
				// Calculate analysis time
				const getAnalysisTime = () => {
					if (backendResults.analysis_time_ms && backendResults.analysis_time_ms > 0) {
						const totalMs = backendResults.analysis_time_ms
						const seconds = Math.round(totalMs / 1000)
						if (seconds < 60) return `${seconds}s`
						const minutes = Math.floor(seconds / 60)
						const remSeconds = seconds % 60
						return `${minutes}m ${remSeconds}s`
					}
					if (backendResults.analysisStartTime) {
						const duration = Date.now() - backendResults.analysisStartTime
						const seconds = Math.round(duration / 1000)
						return seconds < 60 ? `${seconds}s` : `${Math.round(seconds / 60)}m ${seconds % 60}s`
					}
					return "—"
				}

				// Format filename for display
				const getDisplayFileName = () => {
					const fileName = backendResults.fileName || "document.pdf"
					// Remove file extension and make it prettier
					const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "")
					return nameWithoutExt.length > 20 ? nameWithoutExt.substring(0, 20) + "..." : nameWithoutExt
				}

				// Transform backend results to match AnalysisResults component format
				const transformedResults = {
					file_name: getDisplayFileName(),
					errors: [] as AnalysisItem[],
					warnings: [] as AnalysisItem[],
					suggestions: [] as AnalysisItem[]
				}

				const categorized = backendResults.categorized_results || {}
				
				// Map errors
				if (categorized.errors) {
					transformedResults.errors.push(...categorized.errors.map((item, index) => ({
						id: `error-${index}`,
						message: item.text,
						page_number: item.page
					})))
				}

				// Map warnings
				if (categorized.warnings) {
					transformedResults.warnings.push(...categorized.warnings.map((item, index) => ({
						id: `warning-${index}`,
						message: item.text,
						page_number: item.page
					})))
				}

				// Map suggestions
				if (categorized.suggestions) {
					transformedResults.suggestions.push(...categorized.suggestions.map((item, index) => ({
						id: `suggestion-${index}`,
						message: item.text,
						page_number: item.page
					})))
				}

				setResults(transformedResults)
			}
		} catch (_) {
			// ignore
		}
	}, [])

	return (
		<div className="flex min-h-screen bg-gradient-to-b from-[#DAF3DA] to-[#E7F0E7]">
			<Sidebar />
			<main className="flex-1 p-8 overflow-auto">
				<div className="w-full max-w-5xl mx-auto">
					<h1 className="text-3xl font-semibold text-foreground mb-8">Analysis Results</h1>
					<AnalysisResults results={results} onBack={handleBackToUpload} />
				</div>
			</main>
		</div>
	)
}


