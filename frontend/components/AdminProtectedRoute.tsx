"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/router"

interface AdminProtectedRouteProps {
  children: React.ReactNode
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const adminToken = localStorage.getItem('adminToken')
      const adminData = localStorage.getItem('adminData')

      if (!adminToken || !adminData) {
        router.push('/admin/login')
        return
      }

      try {
        // Verify token is valid by making a test request
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        fetch(`${API_BASE_URL}/api/v1/admin/users/count`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        }).then(response => {
          if (response.ok) {
            setIsAuthenticated(true)
          } else {
            // Token is invalid, redirect to login
            localStorage.removeItem('adminToken')
            localStorage.removeItem('adminData')
            router.push('/admin/login')
          }
        }).catch((error) => {
          console.error('Admin auth check error:', error)
          // Network error or invalid token
          localStorage.removeItem('adminToken')
          localStorage.removeItem('adminData')
          router.push('/admin/login')
        })
      } catch (error) {
        console.error('Admin auth check error:', error)
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminData')
        router.push('/admin/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  return <>{children}</>
}
