import Head from "next/head";
import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { userAPI } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar"
import { 
  AlertTriangle, 
  Upload,
  X,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

interface IssueFormData {
  title: string;
  description: string;
  image?: File;
}

export default function IssueReportPage() {
  const [formData, setFormData] = useState<IssueFormData>({
    title: "",
    description: ""
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { user } = useAuth();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size must be less than 2MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError("Please select a valid image file");
        return;
      }

      setFormData(prev => ({
        ...prev,
        image: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(""); // Clear any previous errors
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: undefined
    }));
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description.trim());
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      // Submit issue to API using FormData
      const response = await userAPI.submitIssue(formDataToSend);

      setSuccess("Issue reported successfully! We'll review it and get back to you soon.");
      
      // Reset form
      setFormData({
        title: "",
        description: ""
      });
      setImagePreview(null);
      
      // Show success message for longer and provide better feedback
      setTimeout(() => {
        setSuccess("Redirecting to dashboard...");
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }, 3000);

    } catch (error: any) {
      console.error('Error submitting issue:', error);
      console.error('Error response:', error.response);
      console.error('Error request:', error.request);
      console.error('Error message:', error.message);
      
      // Handle different types of error responses
      let errorMessage = 'Failed to submit issue. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        if (error.response.data && error.response.data.detail) {
          // Handle validation errors (422) which come as an array
          if (Array.isArray(error.response.data.detail)) {
            errorMessage = error.response.data.detail.map((err: any) => err.msg).join(', ');
          } else {
            errorMessage = error.response.data.detail;
          }
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid data provided. Please check your input.';
        } else if (error.response.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (error.response.status === 422) {
          errorMessage = 'Validation error. Please check your input and try again.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        // Other error
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Report an Issue - Academia</title>
      </Head>
      
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="min-h-screen relative overflow-hidden bg-white flex items-center justify-center p-4">
            {/* Animated floating geometric shapes - same as FAQ page */}
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
            `}</style>

            {/* Main content container */}
            <div className="w-full max-w-4xl z-10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4 pt-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full">
                    <AlertTriangle className="h-8 w-8 text-emerald-600" />
                  </div>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Report an Issue
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
                  Found a bug or have a suggestion? Let us know and we'll help you out.
                </p>
              </div>

                             {/* Issue Form */}
               <Card className="bg-white shadow-md border border-gray-200 rounded-2xl overflow-hidden">
                 {success && (
                   <div className="bg-green-50 border-b border-green-200 p-4">
                     <div className="flex items-center justify-center gap-3">
                       <CheckCircle className="h-6 w-6 text-green-600" />
                       <div className="text-center">
                         <h3 className="text-lg font-semibold text-green-800">Issue Successfully Submitted!</h3>
                         <p className="text-sm text-green-700">Thank you for your feedback. We'll review it and get back to you soon.</p>
                       </div>
                     </div>
                   </div>
                 )}
                 <CardHeader className="bg-gray-50 border-b border-gray-200">
                   <CardTitle className="flex items-center gap-2 text-gray-900">
                     <AlertTriangle className="h-5 w-5 text-emerald-500" />
                     Issue Details
                   </CardTitle>
                 </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Issue Title *
                      </label>
                      <Input
                        id="title"
                        name="title"
                        type="text"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Brief description of the issue"
                        className="w-full border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Detailed Description *
                      </label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Please provide detailed information about the issue, including steps to reproduce if applicable..."
                        rows={5}
                        className="w-full border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Screenshot (Optional)
                      </label>
                      <div className="space-y-3">
                        {!imagePreview ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors bg-gray-50/50">
                            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 mb-2">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, GIF up to 2MB
                            </p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                              id="image-upload"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('image-upload')?.click()}
                              className="mt-2 border-gray-300 hover:border-gray-400"
                            >
                              Choose File
                            </Button>
                          </div>
                        ) : (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-48 object-cover rounded-lg border shadow-md"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={removeImage}
                              className="absolute top-2 right-2 h-8 w-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Alerts */}
                    {error && (
                      <Alert variant="destructive" className="border-orange-200 bg-orange-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    {success && (
                      <Alert className="border-green-200 bg-green-50 border-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <AlertDescription className="text-green-800 font-medium">
                          {success}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Submit Button */}
                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        disabled={isSubmitting || !!success}
                        className={`flex-1 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 ${
                          success 
                            ? 'bg-gradient-to-r from-green-600 to-green-700 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800'
                        } text-white`}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : success ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Issue Submitted!
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Submit Issue
                          </>
                        )}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/dashboard')}
                        disabled={isSubmitting}
                        className="border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Help Information */}
              <Card className="mt-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-0 rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-600">
                      <strong>Be specific:</strong> Include steps to reproduce the issue and any error messages you see.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-600">
                      <strong>Add context:</strong> Screenshots help us understand the issue better.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-600">
                      <strong>Check FAQs first:</strong> Your question might already be answered in our FAQ section.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact section */}
              <Card className="mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 border-0 rounded-2xl shadow-sm">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Still need assistance?</h3>
                  <p className="text-gray-600 mb-4">Can't find what you're looking for? We're here to help you get back on track.</p>
                  <Button 
                    onClick={() => router.push('/faqs')}
                    className="bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Check FAQs
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
