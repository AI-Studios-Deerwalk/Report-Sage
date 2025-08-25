"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Loader2, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface EmailConfig {
  smtp_server: string
  smtp_port: string
  smtp_username: string
  smtp_password: string
  from_email: string
  from_name: string
}

export default function EmailConfigForm() {
  const [config, setConfig] = useState<EmailConfig>({
    smtp_server: "",
    smtp_port: "",
    smtp_username: "",
    smtp_password: "",
    from_email: "",
    from_name: ""
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setIsLoading(true)
    try {
      console.log("🔍 Starting to load config...")
      const adminToken = localStorage.getItem('adminToken')
      console.log("🔑 Admin token:", adminToken ? "Found" : "Not found")
      
      if (!adminToken) {
        toast({
          title: "Authentication Error",
          description: "Please log in as admin to access configuration",
          variant: "destructive"
        })
        return
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      console.log("🌐 Fetching from:", `${API_BASE_URL}/api/v1/admin/config/email`)
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/config/email`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      })

      console.log("📡 Response status:", response.status)
      console.log("📡 Response ok:", response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Config data received:", data)
        setConfig(data)
        toast({
          title: "Configuration Loaded",
          description: "Email configuration loaded successfully",
        })
      } else if (response.status === 404) {
        console.log("❌ No configuration found (404)")
        // No config exists yet, that's fine
        toast({
          title: "No Configuration",
          description: "No email configuration found. Please create one.",
        })
      } else {
        console.log("❌ API error:", response.status, response.statusText)
        throw new Error('Failed to load configuration')
      }
    } catch (error) {
      console.error('Error loading config:', error)
      toast({
        title: "Error",
        description: "Failed to load email configuration",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }



  const saveConfig = async () => {
    setIsSaving(true)
    try {
      const adminToken = localStorage.getItem('adminToken')
      if (!adminToken) {
        toast({
          title: "Authentication Error",
          description: "Please log in as admin to save configuration",
          variant: "destructive"
        })
        return
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/config/email/upsert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        setIsSaved(true)
        toast({
          title: "Success",
          description: "Email configuration saved successfully",
        })
        
        // Reset saved state after 3 seconds
        setTimeout(() => setIsSaved(false), 3000)
      } else {
        throw new Error('Failed to save configuration')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      toast({
        title: "Error",
        description: "Failed to save email configuration",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof EmailConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-slate-600">Loading configuration...</span>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SMTP Server */}
          <div className="space-y-2">
            <Label htmlFor="smtp_server">SMTP Server</Label>
            <Input
              id="smtp_server"
              type="text"
              placeholder="e.g., smtp.gmail.com"
              value={config.smtp_server}
              onChange={(e) => handleInputChange('smtp_server', e.target.value)}
              className="w-full"
            />
          </div>

          {/* SMTP Port */}
          <div className="space-y-2">
            <Label htmlFor="smtp_port">SMTP Port</Label>
            <Input
              id="smtp_port"
              type="text"
              placeholder="e.g., 587"
              value={config.smtp_port}
              onChange={(e) => handleInputChange('smtp_port', e.target.value)}
              className="w-full"
            />
          </div>

          {/* SMTP Username */}
          <div className="space-y-2">
            <Label htmlFor="smtp_username">SMTP Username</Label>
            <Input
              id="smtp_username"
              type="text"
              placeholder="e.g., your-email@gmail.com"
              value={config.smtp_username}
              onChange={(e) => handleInputChange('smtp_username', e.target.value)}
              className="w-full"
            />
          </div>

          {/* SMTP Password */}
          <div className="space-y-2">
            <Label htmlFor="smtp_password">SMTP Password</Label>
            <Input
              id="smtp_password"
              type="text"
              placeholder="Enter your SMTP password"
              value={config.smtp_password}
              onChange={(e) => handleInputChange('smtp_password', e.target.value)}
              className="w-full"
            />
          </div>

          {/* From Email */}
          <div className="space-y-2">
            <Label htmlFor="from_email">From Email</Label>
            <Input
              id="from_email"
              type="email"
              placeholder="e.g., noreply@yourdomain.com"
              value={config.from_email}
              onChange={(e) => handleInputChange('from_email', e.target.value)}
              className="w-full"
            />
          </div>

          {/* From Name */}
          <div className="space-y-2">
            <Label htmlFor="from_name">From Name</Label>
            <Input
              id="from_name"
              type="text"
              placeholder="e.g., Your Company Name"
              value={config.from_name}
              onChange={(e) => handleInputChange('from_name', e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 pt-4">
          <Button
            onClick={saveConfig}
            disabled={isSaving}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : isSaved ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      </div>

             
    </>
  )
}
