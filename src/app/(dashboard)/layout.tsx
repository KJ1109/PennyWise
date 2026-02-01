'use client'

import { AppShell } from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [user, setUser] = useState<{
        name: string
        email: string
        avatarUrl?: string
    } | null>(null)

    useEffect(() => {
        async function fetchProfile() {
            const supabase = createClient()
            const { data: { user: authUser } } = await supabase.auth.getUser()

            if (authUser) {
                // Fetch basic profile + budget
                const { data: fetchResult } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url, monthly_budget')
                    .eq('id', authUser.id)
                    .maybeSingle()

                let profile = fetchResult

                // [AUTO-HEAL] If profile doesn't exist (Targeting Mobile/Legacy Users), create it now.
                if (!profile) {
                    const { full_name, avatar_url, name } = authUser.user_metadata || {}
                    const displayName = full_name || name || authUser.email?.split('@')[0] || 'User'

                    const { data: newProfile } = await supabase
                        .from('profiles')
                        .upsert({
                            id: authUser.id,
                            email: authUser.email,
                            full_name: displayName,
                            avatar_url: avatar_url,
                            updated_at: new Date().toISOString()
                        })
                        .select()
                        .single()

                    if (newProfile) profile = newProfile
                }

                // Redirect to onboarding if User has no budget set
                if (!profile?.monthly_budget && profile?.monthly_budget !== 0) {
                    window.location.href = '/onboarding'
                    return
                }

                setUser({
                    name: profile?.full_name || 'User',
                    email: authUser.email || '',
                    avatarUrl: profile?.avatar_url
                })
            }
        }
        fetchProfile()
    }, [])

    return (
        <AuthGuard>
            <AppShell user={user || { name: '...', email: '...' }}>
                {children}
            </AppShell>
        </AuthGuard>
    )
}
