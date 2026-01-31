'use client'

import { formatCurrency } from '@/lib/budget'
import { Check, X, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface PendingInvitesProps {
    invites: any[]
    onRespond: () => void
}

export function PendingInvites({ invites, onRespond }: PendingInvitesProps) {
    const [processing, setProcessing] = useState<string | null>(null)

    if (invites.length === 0) return null

    const handleRespond = async (inviteId: string, accept: boolean) => {
        setProcessing(inviteId)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        try {
            if (accept) {
                // 1. Get Invite details
                const { data: invite } = await supabase
                    .from('group_invites')
                    .select('*')
                    .eq('id', inviteId)
                    .single()

                if (invite) {
                    // 2. Add as Member (Ignore if already member)
                    const { error: memberError } = await supabase
                        .from('group_members')
                        .insert({ group_id: invite.group_id, user_id: user.id })

                    if (memberError && memberError.code !== '23505') { // 23505 = unique_violation
                        throw memberError
                    }

                    // 3. Update Invite
                    await supabase.from('group_invites').update({ status: 'accepted' }).eq('id', inviteId)
                }
            } else {
                // Reject
                await supabase.from('group_invites').update({ status: 'rejected' }).eq('id', inviteId)
            }
            onRespond()
        } catch (error: any) {
            alert('Error processing invite: ' + error.message)
        }
        setProcessing(null)
    }

    return (
        <div className="mb-6 space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Pending Invitations</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {invites.map((invite) => (
                    <div key={invite.id} className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm dark:border-blue-900/50 dark:bg-blue-900/20">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                            <Mail className="h-5 w-5" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                {invite.groups.name}
                            </p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                Invited by {invite.profiles.full_name}
                            </p>
                            <div className="mt-2 flex gap-2">
                                <button
                                    onClick={() => handleRespond(invite.id, true)}
                                    disabled={processing === invite.id}
                                    className="flex flex-1 items-center justify-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-green-600 shadow-sm transition-colors hover:bg-green-50 disabled:opacity-50 dark:bg-gray-800 dark:text-green-400 dark:hover:bg-gray-800/80"
                                >
                                    <Check className="h-3 w-3" /> Accept
                                </button>
                                <button
                                    onClick={() => handleRespond(invite.id, false)}
                                    disabled={processing === invite.id}
                                    className="flex flex-1 items-center justify-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-50 disabled:opacity-50 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-gray-800/80"
                                >
                                    <X className="h-3 w-3" /> Deny
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
