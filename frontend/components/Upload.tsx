"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface UploadedFile {
  id: string;
  file: File;
}

interface FileUploadProps {
  setResults?: (results: any) => void;
}

export function FileUpload({ setResults }: FileUploadProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadedArchiveId, setUploadedArchiveId] = useState<number | null>(
    null
  );
  const [recentUpload, setRecentUpload] = useState<any>(null);
  const [uploadSuccess, setUploadSuccess] = useState<any>(null);
  const { toast } = useToast();

  // Check for recent upload on component mount
  React.useEffect(() => {
    const recentUploadData = localStorage.getItem("recent_upload");
    if (recentUploadData) {
      try {
        const uploadData = JSON.parse(recentUploadData);
        setRecentUpload(uploadData);
      } catch (error) {
        localStorage.removeItem("recent_upload");
      }
    }
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null);

      // Check authentication first
      if (!isAuthenticated) {
        setError("You must be logged in to upload files. Please login first.");
        toast({
          title: "Authentication Required",
          description: "Please login to upload files.",
          variant: "destructive",
        });
        return;
      }

      // Validate file types
      const validFiles = acceptedFiles.filter((file) => {
        if (file.type !== "application/pdf") {
          setError("Only PDF files are allowed.");
          return false;
        }
        if (file.size > 10 * 1024 * 1024) {
          // 10MB limit
          setError("File size must be less than 10MB.");
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        return;
      }

      // Add files to state immediately for display
      const newFiles: UploadedFile[] = validFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
      }));
      setUploadedFiles(newFiles);

      try {
        // Import API client
        const { archiveAPI } = await import("@/lib/api");

        // Upload the first file (we'll handle multiple files later if needed)
        const fileToUpload = validFiles[0];

        if (!isAuthenticated) {
          throw new Error(
            "You must be logged in to upload files. Please login first."
          );
        }

        let response;
        try {
          // Add a timeout wrapper
          const uploadPromise = archiveAPI.uploadDocument(fileToUpload);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Upload timeout after 30 seconds")),
              30000
            )
          );

          response = await Promise.race([uploadPromise, timeoutPromise]);
        } catch (apiError: any) {
          throw apiError;
        }

        const archive = (response as any).data;

        if (!archive) {
          throw new Error("No archive data received from server");
        }

        if (!archive.id) {
          throw new Error("Invalid response from server: missing archive ID");
        }

        setUploadedArchiveId(archive.id);

        // Save upload data to localStorage for persistence
        const uploadData = {
          archive_id: archive.id,
          file_name: archive.file_name || fileToUpload.name,
          analysis_results: [],
          summary_data: null,
          uploaded_at: new Date().toISOString(),
        };
        localStorage.setItem("recent_upload", JSON.stringify(uploadData));

        // Show success toast
        toast({
          title: "Upload successful!",
          description: `File "${fileToUpload.name}" uploaded successfully. Starting analysis...`,
        });

        // Set upload success data for fallback
        const url = `/sequential-analysis?archive_id=${
          archive.id
        }&file_name=${encodeURIComponent(
          archive.file_name || fileToUpload.name
        )}`;

        setUploadSuccess({
          archiveId: archive.id,
          fileName: archive.file_name || fileToUpload.name,
          url: url,
        });

        // Try multiple redirect methods
        try {
          // Method 1: Direct assignment
          window.location.href = url;
        } catch (error) {
          // Method 1 failed, try Method 2
        }

        // Method 2: Using router (if available)
        try {
          if (router && router.push) {
            router.push(url);
          }
        } catch (error) {
          // Method 2 failed, try Method 3
        }

        // Method 3: Force redirect after a short delay
        setTimeout(() => {
          try {
            window.location.replace(url);
          } catch (error) {
            // All methods failed
          }
        }, 100);
      } catch (error: any) {
        let errorMessage = "Upload failed. Please try again.";

        if (error.response) {
          errorMessage =
            error.response.data?.detail ||
            error.response.data?.message ||
            errorMessage;
        } else if (error.message) {
          errorMessage = error.message;
        }

        setError(errorMessage);
        toast({
          title: "Upload failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
    [toast, isAuthenticated]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: true,
    maxFiles: 5,
  });

  // Don't render SequentialAnalysisResults here - let the dashboard handle it
  // The dashboard will show SequentialAnalysisResults when showUpload is false

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FCF8F8] flex items-center justify-center p-4 w-full">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Geometric patterns */}
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-blue-200/30 rotate-12 animate-spin"
             style={{ animationDuration: "20s", animationDirection: "reverse" }}></div>
        
        <div className="absolute top-1/4 right-16 w-24 h-24 border-2 border-indigo-300/40 -rotate-45 animate-pulse"
             style={{ animationDuration: "3s" }}></div>

        {/* Floating elements */}
        <div className="absolute top-1/3 left-1/4 w-16 h-16 rounded-full bg-gradient-to-r from-blue-300/20 to-indigo-300/20 animate-bounce"
             style={{ animationDuration: "4s" }}>
          <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-400/30 to-indigo-400/30 animate-pulse"></div>
        </div>

        {/* Security-themed elements */}
        <div className="absolute bottom-1/4 right-1/3 w-12 h-12 rounded-full bg-gradient-to-r from-slate-300/25 to-blue-300/25 animate-bounce"
             style={{ animationDuration: "3.5s", animationDelay: "1s" }}>
          <div className="w-full h-full rounded-full bg-gradient-to-r from-slate-400/35 to-blue-400/35 animate-pulse"></div>
        </div>

        {/* Particle system */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/30 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Upload Your Research Papers
          </h1>
          {/* <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get instant AI-powered analysis of your research papers. Upload PDF
            files and receive detailed insights on abstract and acknowledgement
            sections.
          </p> */}
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-[0_0_5px_rgba(59,130,246,0.15)]">
          {/* <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-semibold text-gray-800 flex items-center justify-center gap-2">
              <Upload className="h-8 w-8 text-emerald-600" />
              Drag & Drop Your Files
            </CardTitle>
          </CardHeader> */}
          <CardContent className="p-8">
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300 hover:scale-[1.03]
                ${
                  isDragActive
                    ? "border-blue-500/30 bg-blue-50 scale-105"
                    : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                }
              `}
            >
              <input {...getInputProps()} />

              <div className="flex flex-col items-center space-y-5">
                <div className="p-4 bg-blue-100 rounded-xl">
                  <Upload className="h-12 w-12 text-blue-900" />
                </div>

                <div>
                  <p className="text-xl font-medium text-gray-700 mb-2">
                    {isDragActive
                      ? "Drop your files here"
                      : "Drag & drop your PDF files here"}
                  </p>
                  <p className="text-gray-500 mb-4">or click to browse files</p>
                  <Badge
                    variant="outline"
                    className="text-blue-600 border-blue-200"
                  >
                    PDF files only • Max 10MB each • Up to 5 files
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Supported formats: PDF • Maximum file size: 10MB • Maximum
                files: 5
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span>Secure Upload</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span>AI Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span>Instant Results</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
