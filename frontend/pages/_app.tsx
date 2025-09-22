import React, { useEffect } from 'react'
import Head from 'next/head'
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { AuthProvider } from "@/contexts/AuthContext"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ClerkProvider } from '@clerk/nextjs'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

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
    <>
      <Head>
        <title>Report Rage</title>
        <meta name="description" content="AI-powered document analysis and formatting tool" />
        <link rel="icon" href="/Logo.png" />
        <link rel="apple-touch-icon" href="/Logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ClerkProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Component {...pageProps} />
          </AuthProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ClerkProvider>
    </>
  )
}

export default MyApp