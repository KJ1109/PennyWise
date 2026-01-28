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
                await App.addListener('appUrlOpen', (event) => {
                    const url = new URL(event.url)
                    // We only want the path and query string, e.g. /auth/callback?code=...
                    // The domain part is handled by the Capacitor WebView wrapping the site.
                    // If the domain matches our site, we navigate internally.
                    if (url.hostname === 'penny-wise-finance.vercel.app') {
                        const path = url.pathname + url.search + url.hash
                        // Force router navigation
                        router.push(path)
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
