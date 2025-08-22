"use client"

import { useState, useEffect } from "react"

export default function BackendHealthCheck() {
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'unhealthy' | 'error'>('checking')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    checkBackendHealth()
  }, [])

  const checkBackendHealth = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setHealthStatus('healthy')
        console.log('Backend health check:', data)
      } else {
        setHealthStatus('unhealthy')
        setErrorMessage(`Backend responded with status: ${response.status}`)
      }
    } catch (error: any) {
      setHealthStatus('error')
      setErrorMessage(error.message || 'Failed to connect to backend')
      console.error('Backend health check failed:', error)
    }
  }

  const getStatusColor = () => {
    switch (healthStatus) {
      case 'healthy': return 'text-green-600'
      case 'unhealthy': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-blue-600'
    }
  }

  const getStatusText = () => {
    switch (healthStatus) {
      case 'checking': return 'Checking backend...'
      case 'healthy': return 'Backend is running'
      case 'unhealthy': return 'Backend is unhealthy'
      case 'error': return 'Backend is not accessible'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm">
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${
          healthStatus === 'healthy' ? 'bg-green-500' :
          healthStatus === 'unhealthy' ? 'bg-yellow-500' :
          healthStatus === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`}></div>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
      
      {errorMessage && (
        <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
      )}
      
      <button 
        onClick={checkBackendHealth}
        className="text-xs text-blue-600 hover:underline mt-1"
      >
        Retry
      </button>
    </div>
  )
}
