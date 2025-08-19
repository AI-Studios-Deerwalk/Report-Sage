"use client"

import React, { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, X, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import axios from "axios"
import { useRouter } from "next/router"

interface UploadedFile {
  file: File
  id: string
}

interface ProgressState {
  current: number
  total: number
  percentage: number
}

interface FileUploadProps {
  setResults?: (results: any) => void
  onAnalysisComplete?: (completed: boolean) => void
}

export function FileUpload({ setResults, onAnalysisComplete }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<ProgressState>({ current: 0, total: 0, percentage: 0 })
  const [analysisCompleted, setAnalysisCompleted] = useState<boolean>(false)
  const router = useRouter()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter for PDF files only
    const pdfFiles = acceptedFiles.filter(file => file.type === 'application/pdf')
    
    if (pdfFiles.length === 0 && acceptedFiles.length > 0) {
      setError("Please select PDF files only")
      return
    }

    const newFiles = pdfFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
    }))
    setUploadedFiles((prev) => [...prev, ...newFiles])
    setError(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'application/pdf': ['.pdf']
    }
  })

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getProgressMessage = (percentage: number): string => {
    if (percentage < 20) return "Uploading PDF file..."
    if (percentage < 40) return "Extracting text from pages..."
    if (percentage < 60) return "Analyzing format compliance..."
    if (percentage < 80) return "Checking TU standards..."
    if (percentage < 100) return "Finalizing results..."
    return "Analysis complete!"
  }

  const analyzeFiles = async () => {
    if (uploadedFiles.length === 0) {
      setError("Please select at least one PDF file")
      return
    }

    setLoading(true)
    setError(null)
    setProgress({ current: 0, total: 10, percentage: 0 })
    
    // Start progress simulation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newPercentage = Math.min(prev.percentage + Math.random() * 15, 90)
        return {
          ...prev,
          percentage: newPercentage
        }
      })
    }, 1000)
    
    try {
      // For now, analyze the first file (can be extended for batch processing)
      const firstFile = uploadedFiles[0].file
      
      const formData = new FormData()
      formData.append("file", firstFile)
      
      const res = await axios.post(
        "http://localhost:8000/analyze-batch?max_pages=10",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      )
      
      // Complete the progress
      setProgress(prev => ({ ...prev, percentage: 100 }))
      
      if (setResults) {
        setResults(res.data)
      }
      setAnalysisCompleted(true)
      if (onAnalysisComplete) {
        onAnalysisComplete(true)
      }

      // Persist results and navigate to results page
      try {
        const resultData = {
          ...res.data,
          fileName: firstFile.name,
          analysisStartTime: Date.now()
        }
        localStorage.setItem("analysisResults", JSON.stringify(resultData))
      } catch (_) {
        // ignore storage errors
      }
      router.push('/results')
    } catch (err: any) {
      console.error("Upload error:", err)
      if (err.response) {
        setError(`Server error: ${err.response.status} - ${err.response.data?.detail || 'Unknown error'}`)
      } else if (err.request) {
        setError("Network error: Unable to connect to server. Make sure the backend is running on localhost:8000")
      } else {
        setError(`Error: ${err.message}`)
      }
    } finally {
      clearInterval(progressInterval)
      setLoading(false)
      // Reset progress after a short delay
      setTimeout(() => {
        setProgress({ current: 0, total: 0, percentage: 0 })
      }, 2000)
    }
  }

  // If analysis is completed, don't render the upload interface
  if (analysisCompleted) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Upload Area + Uploaded Files inside the same card */}
      <Card className="w-full border-2 border-dashed border-green-300 bg-white transition-colors">
        {/* Drop zone (hidden after at least one file is uploaded) */}
        {uploadedFiles.length === 0 && (
          <div {...getRootProps()} className={`p-12 text-center cursor-pointer ${isDragActive ? "bg-[#F9FCF9]/20" : ""}`}>
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-green-100 rounded-full">
                {loading ? (
                  <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
                ) : (
                  <Upload className="h-8 w-8 text-green-600" />
                )}
              </div>
              <div>
                <p className="text-lg font-medium text-foreground mb-1">
                  {loading ? "Analyzing PDF..." : "Upload a file or drag and drop"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {loading 
                    ? getProgressMessage(progress.percentage)
                    : isDragActive 
                      ? "Drop files here..." 
                      : "PDF files only"
                  }
                </p>
              </div>
              {!loading && (
                <Button variant="outline" className="mt-2 bg-transparent">
                  Choose Files
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Uploaded Files (inside the card, below the drop zone) */}
        {uploadedFiles.length > 0 && (
          <div className="p-12 bg-white min-h-[320px]">
            <h3 className="text-lg font-medium text-foreground mb-6">Uploaded Files</h3>
            {/* Progress moved below Analyze button */}
            <div className="space-y-2">
              {uploadedFiles.map((uploadedFile) => (
                <Card key={uploadedFile.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">{uploadedFile.file.name}</p>
                        <p className="text-sm text-muted-foreground">{formatFileSize(uploadedFile.file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadedFile.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            <div className="flex flex-col items-center pt-6">
              <Button 
                onClick={analyzeFiles}
                disabled={loading}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white text-lg px-10 min-w-[180px] rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze"
                )}
              </Button>
              {loading && (
                <div className="w-full max-w-xs mt-3">
                  <p className="text-xs text-muted-foreground text-center">
                    {Math.round(progress.percentage)}% - {getProgressMessage(progress.percentage)}
                  </p>
                  <Progress value={progress.percentage} className="w-full mt-2" />
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
