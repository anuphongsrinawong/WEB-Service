'use client'

import { useSession } from 'next-auth/react'
import { Dashboard } from '@/components/dashboard'
import { LandingPage } from '@/components/landing-page'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function Home() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (session) {
    return <Dashboard />
  }

  return <LandingPage />
}
