'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase/client'

// Strict Global Gatekeeper
import { usePathname } from 'next/navigation'

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    // Explicit 3-phase state: 'LOADING' | 'CHECKING_PROFILE' | 'AUTHORIZED' | 'UNAUTHORIZED' | 'PUBLIC_ROUTE'
    const [guardState, setGuardState] = useState<'LOADING' | 'CHECKING_PROFILE' | 'AUTHORIZED' | 'UNAUTHORIZED' | 'PUBLIC_ROUTE'>('LOADING')

    useEffect(() => {
        let isMounted = true

        const runStrictGuard = async () => {
            try {
                // 0. Bypass for Public Routes
                if (pathname === '/login' || pathname.startsWith('/auth/')) {
                    if (isMounted) setGuardState('PUBLIC_ROUTE')
                    return
                }

                const supabase = createSupabaseBrowser()

                // --- PHASE 1: AUTHENTICATION ---
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error || !session) {
                    console.log('[AuthGuard] No session. Redirecting to Login.')
                    if (isMounted) setGuardState('UNAUTHORIZED')
                    window.location.href = '/login'
                    return
                }

                // --- PHASE 2: PROFILE RESOLUTION ---
                if (isMounted) setGuardState('CHECKING_PROFILE')

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('monthly_budget, full_name')
                    .eq('id', session.user.id)
                    .maybeSingle()

                if (profileError) {
                    console.error('[AuthGuard] Profile fetch error:', profileError)
                    window.location.href = '/login'
                    return
                }

                // VALIDATION: Does the user have a budget?
                const hasBudget = profile && profile.monthly_budget !== null && profile.monthly_budget > 0

                // LOGIC MATRIX
                // 1. Incomplete Profile (+ No Budget)
                if (!hasBudget) {
                    if (pathname === '/onboarding') {
                        // ALLOW: User is where they need to be
                        if (isMounted) setGuardState('AUTHORIZED')
                    } else {
                        // BLOCK: Redirect to Onboarding
                        console.log('[AuthGuard] Profile incomplete. Redirecting to Onboarding.')
                        window.location.href = '/onboarding'
                    }
                    return
                }

                // 2. Complete Profile
                if (hasBudget) {
                    if (pathname === '/onboarding' || pathname === '/login') {
                        // BLOCK: User is already onboarded, shouldn't be here
                        console.log('[AuthGuard] User onboarded. Redirecting to Dashboard.')
                        window.location.href = '/'
                    } else {
                        // ALLOW: User is allowed on Dashboard or other protected routes
                        if (isMounted) setGuardState('AUTHORIZED')
                    }
                    return
                }

            } catch (e) {
                console.error('[AuthGuard] Critical Error:', e)
                window.location.href = '/login'
            }
        }

        runStrictGuard()

        const supabase = createSupabaseBrowser()
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                // Allow public routes to handle themselves or redirect
                if (pathname !== '/login' && !pathname.startsWith('/auth/')) {
                    window.location.href = '/login'
                }
            }
        })

        return () => {
            isMounted = false
            subscription.unsubscribe()
        }
    }, [pathname, router])

    // --- RENDER BLOCKS ---

    // 0. Public Route -> Just render
    if (guardState === 'PUBLIC_ROUTE') {
        return <>{children}</>
    }

    // 1. Loading / Checking Profile -> Show Spinner
    if (guardState === 'LOADING' || guardState === 'CHECKING_PROFILE') {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-muted-foreground animate-pulse">
                        {guardState === 'LOADING' ? 'Verifying Session...' : 'Verifying Profile...'}
                    </p>
                </div>
            </div>
        )
    }

    // 2. Unauthorized -> Return Null (Redirect happened)
    if (guardState === 'UNAUTHORIZED') {
        return null
    }

    // 3. Authorized -> Render Children
    return <>{children}</>
}
