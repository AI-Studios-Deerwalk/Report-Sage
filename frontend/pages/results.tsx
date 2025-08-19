import React, { useEffect, useState } from "react"
import dynamic from "next/dynamic"
const Sidebar = dynamic(() => import("@/components/Sidebar").then(m => m.Sidebar), { ssr: false })
import { AnalysisResults } from "@/components/analyzeresult"

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
}

interface AnalysisItem {
  id: string
  message: string
  page?: number
  severity: "error" | "warning" | "suggestion"
}

export default function ResultsPage() {
	const [results, setResults] = useState<any>(null)

	useEffect(() => {
		try {
			const stored = localStorage.getItem("analysisResults")
			if (stored) {
				const backendResults: BackendResults = JSON.parse(stored)
				
				// Transform backend results to match AnalysisResults component format
				const transformedResults = {
					fileName: "document.pdf", // You could store this separately if needed
					totalPages: backendResults.total_pages_analyzed || 0,
					analysisTime: "Analysis complete",
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
						page: item.page,
						severity: "error" as const
					})))
				}

				// Map warnings
				if (categorized.warnings) {
					transformedResults.warnings.push(...categorized.warnings.map((item, index) => ({
						id: `warning-${index}`,
						message: item.text,
						page: item.page,
						severity: "warning" as const
					})))
				}

				// Map suggestions
				if (categorized.suggestions) {
					transformedResults.suggestions.push(...categorized.suggestions.map((item, index) => ({
						id: `suggestion-${index}`,
						message: item.text,
						page: item.page,
						severity: "suggestion" as const
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
					<AnalysisResults results={results} />
				</div>
			</main>
		</div>
	)
}


