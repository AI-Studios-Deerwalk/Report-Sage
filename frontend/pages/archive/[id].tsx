import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { archiveAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Trash2,
  RefreshCw,
  Download,
  Eye,
  Clock,
  XCircle,
  Loader2,
  ArrowLeft,
  File,
  HardDrive,
  User,
  CheckSquare,
  Square,
  Info
} from 'lucide-react';
import { format } from 'date-fns';

interface AnalysisItem {
  type: string;
  message: string;
  severity: string;
  category?: string;
  page_number?: number;
  section?: string;
}

interface Archive {
  id: number;
  file_name: string;
  file_path?: string;
  file_size?: number;
  processing_status: string;
  analysis_content?: string;
  suggestions: AnalysisItem[];
  warnings: AnalysisItem[];
  errors: AnalysisItem[];
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
  const [reanalyzing, setReanalyzing] = useState(false);
  const [showRawAnalysis, setShowRawAnalysis] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (id && typeof id === 'string') {
      fetchArchive(parseInt(id));
    }
  }, [isAuthenticated, id, router]);

  const fetchArchive = async (archiveId: number) => {
    try {
      setLoading(true);
      const response = await archiveAPI.getArchive(archiveId);
      setArchive(response.data);
    } catch (error: any) {
      console.error('Error fetching archive:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to fetch archive",
        variant: "destructive",
      });
      router.push('/archive');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArchive = async () => {
    if (!archive) return;
    
    try {
      await archiveAPI.deleteArchive(archive.id);
      toast({
        title: "Success",
        description: "Archive deleted successfully",
      });
      router.push('/archive');
    } catch (error: any) {
      console.error('Error deleting archive:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete archive",
        variant: "destructive",
      });
    }
  };

  const handleReanalyze = async () => {
    if (!archive) return;
    
    try {
      setReanalyzing(true);
      await archiveAPI.reanalyzeArchive(archive.id);
      
      // Update the archive status locally
      setArchive(prev => prev ? {
        ...prev,
        processing_status: 'processing',
        error_message: undefined
      } : null);

      toast({
        title: "Reanalysis Started",
        description: "The document is being reanalyzed",
      });

      // Refresh archive after a delay to get updated status
      setTimeout(() => {
        if (archive) {
          fetchArchive(archive.id);
        }
      }, 2000);
    } catch (error: any) {
      console.error('Error reanalyzing archive:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to start reanalysis",
        variant: "destructive",
      });
    } finally {
      setReanalyzing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      processing: { variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800' },
      pending: { variant: 'outline' as const, className: 'bg-yellow-100 text-yellow-800' },
      failed: { variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const renderAnalysisItems = (items: AnalysisItem[], title: string, icon: React.ReactNode, emptyMessage: string, color: string) => {
    if (!items || items.length === 0) {
      return (
        <Card className="border-l-4 border-l-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              {icon}
              <CardTitle className="text-lg">{title}</CardTitle>
              <Badge variant="outline" className="ml-auto">0</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 italic">{emptyMessage}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-l-4" style={{ borderLeftColor: color }}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant="outline" className="ml-auto">{items.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-start gap-3">
                {getSeverityIcon(item.severity)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-2">{item.message}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      {item.severity} severity
                    </Badge>
                    {item.category && (
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    )}
                    {item.page_number && (
                      <Badge variant="outline" className="text-xs">
                        Page {item.page_number}
                      </Badge>
                    )}
                    {item.section && (
                      <Badge variant="outline" className="text-xs">
                        {item.section}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Archive not found</h3>
              <p className="text-gray-500 mb-4">
                The archive you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button onClick={() => router.push('/archive')}>
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
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/archive')}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{archive.file_name}</h1>
                
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - File Details and Actions */}
            <div className="lg:col-span-1 space-y-6">
              {/* File Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <File className="h-5 w-5" />
                    File Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{archive.file_name}</span>
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
                      {format(new Date(archive.created_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  
                  
                </CardContent>
              </Card>

              

              {/* Actions Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 ">
                  {(archive.processing_status === 'failed' || archive.processing_status === 'completed') && (
                    <Button
                      variant="outline"
                      className="w-full hover:scale-105 transition-transform duration-100 group"
                      onClick={handleReanalyze}
                      disabled={reanalyzing}
                      
                    >
                      {reanalyzing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2 group-hover:animate-spin" />
                      )}
                      Reanalyze Document
                    </Button>
                  )}
                  
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
                    <AlertDialogContent className='bg-white'>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Archive</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{archive.file_name}"? This action cannot be undone.
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

            {/* Right Column - Analysis Results */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Messages */}
              {archive.processing_status === 'failed' && archive.error_message && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-red-800 mb-2">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">Processing Failed</span>
                    </div>
                    <p className="text-sm text-red-700">{archive.error_message}</p>
                  </CardContent>
                </Card>
              )}

              {archive.processing_status === 'processing' && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-blue-800 mb-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="font-medium">Analysis in Progress</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Your document is being analyzed. This may take a few minutes.
                    </p>
                  </CardContent>
                </Card>
              )}

              {archive.processing_status === 'pending' && (
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

              {/* Analysis Results */}
              {archive.processing_status === 'completed' && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRawAnalysis(!showRawAnalysis)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {showRawAnalysis ? 'Hide' : 'Show'} Raw Analysis
                    </Button>
                  </div>

                  {showRawAnalysis && archive.analysis_content && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Raw Analysis Content</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                          {archive.analysis_content}
                        </pre>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-6">
                    {renderAnalysisItems(
                      archive.errors || [],
                      "Errors",
                      <AlertTriangle className="h-5 w-5 text-red-600" />,
                      "No errors found in this document.",
                      "#ef4444"
                    )}

                    {renderAnalysisItems(
                      archive.warnings || [],
                      "Warnings",
                      <AlertCircle className="h-5 w-5 text-yellow-600" />,
                      "No warnings found in this document.",
                      "#eab308"
                    )}

                    {renderAnalysisItems(
                      archive.suggestions || [],
                      "Suggestions",
                      <CheckCircle className="h-5 w-5 text-blue-600" />,
                      "No suggestions available for this document.",
                      "#3b82f6"
                    )}
                  </div>
                </>
              )}

              {/* Summary Stats */}
              {archive.processing_status === 'completed' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {archive.errors?.length || 0}
                        </div>
                        <div className="text-sm text-red-600">Errors</div>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {archive.warnings?.length || 0}
                        </div>
                        <div className="text-sm text-yellow-600">Warnings</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {archive.suggestions?.length || 0}
                        </div>
                        <div className="text-sm text-blue-600">Suggestions</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualArchivePage;
