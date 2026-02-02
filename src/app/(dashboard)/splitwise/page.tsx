'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CreateGroupDialog } from '@/components/splitwise/CreateGroupDialog'
import { GroupList } from '@/components/splitwise/GroupList'
import { PendingInvites } from '@/components/splitwise/PendingInvites'
import { SplitwiseDashboardSkeleton } from '@/components/splitwise/SplitwiseDashboardSkeleton'

export default function SplitwisePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [groups, setGroups] = useState<any[]>([])
    const [pendingInvites, setPendingInvites] = useState<any[]>([])

    useEffect(() => {
        async function loadData() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.replace('/login')
                return
            }
            setUser(user)

            // 1. Fetch Groups (via members)
            const { data: members } = await supabase
                .from('group_members')
                .select('group_id, groups(id, name, created_at)')
                .eq('user_id', user.id)

            const fetchedGroups = members?.map((m: any) => m.groups) || []

            // 2. Fetch Pending Invites
            // We need to fetch invites where user_id is ours.
            // Note: If RLS prevents joining 'groups', we might miss group names if we try to select them directly.
            // Assuming standard RLS: 'read own invites'
            const { data: invites } = await supabase
                .from('group_invites')
                .select(`
                    id,
                    created_at,
                    groups (id, name),
                    profiles!group_invites_invited_by_fkey (full_name, avatar_url)
                `)
                .eq('user_id', user.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            setGroups(fetchedGroups)
            setPendingInvites(invites || [])
            setLoading(false)
        }

        loadData()
    }, [router])

    if (loading) return <SplitwiseDashboardSkeleton />

    return (
        <main className="flex-1 w-full min-h-screen flex flex-col p-4 md:p-8 pb-24 md:pb-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white blue:text-white">Splitwise & Groups</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage shared expenses</p>
                </div>
                {user && <CreateGroupDialog userId={user.id} onGroupCreated={(newGroup) => setGroups(prev => [newGroup, ...prev])} />}
            </div>

            <PendingInvites
                invites={pendingInvites}
                onRespond={() => window.location.reload()} // Simple reload for now, or we can update state
            />
            <GroupList groups={groups} />
        </main>
    )
}
