"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@clerk/nextjs'

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
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    // Add a small delay to prevent rapid redirects during auth initialization
    const redirectTimer = setTimeout(() => {
      if (isLoaded) {
        if (requireAuth && !isSignedIn) {
          console.log('Redirecting to login: user not authenticated');
          router.push(redirectTo);
        } else if (!requireAuth && isSignedIn) {
          console.log('Redirecting to home: user already authenticated');
          router.push('/dashboard');
        }
      }
    }, 100);

    return () => clearTimeout(redirectTimer);
  }, [isSignedIn, isLoaded, requireAuth, redirectTo, router])

  // Show loading state while auth is being initialized
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f5288]"></div>
      </div>
    )
  }

  // Don't render anything while redirect is happening
  if (requireAuth && !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f5288]"></div>
      </div>
    );
  }

  if (!requireAuth && isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f5288]"></div>
      </div>
    );
  }

  return <>{children}</>
}
