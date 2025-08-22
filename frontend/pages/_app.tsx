import React, { useEffect } from 'react'
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { AuthProvider } from "@/contexts/AuthContext"

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()

  useEffect(() => {
    // Handle route changes to ensure proper page transitions
    const handleRouteChange = (url: string) => {
      // Force scroll to top on route change
      window.scrollTo(0, 0)
    }

    router.events.on('routeChangeComplete', handleRouteChange)
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}

export default MyApp