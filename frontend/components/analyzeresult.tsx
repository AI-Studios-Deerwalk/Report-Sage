"use client"
import { AlertCircle, AlertTriangle, Lightbulb, CheckCircle, ArrowLeft, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AnalysisItem {
  id: string
  message: string
  line?: number
  page?: number
  severity: "error" | "warning" | "suggestion"
}

interface AnalysisResultsProps {
  results?: {
    errors: AnalysisItem[]
    warnings: AnalysisItem[]
    suggestions: AnalysisItem[]
    fileName?: string
    totalPages?: number
    analysisTime?: string
  }
  onBack?: () => void
}

// Mock data for demonstration
const mockResults = {
  fileName: "document.pdf",
  totalPages: 15,
  analysisTime: "2.3s",
  errors: [
    { id: "1", message: "Missing required header format on title page", page: 1, severity: "error" as const },
    { id: "2", message: "Bibliography format does not comply with TU standards", page: 14, severity: "error" as const },
    { id: "3", message: "Table caption formatting is incorrect", page: 8, severity: "error" as const },
  ],
  warnings: [
    { id: "4", message: "Page margins appear to be inconsistent", page: 3, severity: "warning" as const },
    {
      id: "5",
      message: "Font size may be too small for accessibility standards",
      page: 5,
      severity: "warning" as const,
    },
    { id: "6", message: "Line spacing inconsistency detected", page: 7, severity: "warning" as const },
    { id: "7", message: "Image resolution may be too low for print quality", page: 10, severity: "warning" as const },
  ],
  suggestions: [
    { id: "8", message: "Consider adding more descriptive figure captions", page: 6, severity: "suggestion" as const },
    {
      id: "9",
      message: "Abstract could be more concise (currently 280 words, recommended 250)",
      page: 2,
      severity: "suggestion" as const,
    },
    {
      id: "10",
      message: "Consider using more recent references (some citations are over 10 years old)",
      page: 13,
      severity: "suggestion" as const,
    },
    { id: "11", message: "Add page numbers to improve navigation", severity: "suggestion" as const },
    { id: "12", message: "Consider adding a table of contents for better structure", severity: "suggestion" as const },
  ],
}

export function AnalysisResults({ results = mockResults, onBack }: AnalysisResultsProps) {
  // Handle null results case
  if (!results) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">No analysis results available</p>
          <p className="text-gray-500 text-sm">Please upload and analyze a document first.</p>
        </div>
      </div>
    )
  }

  const { errors, warnings, suggestions, fileName, totalPages, analysisTime } = results

  const handleExport = () => {
    try {
      const lines: string[] = []
      const safeFileName = (fileName || "document")
        .toString()
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-z0-9-_]+/gi, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$|^$/g, "") || "report"

      const totalIssues = errors.length + warnings.length + suggestions.length
      lines.push("TU Format Analysis Report")
      lines.push("============================")
      lines.push("")
      lines.push(`File Name: ${fileName || "document"}`)
      lines.push(`Pages: ${totalPages ?? "—"}`)
      lines.push(`Analysis Time: ${analysisTime ?? "—"}`)
      lines.push(`Total Issues: ${totalIssues}`)
      lines.push("")

      const pushSection = (title: string, items: AnalysisItem[]) => {
        if (!items || items.length === 0) return
        lines.push(`${title} (${items.length})`)
        lines.push("-".repeat(title.length + 4))
        items.forEach((item, idx) => {
          const where: string[] = []
          if (typeof item.page === "number") where.push(`Page ${item.page}`)
          if (typeof item.line === "number") where.push(`Line ${item.line}`)
          const whereStr = where.length ? ` [${where.join(", ")}]` : ""
          lines.push(`${idx + 1}. ${item.message}${whereStr}`)
        })
        lines.push("")
      }

      pushSection("Errors", errors)
      pushSection("Warnings", warnings)
      pushSection("Suggestions", suggestions)

      const content = lines.join("\n")
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${safeFileName || "report"}-analysis.txt`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      // noop – exporting is best-effort
    }
  }

  const getIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "suggestion":
        return <Lightbulb className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getBulletColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "bg-red-500"
      case "warning":
        return "bg-orange-500"
      case "suggestion":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getCardBorder = (severity: string) => {
    switch (severity) {
      case "error":
        return "border-l-[6px] border-l-red-500"
      case "warning":
        return "border-l-[6px] border-l-orange-500"
      case "suggestion":
        return "border-l-[6px] border-l-blue-500"
      default:
        return ""
    }
  }

  const getTagClasses = (severity: string) => {
    switch (severity) {
      case "error":
        return "bg-red-100 text-red-700"
      case "warning":
        return "bg-orange-100 text-orange-700"
      case "suggestion":
        return "bg-blue-100 text-blue-700"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const renderAnalysisSection = (items: AnalysisItem[], title: string, severity: string) => {
    if (items.length === 0) return null

    return (
      <Card className={`p-6 border-2 border-gray-300 rounded-lg ${getCardBorder(severity)}`}>
        <div className="flex items-center gap-3 mb-4">
          {getIcon(severity)}
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <Badge
            variant="secondary"
            className={`ml-auto text-xs px-2 py-0.5 rounded-full ${getTagClasses(severity)}`}
          >
            {items.length}
          </Badge>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getBulletColor(severity)}`} />
              <div className="flex-1">
                <p className="text-foreground leading-relaxed">{item.message}</p>
                {(item.page || item.line) && (
                  <div className="flex gap-2 mt-1">
                    {item.page && (
                      <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 rounded ${getTagClasses(severity)}`}>Page {item.page}</Badge>
                    )}
                    {item.line && (
                      <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 rounded ${getTagClasses(severity)}`}>Line {item.line}</Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  const totalIssues = errors.length + warnings.length + suggestions.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="default"
            size="sm"
            onClick={onBack}
            className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Upload
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          className="gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-foreground hover:bg-gray-50 shadow-sm"
        >
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Analysis Summary */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-100 rounded-lg">
       

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{fileName}</p>
            <p className="text-sm text-muted-foreground">File Name</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{totalPages}</p>
            <p className="text-sm text-muted-foreground">Pages</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{totalIssues}</p>
            <p className="text-sm text-muted-foreground">Total Issues</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{analysisTime}</p>
            <p className="text-sm text-muted-foreground">Analysis Time</p>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-2 border-gray-300 rounded-lg border-l-[6px] border-l-red-500">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-red-600">{errors.length}</p>
              <p className="text-sm text-muted-foreground">Errors</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-2 border-gray-300 rounded-lg border-l-[6px] border-l-orange-500">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-orange-600">{warnings.length}</p>
              <p className="text-sm text-muted-foreground">Warnings</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-2 border-gray-300 rounded-lg border-l-[6px] border-l-blue-500">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-blue-600">{suggestions.length}</p>
              <p className="text-sm text-muted-foreground">Suggestions</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Results */}
      <div className="space-y-6">
        {renderAnalysisSection(errors, "Errors", "error")}
        {renderAnalysisSection(warnings, "Warnings", "warning")}
        {renderAnalysisSection(suggestions, "Suggestions", "suggestion")}
      </div>

      {/* No Issues Message */}
      {totalIssues === 0 && (
        <Card className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Perfect Document!</h3>
          <p className="text-muted-foreground">
            No errors, warnings, or suggestions found. Your document meets all TU standards.
          </p>
        </Card>
      )}
    </div>
  )
}
