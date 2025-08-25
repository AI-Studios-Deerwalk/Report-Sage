"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Loader2, UserPlus, Users, List, Trash2, X } from "lucide-react";

interface CreateAdminFormData {
  email: string;
  password: string;
  role: string;
}

interface AdminData {
  aid: number;
  email: string;
  created_at: string;
  is_superadmin: boolean;
  is_active: boolean;
}

function AdminList({ isInModal = false }: { isInModal?: boolean }) {
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminData | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${API_BASE_URL}/api/v1/admin/list`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      } else {
        setError('Failed to fetch admin list');
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      setError('An error occurred while fetching admin list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (adminId: number) => {
    const admin = admins.find(a => a.aid === adminId);
    if (admin) {
      setAdminToDelete(admin);
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = async () => {
    if (!adminToDelete) return;

    setDeletingId(adminToDelete.aid);
    try {
      const adminToken = localStorage.getItem('adminToken');
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${API_BASE_URL}/api/v1/admin/${adminToDelete.aid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Refresh admin list
        fetchAdmins();
        setShowDeleteModal(false);
        setAdminToDelete(null);
      } else {
        const errorData = await response.json();
        console.error('Failed to delete admin:', errorData);
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setAdminToDelete(null);
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

  if (isLoading) {
    if (isInModal) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          <span className="ml-2 text-slate-600">Loading admin list...</span>
        </div>
      );
    }
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <List className="h-5 w-5 text-purple-600" />
            <span>Admin List</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            <span className="ml-2 text-slate-600">Loading admin list...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    if (isInModal) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      );
    }
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <List className="h-5 w-5 text-purple-600" />
            <span>Admin List</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const adminListContent = (
    <>
      {admins.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-600">No admin accounts found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {admins.map((admin) => (
            <div
              key={admin.aid}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{admin.email}</p>
                    <p className="text-sm text-slate-600">
                      Created: {formatDate(admin.created_at)}
                    </p>
                  </div>
                                     <div className="text-right">
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                       admin.is_superadmin 
                         ? 'bg-red-100 text-red-800' 
                         : 'bg-blue-100 text-blue-800'
                     }`}>
                       {admin.is_superadmin ? 'Super Admin' : 'Admin'}
                     </span>
                   </div>
                </div>
              </div>
              {!admin.is_superadmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(admin.aid)}
                  disabled={deletingId === admin.aid}
                  className="ml-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {deletingId === admin.aid ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (isInModal) {
    return (
      <>
        {adminListContent}
        
        {/* Delete Confirmation Modal */}
        {showDeleteModal && adminToDelete && (
          <div className="fixed inset-0 flex items-center justify-center z-50 overflow-hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            
            {/* Modal */}
            <div className="relative bg-white rounded-xl p-8 w-full max-w-md mx-4 border border-gray-200 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Delete Admin Account</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="space-y-6">
                {/* Warning Message */}
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 border border-red-100">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="text-sm font-medium text-red-700">
                      Are you sure you want to delete this admin account?
                    </p>
                  </div>
                  <p className="text-xs text-red-600 mt-1">
                    This will permanently remove the admin account and all associated data.
                  </p>
                </div>
                
                {/* Admin Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <span className="text-sm text-gray-900">{adminToDelete.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Role:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        adminToDelete.is_superadmin 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {adminToDelete.is_superadmin ? 'Super Admin' : 'Admin'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Created:</span>
                      <span className="text-sm text-gray-900">{formatDate(adminToDelete.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={confirmDelete}
                    disabled={deletingId === adminToDelete.aid}
                    className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white h-12 font-medium"
                  >
                    {deletingId === adminToDelete.aid ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Admin
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={cancelDelete}
                    disabled={deletingId === adminToDelete.aid}
                    className="h-12 font-medium"
                  >
                    Cancel
                  </Button>
                </div>
                
                {/* Security Notice */}
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    ⚠️ This action requires super admin privileges and cannot be reversed
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <List className="h-5 w-5 text-purple-600" />
          <span>Admin List</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {adminListContent}
        
        {/* Delete Confirmation Modal */}
        {showDeleteModal && adminToDelete && (
          <div className="fixed inset-0 flex items-center justify-center z-50 overflow-hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            
            {/* Modal */}
            <div className="relative bg-white rounded-xl p-8 w-full max-w-md mx-4 border border-gray-200 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Delete Admin Account</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="space-y-6">
                {/* Warning Message */}
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 border border-red-100">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="text-sm font-medium text-red-700">
                      Are you sure you want to delete this admin account?
                    </p>
                  </div>
                  <p className="text-xs text-red-600 mt-1">
                    This will permanently remove the admin account and all associated data.
                  </p>
                </div>
                
                {/* Admin Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <span className="text-sm text-gray-900">{adminToDelete.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-red-800">Role:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        adminToDelete.is_superadmin 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {adminToDelete.is_superadmin ? 'Super Admin' : 'Admin'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Created:</span>
                      <span className="text-sm text-gray-900">{formatDate(adminToDelete.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={confirmDelete}
                    disabled={deletingId === adminToDelete.aid}
                    className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white h-12 font-medium"
                  >
                    {deletingId === adminToDelete.aid ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Admin
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={cancelDelete}
                    disabled={deletingId === adminToDelete.aid}
                    className="h-12 font-medium"
                  >
                    Cancel
                  </Button>
                </div>
                
                {/* Security Notice */}
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    ⚠️ This action requires super admin privileges and cannot be reversed
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CreateAdminForm() {
  const [formData, setFormData] = useState<CreateAdminFormData>({
    email: "",
    password: "",
    role: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showAdminListModal, setShowAdminListModal] = useState(false);


  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (showAdminListModal) {
      // Store current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [showAdminListModal]);



  const handleInputChange = (field: keyof CreateAdminFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const createAdmin = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const adminToken = localStorage.getItem('adminToken');
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${API_BASE_URL}/api/v1/admin/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({ 
          type: "success", 
          text: `Admin account created successfully! Email: ${result.email}, Role: ${result.is_superadmin ? 'Super Admin' : 'Admin'}` 
        });
        
        // Reset form
        setFormData({
          email: "",
          password: "",
          role: ""
        });
      } else {
        const errorData = await response.json();
        setMessage({ 
          type: "error", 
          text: errorData.detail || `Failed to create admin account. Status: ${response.status}` 
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ 
        type: "error", 
        text: "An unexpected error occurred. Please try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.role) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    await createAdmin();
  };



  return (
    <div className="space-y-6">
             {/* Header Section */}
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
           <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
             <UserPlus className="h-6 w-6 text-white" />
           </div>
           <div>
             <h1 className="text-2xl font-bold text-slate-900">Admin Config</h1>
             <p className="text-slate-600">Create new admin accounts with specified roles and permissions</p>
           </div>
         </div>
                   <Button
            onClick={() => setShowAdminListModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <List className="mr-2 h-4 w-4" />
            See All Admin Lists
          </Button>
       </div>

      {/* Super Admin Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          You are creating admin accounts as a Super Administrator. Only super admins can create new admin accounts.
        </AlertDescription>
      </Alert>

      {/* Main Form Card */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-green-600" />
            <span>Admin Account Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter secure password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  className="w-full"
                />
              </div>
            </div>

            {/* Role Field - Full Width */}
            <div className="space-y-2">
              <Label htmlFor="role">Admin Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
                required
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Select admin role" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Admin...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Create Admin Account
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Message Display */}
      {message && (
        <Alert className={message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

             {/* Information Card */}
       <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
         <CardHeader>
           <CardTitle className="flex items-center space-x-2">
             <Users className="h-5 w-5 text-blue-600" />
             <span>Role Information</span>
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="space-y-4">
             <div className="bg-white/60 rounded-lg p-4 border border-blue-100">
               <h4 className="font-semibold text-blue-900 mb-2">Admin Role</h4>
               <p className="text-sm text-blue-800">
                 Can manage users, view reports, and access basic admin functions. Limited system configuration access.
               </p>
             </div>
             <div className="bg-white/60 rounded-lg p-4 border border-blue-100">
               <h4 className="font-semibold text-blue-900 mb-2">Super Admin Role</h4>
               <p className="text-sm text-blue-800">
                 Has full system access including creating other admin accounts, system configuration, and all admin privileges.
               </p>
             </div>
           </div>
         </CardContent>
       </Card>



                                                                                                                               {/* Admin List Modal */}
           {showAdminListModal && (
             <div className="fixed inset-0 flex items-center justify-center z-50 overflow-hidden">
               <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto border-2 border-purple-200 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <List className="h-6 w-6 text-purple-600" />
                  <h3 className="text-xl font-semibold text-gray-900">Admin List</h3>
                </div>
                <button
                  onClick={() => setShowAdminListModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
                             <AdminList isInModal={true} />
             </div>
           </div>
         )}


      </div>
    );
  }
