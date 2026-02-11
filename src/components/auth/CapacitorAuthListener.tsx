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
            // The URL might look like: pennywise://auth-callback#access_token=...&refresh_token=...
            if (url.startsWith('pennywise://auth-callback')) {
                const supabase = createSupabaseBrowser()

                // Parse the hash
                const hashIndex = url.indexOf('#')
                if (hashIndex !== -1) {
                    const hash = url.substring(hashIndex + 1)
                    const params = new URLSearchParams(hash)
                    const accessToken = params.get('access_token')
                    const refreshToken = params.get('refresh_token')

                    if (accessToken && refreshToken) {
                        const { error } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken
                        })

                        if (!error) {
                            // Successfully logged in
                            // Force a router refresh to update server components and redirect to home
                            router.refresh()
                            router.replace('/')
                        }
                    }
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
