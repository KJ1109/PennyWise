'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { AddGroupExpense } from '@/components/splitwise/AddGroupExpense'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { GroupNetBalance } from '@/components/splitwise/GroupNetBalance'
import { GroupSpendingChart } from '@/components/splitwise/GroupSpendingChart'
import { ExpenseLedger } from '@/components/splitwise/ExpenseLedger'
import { DebtSummary } from '@/components/splitwise/DebtSummary'
import { ManageMembersDialog } from '@/components/splitwise/ManageMembersDialog'
import { GroupSettingsMenu } from '@/components/splitwise/GroupSettingsMenu'
import { SettleUpDialog } from '@/components/splitwise/SettleUpDialog'
import { GroupDetailSkeleton } from '@/components/splitwise/GroupDetailSkeleton'

export default function GroupDetailPage() {
    const router = useRouter()

    const [groupId, setGroupId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [group, setGroup] = useState<any>(null)
    const [members, setMembers] = useState<any[]>([])
    const [expenses, setExpenses] = useState<any[]>([])
    const [balances, setBalances] = useState<Record<string, number>>({})

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const id = params.get('id')
        if (id) {
            setGroupId(id)
        } else {
            setLoading(false)
            // Optionally redirect
        }
    }, [])

    const loadGroupData = async () => {
        if (!groupId) return

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            router.replace('/login')
            return
        }
        setUser(user)

        // 1. Fetch Group Details
        const { data: groupData, error: groupError } = await supabase
            .from('groups')
            .select('*')
            .eq('id', groupId)
            .single()

        if (groupError || !groupData) {
            // Handle 404 or Access Denied
            setLoading(false)
            return
        }

        // 2. Parallel Fetch: Members (Real + Manual) & Expenses
        const [
            { data: realMembers },
            { data: manualMembersResult },
            { data: expenseData }
        ] = await Promise.all([
            supabase.from('group_members').select('user_id, profiles(full_name, avatar_url)').eq('group_id', groupId),
            supabase.from('manual_members').select('*').eq('group_id', groupId),
            supabase.from('group_expenses').select(`
                    *,
                    profiles(full_name),
                    manual_members(name),
                    expense_splits(user_id, manual_member_id, amount_owed)
                `).eq('group_id', groupId).order('date', { ascending: false })
        ])

        // Normalize Members
        const allMembers = [
            ...(realMembers || []).map((m: any) => ({
                id: m.user_id,
                name: m.profiles?.full_name || 'Unknown',
                avatarUrl: m.profiles?.avatar_url,
                type: 'user' as const
            })),
            ...(manualMembersResult || []).map((m: any) => ({
                id: m.id,
                name: m.name,
                type: 'manual' as const
            }))
        ]

        // Calculate Balances
        const safeExpenses = expenseData || []
        const newBalances: Record<string, number> = {}
        allMembers.forEach(m => newBalances[m.id] = 0)

        safeExpenses.forEach((e: any) => {
            const payerId = e.payer_id || e.manual_payer_id
            if (payerId) {
                newBalances[payerId] = (newBalances[payerId] || 0) + Number(e.amount)
            }
            e.expense_splits.forEach((s: any) => {
                const memberId = s.user_id || s.manual_member_id
                if (memberId) {
                    newBalances[memberId] = (newBalances[memberId] || 0) - Number(s.amount_owed)
                }
            })
        })

        setGroup(groupData)
        setMembers(allMembers)
        setExpenses(safeExpenses)
        setBalances(newBalances)
        setLoading(false)
    }

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const id = params.get('id')
        if (id) {
            setGroupId(id)
        } else {
            setLoading(false)
            // Optionally redirect
        }
    }, [])

    useEffect(() => {
        if (groupId) {
            loadGroupData()
        }
    }, [groupId, router])

    if (loading) return <GroupDetailSkeleton />
    if (!groupId || !group) return <div>Group not found or access denied.</div>

    return (
        <main className="flex-1 w-full min-h-screen flex flex-col p-4 md:p-6 pb-24 md:pb-6">
            {/* Back Navigation */}
            <div className="mb-4">
                <Link href="/splitwise" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 blue:text-gray-400 blue:hover:text-white">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Groups
                </Link>
            </div>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white blue:text-white">{group.name}</h1>
                        <GroupSettingsMenu groupId={groupId} isCreator={group.created_by === user.id} />
                    </div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <ManageMembersDialog
                            members={members}
                            groupId={groupId}
                            currentUserId={user.id}
                            isCreator={group.created_by === user.id}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <SettleUpDialog groupId={groupId} members={members} userId={user.id} onUpdate={loadGroupData} />
                    <AddGroupExpense groupId={groupId} members={members} userId={user.id} onUpdate={loadGroupData} />
                </div>
            </div>

            {/* Layout */}
            <div className="flex flex-col xl:grid xl:grid-cols-12 gap-6 h-auto xl:h-[calc(100vh-140px)]">

                {/* Left Panel */}
                <div className="xl:col-span-3 h-auto xl:h-full">
                    <GroupNetBalance
                        members={members}
                        balances={balances}
                        currentUserId={user.id}
                        groupId={groupId}
                    />
                </div>

                {/* Main Content */}
                <div className="xl:col-span-9 flex flex-col h-auto xl:h-full gap-6">

                    {/* Top Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto xl:h-[300px] shrink-0">
                        {/* Spending Chart */}
                        <div className="lg:col-span-4 h-[300px] xl:h-full overflow-hidden">
                            <GroupSpendingChart expenses={expenses} members={members} />
                        </div>

                        {/* Settlements */}
                        <div className="lg:col-span-8 h-auto xl:h-full rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800 overflow-hidden">
                            <DebtSummary
                                members={members}
                                expenses={expenses}
                                currentUserId={user.id}
                            />
                        </div>
                    </div>

                    {/* Bottom Row: Ledger */}
                    <div className="flex-1 overflow-hidden flex flex-col rounded-xl border bg-white shadow-sm dark:bg-gray-900 dark:border-gray-800 min-h-[500px]">
                        <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 dark:text-white blue:text-white">Expense Ledger</h3>
                            <span className="text-xs text-gray-500">{expenses.length} transactions</span>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <ExpenseLedger
                                expenses={expenses}
                                members={members}
                                groupId={groupId}
                                currentUserId={user.id}
                                onUpdate={loadGroupData}
                            />
                        </div>
                    </div>
                </div>

            </div>
        </main>
    )
}
