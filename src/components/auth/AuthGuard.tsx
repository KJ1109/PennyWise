'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Network } from '@capacitor/network'

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthorized, setIsAuthorized] = useState(false)

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient()

            // Check current session
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                // Check REAL connection status before redirecting
                const status = await Network.getStatus()

                if (status.connected) {
                    router.replace('/login')
                } else {
                    console.log('Offline: Allow access to cached pages despite potential session expiry')
                    setIsAuthorized(true) // Allow render
                    setIsLoading(false)
                }
                return
            }

            // Optional: You could fetch profile here if needed globally
            setIsAuthorized(true)
            setIsLoading(false)
        }

        checkAuth()

        // Set up listener for future auth changes (e.g. sign out from another tab/window)
        const supabase = createClient()
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // Fix: Don't force logout if we are just offline and session refresh failed
            if (event === 'SIGNED_OUT' || !session) {
                const status = await Network.getStatus()

                if (status.connected) {
                    router.replace('/login')
                } else {
                    console.log('Offline: Supabase session invalid, but keeping UI for read-only mode.')
                }
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [router])

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-muted-foreground animate-pulse">Loading PennyWise...</p>
                </div>
            </div>
        )
    }

    if (!isAuthorized) {
        return null // Will redirect
    }

    return <>{children}</>
}
