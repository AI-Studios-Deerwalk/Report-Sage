"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, X, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/router"
import { archiveAPI } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { OTPPurpose } from "@/lib/api"

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
  const [showVerificationWarning, setShowVerificationWarning] = useState<boolean>(false)
  const [isSendingVerification, setIsSendingVerification] = useState<boolean>(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | undefined>(undefined)
  const router = useRouter()
  const { user, resendOTP } = useAuth()
  const { toast } = useToast()

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (abortController) {
        abortController.abort()
      }
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }, [abortController, progressInterval])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Check if user is verified
    if (user && !user.is_email_verified) {
      setShowVerificationWarning(true)
      toast({
        title: "Email Verification Required",
        description: "Please verify your email address to proceed with file uploads.",
        variant: "destructive",
      })
      return
    }

    // Filter for PDF files only
    const pdfFiles = acceptedFiles.filter(file => file.type === 'application/pdf')
    
    if (pdfFiles.length === 0 && acceptedFiles.length > 0) {
      setError("Please select PDF files only. Only PDF documents are supported for analysis.")
      return
    }

    // Check file size limit (10MB per file)
    const maxSize = 10 * 1024 * 1024 // 10MB
    const oversizedFiles = pdfFiles.filter(file => file.size > maxSize)
    
    if (oversizedFiles.length > 0) {
      setError(`File size limit exceeded. Maximum file size is 10MB. Please compress or split your files.`)
      return
    }

    const newFiles = pdfFiles.map((file) => ({
      file,
      id: crypto.randomUUID(),
    }))
    setUploadedFiles((prev) => [...prev, ...newFiles])
    setError(null)
    setShowVerificationWarning(false) // Hide warning when files are successfully added
    
    toast({
      title: "Files Added",
      description: `Successfully added ${pdfFiles.length} PDF file${pdfFiles.length > 1 ? 's' : ''} for analysis.`,
    })
  }, [user, toast])

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

  const cancelAnalysis = () => {
    // Abort any ongoing requests
    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
    
    // Clear progress interval
    if (progressInterval) {
      clearInterval(progressInterval)
      setProgressInterval(undefined)
    }
    
    // Reset states without showing error
    setLoading(false)
    setProgress({ current: 0, total: 0, percentage: 0 })
    setError(null)
    
    toast({
      title: "Analysis Cancelled",
      description: "The analysis process has been cancelled. You can start a new analysis.",
      variant: "default",
    })
  }

  const handleVerifyEmail = async () => {
    if (!user) return

    setIsSendingVerification(true)
    try {
      // Send OTP email
      await resendOTP(parseInt(user.uid), OTPPurpose.VERIFICATION)
      
      // Store verification data in localStorage for the OTP page
      localStorage.setItem('pendingVerificationUserId', user.uid)
      localStorage.setItem('pendingVerificationEmail', user.email)
      
      // Show success toast
      toast({
        title: "Verification email sent",
        description: "A verification email with OTP has been sent to your inbox.",
      })
      
      // Redirect to OTP verification page
      router.push(`/verify-otp?userId=${user.uid}&email=${encodeURIComponent(user.email)}`)
    } catch (error: any) {
      toast({
        title: "Failed to send verification email",
        description: error.message || "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSendingVerification(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getProgressMessage = (percentage: number): string => {
    if (percentage < 20) return "Uploading PDF file to archive..."
    if (percentage < 40) return "Extracting text from document..."
    if (percentage < 60) return "Analyzing with Ollama AI..."
    if (percentage < 80) return "Generating suggestions and warnings..."
    if (percentage < 100) return "Saving analysis results to archive..."
    return "Analysis complete! Results ready to view."
  }

  const analyzeFiles = async () => {
    // Check if user is verified
    if (user && !user.is_email_verified) {
      setShowVerificationWarning(true)
      toast({
        title: "Email Verification Required",
        description: "Please verify your email address to proceed with file analysis.",
        variant: "destructive",
      })
      return
    }

    if (uploadedFiles.length === 0) {
      setError("Please select at least one PDF file to analyze.")
      return
    }

    // Additional validation
    if (uploadedFiles.length > 5) {
      setError("Maximum 5 files can be analyzed at once. Please remove some files and try again.")
      return
    }

    setLoading(true)
    setError(null)
    setProgress({ current: 0, total: 10, percentage: 0 })
    
    // Create abort controller for cancellation
    const controller = new AbortController()
    setAbortController(controller)
    
    // Start progress simulation
    const interval = setInterval(() => {
      setProgress(prev => {
        const newPercentage = Math.min(prev.percentage + Math.random() * 15, 85)
        return {
          ...prev,
          percentage: newPercentage
        }
      })
    }, 1000)
    setProgressInterval(interval)
    
    try {
      // First, check if backend is ready
      try {
        const healthCheck = await fetch('http://localhost:8000/health');
        const healthData = await healthCheck.json();
        
        if (healthData.status !== 'healthy') {
          console.warn('Backend not fully ready, but proceeding with upload...');
        }
      } catch (healthError) {
        console.warn('Health check failed, but proceeding with upload...');
      }
      
      // For now, analyze the first file (can be extended for batch processing)
      const firstFile = uploadedFiles[0].file
      
      // Upload document to archive with retry logic
      let uploadResponse;
      let uploadAttempts = 0;
      const maxUploadAttempts = 3;
      
      while (uploadAttempts < maxUploadAttempts) {
        try {
          // Check if cancelled
          if (controller.signal.aborted) {
            throw new Error('Upload cancelled by user');
          }
          
          uploadResponse = await archiveAPI.uploadDocument(firstFile)
          break; // Success, exit retry loop
        } catch (uploadError: any) {
          // Check if cancelled
          if (controller.signal.aborted) {
            throw new Error('Upload cancelled by user');
          }
          
          uploadAttempts++;
          console.warn(`Upload attempt ${uploadAttempts} failed:`, uploadError);
          
          if (uploadAttempts >= maxUploadAttempts) {
            throw uploadError; // Final attempt failed
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
        }
      }
      
      if (!uploadResponse) {
        throw new Error('Upload failed after multiple attempts');
      }
      
      // Show upload success toast
      toast({
        title: "Analysis Started",
        description: "Your PDF has been uploaded successfully. AI analysis is now in progress.",
        variant: "default",
      })
      
      // Wait for analysis to complete by polling the archive
      const archiveId = uploadResponse.data.id
      let analysisComplete = false
      let attempts = 0
      const maxAttempts = 120 // Wait up to 120 seconds (2 minutes)
      let consecutiveErrors = 0
      const maxConsecutiveErrors = 5
      
      while (!analysisComplete && attempts < maxAttempts) {
        // Check if cancelled
        if (controller.signal.aborted) {
          throw new Error('Analysis cancelled by user');
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
        attempts++
        
        console.log(`Polling attempt ${attempts}/${maxAttempts} for archive ${archiveId}`)
        
        try {
          // Use a longer timeout for polling requests
          const archiveResponse = await archiveAPI.getArchive(archiveId)
          const archive = archiveResponse.data
          
          // Reset consecutive errors on successful request
          consecutiveErrors = 0
          
          console.log(`Archive ${archiveId} status: ${archive.processing_status}`)
          
          if (archive.processing_status === 'completed') {
            analysisComplete = true
            
            // Complete the progress
            setProgress(prev => ({ ...prev, percentage: 100 }))
            
            // Format results for abstract analysis
            const results = {
              analysis_results: archive.analysis_results || [],
              summary_data: archive.summary_data || null,
              file_name: archive.file_name,
              archive_id: archive.id
            }
            
            if (setResults) {
              setResults(results)
            }
            setAnalysisCompleted(true)
            if (onAnalysisComplete) {
              onAnalysisComplete(true)
            }
            
            // Show success toast
            toast({
              title: "Analysis Complete",
              description: `Successfully analyzed "${archive.file_name}". Results are now available.`,
              variant: "default",
            })

            // Stay on dashboard to show results instead of navigating away
            // router.push('/archive') - commented out to stay on dashboard
            break
          } else if (archive.processing_status === 'failed') {
            throw new Error(archive.error_message || 'Analysis failed')
          }
          
          // Update progress based on status
          if (archive.processing_status === 'processing') {
            setProgress(prev => ({
              ...prev,
              percentage: Math.min(prev.percentage + 2, 80)
            }))
          }
        } catch (pollError: any) {
          consecutiveErrors++;
          console.warn(`Polling error ${consecutiveErrors}/${maxConsecutiveErrors}:`, pollError);
          
          if (pollError.response?.status === 404) {
            // Archive not found yet, continue polling
            consecutiveErrors = 0; // Reset on expected 404
            continue
          }
          
          // Handle network errors during polling more gracefully
          if (pollError.request && !pollError.response) {
            console.warn('Network error during polling, retrying...', pollError);
            if (consecutiveErrors >= maxConsecutiveErrors) {
              throw new Error('Too many consecutive network errors during polling');
            }
            continue;
          }
          
          // Only throw for actual server errors (4xx, 5xx) or too many consecutive errors
          if (pollError.response && pollError.response.status >= 400) {
            throw pollError;
          }
          
          if (consecutiveErrors >= maxConsecutiveErrors) {
            throw new Error('Too many consecutive errors during polling');
          }
          
          // For other errors, continue polling
          console.warn('Unexpected error during polling, continuing...', pollError);
          continue;
        }
      }
      
      if (!analysisComplete) {
        throw new Error('Analysis timed out. Please check your archive later.')
      }
      
    } catch (err: any) {
      console.error("Upload error:", err)
      
      // Check if this is a user cancellation
      if (err.message && (err.message.includes('cancelled by user') || err.message.includes('Upload cancelled by user') || err.message.includes('Analysis cancelled by user'))) {
        // Don't show error for user cancellation - it's handled by cancelAnalysis function
        return
      }
      
      let errorMessage = ''
      
      if (err.response) {
        errorMessage = `Server error: ${err.response.status} - ${err.response.data?.detail || 'Unknown error'}`
        setError(errorMessage)
      } else if (err.request && !err.response) {
        // This is a network error (no response received)
        errorMessage = "Connection error: Unable to reach the analysis server. Please ensure the backend service is running and try again."
        setError(errorMessage)
      } else if (err.message && err.message.includes('timed out')) {
        errorMessage = "Analysis timed out. The process took longer than expected. Please check your archive later or try with a smaller file."
        setError(errorMessage)
      } else {
        errorMessage = `Analysis failed: ${err.message || 'An unexpected error occurred. Please try again.'}`
        setError(errorMessage)
      }
      
      // Show error toast only for actual errors, not cancellations
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      // Clear progress interval
      if (progressInterval) {
        clearInterval(progressInterval)
        setProgressInterval(undefined)
      }
      
      // Clear abort controller
      setAbortController(null)
      
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4 w-full">
      {/* Animated floating geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large floating hexagons */}
        <div
          className="absolute top-10 left-10 w-32 h-32 border-2 border-emerald-200/30 rotate-12 animate-spin"
          style={{
            clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
            animationDuration: "20s",
            animationDirection: "reverse",
          }}
        ></div>

        <div
          className="absolute top-1/4 right-16 w-24 h-24 border-2 border-teal-300/40 -rotate-45 animate-pulse"
          style={{
            clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
            animationDuration: "3s",
          }}
        ></div>

        {/* Floating orbs with inner glow */}
        <div
          className="absolute top-1/3 left-1/4 w-16 h-16 rounded-full bg-gradient-to-r from-emerald-300/20 to-teal-300/20 animate-bounce"
          style={{ animationDuration: "4s", animationDelay: "0s" }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-r from-emerald-400/30 to-teal-400/30 animate-pulse"></div>
        </div>

        <div
          className="absolute bottom-1/4 right-1/3 w-12 h-12 rounded-full bg-gradient-to-r from-green-300/25 to-emerald-300/25 animate-bounce"
          style={{ animationDuration: "3.5s", animationDelay: "1s" }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-r from-green-400/35 to-emerald-400/35 animate-pulse"></div>
        </div>

        {/* Morphing blob shapes */}
        <div className="absolute top-16 right-1/4 w-40 h-40 opacity-20">
          <div
            className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full animate-pulse"
            style={{
              borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
              animation: "morph 8s ease-in-out infinite",
            }}
          ></div>
        </div>

        <div className="absolute bottom-20 left-1/5 w-32 h-32 opacity-15">
          <div
            className="w-full h-full bg-gradient-to-tr from-teal-400 to-green-400 rounded-full animate-pulse"
            style={{
              borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
              animation: "morph 6s ease-in-out infinite reverse",
            }}
          ></div>
        </div>

        {/* Particle system - floating dots */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400/30 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}

        {/* Cosmic rays/lines */}
        <div className="absolute top-0 left-1/4 w-px h-32 bg-gradient-to-b from-transparent via-emerald-300/50 to-transparent transform rotate-12 animate-pulse"></div>
        <div
          className="absolute top-1/3 right-1/5 w-px h-24 bg-gradient-to-b from-transparent via-teal-300/40 to-transparent transform -rotate-45 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/3 w-px h-20 bg-gradient-to-b from-transparent via-green-300/45 to-transparent transform rotate-75 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        {/* Constellation pattern */}
        <div className="absolute top-1/5 left-1/2 w-1 h-1 bg-emerald-400/60 rounded-full animate-twinkle"></div>
        <div
          className="absolute top-1/4 left-1/2 w-1 h-1 bg-teal-400/60 rounded-full animate-twinkle"
          style={{ animationDelay: "0.5s" }}
        ></div>
        <div
          className="absolute top-1/3 left-1/2 w-1 h-1 bg-green-400/60 rounded-full animate-twinkle"
          style={{ animationDelay: "1s" }}
        ></div>

        {/* Connecting lines for constellation */}
        <svg className="absolute top-1/5 left-1/2 w-8 h-16 opacity-30">
          <line
            x1="2"
            y1="0"
            x2="2"
            y2="16"
            stroke="url(#emeraldGradient)"
            strokeWidth="0.5"
            className="animate-pulse"
          />
          <line
            x1="2"
            y1="16"
            x2="2"
            y2="32"
            stroke="url(#emeraldGradient)"
            strokeWidth="0.5"
            className="animate-pulse"
            style={{ animationDelay: "0.5s" }}
          />
          <defs>
            <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(52 211 153 / 0.6)" />
              <stop offset="100%" stopColor="rgb(20 184 166 / 0.6)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Spiral galaxy effect */}
        <div className="absolute top-1/2 left-1/6 w-20 h-20 opacity-10">
          <div
            className="w-full h-full border-2 border-emerald-400 rounded-full animate-spin"
            style={{ animationDuration: "15s" }}
          >
            <div
              className="w-3/4 h-3/4 border border-teal-400 rounded-full m-2 animate-spin"
              style={{ animationDuration: "10s", animationDirection: "reverse" }}
            >
              <div
                className="w-1/2 h-1/2 border border-green-400 rounded-full m-3 animate-spin"
                style={{ animationDuration: "5s" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Energy waves */}
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 opacity-20">
          <div
            className="w-full h-full border-2 border-emerald-300 rounded-full animate-ping"
            style={{ animationDuration: "4s" }}
          ></div>
          <div
            className="absolute inset-2 border border-teal-300 rounded-full animate-ping"
            style={{ animationDuration: "4s", animationDelay: "1s" }}
          ></div>
          <div
            className="absolute inset-4 border border-green-300 rounded-full animate-ping"
            style={{ animationDuration: "4s", animationDelay: "2s" }}
          ></div>
        </div>
      </div>

      {/* Custom CSS animations */}
      <style jsx>{`
        @keyframes morph {
          0%, 100% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          }
          50% {
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
          }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
      `}</style>

      <div className="w-full max-w-4xl z-10">
        {/* Upload Area + Uploaded Files inside the same card */}
        <Card className="w-full bg-white/95 backdrop-blur-sm shadow-lg shadow-emerald-800/10 rounded-2xl transition-colors relative">
          {/* Drop zone (hidden after at least one file is uploaded) */}
          {uploadedFiles.length === 0 && (
            <div {...getRootProps()} className={`p-12 text-center cursor-pointer transition-all duration-200 ${isDragActive ? "bg-green-50 border-green-400 rounded-2xl" : "hover:bg-gray-50 rounded-2xl"}`}>
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-green-100 rounded-2xl">
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
                        : "PDF files only (max 10MB each)"
                    }
                  </p>
                </div>
                {!loading && (
                  <Button variant="outline" className="mt-2 bg-transparent hover:bg-green-50">
                    Choose Files
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Uploaded Files (inside the card, below the drop zone) */}
          {uploadedFiles.length > 0 && (
            <div className="p-12 bg-white min-h-[320px] rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-foreground">Uploaded Files</h3>
                <span className="text-sm text-muted-foreground">
                  {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="space-y-3">
                {uploadedFiles.map((uploadedFile) => (
                  <Card key={uploadedFile.id} className="p-4 border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-foreground">{uploadedFile.file.name}</p>
                          <p className="text-sm text-muted-foreground">{formatFileSize(uploadedFile.file.size)}</p>
                        </div>
                      </div>
                      {!loading && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(uploadedFile.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          title="Remove file"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
              <div className="flex flex-col items-center pt-6">
                {!loading && (
                  <Button 
                    onClick={analyzeFiles}
                    size="lg"
                    className="bg-gray-800 hover:bg-gray-900 text-white text-lg px-10 min-w-[180px] rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    Analyze Files
                  </Button>
                )}
                {loading && (
                  <div className="flex gap-4">
                    <Button 
                      disabled
                      size="lg"
                      className="bg-gray-800 text-white text-lg px-10 min-w-[180px] rounded-lg shadow-md transition-all duration-200"
                    >
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing...
                    </Button>
                    <Button 
                      onClick={cancelAnalysis}
                      variant="outline"
                      size="lg"
                      className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 text-lg px-10 min-w-[180px] rounded-lg transition-all duration-200"
                    >
                      <X className="mr-2 h-5 w-5" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
              
              {loading && (
                <div className="w-full max-w-lg mt-8 mx-auto">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">Analyzing...</span>
                    <span className="text-sm font-semibold text-blue-600">{Math.round(progress.percentage)}%</span>
                  </div>
                  <div className="relative">
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Email Verification Warning - Only show when user attempts to upload without verification */}
        {showVerificationWarning && user && !user.is_email_verified && (
          <Alert className="border-amber-200 bg-amber-50 shadow-sm mt-4">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
            <AlertDescription className="text-amber-800">
              <span className="font-semibold">Email verification required.</span> Please verify your email address to proceed with file uploads.{" "}
              <button 
                onClick={handleVerifyEmail}
                className="text-blue-600 underline hover:text-blue-700 font-medium cursor-pointer"
                disabled={isSendingVerification}
              >
                {isSendingVerification ? "Sending..." : "Verify Email"}
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 mt-4">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
