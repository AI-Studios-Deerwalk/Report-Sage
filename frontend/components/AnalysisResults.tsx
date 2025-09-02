import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, XCircle, Lightbulb, Archive, Share2, Copy, Check, BookOpen, Target, TrendingUp, Award } from "lucide-react"
import { useRouter } from "next/router"
import { useToast } from "@/hooks/use-toast"

interface AnalysisItem {
  type: string
  message: string
  page_number?: number
}

interface AnalysisResultsProps {
  results: {
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
  onBack?: () => void
}

export function AnalysisResults({ results, onBack }: AnalysisResultsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const handleViewArchives = () => {
    router.push('/archive')
  }

  const handleShareResults = async () => {
    if (results.archive_id) {
      const shareUrl = `${window.location.origin}/dashboard?archive_id=${results.archive_id}`
      
      try {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        toast({
          title: "Link Copied!",
          description: "Analysis results link has been copied to your clipboard.",
          variant: "default",
        })
        
        // Reset copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea')
        textArea.value = shareUrl
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        
        setCopied(true)
        toast({
          title: "Link Copied!",
          description: "Analysis results link has been copied to your clipboard.",
          variant: "default",
        })
        
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'motivation':
        return <Target className="h-5 w-5 text-blue-500" />
      case 'methods':
        return <BookOpen className="h-5 w-5 text-green-500" />
      case 'results':
        return <TrendingUp className="h-5 w-5 text-purple-500" />
      case 'conclusion':
        return <Award className="h-5 w-5 text-orange-500" />
      case 'overall':
        return <CheckCircle className="h-5 w-5 text-gray-500" />
      default:
        return <CheckCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getTypeTitle = (type: string) => {
    switch (type.toLowerCase()) {
      case 'motivation':
        return 'Motivation / Problem Statement'
      case 'methods':
        return 'Methods / Procedure / Approach'
      case 'results':
        return 'Results / Findings / Product'
      case 'conclusion':
        return 'Conclusion / Implications'
      case 'overall':
        return 'Overall Evaluation'
      default:
        return type
    }
  }

  const renderAnalysisItems = (items: AnalysisItem[]) => {
    if (items.length === 0) return null

    return (
      <div className="space-y-6">
        {items.map((item, index) => (
          <Card key={index} className="bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                {getIcon(item.type)}
                {getTypeTitle(item.type)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 rounded-lg border bg-gray-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-left text-gray-800 whitespace-pre-wrap">{item.message}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const summary = results.summary_data?.summary

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      {onBack && (
        <div className="mb-4">
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            ← Back to Upload
          </Button>
        </div>
      )}
      
      <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Abstract Analysis Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-green-600">{summary.present}</div>
                <div className="text-sm text-gray-600">Present</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-yellow-600">{summary.partially_present}</div>
                <div className="text-sm text-gray-600">Partially Present</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-red-600">{summary.missing}</div>
                <div className="text-sm text-gray-600">Missing</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">{summary.score}%</div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
            </div>
          )}
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Analysis completed for: <strong>{results.file_name}</strong>
            </p>
            {summary && (
              <p className="text-sm text-gray-600 mt-1">
                Quality Assessment: <strong className="text-blue-600">{summary.quality}</strong>
              </p>
            )}
            {results.archive_id && (
              <div className="mt-3 flex justify-center gap-2">
                <Button
                  onClick={handleShareResults}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      Share Results
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {renderAnalysisItems(results.analysis_results)}

      {/* No Analysis Results */}
      {results.analysis_results.length === 0 && (
        <Card className="bg-yellow-50">
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              No Analysis Results Available
            </h3>
            <p className="text-sm text-yellow-600">
              The abstract analysis could not be completed. Please try uploading the document again.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
