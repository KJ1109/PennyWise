import { AppShell } from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch basic profile + budget
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, monthly_budget')
        .eq('id', user.id)
        .maybeSingle()

    // Onboarding Check: If no budget is set, force them to onboarding.
    if (!profile?.monthly_budget || profile.monthly_budget <= 0) {
        redirect('/onboarding')
    }

    const userData = {
        name: profile?.full_name || 'User',
        email: user.email || '',
        avatarUrl: profile?.avatar_url
    }

    return (
        <AppShell user={userData}>
            {children}
        </AppShell>
    )
}
