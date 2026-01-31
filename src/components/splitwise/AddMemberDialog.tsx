'use client'

import { useState, useEffect } from 'react'
import { Plus, X, UserPlus, Mail, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function AddMemberDialog({ groupId }: { groupId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [mode, setMode] = useState<'email' | 'manual'>('manual') // Default to manual as per user pref
    const [inputVal, setInputVal] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // Validation State
    const [isValidating, setIsValidating] = useState(false)
    const [userExists, setUserExists] = useState<boolean | null>(null)
    const [lookedUpUserId, setLookedUpUserId] = useState<string | null>(null)

    // Debounce Check
    useEffect(() => {
        if (mode !== 'email' || !inputVal || inputVal.length < 3) {
            setUserExists(null)
            setLookedUpUserId(null)
            return
        }

        const timer = setTimeout(async () => {
            setIsValidating(true)
            const supabase = createClient()

            // Try explicit email lookup first using our secure RPC function
            const { data: userId, error } = await supabase.rpc('get_user_id_by_email', {
                lookup_email: inputVal.trim()
            })

            if (userId) {
                setUserExists(true)
                setLookedUpUserId(userId)
            } else {
                // Fallback: Check strictly by username if it was not an email
                // Note: We don't have a direct "get_user_id_by_username" RPC secure function usually.
                // Assuming input is primarily email. If username support is needed, we'd need a similar RPC.
                // For now, we only support email lookup securely.
                setUserExists(false)
                setLookedUpUserId(null)
            }
            setIsValidating(false)
        }, 500)

        return () => clearTimeout(timer)
    }, [inputVal, mode])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const supabase = createClient()

        try {
            if (mode === 'email') {
                if (!lookedUpUserId) {
                    throw new Error("User not found")
                }

                // Check if already a member
                const { data: existingMember } = await supabase
                    .from('group_members')
                    .select('user_id')
                    .eq('group_id', groupId)
                    .eq('user_id', lookedUpUserId)
                    .single()

                if (existingMember) {
                    throw new Error("User is already a member of this group.")
                }

                // Insert Invite
                const { error: inviteError } = await supabase
                    .from('group_invites')
                    .insert({
                        group_id: groupId,
                        user_id: lookedUpUserId,
                        invited_by: (await supabase.auth.getUser()).data.user?.id,
                        status: 'pending'
                    })

                if (inviteError) {
                    if (inviteError.code === '23505') { // Unique violation
                        throw new Error("Invite already sent to this user.")
                    }
                    throw inviteError
                }

                alert('Invitation sent successfully! They need to accept it.')

            } else {
                // Manual Member
                const { error: manualError } = await supabase
                    .from('manual_members')
                    .insert({
                        group_id: groupId,
                        name: inputVal.trim()
                    })

                if (manualError) throw manualError
            }

            // Success
            setInputVal('')
            setIsOpen(false)
            window.location.reload()

        } catch (err: any) {
            alert(err.message || 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
            >
                <Plus className="h-4 w-4" />
                Invite Friend
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900 dark:border dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white blue:text-white">Add Member</h2>
                    <button onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="h-5 w-5 dark:text-gray-400" />
                    </button>
                </div>

                <div className="mb-4 flex rounded-md bg-gray-100 p-1 dark:bg-gray-800">
                    <button
                        onClick={() => {
                            setMode('manual')
                            setUserExists(null)
                            setInputVal('')
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 rounded py-1.5 text-xs font-medium transition-colors ${mode === 'manual'
                            ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-white'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                            }`}
                    >
                        <UserPlus className="h-3 w-3" />
                        By Name
                    </button>
                    <button
                        onClick={() => {
                            setMode('email')
                            setUserExists(null)
                            setInputVal('')
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 rounded py-1.5 text-xs font-medium transition-colors ${mode === 'email'
                            ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-white'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                            }`}
                    >
                        <Mail className="h-3 w-3" />
                        By Email
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 blue:text-gray-300">
                            {mode === 'email' ? 'Member Email' : 'Member Name'}
                        </label>
                        <div className="relative">
                            <input
                                type={mode === 'email' ? 'email' : 'text'}
                                required
                                autoFocus
                                value={inputVal}
                                onChange={(e) => setInputVal(e.target.value)}
                                className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 pr-10 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white blue:border-gray-700 blue:bg-gray-800 blue:text-white"
                                placeholder={mode === 'email' ? 'friend@example.com' : 'John Doe'}
                            />
                            {/* Validation Icon */}
                            {mode === 'email' && inputVal.length >= 3 && (
                                <div className="absolute right-3 top-[calc(50%+2px)] -translate-y-1/2">
                                    {isValidating ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                    ) : userExists === true ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    ) : userExists === false ? (
                                        <XCircle className="h-4 w-4 text-red-500" />
                                    ) : null}
                                </div>
                            )}
                        </div>
                        {mode === 'email' && <p className="mt-1 text-xs text-gray-500">User must have a registered account.</p>}
                        {mode === 'manual' && <p className="mt-1 text-xs text-gray-500">Adds a user managed by the group.</p>}
                    </div>

                    <div className="flex gap-2 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="flex-1 rounded-md bg-gray-100 py-2 font-medium text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 blue:bg-gray-800 blue:text-white blue:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (mode === 'email' && userExists === false)}
                            className="flex-1 rounded-md bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Adding...' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
