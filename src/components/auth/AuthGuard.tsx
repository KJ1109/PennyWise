'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthorized, setIsAuthorized] = useState(false)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const supabase = createClient()

                // Check current session
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error || !session) {
                    throw new Error('No session')
                }

                // Optional: You could fetch profile here if needed globally
                setIsAuthorized(true)
            } catch (error) {
                // If any error occurs (network, config, no session), redirect to login
                setIsAuthorized(false)
                router.replace('/login')
            } finally {
                setIsLoading(false)
            }
        }

        checkAuth()

        // Set up listener for future auth changes (e.g. sign out from another tab/window)
        const supabase = createClient()
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                setIsAuthorized(false)
                router.replace('/login')
                router.refresh()
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
