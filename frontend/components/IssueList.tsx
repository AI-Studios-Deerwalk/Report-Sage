"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, AlertTriangle, Clock, CheckCircle, XCircle, Loader2, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { userAPI } from "@/lib/api"

interface IssueItem {
  issue_id: string
  title: string
  description: string
  image?: string
  status: 'pending' | 'inprogress' | 'resolved' | 'closed'
  created_at: string
}

export function IssueList() {
  const [openItems, setOpenItems] = useState<string[]>([])
  const [issueData, setIssueData] = useState<IssueItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingIssues, setDeletingIssues] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadIssues = async () => {
      try {
        setIsLoading(true)
        // Fetch user's issues
        const response = await userAPI.getUserIssues()
        const issues = response.data || []
        setIssueData(issues)
      } catch (err: any) {
        console.error('Error loading issues:', err)
        setError('Failed to load your issues. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    loadIssues()
  }, [])

  const toggleItem = (issueId: string) => {
    setOpenItems((prev) => 
      prev.includes(issueId) 
        ? prev.filter((id) => id !== issueId) 
        : [...prev, issueId]
    )
  }

  const handleDeleteIssue = async (issueId: string) => {
    if (!confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingIssues(prev => new Set(prev).add(issueId))
      await userAPI.deleteIssue(issueId)
      
      // Remove the issue from the local state
      setIssueData(prev => prev.filter(issue => issue.issue_id !== issueId))
      
      // Remove from open items if it was open
      setOpenItems(prev => prev.filter(id => id !== issueId))
      
    } catch (err: any) {
      console.error('Error deleting issue:', err)
      alert('Failed to delete issue. Please try again later.')
    } finally {
      setDeletingIssues(prev => {
        const newSet = new Set(prev)
        newSet.delete(issueId)
        return newSet
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      inprogress: { color: 'bg-blue-100 text-blue-800', icon: Loader2, label: 'In Progress' },
      resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Resolved' },
      closed: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Closed' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const IconComponent = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center p-4">
      {/* Animated floating geometric shapes - similar to FAQ but with red/orange theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large floating hexagons */}
        <div
          className="absolute top-10 left-10 w-32 h-32 border-2 border-red-200/30 rotate-12 animate-spin"
          style={{
            clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
            animationDuration: "20s",
            animationDirection: "reverse",
          }}
        ></div>

        <div
          className="absolute top-1/4 right-16 w-24 h-24 border-2 border-orange-300/40 -rotate-45 animate-pulse"
          style={{
            clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
            animationDuration: "3s",
          }}
        ></div>

        {/* Floating orbs with inner glow */}
        <div
          className="absolute top-1/3 left-1/4 w-16 h-16 rounded-full bg-gradient-to-r from-red-300/20 to-orange-300/20 animate-bounce"
          style={{ animationDuration: "4s", animationDelay: "0s" }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-r from-red-400/30 to-orange-400/30 animate-pulse"></div>
        </div>

        <div
          className="absolute bottom-1/4 right-1/3 w-12 h-12 rounded-full bg-gradient-to-r from-orange-300/25 to-amber-300/25 animate-bounce"
          style={{ animationDuration: "3.5s", animationDelay: "1s" }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-r from-orange-400/35 to-amber-400/35 animate-pulse"></div>
        </div>

        {/* Morphing blob shapes */}
        <div className="absolute top-16 right-1/4 w-40 h-40 opacity-20">
          <div
            className="w-full h-full bg-gradient-to-br from-red-400 to-orange-400 rounded-full animate-pulse"
            style={{
              borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
              animation: "morph 8s ease-in-out infinite",
            }}
          ></div>
        </div>

        <div className="absolute bottom-20 left-1/5 w-32 h-32 opacity-15">
          <div
            className="w-full h-full bg-gradient-to-tr from-orange-400 to-amber-400 rounded-full animate-pulse"
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
            className="absolute w-2 h-2 bg-red-400/30 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}

        {/* Cosmic rays/lines */}
        <div className="absolute top-0 left-1/4 w-px h-32 bg-gradient-to-b from-transparent via-red-300/50 to-transparent transform rotate-12 animate-pulse"></div>
        <div
          className="absolute top-1/3 right-1/5 w-px h-24 bg-gradient-to-b from-transparent via-orange-300/40 to-transparent transform -rotate-45 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/3 w-px h-20 bg-gradient-to-b from-transparent via-amber-300/45 to-transparent transform rotate-75 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        {/* Energy waves */}
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 opacity-20">
          <div
            className="w-full h-full border-2 border-red-300 rounded-full animate-ping"
            style={{ animationDuration: "4s" }}
          ></div>
          <div
            className="absolute inset-2 border border-orange-300 rounded-full animate-ping"
            style={{ animationDuration: "4s", animationDelay: "1s" }}
          ></div>
          <div
            className="absolute inset-4 border border-amber-300 rounded-full animate-ping"
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

      {/* Main Issue container */}
      <div className="w-full max-w-4xl z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4 pt-8">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              My Reported Issues
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Track the status of your reported issues and get updates on their resolution.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your issues...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Issue Items */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {issueData.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2">No issues reported yet.</p>
                <p className="text-gray-400 text-sm">Report an issue to get started!</p>
              </div>
            ) : (
              issueData.map((item) => (
                <Card
                  key={item.issue_id}
                  className="bg-white/95 backdrop-blur-sm shadow-lg border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl"
                >
                  <CardContent className="p-0">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        toggleItem(item.issue_id)
                      }}
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50/50 transition-colors duration-200 select-none"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            {getStatusBadge(item.status)}
                            <span>•</span>
                            <span>Reported {formatDate(item.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent toggleItem from firing
                            handleDeleteIssue(item.issue_id);
                          }}
                          disabled={deletingIssues.has(item.issue_id)}
                          className="text-red-600 hover:text-red-700 border-red-600 hover:border-red-700"
                        >
                          {deletingIssues.has(item.issue_id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                        {openItems.includes(item.issue_id) ? (
                          <ChevronUp className="w-5 h-5 text-red-600 transition-transform duration-200" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 transition-transform duration-200" />
                        )}
                      </div>
                    </button>

                    {openItems.includes(item.issue_id) && (
                      <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-200">
                        <div className="border-t border-gray-100 pt-4">
                          <p className="text-gray-600 leading-relaxed mb-4">{item.description}</p>
                          
                          {item.image && (
                            <div className="mt-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">Attached Screenshot:</p>
                              <img 
                                src={`http://localhost:8000/${item.image}`} 
                                alt="Issue screenshot" 
                                className="max-w-full h-auto rounded-lg border max-h-64 object-cover"
                                onError={(e) => {
                                  // Fallback if image fails to load
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <p className="hidden text-sm text-gray-500 mt-2">Image: {item.image}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Contact section */}
        <Card className="mt-8 bg-gradient-to-r from-red-50 to-orange-50 border-0 rounded-2xl">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Need to report a new issue?</h3>
            <p className="text-gray-600 mb-4">Found a bug or have a suggestion? Let us know and we'll help you out.</p>
            <button 
              onClick={() => window.location.href = '/issue-report'}
              className="bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Report New Issue
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
