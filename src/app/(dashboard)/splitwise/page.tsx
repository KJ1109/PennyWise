import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateGroupDialog } from '@/components/splitwise/CreateGroupDialog'
import { GroupList } from '@/components/splitwise/GroupList'
import { getPendingInvites } from '@/app/actions/splitwise'
import { PendingInvites } from '@/components/splitwise/PendingInvites'

export default async function SplitwisePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch groups user is a member of
    const { data: members } = await supabase
        .from('group_members')
        .select('group_id, groups(id, name, created_at)')
        .eq('user_id', user.id)

        .eq('user_id', user.id)

    const groups = members?.map((m: any) => m.groups) || []
    const pendingInvites = await getPendingInvites()

    return (
        <main className="flex-1 w-full min-h-screen flex flex-col p-4 md:p-8 pb-24 md:pb-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white blue:text-white">Splitwise & Groups</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage shared expenses</p>
                </div>
                <CreateGroupDialog userId={user.id} />
            </div>

            <PendingInvites invites={pendingInvites} />
            <GroupList groups={groups} />
        </main>
    )
}
