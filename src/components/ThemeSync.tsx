'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'

export function ThemeSync() {
    const { setTheme, theme } = useTheme()

    useEffect(() => {
        async function syncUserTheme() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return

            // Fetch profile theme
            const { data: profile } = await supabase
                .from('profiles')
                .select('theme')
                .eq('id', user.id)
                .single()

            if (profile?.theme) {
                if (profile.theme !== theme) {
                    console.log('Syncing theme from DB:', profile.theme)
                    setTheme(profile.theme)
                }
            } else {
                // No theme saved? Force default dark to avoid bleeding from previous user
                if (theme !== 'dark') {
                    setTheme('dark')
                }
            }
        }

        syncUserTheme()
    }, []) // Run once on mount

    return null // Invisible component
}
