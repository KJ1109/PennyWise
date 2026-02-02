'use client'

import { AppShell } from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'


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
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('id', authUser.id)
                    .maybeSingle()

                // Presentation Only: Set user state for sidebar/header
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
        <AppShell user={user || { name: '...', email: '...' }}>
            {children}
        </AppShell>
    )
}
