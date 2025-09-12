import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/AdminLayout";
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Building,
  Settings,
  BookOpen,
  Hash,
  AlertCircle,
  CheckCircle
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAdminData, hasAdminPermission } from "@/lib/adminAuth"

interface DocumentRule {
  id: number
  chunk_id: string
  title: string
  rules: string
  university: string
  degree_program: string
  chapter: string
  section: string
  subsection?: string
  required_elements?: string[]
  quality_criteria?: string[]
  examples?: string[]
  common_mistakes?: string[]
  priority: number
  is_active: boolean
  version: number
  created_by?: string
  created_at: string
  updated_at: string
}

interface DocumentRuleFormData {
  chunk_id: string
  title: string
  rules: string
  university: string
  degree_program: string
  chapter: string
  section: string
  subsection?: string
  required_elements?: string[]
  quality_criteria?: string[]
  examples?: string[]
  common_mistakes?: string[]
  priority: number
  is_active: boolean
}

export default function AdminDocumentConfigPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [rules, setRules] = useState<DocumentRule[]>([])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<DocumentRule | null>(null)
  const [viewingRule, setViewingRule] = useState<DocumentRule | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null)
  const [hierarchy, setHierarchy] = useState<any>({})
  const [formData, setFormData] = useState<DocumentRuleFormData>({
    chunk_id: "",
    title: "",
    rules: "",
    university: "",
    degree_program: "",
    chapter: "",
    section: "",
    subsection: "",
    required_elements: [],
    quality_criteria: [],
    examples: [],
    common_mistakes: [],
    priority: 1,
    is_active: true
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

    // Check if admin has permission to access config
    if (!hasAdminPermission('config')) {
      router.push('/admin/dashboard');
      return;
    }

    // Load document rules from API
    loadDocumentRules();
  }, []);

  const loadDocumentRules = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/document-rules');
      if (!response.ok) {
        throw new Error('Failed to load document rules');
      }
      const data = await response.json();
      setRules(data);
      
      // Build hierarchy from the list data
      buildHierarchyFromRules(data);
    } catch (err: any) {
      console.error('Error loading document rules:', err);
      setError(err.message || 'Failed to load document rules');
    } finally {
      setIsLoading(false);
    }
  };

  const buildHierarchyFromRules = (rulesData: DocumentRule[]) => {
    const hierarchyData: any = {};
    
    rulesData.forEach(rule => {
      const chapter = rule.chapter || "unknown";
      const section = rule.section || "unknown";
      
      if (!hierarchyData[chapter]) {
        hierarchyData[chapter] = {};
      }
      
      if (!hierarchyData[chapter][section]) {
        hierarchyData[chapter][section] = [];
      }
      
      hierarchyData[chapter][section].push({
        id: rule.id,
        chunk_id: rule.chunk_id,
        title: rule.title,
        priority: rule.priority,
        subsection: rule.subsection,
        is_active: rule.is_active,
        version: rule.version,
        rules: rule.rules,
        university: rule.university,
        degree_program: rule.degree_program
      });
    });
    
    setHierarchy(hierarchyData);
  };


  const handleAddRule = async () => {
    try {
      const response = await fetch('/api/document-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create document rule');
      }

      setSuccess('Document rule created successfully');
      setIsAddDialogOpen(false);
      resetForm();
      loadDocumentRules();
    } catch (err: any) {
      console.error('Error creating document rule:', err);
      setError(err.message || 'Failed to create document rule');
    }
  };

  const handleEditRule = async () => {
    if (!editingRule) return;

    try {
      const response = await fetch(`/api/document-rules/${editingRule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update document rule');
      }

      setSuccess('Document rule updated successfully');
      setIsEditDialogOpen(false);
      setEditingRule(null);
      resetForm();
      loadDocumentRules();
    } catch (err: any) {
      console.error('Error updating document rule:', err);
      setError(err.message || 'Failed to update document rule');
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    try {
      const response = await fetch(`/api/document-rules/${ruleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document rule');
      }

      setSuccess('Document rule deleted successfully');
      loadDocumentRules();
    } catch (err: any) {
      console.error('Error deleting document rule:', err);
      setError(err.message || 'Failed to delete document rule');
    }
  };

  const openEditDialog = (rule: DocumentRule) => {
    setEditingRule(rule);
    setFormData({
      chunk_id: rule.chunk_id,
      title: rule.title,
      rules: rule.rules,
      university: rule.university,
      degree_program: rule.degree_program,
      chapter: rule.chapter,
      section: rule.section,
      subsection: rule.subsection || "",
      required_elements: rule.required_elements || [],
      quality_criteria: rule.quality_criteria || [],
      examples: rule.examples || [],
      common_mistakes: rule.common_mistakes || [],
      priority: rule.priority,
      is_active: rule.is_active
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (rule: DocumentRule) => {
    setViewingRule(rule);
    setIsViewDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      chunk_id: "",
      title: "",
      rules: "",
      university: "",
      degree_program: "",
      chapter: "",
      section: "",
      subsection: "",
      required_elements: [],
      quality_criteria: [],
      examples: [],
      common_mistakes: [],
      priority: 1,
      is_active: true
    });
  };

  const handleRuleClick = (rule: DocumentRule) => {
    setViewingRule(rule);
    setIsViewDialogOpen(true);
  };

  const handleChapterClick = (chapter: string) => {
    setSelectedChapter(chapter);
  };

  const handleBackToChapters = () => {
    setSelectedChapter(null);
  };

  const getChapterNumbers = () => {
    const chapters = Object.keys(hierarchy);
    return chapters.sort((a, b) => {
      // Extract numbers from chapter names for proper sorting
      const aNum = parseInt(a.replace(/\D/g, '')) || 0;
      const bNum = parseInt(b.replace(/\D/g, '')) || 0;
      return aNum - bNum;
    });
  };

  const getSectionNumbers = (chapter: string) => {
    // Get unique sections from rules for the selected chapter
    const chapterRules = rules.filter(rule => rule.chapter === chapter);
    const sections = Array.from(new Set(chapterRules.map(rule => rule.section)));
    return sections.sort((a, b) => {
      // Extract numbers from section names for proper sorting
      const aNum = parseFloat(a.replace(/\D/g, '')) || 0;
      const bNum = parseFloat(b.replace(/\D/g, '')) || 0;
      return aNum - bNum;
    });
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading document rules...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Document Rules - DWIT Academia</title>
        <meta name="description" content="Manage document rules and guidelines" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <AdminLayout currentPage="document-config">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Document Rules</h1>
                <p className="text-slate-600">Manage document rules and guidelines for different universities and programs</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto bg-white">
                  <DialogHeader>
                    <DialogTitle>Add New Document Rule</DialogTitle>
                    <DialogDescription>
                      Create a new document rule for specific university and program requirements.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="chunk_id">Chunk ID</Label>
                      <Input
                        id="chunk_id"
                        value={formData.chunk_id}
                        onChange={(e) => setFormData({...formData, chunk_id: e.target.value})}
                        placeholder="e.g., chapter_1_intro"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          placeholder="e.g., Chapter 1: Introduction"
                        />
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={formData.priority.toString()} onValueChange={(value) => setFormData({...formData, priority: parseInt(value)})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Priority 1</SelectItem>
                            <SelectItem value="2">Priority 2</SelectItem>
                            <SelectItem value="3">Priority 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="university">University</Label>
                        <Input
                          id="university"
                          value={formData.university}
                          onChange={(e) => setFormData({...formData, university: e.target.value})}
                          placeholder="e.g., TU"
                        />
                      </div>
                      <div>
                        <Label htmlFor="degree_program">Degree Program</Label>
                        <Input
                          id="degree_program"
                          value={formData.degree_program}
                          onChange={(e) => setFormData({...formData, degree_program: e.target.value})}
                          placeholder="e.g., BSCCSIT"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="chapter">Chapter</Label>
                        <Input
                          id="chapter"
                          value={formData.chapter}
                          onChange={(e) => setFormData({...formData, chapter: e.target.value})}
                          placeholder="e.g., Chapter 1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="section">Section</Label>
                        <Input
                          id="section"
                          value={formData.section}
                          onChange={(e) => setFormData({...formData, section: e.target.value})}
                          placeholder="e.g., 1.1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="subsection">Subsection (Optional)</Label>
                      <Input
                        id="subsection"
                        value={formData.subsection}
                        onChange={(e) => setFormData({...formData, subsection: e.target.value})}
                        placeholder="e.g., 1.1.1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="rules">Rules</Label>
                      <Textarea
                        id="rules"
                        value={formData.rules}
                        onChange={(e) => setFormData({...formData, rules: e.target.value})}
                        placeholder="Describe the rule requirements..."
                        rows={4}
                      />
                    </div>
                    
                    <div>
                      <Label>Required Elements</Label>
                      <div className="space-y-2">
                        {formData.required_elements?.map((element, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={element}
                              onChange={(e) => {
                                const newElements = [...(formData.required_elements || [])];
                                newElements[index] = e.target.value;
                                setFormData({...formData, required_elements: newElements});
                              }}
                              placeholder="Enter required element..."
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newElements = formData.required_elements?.filter((_, i) => i !== index) || [];
                                setFormData({...formData, required_elements: newElements});
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newElements = [...(formData.required_elements || []), ''];
                            setFormData({...formData, required_elements: newElements});
                          }}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Required Element
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Quality Criteria</Label>
                      <div className="space-y-2">
                        {formData.quality_criteria?.map((criteria, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={criteria}
                              onChange={(e) => {
                                const newCriteria = [...(formData.quality_criteria || [])];
                                newCriteria[index] = e.target.value;
                                setFormData({...formData, quality_criteria: newCriteria});
                              }}
                              placeholder="Enter quality criteria..."
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newCriteria = formData.quality_criteria?.filter((_, i) => i !== index) || [];
                                setFormData({...formData, quality_criteria: newCriteria});
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newCriteria = [...(formData.quality_criteria || []), ''];
                            setFormData({...formData, quality_criteria: newCriteria});
                          }}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Quality Criteria
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Examples</Label>
                      <div className="space-y-2">
                        {formData.examples?.map((example, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={example}
                              onChange={(e) => {
                                const newExamples = [...(formData.examples || [])];
                                newExamples[index] = e.target.value;
                                setFormData({...formData, examples: newExamples});
                              }}
                              placeholder="Enter example..."
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newExamples = formData.examples?.filter((_, i) => i !== index) || [];
                                setFormData({...formData, examples: newExamples});
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newExamples = [...(formData.examples || []), ''];
                            setFormData({...formData, examples: newExamples});
                          }}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Example
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Common Mistakes</Label>
                      <div className="space-y-2">
                        {formData.common_mistakes?.map((mistake, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={mistake}
                              onChange={(e) => {
                                const newMistakes = [...(formData.common_mistakes || [])];
                                newMistakes[index] = e.target.value;
                                setFormData({...formData, common_mistakes: newMistakes});
                              }}
                              placeholder="Enter common mistake..."
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newMistakes = formData.common_mistakes?.filter((_, i) => i !== index) || [];
                                setFormData({...formData, common_mistakes: newMistakes});
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newMistakes = [...(formData.common_mistakes || []), ''];
                            setFormData({...formData, common_mistakes: newMistakes});
                          }}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Common Mistake
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddRule} className="bg-blue-600 hover:bg-blue-700 text-white">
                      Create Rule
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}


           
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {selectedChapter && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBackToChapters}
                        className="flex items-center space-x-2"
                      >
                        <span>←</span>
                        <span>Back to Chapters</span>
                      </Button>
                    )}
                    <span>
                      {selectedChapter 
                        ? `Chapter ${selectedChapter} Sections` 
                        : `Document Rules (${Object.keys(hierarchy).length} Chapters)`
                      }
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {rules.filter(rule => rule.is_active).length} Active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  {!selectedChapter ? (
                      // Show Chapters List
                      <div className="space-y-4">
                        {getChapterNumbers().map((chapter) => {
                          const chapterRules = rules.filter(rule => rule.chapter === chapter);
                          const activeRules = chapterRules.filter(rule => rule.is_active);
                          const sections = getSectionNumbers(chapter);
                          
                          // Get the first rule to extract chapter name and details
                          const firstRule = chapterRules[0];
                          const chapterName = firstRule?.title || `${chapter}`;
                          
                          return (
                            <div
                              key={chapter}
                              className="border border-slate-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                      Priority {firstRule?.priority || 1} {activeRules.length > 0 ? 'Active' : 'Inactive'} v{firstRule?.version || 1}
                                    </Badge>
                                  </div>
                                  
                                  <h3 className="font-semibold text-lg text-slate-900 mb-2">{chapterName}</h3>
                                  
                                  <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
                                    <div className="flex items-center space-x-1">
                                      <Building className="h-4 w-4" />
                                      <span>{firstRule?.university || 'TU'}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Settings className="h-4 w-4" />
                                      <span>{firstRule?.degree_program || 'BScCSIT'}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <BookOpen className="h-4 w-4" />
                                      <span>{chapter}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Hash className="h-4 w-4" />
                                      <span>{sections.length} Sections</span>
                                    </div>
                                  </div>
                                  
                                  <p className="text-slate-700 leading-relaxed">
                                    {firstRule?.rules || `This chapter contains ${sections.length} sections with ${chapterRules.length} total rules. Click to view all sections in this chapter.`}
                                  </p>
                                </div>
                                
                                <div className="flex items-center space-x-2 ml-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (firstRule) openViewDialog(firstRule);
                                    }}
                                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (firstRule) openEditDialog(firstRule);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleChapterClick(chapter)}
                                    className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                  >
                                    <BookOpen className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-white border border-slate-200 rounded-lg shadow-xl">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-slate-900">Delete Chapter Rules</AlertDialogTitle>
                                        <AlertDialogDescription className="text-slate-600">
                                          Are you sure you want to delete all rules in chapter "{chapter}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => {
                                            // Delete all rules in this chapter
                                            chapterRules.forEach(rule => handleDeleteRule(rule.id));
                                          }}
                                          className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                          Delete All
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Show Sections for selected chapter
                      <div>
                        <div className="mb-6">
                          <h2 className="text-xl font-semibold text-slate-900 mb-2">
                            Chapter {selectedChapter} - Sections
                          </h2>
                          <p className="text-slate-600">
                            Select a section to view its rules
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          {getSectionNumbers(selectedChapter).map((section) => {
                            const sectionRules = rules.filter(rule => 
                              rule.chapter === selectedChapter && rule.section === section
                            );
                            const activeRules = sectionRules.filter(rule => rule.is_active);
                            
                            // Get the first rule to display section info
                            const firstRule = sectionRules[0];
                            
                            return (
                              <div
                                key={section}
                                className="border border-slate-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        Priority {firstRule?.priority || 1} {activeRules.length > 0 ? 'Active' : 'Inactive'} v{firstRule?.version || 1}
                                      </Badge>
                                    </div>
                                    
                                    <h3 className="font-semibold text-lg text-slate-900 mb-2">{firstRule?.title || section}</h3>
                                    
                                    <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
                                      <div className="flex items-center space-x-1">
                                        <Building className="h-4 w-4" />
                                        <span>{firstRule?.university || 'TU'}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Settings className="h-4 w-4" />
                                        <span>{firstRule?.degree_program || 'BScCSIT'}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <BookOpen className="h-4 w-4" />
                                        <span>{selectedChapter}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Hash className="h-4 w-4" />
                                        <span>#{section}</span>
                                      </div>
                                    </div>
                                    
                                    <p className="text-slate-700 leading-relaxed">
                                      {firstRule?.rules || `This section contains ${sectionRules.length} rule${sectionRules.length !== 1 ? 's' : ''} for ${section}.`}
                                    </p>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2 ml-4">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (firstRule) openViewDialog(firstRule);
                                      }}
                                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (firstRule) openEditDialog(firstRule);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="bg-white border border-slate-200 rounded-lg shadow-xl">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle className="text-slate-900">Delete Section Rules</AlertDialogTitle>
                                          <AlertDialogDescription className="text-slate-600">
                                            Are you sure you want to delete all rules in section "{section}"? This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel className="border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => {
                                              // Delete all rules in this section
                                              sectionRules.forEach(rule => handleDeleteRule(rule.id));
                                            }}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                          >
                                            Delete All
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
              </CardContent>
            </Card>
     
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>Edit Document Rule</DialogTitle>
              <DialogDescription>
                Update the document rule information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-chunk_id">Chunk ID</Label>
                  <Input
                    id="edit-chunk_id"
                    value={formData.chunk_id}
                    onChange={(e) => setFormData({...formData, chunk_id: e.target.value})}
                    placeholder="e.g., chapter_1_intro"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Chapter 1: Introduction"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select value={formData.priority.toString()} onValueChange={(value) => setFormData({...formData, priority: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Priority 1</SelectItem>
                      <SelectItem value="2">Priority 2</SelectItem>
                      <SelectItem value="3">Priority 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="edit-university">University</Label>
                  <Input
                    id="edit-university"
                    value={formData.university}
                    onChange={(e) => setFormData({...formData, university: e.target.value})}
                    placeholder="e.g., TU"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-degree_program">Degree Program</Label>
                  <Input
                    id="edit-degree_program"
                    value={formData.degree_program}
                    onChange={(e) => setFormData({...formData, degree_program: e.target.value})}
                    placeholder="e.g., BSCCSIT"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-chapter">Chapter</Label>
                  <Input
                    id="edit-chapter"
                    value={formData.chapter}
                    onChange={(e) => setFormData({...formData, chapter: e.target.value})}
                    placeholder="e.g., Chapter 1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-section">Section</Label>
                  <Input
                    id="edit-section"
                    value={formData.section}
                    onChange={(e) => setFormData({...formData, section: e.target.value})}
                    placeholder="e.g., 1.1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-subsection">Subsection (Optional)</Label>
                  <Input
                    id="edit-subsection"
                    value={formData.subsection}
                    onChange={(e) => setFormData({...formData, subsection: e.target.value})}
                    placeholder="e.g., 1.1.1"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="edit-is_active">Active</Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-rules">Rules</Label>
                <Textarea
                  id="edit-rules"
                  value={formData.rules}
                  onChange={(e) => setFormData({...formData, rules: e.target.value})}
                  placeholder="Describe the rule requirements..."
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>Required Elements</Label>
                  <div className="space-y-2">
                    {formData.required_elements?.map((element, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={element}
                          onChange={(e) => {
                            const newElements = [...(formData.required_elements || [])];
                            newElements[index] = e.target.value;
                            setFormData({...formData, required_elements: newElements});
                          }}
                          placeholder="Enter required element..."
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newElements = formData.required_elements?.filter((_, i) => i !== index) || [];
                            setFormData({...formData, required_elements: newElements});
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newElements = [...(formData.required_elements || []), ''];
                        setFormData({...formData, required_elements: newElements});
                      }}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Required Element
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label>Quality Criteria</Label>
                  <div className="space-y-2">
                    {formData.quality_criteria?.map((criteria, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={criteria}
                          onChange={(e) => {
                            const newCriteria = [...(formData.quality_criteria || [])];
                            newCriteria[index] = e.target.value;
                            setFormData({...formData, quality_criteria: newCriteria});
                          }}
                          placeholder="Enter quality criteria..."
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newCriteria = formData.quality_criteria?.filter((_, i) => i !== index) || [];
                            setFormData({...formData, quality_criteria: newCriteria});
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newCriteria = [...(formData.quality_criteria || []), ''];
                        setFormData({...formData, quality_criteria: newCriteria});
                      }}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Quality Criteria
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>Examples</Label>
                  <div className="space-y-2">
                    {formData.examples?.map((example, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={example}
                          onChange={(e) => {
                            const newExamples = [...(formData.examples || [])];
                            newExamples[index] = e.target.value;
                            setFormData({...formData, examples: newExamples});
                          }}
                          placeholder="Enter example..."
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newExamples = formData.examples?.filter((_, i) => i !== index) || [];
                            setFormData({...formData, examples: newExamples});
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newExamples = [...(formData.examples || []), ''];
                        setFormData({...formData, examples: newExamples});
                      }}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Example
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label>Common Mistakes</Label>
                  <div className="space-y-2">
                    {formData.common_mistakes?.map((mistake, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={mistake}
                          onChange={(e) => {
                            const newMistakes = [...(formData.common_mistakes || [])];
                            newMistakes[index] = e.target.value;
                            setFormData({...formData, common_mistakes: newMistakes});
                          }}
                          placeholder="Enter common mistake..."
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newMistakes = formData.common_mistakes?.filter((_, i) => i !== index) || [];
                            setFormData({...formData, common_mistakes: newMistakes});
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newMistakes = [...(formData.common_mistakes || []), ''];
                        setFormData({...formData, common_mistakes: newMistakes});
                      }}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Common Mistake
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditRule} className="bg-blue-600 hover:bg-blue-700 text-white">
                Update Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>View Document Rule</DialogTitle>
              <DialogDescription>
                View the complete document rule information.
              </DialogDescription>
            </DialogHeader>
            {viewingRule && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Priority {viewingRule.priority} {viewingRule.is_active ? 'Active' : 'Inactive'} v{viewingRule.version}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-600">
                    Created: {new Date(viewingRule.created_at).toLocaleDateString()} | 
                    Updated: {new Date(viewingRule.updated_at).toLocaleDateString()}
                  </div>
                </div>
                
                <h3 className="font-semibold text-2xl text-slate-900">{viewingRule.title}</h3>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <Label className="text-slate-600">University</Label>
                    <p className="font-medium">{viewingRule.university}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600">Degree Program</Label>
                    <p className="font-medium">{viewingRule.degree_program}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600">Chapter</Label>
                    <p className="font-medium">{viewingRule.chapter}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600">Section</Label>
                    <p className="font-medium">{viewingRule.section}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600">Subsection</Label>
                    <p className="font-medium">{viewingRule.subsection || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600">Chunk ID</Label>
                    <p className="font-medium font-mono text-xs">{viewingRule.chunk_id}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-slate-600">Rules</Label>
                  <p className="text-slate-700 leading-relaxed mt-1 p-4 bg-slate-50 rounded-lg border">{viewingRule.rules}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {viewingRule.required_elements && viewingRule.required_elements.length > 0 && (
                    <div>
                      <Label className="text-slate-600">Required Elements</Label>
                      <ul className="list-disc list-inside text-slate-700 mt-1 space-y-1 p-3 bg-slate-50 rounded-lg border">
                        {viewingRule.required_elements.map((element, index) => (
                          <li key={index}>{element}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {viewingRule.quality_criteria && viewingRule.quality_criteria.length > 0 && (
                    <div>
                      <Label className="text-slate-600">Quality Criteria</Label>
                      <ul className="list-disc list-inside text-slate-700 mt-1 space-y-1 p-3 bg-slate-50 rounded-lg border">
                        {viewingRule.quality_criteria.map((criteria, index) => (
                          <li key={index}>{criteria}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {viewingRule.examples && viewingRule.examples.length > 0 && (
                    <div>
                      <Label className="text-slate-600">Examples</Label>
                      <ul className="list-disc list-inside text-slate-700 mt-1 space-y-1 p-3 bg-slate-50 rounded-lg border">
                        {viewingRule.examples.map((example, index) => (
                          <li key={index}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {viewingRule.common_mistakes && viewingRule.common_mistakes.length > 0 && (
                    <div>
                      <Label className="text-slate-600">Common Mistakes</Label>
                      <ul className="list-disc list-inside text-slate-700 mt-1 space-y-1 p-3 bg-slate-50 rounded-lg border">
                        {viewingRule.common_mistakes.map((mistake, index) => (
                          <li key={index}>{mistake}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
}
