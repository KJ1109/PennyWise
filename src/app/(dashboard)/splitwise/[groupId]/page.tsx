// ... imports
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AddGroupExpense } from '@/components/splitwise/AddGroupExpense'
import { formatCurrency } from '@/lib/budget'
import { simplifyDebts } from '@/lib/split'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { GroupNetBalance } from '@/components/splitwise/GroupNetBalance'
import { GroupSpendingChart } from '@/components/splitwise/GroupSpendingChart'
import { ExpenseLedger } from '@/components/splitwise/ExpenseLedger'
import { DebtSummary } from '@/components/splitwise/DebtSummary'
import { ManageMembersDialog } from '@/components/splitwise/ManageMembersDialog'
import { GroupSettingsMenu } from '@/components/splitwise/GroupSettingsMenu'
import { SettleUpDialog } from '@/components/splitwise/SettleUpDialog'

export default async function GroupDetailPage({
    params
}: {
    params: Promise<{ groupId: string }>
}) {
    const { groupId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch Group
    const { data: group } = await supabase.from('groups').select('*').eq('id', groupId).single()
    if (!group) return <div>Group not found</div>

    // Fetch Real Members
    const { data: realMembers } = await supabase
        .from('group_members')
        .select('user_id, profiles(full_name, avatar_url)')
        .eq('group_id', groupId)

    // Fetch Manual Members
    const { data: manualMembersResult } = await supabase
        .from('manual_members')
        .select('*')
        .eq('group_id', groupId)

    // Normalize Members
    const members = [
        ...(realMembers || []).map((m: any) => ({
            id: m.user_id, // Uniform ID
            name: m.profiles?.full_name || 'Unknown',
            avatarUrl: m.profiles?.avatar_url,
            type: 'user' as const
        })),
        ...(manualMembersResult || []).map((m: any) => ({
            id: m.id, // Uniform ID
            name: m.name,
            type: 'manual' as const
        }))
    ]

    // Fetch Expenses with Splits
    const { data: expenses } = await supabase
        .from('group_expenses')
        .select(`
      *,
      profiles(full_name),
      manual_members(name),
      expense_splits(user_id, manual_member_id, amount_owed)
    `)
        .eq('group_id', groupId)
        .order('date', { ascending: false })

    const safeExpenses = expenses || []

    // Calculate Net Balances
    const balances: Record<string, number> = {} // memberId -> amount
    members.forEach(m => balances[m.id] = 0)

    safeExpenses.forEach((e: any) => {
        // Payer
        const payerId = e.payer_id || e.manual_payer_id
        if (payerId) {
            balances[payerId] = (balances[payerId] || 0) + Number(e.amount)
        }

        // Consumers
        e.expense_splits.forEach((s: any) => {
            const memberId = s.user_id || s.manual_member_id
            if (memberId) {
                balances[memberId] = (balances[memberId] || 0) - Number(s.amount_owed)
            }
        })
    })

    // Simplify
    const settlements = simplifyDebts(balances)

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
                    <SettleUpDialog groupId={groupId} members={members} userId={user.id} />
                    <AddGroupExpense groupId={groupId} members={members} userId={user.id} />
                </div>
            </div>

            {/* 3-Column Layout -> 2-Panel Layout (Left Sidebar + Main Content) */}
            <div className="flex flex-col xl:grid xl:grid-cols-12 gap-6 h-auto xl:h-[calc(100vh-140px)]">

                {/* Left Panel: Net Balance & Members (3 cols) */}
                <div className="xl:col-span-3 h-auto xl:h-full">
                    <GroupNetBalance
                        members={members}
                        balances={balances}
                        currentUserId={user.id}
                        groupId={groupId}
                    />
                </div>

                {/* Main Content: Middle & Right (9 cols) */}
                <div className="xl:col-span-9 flex flex-col h-auto xl:h-full gap-6">

                    {/* Top Row: Insights & Settlements */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto xl:h-[300px] shrink-0">
                        {/* Spending Chart */}
                        <div className="lg:col-span-4 h-[300px] xl:h-full overflow-hidden">
                            <GroupSpendingChart expenses={safeExpenses} members={members} />
                        </div>

                        {/* Settlements */}
                        <div className="lg:col-span-8 h-auto xl:h-full rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800 overflow-hidden">
                            <DebtSummary
                                members={members}
                                expenses={safeExpenses}
                                currentUserId={user.id}
                            />
                        </div>
                    </div>

                    {/* Bottom Row: Ledger */}
                    <div className="flex-1 overflow-hidden flex flex-col rounded-xl border bg-white shadow-sm dark:bg-gray-900 dark:border-gray-800 min-h-[500px]">
                        <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 dark:text-white blue:text-white">Expense Ledger</h3>
                            <span className="text-xs text-gray-500">{safeExpenses.length} transactions</span>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <ExpenseLedger
                                expenses={safeExpenses}
                                members={members}
                                groupId={groupId}
                                currentUserId={user.id}
                            />
                        </div>
                    </div>
                </div>

            </div>
        </main>
    )
}
