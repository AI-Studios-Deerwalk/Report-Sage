import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { archiveAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
}

interface ArchiveListResponse {
  archives: Archive[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

const ArchivePage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [archives, setArchives] = useState<Archive[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [reanalyzingIds, setReanalyzingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchArchives();
  }, [isAuthenticated, router]);

  const fetchArchives = async (pageNum = 1, append = false, retryCount = 0) => {
    try {
      setLoading(!append);
      const response = await archiveAPI.getArchives({
        skip: (pageNum - 1) * 20,
        limit: 20,
      });

      const data: ArchiveListResponse = response.data;
      // Sort by created_at date (newest first)
      const sortByDateDesc = (list: Archive[]) =>
        [...list].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

      if (append) {
        setArchives((prev) => sortByDateDesc([...prev, ...data.archives]));
      } else {
        setArchives(sortByDateDesc(data.archives));
      }

      setTotalCount(data.total);
      setPage(pageNum);
      setHasMore(pageNum < data.total_pages);
    } catch (error: any) {
      console.error("Error fetching archives:", error);

      // Retry logic for timeout errors
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        if (retryCount < 2) {
          console.log(`Retrying archive fetch (attempt ${retryCount + 1})...`);
          setTimeout(() => {
            fetchArchives(pageNum, append, retryCount + 1);
          }, 2000 * (retryCount + 1)); // Exponential backoff
          return;
        }
      }

      toast({
        title: "Error",
        description:
          error.response?.data?.detail ||
          "Failed to fetch archives. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchArchives(page + 1, true);
    }
  };

  const handleDeleteArchive = async (archiveId: number) => {
    try {
      await archiveAPI.deleteArchive(archiveId);
      setArchives((prev) => prev.filter((archive) => archive.id !== archiveId));
      setTotalCount((prev) => prev - 1);
      toast({
        title: "Success",
        description: "Archive deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting archive:", error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete archive",
        variant: "destructive",
      });
    }
  };

  const handleReanalyze = async (archiveId: number) => {
    try {
      setReanalyzingIds((prev) => new Set(prev).add(archiveId));
      await archiveAPI.reanalyzeArchive(archiveId);

      // Update the archive status locally
      setArchives((prev) =>
        prev.map((archive) =>
          archive.id === archiveId
            ? {
                ...archive,
                processing_status: "processing",
                error_message: undefined,
              }
            : archive
        )
      );

      toast({
        title: "Reanalysis Started",
        description: "The document is being reanalyzed",
      });

      // Refresh archives after a delay to get updated status
      setTimeout(() => {
        fetchArchives();
      }, 2000);
    } catch (error: any) {
      console.error("Error reanalyzing archive:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to start reanalysis",
        variant: "destructive",
      });
    } finally {
      setReanalyzingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(archiveId);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Archive</h1>
            <p className="text-gray-600 mt-2">
              View and manage your uploaded documents and their analysis results
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Total documents: {totalCount}
            </div>
          </div>

          {loading && archives.length === 0 ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : archives.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No archives found
              </h3>
              <p className="text-gray-500 mb-4">
                You haven't uploaded any documents yet.
              </p>
              <Button
                className="border hover:bg-gray-200"
                onClick={() => router.push("/dashboard")}
              >
                Upload Your First Document
              </Button>
            </Card>
          ) : (
            <div className="space-y-4 ">
              <Accordion
                type="single"
                collapsible
                className="space-y-4"
                disabled
              >
                {archives.map((archive) => (
                  <AccordionItem key={archive.id} value={archive.id.toString()}>
                    <div
                      className="transform duration-200 hover:[scale:1.02] cursor-pointer"
                      onClick={() => {
                        router.push(`/archive/${archive.id}`);
                      }}
                    >
                      <Card>
                        {/* <AccordionTrigger className="[&>svg]:hidden px-4 py-2 hover:no-underline cursor-pointer"> */}
                        <CardHeader className="flex-1 pb-4">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(archive.processing_status)}
                              <div className="text-left">
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                  {archive.file_name}
                                </CardTitle>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(
                                      new Date(archive.created_at),
                                      "MMM dd, yyyy HH:mm"
                                    )}
                                  </div>
                                  <span>
                                    {formatFileSize(archive.file_size)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(archive.processing_status)}
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    </div>
                  </AccordionItem>
                ))}
              </Accordion>

              {hasMore && (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchivePage;
