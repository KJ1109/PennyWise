import { AppShell } from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase/server'
import { getCachedUser } from '@/lib/auth-cache'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user } = await getCachedUser()

    if (!user) redirect('/login')

    const supabase = await createClient()
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()

    const userData = {
        name: profile?.full_name || 'User',
        email: user.email || 'No Email',
        avatarUrl: profile?.avatar_url
    }

    return <AppShell user={userData}>{children}</AppShell>
}
