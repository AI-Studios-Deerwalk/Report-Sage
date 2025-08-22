import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/AdminLayout";
import { adminAPI } from "../../lib/api";
import { 
  HelpCircle, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  ListOrdered,
  GripVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion, Reorder } from "framer-motion"

interface FAQ {
  fid: number
  question: string
  answer: string
  priority: string | null
  created_at: string
  updated_at: string | null
}

interface FAQFormData {
  question: string
  answer: string
}

// Initial empty state for FAQs
const initialFAQs: FAQ[] = []

export default function AdminFAQsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [faqs, setFaqs] = useState<FAQ[]>(initialFAQs)
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>(initialFAQs)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPriorityDialogOpen, setIsPriorityDialogOpen] = useState(false)
  const [isSavingPriority, setIsSavingPriority] = useState(false)
  const [priorityOrderChanged, setPriorityOrderChanged] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [formData, setFormData] = useState<FAQFormData>({
    question: "",
    answer: ""
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

    // Load FAQs from API
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getFaqs({ page: 1, page_size: 100 });
      const faqsData = response.data.items || response.data;
      setFaqs(faqsData);
      setFilteredFaqs(faqsData);
    } catch (err: any) {
      console.error('Error loading FAQs:', err);
      setError(err.response?.data?.detail || 'Failed to load FAQs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Filter FAQs based on search term
    let filtered = faqs
    
    if (searchTerm) {
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredFaqs(filtered)
  }, [searchTerm, faqs])

  const handleAddFAQ = async () => {
    try {
      const response = await adminAPI.createFaq({
        question: formData.question,
        answer: formData.answer
      });
      
      const newFAQ = response.data;
      setFaqs(prev => [...prev, newFAQ])
      setFormData({ question: "", answer: "" })
      setIsAddDialogOpen(false)
      setSuccess('FAQ added successfully')
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      console.error('Error adding FAQ:', err);
      setError(err.response?.data?.detail || 'Failed to add FAQ');
    }
  }

  const handleEditFAQ = async () => {
    if (!editingFaq) return

    try {
             const response = await adminAPI.updateFaq(editingFaq.fid, {
        question: formData.question,
        answer: formData.answer
      });
      
      const updatedFAQ = response.data;
      setFaqs(prev => prev.map(faq => faq.fid === editingFaq.fid ? updatedFAQ : faq))
      setFormData({ question: "", answer: "" })
      setEditingFaq(null)
      setIsEditDialogOpen(false)
      setSuccess('FAQ updated successfully')
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      console.error('Error updating FAQ:', err);
      setError(err.response?.data?.detail || 'Failed to update FAQ');
    }
  }

  const handleDeleteFAQ = async (faqId: number) => {
    try {
      await adminAPI.deleteFaq(faqId);
      setFaqs(prev => prev.filter(faq => faq.fid !== faqId))
      setSuccess('FAQ deleted successfully')
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      console.error('Error deleting FAQ:', err);
      setError(err.response?.data?.detail || 'Failed to delete FAQ');
    }
  }

  const openEditDialog = (faq: FAQ) => {
    setEditingFaq(faq)
    setFormData({
      question: faq.question,
      answer: faq.answer
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({ question: "", answer: "" })
    setEditingFaq(null)
  }

  const openPriorityDialog = () => {
    setPriorityOrderChanged(false) // Reset change flag when opening dialog
    setIsPriorityDialogOpen(true)
  }

  const handlePriorityReorder = (newOrder: FAQ[]) => {
    // Update priorities based on new order
    const updatedFaqs = newOrder.map((faq, index) => ({
      ...faq,
      priority: (index + 1).toString()
    }))
    
    setFaqs(updatedFaqs)
    setFilteredFaqs(updatedFaqs) // Also update filtered FAQs to reflect the new order
    setPriorityOrderChanged(true) // Mark that the order has changed
  }

  const savePriorityOrder = async () => {
    try {
      setIsSavingPriority(true)
      setError("") // Clear any previous errors
      
      // Update priorities for each FAQ
      const updatePromises = faqs.map((faq, index) => 
        adminAPI.updateFaq(faq.fid, { priority: (index + 1).toString() })
      );
      
      await Promise.all(updatePromises);
      setIsPriorityDialogOpen(false)
      setPriorityOrderChanged(false) // Reset the change flag
      setSuccess('FAQ priorities updated successfully')
      setTimeout(() => setSuccess(""), 3000)
      
      // Reload FAQs to ensure we have the latest data from the server
      await loadFAQs()
    } catch (err: any) {
      console.error('Error updating priorities:', err);
      setError(err.response?.data?.detail || 'Failed to update priorities. Please try again.')
    } finally {
      setIsSavingPriority(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading FAQ management...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>FAQ Management - DWIT Academia</title>
        <meta name="description" content="FAQ management for DWIT Academia" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <AdminLayout currentPage="faqs" key={router.asPath}>
        <div className="space-y-6">
          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <HelpCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">FAQ Management</h1>
                <p className="text-slate-600">Manage frequently asked questions and help content</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
                             <Dialog open={isPriorityDialogOpen} onOpenChange={setIsPriorityDialogOpen}>
                 <DialogTrigger asChild>
                   <Button 
                     variant="outline"
                     className="border-slate-300 hover:bg-slate-50 text-slate-700"
                     onClick={openPriorityDialog}
                   >
                     <ListOrdered className="h-4 w-4 mr-2" />
                     Manage Priority
                   </Button>
                 </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto bg-white">
                  <DialogHeader className="pb-4">
                    <DialogTitle className="text-xl font-semibold">Manage FAQ Priority</DialogTitle>
                    <DialogDescription className="text-slate-600">
                      Drag and drop FAQs to reorder their priority. The top FAQ will appear first.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Reorder.Group 
                      axis="y" 
                      values={faqs} 
                      onReorder={handlePriorityReorder}
                      className="space-y-2"
                    >
                      {faqs.map((faq) => (
                                                 <Reorder.Item
                           key={faq.fid}
                           value={faq}
                          className="border border-slate-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow cursor-move"
                        >
                          <motion.div
                            layout
                            className="flex items-center space-x-3"
                          >
                            <div className="flex-shrink-0">
                              <GripVertical className="h-5 w-5 text-slate-400" />
                            </div>
                            <div className="flex-1">
                                                             <div className="flex items-center space-x-2 mb-1">
                                 <h3 className="font-semibold text-slate-900 text-sm">{faq.question}</h3>
                               </div>
                              <p className="text-slate-600 text-xs line-clamp-2">{faq.answer}</p>
                            </div>
                          </motion.div>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button variant="outline" onClick={() => setIsPriorityDialogOpen(false)} className="h-9">
                      Cancel
                    </Button>
                                         <Button 
                       onClick={savePriorityOrder}
                       disabled={isSavingPriority || !priorityOrderChanged}
                       className={`h-9 ${
                         priorityOrderChanged 
                           ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white" 
                           : "bg-gray-300 text-gray-500 cursor-not-allowed"
                       }`}
                     >
                       {isSavingPriority ? (
                         <>
                           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                           Saving...
                         </>
                       ) : (
                         <>
                           <Save className="h-4 w-4 mr-2" />
                           Save Priority Order
                         </>
                       )}
                     </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add FAQ
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto bg-white">
                  <DialogHeader className="pb-4">
                    <DialogTitle className="text-xl font-semibold">Add New FAQ</DialogTitle>
                    <DialogDescription className="text-slate-600">
                      Create a new frequently asked question and its answer.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">Question</label>
                      <Input
                        placeholder="Enter the question..."
                        value={formData.question}
                        onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                        className="h-10"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">Answer</label>
                      <Textarea
                        placeholder="Enter the answer..."
                        value={formData.answer}
                        onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                        className="min-h-[100px] resize-none"
                      />
                    </div>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="h-9">
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddFAQ}
                      disabled={!formData.question.trim() || !formData.answer.trim()}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white h-9"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Add FAQ
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="py-3">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* FAQs List */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Frequently Asked Questions</span>
                <Badge variant="secondary">{filteredFaqs.length} FAQs</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-8">
                  <HelpCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No FAQs found</p>
                  {searchTerm && (
                    <p className="text-sm text-slate-400 mt-2">Try adjusting your search terms</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                                     {filteredFaqs.map((faq) => (
                     <div key={faq.fid} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                                                     <div className="flex items-center space-x-2 mb-2">
                             <h3 className="font-semibold text-slate-900">{faq.question}</h3>
                           </div>
                          <p className="text-slate-600 text-sm leading-relaxed">{faq.answer}</p>
                                                     <div className="flex items-center space-x-4 mt-3 text-xs text-slate-400">
                             <span>Created: {new Date(faq.created_at).toLocaleDateString()}</span>
                             {faq.updated_at && faq.updated_at !== faq.created_at && (
                               <span>Updated: {new Date(faq.updated_at).toLocaleDateString()}</span>
                             )}
                           </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(faq)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white border border-slate-200 rounded-lg shadow-xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-slate-900">Delete FAQ</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-600">
                                  Are you sure you want to delete this FAQ? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</AlertDialogCancel>
                                                                 <AlertDialogAction
                                   onClick={() => handleDeleteFAQ(faq.fid)}
                                   className="bg-red-600 hover:bg-red-700 text-white"
                                 >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit FAQ Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto bg-white">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-semibold">Edit FAQ</DialogTitle>
              <DialogDescription className="text-slate-600">
                Update the question and answer for this FAQ.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Question</label>
                <Input
                  placeholder="Enter the question..."
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  className="h-10"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Answer</label>
                <Textarea
                  placeholder="Enter the answer..."
                  value={formData.answer}
                  onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                  className="min-h-[100px] resize-none"
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false)
                resetForm()
              }} className="h-9">
                Cancel
              </Button>
              <Button 
                onClick={handleEditFAQ}
                disabled={!formData.question.trim() || !formData.answer.trim()}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white h-9"
              >
                <Save className="h-4 w-4 mr-2" />
                Update FAQ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
}
