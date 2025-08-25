import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/AdminLayout";
import { adminAPI } from "../../lib/api";
import { 
  AlertTriangle, 
  Search,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Calendar,
  User,
  Image as ImageIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

interface Issue {
  issue_id: string
  title: string
  description: string
  image?: string
  status: "pending" | "inprogress" | "resolved" | "closed"
  created_at: string
  user_id: number
  is_read: boolean
  user?: {
    uid: number
    fname: string
    lname: string
    email: string
  }
}

interface IssueStats {
  total: number
  pending: number
  inprogress: number
  resolved: number
  closed: number
}

export default function AdminIssuesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [issues, setIssues] = useState<Issue[]>([])
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>("")
  const [issueStats, setIssueStats] = useState<IssueStats>({
    total: 0,
    pending: 0,
    inprogress: 0,
    resolved: 0,
    closed: 0
  })
  const router = useRouter();

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (!adminToken || !adminData) {
      router.push('/admin/login');
      return;
    }

    // Load issues from API
    loadIssues();
  }, []);

  useEffect(() => {
    // Filter issues based on search term and status
    let filtered = issues
    
    if (searchTerm) {
      filtered = filtered.filter(issue => 
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(issue => issue.status === statusFilter)
    }
    
    // Sort issues by creation date (newest first)
    filtered = filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    setFilteredIssues(filtered)
  }, [issues, searchTerm, statusFilter])

  const loadIssues = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getIssues({ limit: 100 });
      const issuesData = response.data;
      setIssues(issuesData);
      
      // Calculate stats
      const stats = {
        total: issuesData.length,
        pending: issuesData.filter((issue: Issue) => issue.status === 'pending').length,
        inprogress: issuesData.filter((issue: Issue) => issue.status === 'inprogress').length,
        resolved: issuesData.filter((issue: Issue) => issue.status === 'resolved').length,
        closed: issuesData.filter((issue: Issue) => issue.status === 'closed').length
      };
      setIssueStats(stats);
      
    } catch (error: any) {
      console.error('Error loading issues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (issueId: string, newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      await adminAPI.updateIssueStatus(issueId, { status: newStatus });
      
      // Update the issue in the local state
      setIssues(prevIssues => 
        prevIssues.map(issue => 
          issue.issue_id === issueId 
            ? { ...issue, status: newStatus as any }
            : issue
        )
      );
      
      // Refresh the sidebar unread count
      if (typeof window !== 'undefined' && (window as any).refreshAdminSidebarUnreadCount) {
        (window as any).refreshAdminSidebarUnreadCount();
      }
      
    } catch (error: any) {
      console.error('Error updating issue status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const markIssueAsRead = async (issueId: string) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${API_BASE_URL}/api/v1/issue/markAsRead/${issueId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (response.ok) {
        // Update the issue in the local state
        setIssues(prevIssues => 
          prevIssues.map(issue => 
            issue.issue_id === issueId 
              ? { ...issue, is_read: true }
              : issue
          )
        );
        
        // Refresh the sidebar unread count
        if (typeof window !== 'undefined' && (window as any).refreshAdminSidebarUnreadCount) {
          (window as any).refreshAdminSidebarUnreadCount();
        }
      } else {
        console.error('Failed to mark issue as read:', response.status);
      }
    } catch (error: any) {
      console.error('Error marking issue as read:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        variant: "secondary" as const, 
        icon: <Clock className="h-3 w-3" />,
        className: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200"
      },
      inprogress: { 
        variant: "default" as const, 
        icon: <Loader2 className="h-3 w-3" />,
        className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200"
      },
      resolved: { 
        variant: "default" as const, 
        icon: <CheckCircle className="h-3 w-3" />,
        className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
      },
      closed: { 
        variant: "secondary" as const, 
        icon: <XCircle className="h-3 w-3" />,
        className: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200"
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className}`}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getUnreadCount = () => {
    return issues.filter(issue => !issue.is_read).length;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsViewDialogOpen(true);
    markIssueAsRead(issue.issue_id); // Mark as read when viewing
  };

  const handleViewImage = (imageUrl: string) => {
    const fullImageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${imageUrl}`;
    setSelectedImage(fullImageUrl);
    setIsImageViewerOpen(true);
  };

  if (isLoading) {
    return (
      <AdminLayout currentPage="issues">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Issue Reports - Admin Dashboard</title>
      </Head>
      
      <AdminLayout currentPage="issues">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Issue Reports</h1>
              <p className="text-gray-600 mt-1">Manage and track user-reported issues</p>
              {getUnreadCount() > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-600 font-medium">
                    {getUnreadCount()} unread issue{getUnreadCount() !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
            <Button onClick={loadIssues} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
           
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Unread</p>
                    <p className="text-2xl font-bold text-blue-600">{getUnreadCount()}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{issueStats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{issueStats.inprogress}</p>
                  </div>
                  <Loader2 className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Resolved</p>
                    <p className="text-2xl font-bold text-green-600">{issueStats.resolved}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Closed</p>
                    <p className="text-2xl font-bold text-gray-600">{issueStats.closed}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search issues..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                                 <div className="w-full sm:w-48">
                   <Select value={statusFilter} onValueChange={setStatusFilter}>
                     <SelectTrigger className="bg-white">
                       <SelectValue placeholder="Filter by status" />
                     </SelectTrigger>
                     <SelectContent className="bg-white">
                       <SelectItem value="all">All Status</SelectItem>
                       <SelectItem value="pending">Pending</SelectItem>
                       <SelectItem value="inprogress">In Progress</SelectItem>
                       <SelectItem value="resolved">Resolved</SelectItem>
                       <SelectItem value="closed">Closed</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
              </div>
            </CardContent>
          </Card>



                     {/* Issues List */}
           <Card>
             <CardHeader>
               <div className="flex items-center justify-between">
                 <CardTitle>Issues ({filteredIssues.length})</CardTitle>
                 <div className="flex items-center gap-4 text-xs text-gray-600">
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                     <span>Unread</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                     <span>Read</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full"></span>
                     <span>Pending</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="inline-block w-3 h-3 bg-blue-500 rounded-full"></span>
                     <span>In Progress</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                     <span>Resolved</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="inline-block w-3 h-3 bg-gray-500 rounded-full"></span>
                     <span>Closed</span>
                   </div>
                 </div>
               </div>
             </CardHeader>
            <CardContent>
              {filteredIssues.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No issues found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredIssues.map((issue) => (
                    <div key={issue.issue_id} className={`border-l-4 rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                      issue.status === 'pending' ? 'border-l-yellow-500' :
                      issue.status === 'inprogress' ? 'border-l-blue-500' :
                      issue.status === 'resolved' ? 'border-l-green-500' :
                      'border-l-gray-500'
                    } ${
                      issue.is_read 
                        ? 'bg-gray-50/50' // Light gray background for read issues
                        : 'bg-blue-50/70' // Light blue background for unread issues
                    }`}>
                       <div className="flex items-start justify-between">
                         <div className="flex-1">
                           <div className="flex items-center gap-3 mb-2">
                             <div className="flex items-center gap-2">
                               {!issue.is_read ? (
                                 <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                               ) : (
                                 <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                               )}
                               <h3 className="font-semibold text-gray-900">{issue.title}</h3>
                             </div>
                             <div className="flex items-center gap-2">
                               {getStatusBadge(issue.status)}
                             </div>
                           </div>
                          
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {issue.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(issue.created_at)}
                            </div>
                                                         <div className="flex items-center gap-1">
                               <User className="h-3 w-3" />
                               {issue.user ? (
                                 `${issue.user.fname} ${issue.user.lname}`
                               ) : (
                                 `User #${issue.user_id}`
                               )}
                             </div>
                                                         {issue.image && (
                               <div className="flex items-center gap-1">
                                 <ImageIcon className="h-3 w-3" />
                                 <img 
                                   src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${issue.image}`}
                                   alt="Issue thumbnail"
                                   className="w-6 h-6 object-cover rounded border"
                                   onError={(e) => {
                                     e.currentTarget.style.display = 'none';
                                   }}
                                 />
                               </div>
                             )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewIssue(issue)}
                            className="bg-white"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          
                          <Select
                            value={issue.status}
                            onValueChange={(value) => handleStatusUpdate(issue.issue_id, value)}
                            disabled={isUpdatingStatus}
                          >
                            <SelectTrigger className="w-32 bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="inprogress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

                 {/* View Issue Dialog */}
         <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
           <DialogContent className="max-w-2xl bg-white border border-gray-200 shadow-lg rounded-lg">
             <DialogHeader className="bg-gray-50 px-3 py-2 border-b border-gray-200">
               <div className="flex items-center justify-between">
                 <DialogTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                   <AlertTriangle className="h-4 w-4 text-blue-600" />
                   Issue Details
                 </DialogTitle>
                 {selectedIssue && (
                   <div className="flex items-center gap-2">
                     {getStatusBadge(selectedIssue.status)}
                     {!selectedIssue.is_read && (
                       <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                         <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-1"></div>
                         Unread
                       </Badge>
                     )}
                   </div>
                 )}
               </div>
             </DialogHeader>
             
             {selectedIssue && (
               <div className="p-6 space-y-4">
                 {/* Title */}
                 <h3 className="font-semibold text-lg text-gray-900">{selectedIssue.title}</h3>
                 
                 {/* Description */}
                 <p className="text-gray-700">{selectedIssue.description}</p>
                 
                 {/* Image - Only show if image exists */}
                 {selectedIssue.image && (
                   <div 
                     className="cursor-pointer group"
                     onClick={() => handleViewImage(selectedIssue.image!)}
                   >
                     <div className="flex items-center gap-2 text-sm text-blue-600 mb-2 group-hover:text-blue-800 transition-colors">
                       <ImageIcon className="h-4 w-4" />
                       View Image
                     </div>
                     <div>
                       <img 
                         src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${selectedIssue.image}`}
                         alt="Issue attachment"
                         className="max-w-full h-auto rounded border border-gray-200 group-hover:border-blue-400 group-hover:shadow-md transition-all duration-200"
                         onError={(e) => {
                           e.currentTarget.style.display = 'none';
                         }}
                       />
                     </div>
                   </div>
                 )}
               </div>
             )}
             
             <DialogFooter className="bg-gray-50 px-3 py-2 border-t border-gray-200">
               <Button 
                 variant="outline" 
                 onClick={() => setIsViewDialogOpen(false)}
                 size="sm"
                 className="px-3 py-1 text-sm"
               >
                 Close
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>

          {/* Image Viewer Modal */}
          <Dialog open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] bg-black border-0 p-0 overflow-hidden">
              <DialogHeader className="bg-black px-4 py-3 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-white text-lg font-semibold flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-blue-400" />
                    Image Viewer
                  </DialogTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsImageViewerOpen(false)}
                    className="text-white hover:bg-gray-800"
                  >
                    ✕
                  </Button>
                </div>
              </DialogHeader>
              
                             <div className="flex items-center justify-center p-4 bg-black">
                 <img 
                   src={selectedImage} 
                   alt="Full size image"
                   className="max-w-full max-h-[70vh] object-contain rounded cursor-pointer hover:opacity-90 transition-opacity"
                   onClick={() => window.open(selectedImage, '_blank')}
                   onError={(e) => {
                     e.currentTarget.style.display = 'none';
                   }}
                 />
               </div>
              
              <DialogFooter className="bg-black px-4 py-3 border-t border-gray-800">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(selectedImage, '_blank')}
                    className="text-white border-gray-600 hover:bg-gray-800"
                  >
                    Open in New Tab
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsImageViewerOpen(false)}
                    className="text-white border-gray-600 hover:bg-gray-800"
                  >
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </AdminLayout>
      </>
    );
  }
