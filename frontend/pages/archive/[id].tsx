import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { archiveAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Calendar,
  Trash2,
  RefreshCw,
  Clock,
  XCircle,
  Loader2,
  ArrowLeft,
  File,
  HardDrive,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";

interface Archive {
  id: number;
  file_name: string;
  file_path?: string;
  file_size?: number;
  processing_status: string;
  error_message?: string;
  created_at: string;
  updated_at?: string;
  user_id: number;
}

const IndividualArchivePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [archive, setArchive] = useState<Archive | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (id && typeof id === "string") {
      fetchArchive(parseInt(id));
    }
  }, [isAuthenticated, id, router]);

  const fetchArchive = async (archiveId: number) => {
    try {
      setLoading(true);
      const response = await archiveAPI.getArchive(archiveId);
      setArchive(response.data);
    } catch (error: any) {
      console.error("Error fetching archive:", error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to fetch archive",
        variant: "destructive",
      });
      router.push("/archive");
    } finally {
      setLoading(false);
    }
  };

  // Redirect to sequential analysis page when archive is loaded
  useEffect(() => {
    if (archive && id) {
      router.push(
        `/sequential-analysis?archive_id=${id}&file_name=${encodeURIComponent(
          archive.file_name
        )}`
      );
    }
  }, [archive, id, router]);

  const handleDeleteArchive = async () => {
    if (!archive) return;

    try {
      await archiveAPI.deleteArchive(archive.id);
      toast({
        title: "Success",
        description: "Archive deleted successfully",
      });
      router.push("/archive");
    } catch (error: any) {
      console.error("Error deleting archive:", error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete archive",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "processing":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: {
        variant: "default" as const,
        className: "bg-green-100 text-green-800",
      },
      processing: {
        variant: "secondary" as const,
        className: "bg-blue-100 text-blue-800",
      },
      pending: {
        variant: "outline" as const,
        className: "bg-yellow-100 text-yellow-800",
      },
      failed: {
        variant: "destructive" as const,
        className: "bg-red-100 text-red-800",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-6">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!archive) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <div className="flex-1 p-6 overflow-y-auto">
            <Card className="p-8 text-center">
              <FileText className="h-16 w-16 mx-auto text-gray-400 mb-2" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Archive not found
              </h3>
              <p className="text-gray-500 mb-4">
                The archive you're looking for doesn't exist or you don't have
                access to it.
              </p>
              <Button onClick={() => router.push("/archive")}>
                Back to Archives
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/archive")}
                className="p-2 hover:scale-110 transition-transform duration-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {archive.file_name}
                </h1>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
            {/* Redirecting to sequential analysis page */}
            <div className="lg:col-span-2 space-y-6 h-full flex flex-col">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Redirecting to Analysis...
                  </h3>
                  <p className="text-sm text-gray-500">
                    Taking you to the detailed analysis view
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - File Information */}
            <div className="lg:col-span-1 space-y-6 h-full flex flex-col">
              {/* File Information Card */}
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <File className="h-5 w-5" />
                    File Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {archive.file_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <HardDrive className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {formatFileSize(archive.file_size)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {format(
                        new Date(archive.created_at),
                        "MMM dd, yyyy HH:mm"
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 text-gray-400 flex items-center justify-center">
                      {getStatusIcon(archive.processing_status)}
                    </div>
                    <span className="text-sm text-gray-600">
                      Status: {archive.processing_status}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Status Messages */}
              {archive.processing_status === "failed" &&
                archive.error_message && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-red-800 mb-2">
                        <XCircle className="h-5 w-5" />
                        <span className="font-medium">Processing Failed</span>
                      </div>
                      <p className="text-sm text-red-700">
                        {archive.error_message}
                      </p>
                    </CardContent>
                  </Card>
                )}

              {archive.processing_status === "processing" && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-blue-800 mb-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="font-medium">Analysis in Progress</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Your document is being analyzed. This may take a few
                      minutes.
                    </p>
                  </CardContent>
                </Card>
              )}

              {archive.processing_status === "pending" && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-yellow-800 mb-2">
                      <Clock className="h-5 w-5" />
                      <span className="font-medium">Waiting for Analysis</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      Your document is queued for analysis.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Delete Button */}
              <Card>
                <CardContent className="pt-6">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full text-red-600 hover:text-red-700 hover:scale-105 transition-transform duration-100"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Archive
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Archive</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{archive.file_name}"?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteArchive}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualArchivePage;
