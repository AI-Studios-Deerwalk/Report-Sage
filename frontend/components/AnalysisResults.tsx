import React, { useState } from "react";
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
  Eye,
} from "lucide-react";
import { useRouter } from "next/router";
import { useToast } from "@/hooks/use-toast";

interface AnalysisItem {
  type: string;
  message: string;
  page_number?: number;
}

interface AnalysisResultsProps {
  results: {
    analysis_results: AnalysisItem[];
    summary_data?: {
      summary: {
        total_sections: number;
        present: number;
        partially_present: number;
        missing: number;
        score: number;
        quality: string;
      };
    };
    file_name: string;
    archive_id?: number;
  };
  onBack?: () => void;
}

export function AnalysisResults({ results, onBack }: AnalysisResultsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isAbstractOpen, setIsAbstractOpen] = useState(false);
  const [isAcknowledgementOpen, setIsAcknowledgementOpen] = useState(false);

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
      console.log(
        "Starting handleViewReport with archive_id:",
        results.archive_id
      );

      if (results.archive_id) {
        // Get the archive details to get the actual file path
        const { archiveAPI } = await import("@/lib/api");
        const archiveResponse = await archiveAPI.getArchive(results.archive_id);
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
          // Fallback: construct URL based on archive ID and filename
          const backendUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          const fileUrl = `${backendUrl}/uploads/reports/${results.archive_id}_${results.file_name}`;
          console.log("Fallback file URL:", fileUrl);
          window.open(fileUrl, "_blank");
        }
      } else {
        console.log("No archive ID available");
        // No archive ID available, show error
        toast({
          title: "Error",
          description: "Cannot view report: Archive ID not available",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching archive details:", error);
      // Fallback: construct URL based on archive ID and filename
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const fileUrl = `${backendUrl}/uploads/reports/${results.archive_id}_${results.file_name}`;
      console.log("Error fallback file URL:", fileUrl);
      window.open(fileUrl, "_blank");
    }
  };

  const handleViewArchives = () => {
    router.push("/archive");
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

  // Separate analysis items into abstract and acknowledgement sections
  const getAbstractItems = (items: AnalysisItem[]) => {
    return items.filter((item) =>
      ["motivation", "methods", "results", "conclusion"].includes(
        item.type.toLowerCase()
      )
    );
  };

  const getAcknowledgementItems = (items: AnalysisItem[]) => {
    return items.filter((item) =>
      [
        "student_info",
        "gratitude_expression",
        "mentioned_parties",
        "contribution_description",
      ].includes(item.type.toLowerCase())
    );
  };

  const renderAnalysisItems = (items: AnalysisItem[]) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-6">
        {items.map((item, index) => (
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
        ))}
      </div>
    );
  };

  const summary = results.summary_data?.summary;

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="mb-4 flex gap-3">
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            ← Back to Upload
          </Button>
        )}
        <Button
          onClick={handleViewReport}
          variant="default"
          size="sm"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Eye className="h-4 w-4" />
          View Report
        </Button>
      </div>

      <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Analysis Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Analysis completed for: <strong>{results.file_name}</strong>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Both Abstract and Acknowledgement sections have been analyzed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Abstract Analysis Section */}
      <Card className="mb-6">
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 transition-colors select-none"
          onClick={(e) => {
            e.preventDefault();
            setIsAbstractOpen(!isAbstractOpen);
          }}
        >
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Abstract Analysis
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
            {/* Abstract Analysis Results */}
            {renderAnalysisItems(getAbstractItems(results.analysis_results))}

            {/* No Abstract Analysis Results */}
            {getAbstractItems(results.analysis_results).length === 0 && (
              <Card className="bg-yellow-50">
                <CardContent className="text-center py-8">
                  <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    No Abstract Analysis Results Available
                  </h3>
                  <p className="text-sm text-yellow-600">
                    The abstract analysis could not be completed. Please try
                    uploading the document again.
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        )}
      </Card>

      {/* Acknowledgement Analysis Section */}
      <Card className="mb-6">
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 transition-colors select-none"
          onClick={(e) => {
            e.preventDefault();
            setIsAcknowledgementOpen(!isAcknowledgementOpen);
          }}
        >
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              Acknowledgement Analysis
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
            {/* Acknowledgement Analysis Results */}
            {renderAnalysisItems(
              getAcknowledgementItems(results.analysis_results)
            )}

            {/* No Acknowledgement Analysis Results */}
            {getAcknowledgementItems(results.analysis_results).length === 0 && (
              <Card className="bg-yellow-50">
                <CardContent className="text-center py-8">
                  <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    No Acknowledgement Analysis Results Available
                  </h3>
                  <p className="text-sm text-yellow-600">
                    The acknowledgement analysis could not be completed. Please
                    try uploading the document again.
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
