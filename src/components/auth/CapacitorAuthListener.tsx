'use client'

import { useEffect } from 'react'
import { App } from '@capacitor/app'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function CapacitorAuthListener() {
    const router = useRouter()

    useEffect(() => {
        const handleDeepLink = async (url: string) => {
            console.log("App opened with URL:", url)

            // Check if it's our auth callback
            if (url.startsWith('pennywise://auth-callback')) {
                const supabase = createSupabaseBrowser()

                try {
                    // Parse the URL to get the code
                    const parsedUrl = new URL(url)
                    const code = parsedUrl.searchParams.get('code')

                    console.log("OAuth code:", code)

                    if (code) {
                        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

                        console.log("Exchange result:", data, error)

                        if (error) {
                            console.error("Session exchange failed:", error)
                            return
                        }

                        // Now the user is logged in
                        router.refresh()
                        router.replace('/')
                    }
                } catch (err) {
                    console.error("Deep link handling error:", err)
                }
            }
        }

        const listener = App.addListener('appUrlOpen', ({ url }) => {
            handleDeepLink(url)
        })

        return () => {
            listener.then(handle => handle.remove())
        }
    }, [router])

    return null
}
