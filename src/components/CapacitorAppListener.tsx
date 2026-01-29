'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { App } from '@capacitor/app'

export function CapacitorAppListener() {
    const router = useRouter()

    useEffect(() => {
        // Only run on client and if App plugin is available
        const setupListener = async () => {
            try {
                // Add listener for app URL open (deep links)
                await App.addListener('appUrlOpen', async (event) => {
                    const url = new URL(event.url)
                    // We only want the path and query string, e.g. /auth/callback?code=...
                    // The domain part is handled by the Capacitor WebView wrapping the site.
                    // If the domain matches our site, we navigate internally.
                    // Case 1: Universal Link (https://penny-wise-finance.vercel.app...)
                    if (url.hostname === 'penny-wise-finance.vercel.app') {
                        const path = url.pathname + url.search + url.hash
                        router.push(path)
                    }
                    // Case 2: Custom Scheme (pennywise://login-callback...)
                    else if (url.protocol === 'pennywise:') {
                        // pennywise://login-callback?code=xyz
                        // Client-Side Exchange to ensure Session is set in WebView
                        const params = new URLSearchParams(url.search)
                        const code = params.get('code')

                        if (code) {
                            const { createClient } = await import('@/lib/supabase/client')
                            const supabase = createClient()

                            const { error } = await supabase.auth.exchangeCodeForSession(code)

                            if (!error) {
                                // Session established! Reload to Dashboard
                                window.location.href = '/'
                            } else {
                                console.error('Auth Exchange Error:', error)
                                router.push(`/auth/auth-code-error?error=${error.message}`)
                            }
                        }
                    }
                })
            } catch (e) {
                console.error('Error setting up Capacitor listener:', e)
            }
        }

        setupListener()

        // Cleanup
        return () => {
            App.removeAllListeners()
        }
    }, [router])

    return null
}
