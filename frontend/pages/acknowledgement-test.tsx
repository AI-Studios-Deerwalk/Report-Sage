import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, User, Heart, Users, HelpCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { analysisAPI } from '@/lib/api'
import Sidebar from '@/components/Sidebar'

interface AcknowledgementAnalysisResult {
  success: boolean
  acknowledgement: string
  analysis_results: {
    student_info: { status: string; feedback: string }
    gratitude_expression: { status: string; feedback: string }
    mentioned_parties: { status: string; feedback: string }
    contribution_description: { status: string; feedback: string }
  }
  summary: {
    total_sections: number
    passed_sections: number
    failed_sections: number
    overall_score: number
    recommendations: string[]
  }
}

export default function AcknowledgementTestPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<AcknowledgementAnalysisResult | null>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResults(null)
    }
  }

  const handleAnalyze = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to analyze.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await analysisAPI.analyzeAcknowledgement(file)
      setResults(response.data)
      toast({
        title: "Analysis Complete",
        description: "Acknowledgement analysis has been completed successfully.",
      })
    } catch (error: any) {
      console.error('Analysis failed:', error)
      toast({
        title: "Analysis Failed",
        description: error.response?.data?.error || "Failed to analyze acknowledgement section.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    return status === 'present' ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === 'present' ? 'default' : 'destructive'}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'student_info':
        return <User className="h-5 w-5 text-cyan-500" />
      case 'gratitude_expression':
        return <Heart className="h-5 w-5 text-pink-500" />
      case 'mentioned_parties':
        return <Users className="h-5 w-5 text-teal-500" />
      case 'contribution_description':
        return <HelpCircle className="h-5 w-5 text-amber-500" />
      default:
        return <CheckCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getSectionTitle = (type: string) => {
    switch (type) {
      case 'student_info':
        return 'Student Information'
      case 'gratitude_expression':
        return 'Gratitude Expression'
      case 'mentioned_parties':
        return 'Mentioned Parties'
      case 'contribution_description':
        return 'Contribution Description'
      default:
        return type
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#DAF3DA] to-[#E7F0E7]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="w-full max-w-4xl mx-auto">
          <h1 className="text-3xl font-semibold text-foreground mb-8">Acknowledgement Analysis Test</h1>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Upload PDF for Acknowledgement Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file">Select PDF File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="mt-2"
                />
              </div>
              <Button 
                onClick={handleAnalyze} 
                disabled={!file || loading}
                className="w-full"
              >
                {loading ? 'Analyzing...' : 'Analyze Acknowledgement'}
              </Button>
            </CardContent>
          </Card>

          {results && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Extracted Acknowledgement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {results.acknowledgement}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analysis Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(results.analysis_results).map(([key, value]) => (
                      <div key={key} className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center gap-2 mb-3">
                          {getSectionIcon(key)}
                          <h3 className="text-lg font-semibold text-gray-900">
                            {getSectionTitle(key)}
                          </h3>
                          {getStatusIcon(value.status)}
                          {getStatusBadge(value.status)}
                        </div>
                        <div className="p-3 rounded-lg border bg-gray-50">
                          <p className="text-sm text-left text-gray-800 whitespace-pre-wrap">
                            {value.feedback}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{results.summary.total_sections}</div>
                      <div className="text-sm text-gray-600">Total Sections</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{results.summary.passed_sections}</div>
                      <div className="text-sm text-gray-600">Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{results.summary.failed_sections}</div>
                      <div className="text-sm text-gray-600">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{Math.round(results.summary.overall_score)}%</div>
                      <div className="text-sm text-gray-600">Score</div>
                    </div>
                  </div>
                  
                  {results.summary.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Recommendations:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {results.summary.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-gray-700">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
