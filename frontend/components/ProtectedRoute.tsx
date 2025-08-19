"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Add a small delay to prevent rapid redirects during auth initialization
    const redirectTimer = setTimeout(() => {
      if (!isLoading) {
        if (requireAuth && !isAuthenticated) {
          console.log('Redirecting to login: user not authenticated');
          router.push(redirectTo);
        } else if (!requireAuth && isAuthenticated) {
          console.log('Redirecting to home: user already authenticated');
          router.push('/dashboard');
        }
      }
    }, 100);

    return () => clearTimeout(redirectTimer);
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router])

  // Show loading state while auth is being initialized
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f5288]"></div>
      </div>
    )
  }

  // Don't render anything while redirect is happening
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f5288]"></div>
      </div>
    );
  }

  if (!requireAuth && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f5288]"></div>
      </div>
    );
  }

  return <>{children}</>
}
