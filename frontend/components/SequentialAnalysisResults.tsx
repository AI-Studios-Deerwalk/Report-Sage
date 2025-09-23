import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
  Archive,
  BookOpen,
  Target,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronUp,
  Loader2,
  Eye,
  ChevronLeft,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/router";
import { useToast } from "@/hooks/use-toast";
import { archiveAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface AnalysisItem {
  type: string;
  message: string;
  page_number?: number;
}

interface SequentialAnalysisResultsProps {
  archiveId: number;
  fileName: string;
  onBack?: () => void;
}

interface AnalysisState {
  abstract: {
    loading: boolean;
    status: string;
    results: AnalysisItem[];
    summary: any;
    error: string | null;
  };
  acknowledgement: {
    loading: boolean;
    status: string;
    results: AnalysisItem[];
    summary: any;
    error: string | null;
  };
  overallStatus: "idle" | "processing" | "completed" | "failed";
}

export function SequentialAnalysisResults({
  archiveId,
  fileName,
  onBack,
}: SequentialAnalysisResultsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAbstractOpen, setIsAbstractOpen] = useState(false);
  const [isAcknowledgementOpen, setIsAcknowledgementOpen] = useState(false);
  const [abstractPolling, setAbstractPolling] = useState(true);
  const [acknowledgementPolling, setAcknowledgementPolling] = useState(true);

  // React Query for Abstract Status
  const {
    data: abstractData,
    isLoading: abstractLoading,
    isError: abstractError,
    error: abstractErrorDetails,
    refetch: refetchAbstract,
  } = useQuery({
    queryKey: ["abstract-status", archiveId],
    queryFn: () => {
      console.log(
        "🚀 EXECUTING QUERY: abstract-status for archiveId:",
        archiveId
      );
      return archiveAPI.getAbstractStatus(archiveId);
    },
    enabled: !!archiveId && archiveId !== 0,
    refetchInterval: abstractPolling ? 1000 : false, // Poll every 1 second while polling is enabled
    retry: 3,
    staleTime: 0, // Always consider data stale to fetch fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Derived state from React Query data
  const abstractStatus = abstractData?.data?.abstract_status || "pending";
  const abstractResults = abstractData?.data?.abstract_results || [];
  const abstractSummary = abstractData?.data?.abstract_summary || null;
  const abstractErrorMsg = abstractData?.data?.abstract_error || null;

  // Handle query success and error
  useEffect(() => {
    if (abstractData) {
      console.log("✅ QUERY SUCCESS: abstract-status", abstractData);
    }
  }, [abstractData]);

  useEffect(() => {
    if (abstractError) {
      console.error("❌ QUERY ERROR: abstract-status", abstractError);
    }
  }, [abstractError]);

  // React Query for Acknowledgement Status
  const {
    data: acknowledgementData,
    isLoading: acknowledgementLoading,
    isError: acknowledgementError,
    error: acknowledgementErrorDetails,
    refetch: refetchAcknowledgement,
  } = useQuery({
    queryKey: ["acknowledgement-status", archiveId],
    queryFn: () => archiveAPI.getAcknowledgementStatus(archiveId),
    enabled: !!archiveId && archiveId !== 0, // Start immediately, don't wait for abstract
    refetchInterval: acknowledgementPolling ? 1000 : false, // Poll every 1 second while polling is enabled
    retry: 3,
    staleTime: 0, // Always consider data stale to fetch fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const acknowledgementStatus =
    acknowledgementData?.data?.acknowledgement_status || "pending";
  const acknowledgementResults =
    acknowledgementData?.data?.acknowledgement_results || [];
  const acknowledgementSummary =
    acknowledgementData?.data?.acknowledgement_summary || null;
  const acknowledgementErrorMsg =
    acknowledgementData?.data?.acknowledgement_error || null;

  // Debug logging
  console.log("SequentialAnalysisResults rendered with:", {
    archiveId,
    fileName,
    abstractStatus,
    acknowledgementStatus,
    abstractResults,
    abstractResultsLength: abstractResults?.length,
    acknowledgementResults,
    user: user?.uid,
  });

  // Additional debug logging for abstract data
  console.log("Abstract data details:", {
    abstractData,
    abstractStatus,
    abstractResults,
    abstractResultsLength: abstractResults?.length,
    abstractLoading,
    abstractError,
    abstractErrorMsg,
  });

  // Detailed logging of the API response structure
  if (abstractData) {
    console.log(
      "Full abstract API response:",
      JSON.stringify(abstractData, null, 2)
    );
    console.log(
      "Abstract results from API:",
      abstractData.data?.abstract_results
    );
    console.log(
      "Abstract results type:",
      typeof abstractData.data?.abstract_results
    );
    console.log(
      "Abstract results is array:",
      Array.isArray(abstractData.data?.abstract_results)
    );
  }

  // Force immediate refetch when component mounts with valid archive ID
  useEffect(() => {
    if (archiveId && archiveId !== 0) {
      console.log(
        "🔍 FORCE REFETCH: Component mounted with archiveId:",
        archiveId
      );
      console.log("🔍 Current abstract status:", abstractStatus);
      console.log("🔍 Current abstract data:", abstractData);

      // Test API call directly
      const testApiCall = async () => {
        try {
          console.log(
            "🧪 TESTING API: Making direct call to abstract-status endpoint"
          );
          const response = await archiveAPI.getAbstractStatus(archiveId);
          console.log("🧪 API RESPONSE:", response.data);
        } catch (error) {
          console.error("🧪 API ERROR:", error);
        }
      };

      testApiCall();

      // Force immediate refetch
      refetchAbstract();
      refetchAcknowledgement();
    }
  }, [archiveId, refetchAbstract, refetchAcknowledgement]);

  const handleViewArchives = () => {
    router.push("/archive");
  };

  // Utility function to extract relative path from full file path
  const extractRelativePath = (fullPath: string): string => {
    console.log("Original file path:", fullPath);

    // Handle different path formats
    if (!fullPath) return "";

    // Method 1: Look for 'uploads/' directory
    const uploadsIndex = fullPath.indexOf("uploads/");
    if (uploadsIndex !== -1) {
      const relativePath = fullPath.substring(uploadsIndex);
      console.log("Extracted relative path (method 1):", relativePath);
      return relativePath;
    }

    // Method 2: Look for 'uploads\\' directory (Windows)
    const uploadsIndexWin = fullPath.indexOf("uploads\\");
    if (uploadsIndexWin !== -1) {
      const relativePath = fullPath
        .substring(uploadsIndexWin)
        .replace(/\\/g, "/");
      console.log("Extracted relative path (method 2):", relativePath);
      return relativePath;
    }

    // Method 3: If it's already a relative path starting with uploads
    if (fullPath.startsWith("uploads/") || fullPath.startsWith("uploads\\")) {
      const relativePath = fullPath.replace(/\\/g, "/");
      console.log("Already relative path:", relativePath);
      return relativePath;
    }

    // Method 4: Extract filename and construct path
    const filename = fullPath.split(/[/\\]/).pop();
    if (filename) {
      const relativePath = `uploads/reports/${filename}`;
      console.log("Constructed path from filename:", relativePath);
      return relativePath;
    }

    console.log("Using original path as fallback:", fullPath);
    return fullPath;
  };

  const handleViewReport = async () => {
    try {
      console.log("Starting handleViewReport with archiveId:", archiveId);
      console.log("User ID:", user?.uid);
      console.log("File name:", fileName);

      // Get the archive details to get the actual file path
      const archiveResponse = await archiveAPI.getArchive(archiveId);
      const archive = archiveResponse.data;

      console.log("Archive data received:", archive);

      if (archive && archive.file_path) {
        // Extract the relative path from the full file path
        const relativePath = extractRelativePath(archive.file_path);

        // Construct the full URL for the static file serving
        const backendUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const fileUrl = `${backendUrl}/${relativePath}`;

        console.log("Constructed file URL:", fileUrl);

        // Open the PDF in a new tab
        window.open(fileUrl, "_blank");
      } else {
        console.log("No file_path found, using fallback method");
        // Fallback: construct URL based on user ID and filename
        const backendUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const fileUrl = `${backendUrl}/uploads/reports/${user?.uid}_${fileName}`;
        console.log("Fallback file URL:", fileUrl);
        window.open(fileUrl, "_blank");
      }
    } catch (error) {
      console.error("Error fetching archive details:", error);
      // Fallback: construct URL based on user ID and filename
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const fileUrl = `${backendUrl}/uploads/reports/${user?.uid}_${fileName}`;
      console.log("Error fallback file URL:", fileUrl);
      window.open(fileUrl, "_blank");
    }
  };

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "motivation":
        return <Target className="h-5 w-5 text-blue-500" />;
      case "methods":
        return <BookOpen className="h-5 w-5 text-green-500" />;
      case "results":
        return <TrendingUp className="h-5 w-5 text-purple-500" />;
      case "conclusion":
        return <Award className="h-5 w-5 text-orange-500" />;
      case "student_info":
        return <CheckCircle className="h-5 w-5 text-cyan-500" />;
      case "gratitude_expression":
        return <Award className="h-5 w-5 text-pink-500" />;
      case "mentioned_parties":
        return <BookOpen className="h-5 w-5 text-teal-500" />;
      case "contribution_description":
        return <TrendingUp className="h-5 w-5 text-amber-500" />;
      case "overall":
        return <Archive className="h-5 w-5 text-indigo-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeTitle = (type: string) => {
    switch (type.toLowerCase()) {
      case "motivation":
        return "Motivation / Problem Statement";
      case "methods":
        return "Methods / Procedure / Approach";
      case "results":
        return "Results / Findings / Product";
      case "conclusion":
        return "Conclusion / Implications";
      case "student_info":
        return "Student Information";
      case "gratitude_expression":
        return "Gratitude Expression";
      case "mentioned_parties":
        return "Mentioned Parties";
      case "contribution_description":
        return "Contribution Description";
      case "overall":
        return "Overall Evaluation";
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string, isLoading: boolean = false) => {
    if (isLoading) {
      return (
        <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1 animate-pulse">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading...
        </Badge>
      );
    }

    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-gray-100 text-gray-600 flex items-center gap-1">
            <Loader2 className="h-3 w-3" />
            Waiting...
          </Badge>
        );
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const renderAnalysisItems = (items: AnalysisItem[]) => {
    console.log("renderAnalysisItems called with:", items);
    console.log("Items length:", items?.length);
    console.log("Items type:", typeof items);

    if (!items || items.length === 0) {
      console.log("No items to render");
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-gray-400" />
            <span>No analysis</span>
          </div>
          <p className="text-sm text-gray-400">
            No analysis results were generated for this section.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {items.map((item, index) => {
          console.log(`Rendering item ${index}:`, item);
          return (
            <div key={index} className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                {getIcon(item.type)}
                <h3 className="text-lg font-semibold text-gray-900">
                  {getTypeTitle(item.type)}
                </h3>
              </div>
              <div className="p-3 rounded-lg border bg-gray-50">
                <p className="text-sm text-left text-gray-800 whitespace-pre-wrap">
                  {item.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderLoadingState = (section: "abstract" | "acknowledgement") => {
    const sectionTitle =
      section === "abstract" ? "Abstract" : "Acknowledgement";
    const sectionIcon = section === "abstract" ? BookOpen : Award;
    const sectionColor = section === "abstract" ? "blue" : "purple";

    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="p-4 bg-gray-100 rounded-full">
              {React.createElement(sectionIcon, {
                className: `h-8 w-8 text-${sectionColor}-600 animate-pulse`,
              })}
            </div>
            <div className="absolute -top-1 -right-1">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Analyzing {sectionTitle} Section...
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            AI is processing your {sectionTitle.toLowerCase()} content
          </p>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  const renderErrorState = (error: string) => {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">
            Analysis Failed
          </h3>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  };

  // Force immediate fetch when component mounts
  useEffect(() => {
    if (archiveId && archiveId !== 0) {
      console.log(
        "Component mounted, forcing immediate abstract fetch for archive:",
        archiveId
      );
      // Only fetch abstract initially, acknowledgement will start after abstract completes
      refetchAbstract();
    }
  }, [archiveId, refetchAbstract]);

  // Stop polling when analysis is completed
  useEffect(() => {
    if (abstractStatus === "completed" || abstractStatus === "failed") {
      setAbstractPolling(false);
      console.log("Abstract analysis finished, stopping polling");
    }
  }, [abstractStatus]);

  useEffect(() => {
    if (
      acknowledgementStatus === "completed" ||
      acknowledgementStatus === "failed"
    ) {
      setAcknowledgementPolling(false);
      console.log("Acknowledgement analysis finished, stopping polling");
    }
  }, [acknowledgementStatus]);

  // Start acknowledgement fetch immediately when component mounts
  useEffect(() => {
    if (archiveId && archiveId !== 0) {
      console.log(
        "Component mounted, starting acknowledgement fetch for archive:",
        archiveId
      );
      refetchAcknowledgement();
    }
  }, [archiveId, refetchAcknowledgement]);

  // Keep sections closed by default - users must manually open them
  // Removed auto-open behavior

  // Handle upload state (archiveId = 0) - don't show any loader cards
  if (archiveId === 0) {
    return null;
  }

  // Simple fallback to ensure component always renders something
  if (!archiveId) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Sequential Analysis Progress
          </h2>
          <p className="text-gray-600">No archive ID provided</p>
        </div>
      </div>
    );
  }

  // Show loading state when we have an archive ID but no data yet
  if (archiveId && archiveId !== 0 && !abstractData && !acknowledgementData) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-8">
        <div className="text-center py-12">
          <div className="flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Loading Analysis Data...
          </h2>
          <p className="text-gray-600">
            Fetching analysis results for archive ID: {archiveId}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      
      <div className="mb-4 flex gap-3">
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 w-10 hover:w-40 group transition-all duration-300 ease-in-out overflow-hidden group"
          >
            <ChevronLeft className="fixed group-hover:relative"/>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pb-1">
              Back to Upload
            </span>
             
          </Button>
        
      )}
      </div>
      <div className="my-9 flex items-center justify-between ">
        <div>
              <h1 className="font-inter font-semibold text-2xl">{fileName}</h1>
              <button className="border p-2 px-5 rounded-md mt-3 bg-blue-600 text-white shadow-md hover:bg-blue-700 transition">
                View Report {/* Need to add Functionality */}
              </button>
        </div>
        <div>
          <button className="border p-2 rounded-md mt-3 bg-red-100 hover:bg-red-200 transition flex items-center hover:scale-105">
            <Trash2 className="text-red-600"/> {/* Need to add Functionality */}
          </button>
            
        </div>
        
      </div>
     

      {/* Abstract Analysis Section */}
      <Card
        className={`mb-6 transition-opacity duration-300 rounded-lg ${
          abstractStatus === "completed" || abstractStatus === "processing"
            ? "opacity-100"
            : abstractStatus === "pending" || abstractLoading
            ? "opacity-30"
            : "opacity-50"
        }`}
      >
        <CardHeader
          className={`transition-colors select-none ${
            abstractStatus === "completed"
              ? "cursor-pointer hover:bg-gray-50 rounded-lg"
              : "cursor-not-allowed opacity-60"
          }`}
          onClick={(e) => {
            e.preventDefault();
            // Only allow opening if abstract is completed
            if (abstractStatus !== "completed") {
              return;
            }
            // Allow manual toggle only when completed
            setIsAbstractOpen(!isAbstractOpen);
          }}
        >
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Abstract Analysis
              {getStatusBadge(abstractStatus, abstractLoading)}
            </span>
            {isAbstractOpen ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </CardTitle>
        </CardHeader>

        {isAbstractOpen && (
          <CardContent>
            {abstractLoading && renderLoadingState("abstract")}
            {abstractError &&
              renderErrorState(
                abstractErrorDetails?.message || "Unknown error"
              )}
            {abstractErrorMsg && renderErrorState(abstractErrorMsg)}
            {(abstractStatus === "completed" ||
              abstractStatus === "processing") && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 mb-4">
                  <CheckCircle className="h-5 w-5 mt-2" />
                  <span className="font-medium mt-2">
                    {abstractStatus === "completed"
                      ? "Abstract Analysis Completed"
                      : "Abstract Analysis In Progress"}
                  </span>
                </div>
                {abstractResults.length > 0 ? (
                  renderAnalysisItems(abstractResults)
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <BookOpen className="h-5 w-5 text-gray-400" />
                      <span>No analysis</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      No analysis results were generated for this section.
                    </p>
                  </div>
                )}
              </div>
            )}
            {abstractStatus === "pending" && !abstractLoading && (
              <div className="text-center py-8 text-gray-500">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BookOpen className="h-5 w-5 text-gray-400" />
                  <span>Waiting for abstract analysis to start...</span>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Acknowledgement Analysis Section */}
      <Card
        className={`mb-6 rounded-lg transition-opacity duration-300 ${
          acknowledgementStatus === "completed" ||
          acknowledgementStatus === "processing"
            ? "opacity-100"
            : acknowledgementStatus === "pending" || acknowledgementLoading
            ? "opacity-30"
            : "opacity-50"
        }`}
      >
        <CardHeader
          className={`transition-colors select-none ${
            acknowledgementStatus === "completed"
              ? "cursor-pointer hover:bg-gray-50 rounded-lg"
              : "cursor-not-allowed opacity-60"
          }`}
          onClick={(e) => {
            e.preventDefault();
            // Only allow opening if acknowledgement is completed
            if (acknowledgementStatus !== "completed") {
              return;
            }
            // Allow manual toggle only when completed
            setIsAcknowledgementOpen(!isAcknowledgementOpen);
          }}
        >
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              Acknowledgement Analysis
              {getStatusBadge(acknowledgementStatus, acknowledgementLoading)}
            </span>
            {isAcknowledgementOpen ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </CardTitle>
        </CardHeader>

        {isAcknowledgementOpen && (
          <CardContent>
            {acknowledgementLoading && renderLoadingState("acknowledgement")}
            {acknowledgementError &&
              renderErrorState(
                acknowledgementErrorDetails?.message || "Unknown error"
              )}
            {acknowledgementErrorMsg &&
              renderErrorState(acknowledgementErrorMsg)}
            {(acknowledgementStatus === "completed" ||
              acknowledgementStatus === "processing") && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 mb-4">
                  <CheckCircle className="h-5 w-5 mt-2" />
                  <span className="font-medium mt-2">
                    {acknowledgementStatus === "completed"
                      ? "Acknowledgement Analysis Completed"
                      : "Acknowledgement Analysis In Progress"}
                  </span>
                </div>
                {acknowledgementResults.length > 0 ? (
                  renderAnalysisItems(acknowledgementResults)
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Award className="h-5 w-5 text-gray-400" />
                      <span>No analysis</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      No analysis results were generated for this section.
                    </p>
                  </div>
                )}
              </div>
            )}
            {acknowledgementStatus === "pending" && !acknowledgementLoading && (
              <div className="text-center py-8 text-gray-500">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
                  <span>Waiting for acknowledgement analysis to start...</span>
                </div>
                <p className="text-sm text-gray-400">
                  Acknowledgement analysis will start soon...
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
