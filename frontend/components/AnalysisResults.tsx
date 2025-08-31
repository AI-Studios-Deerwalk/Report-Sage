import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, XCircle, Lightbulb, Archive, Share2, Copy, Check } from "lucide-react"
import { useRouter } from "next/router"
import { useToast } from "@/hooks/use-toast"

interface AnalysisItem {
  type: string
  message: string
  page_number?: number
}

interface AnalysisResultsProps {
  results: {
    suggestions: AnalysisItem[]
    warnings: AnalysisItem[]
    errors: AnalysisItem[]
    file_name: string
    analysis_content?: string
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
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'suggestion':
        return <Lightbulb className="h-5 w-5 text-blue-500" />
      default:
        return <CheckCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const renderAnalysisItems = (items: AnalysisItem[], title: string, icon: React.ReactNode) => {
    if (items.length === 0) return null

    return (
      <Card className="mb-6 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title} - {items.length}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 ">
            {items.map((item, index) => (
                
              <div key={index} className="p-3 rounded-lg border bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-left text-gray-800">{item.message}</p>
                    {item.page_number && (
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          Page {item.page_number}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

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
            Analysis Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-red-600">{results.errors.length}</div>
              <div className="text-sm text-gray-600">Errors Found</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-yellow-600">{results.warnings.length}</div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{results.suggestions.length}</div>
              <div className="text-sm text-gray-600">Suggestions</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Analysis completed for: <strong>{results.file_name}</strong>
            </p>
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

      {/* Errors Section */}
      {renderAnalysisItems(
        results.errors, 
        "Errors", 
        <XCircle className="h-5 w-5 text-red-500" />
      )}

      {/* Warnings Section */}
      {renderAnalysisItems(
        results.warnings, 
        "Warnings", 
        <AlertTriangle className="h-5 w-5 text-yellow-500" />
      )}

      {/* Suggestions Section */}
      {renderAnalysisItems(
        results.suggestions, 
        "Suggestions", 
        <Lightbulb className="h-5 w-5 text-blue-500" />
      )}

      {/* No Issues Found */}
      {results.errors.length === 0 && results.warnings.length === 0 && results.suggestions.length === 0 && (
        <Card className="bg-green-50">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Excellent! No Issues Found
            </h3>
            <p className="text-sm text-green-600">
              Your document appears to follow all formatting standards correctly.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
