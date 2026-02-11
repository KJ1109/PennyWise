'use client'

import { useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { clearApplicationData } from '@/lib/reset-app-store'
import { Database, Calendar, Trash2, AlertTriangle, User } from 'lucide-react'
import { formatCurrency } from '@/lib/budget'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"

interface DataManagementSectionProps {
    profileId?: string
}

export function DataManagementSection({ profileId }: DataManagementSectionProps) {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [confirmAction, setConfirmAction] = useState<{
        type: 'range' | 'all' | 'delete_account',
        dataType?: 'expenses' | 'all',
        description: string
    } | null>(null)

    const handleDeleteRange = () => {
        if (!startDate || !endDate) {
            alert('Please select both start and end dates')
            return
        }
        setConfirmAction({
            type: 'range',
            dataType: 'expenses',
            description: `delete all expenses between ${startDate} and ${endDate}`
        })
    }

    const handleClearAll = (dataType: 'expenses' | 'all') => {
        const desc = dataType === 'all'
            ? 'RESET YOUR ACCOUNT (Clears Profile, Expenses, Groups - Starts Fresh)'
            : 'delete all expenses'

        setConfirmAction({
            type: 'all',
            dataType,
            description: desc
        })
    }

    const handleDeleteAccount = () => {
        setConfirmAction({
            type: 'delete_account',
            description: 'PERMANENTLY DELETE YOUR ACCOUNT (All data + Login Access will be removed)'
        })
    }

    const checkDebts = async (supabase: any, uid: string) => {
        // 1. Get all groups user is in
        const { data: memberGroups } = await supabase.from('group_members').select('group_id').eq('user_id', uid)
        const groupIds = memberGroups?.map((g: any) => g.group_id) || []

        if (groupIds.length > 0) {
            // 2. Calculate Balances for these groups
            // We fetch ALL expenses for these groups to calculate net balance properly
            const { data: groupExpenses } = await supabase
                .from('group_expenses')
                .select(`
                    *,
                    expense_splits(user_id, amount_owed)
                `)
                .in('group_id', groupIds)

            // Calculate User's Net Balance
            let netBalance = 0
            groupExpenses?.forEach((e: any) => {
                // Paid by user? (+ Credit)
                if (e.payer_id === uid) {
                    netBalance += Number(e.amount)
                }
                // Splits owed by user? (- Debit)
                e.expense_splits.forEach((s: any) => {
                    if (s.user_id === uid) {
                        netBalance -= Number(s.amount_owed)
                    }
                })
            })

            // 3. Block if unsettled
            if (Math.abs(netBalance) > 0.05) { // 5 cents tolerance
                throw new Error(`You have unsettled debts/credits (Net: ${formatCurrency(netBalance)}). Please settle up in all groups before performing this action.`)
            }
        }
    }

    const executeDeletion = async () => {
        if (!confirmAction || !profileId) return

        setIsLoading(true)
        const supabase = createSupabaseBrowser()
        let success = false
        let errorMsg = ''

        try {
            // STRICT DEBT CHECK for ALL Destructive Splitwise-related or Account-level actions
            // The user requested: "only if the user has not pending owing to anyone if owes the user shouldnt be able to delete expenses or reset account or delete account"
            // We interpret this as: Block "Clear All Expenses", "Reset Account", "Delete Account".
            // Range deletion might be fine, but to be safe/strict as requested, let's block heavy actions.
            if (confirmAction.type === 'all' || confirmAction.type === 'delete_account') {
                await checkDebts(supabase, profileId)
            }

            if (confirmAction.type === 'range' && confirmAction.dataType === 'expenses') {
                const { error } = await supabase
                    .from('expenses')
                    .delete()
                    .eq('user_id', profileId)
                    .gte('date', startDate)
                    .lte('date', endDate)
                if (error) throw error
                success = true
            } else if (confirmAction.type === 'all' && (confirmAction.dataType === 'expenses' || confirmAction.dataType === 'all')) {
                // Delete Personal Expenses
                const { error } = await supabase.from('expenses').delete().eq('user_id', profileId)
                if (error) throw error

                if (confirmAction.dataType === 'all') {
                    // --- Deep Reset ---
                    // 1. Delete Savings Goals
                    const { error: goalsError } = await supabase.from('savings_goals').delete().eq('user_id', profileId)
                    if (goalsError) throw new Error('Failed to delete savings goals: ' + goalsError.message)

                    // 2. Delete Upcoming Payments
                    const { error: paymentsError } = await supabase.from('upcoming_payments').delete().eq('user_id', profileId)
                    if (paymentsError) throw new Error('Failed to delete upcoming payments: ' + paymentsError.message)

                    // 3. Delete Groups Created by User
                    const { error: groupsError } = await supabase.from('groups').delete().eq('created_by', profileId)
                    if (groupsError) throw new Error('Failed to delete groups: ' + groupsError.message)

                    // 4. Leave other groups
                    const { error: membersError } = await supabase.from('group_members').delete().eq('user_id', profileId)
                    if (membersError) throw new Error('Failed to leave groups: ' + membersError.message)

                    // 5. Reset Profile
                    const { error: profileError } = await supabase.from('profiles').update({
                        full_name: null,
                        monthly_budget: null,
                        currency: 'INR',
                        avatar_url: null,
                        updated_at: new Date().toISOString()
                    }).eq('id', profileId)
                    if (profileError) throw new Error('Failed to reset profile: ' + profileError.message)
                }
                success = true
            } else if (confirmAction.type === 'delete_account') {
                const { error } = await supabase.rpc('delete_own_user')
                if (error) throw error

                // Strict cleanup (Kill session)
                await clearApplicationData(false)
                return
            }

            if (success) {
                if (confirmAction.type === 'all' && confirmAction.dataType === 'all') {
                    // Verify Update
                    const { data: verifyProfile } = await supabase
                        .from('profiles')
                        .select('monthly_budget')
                        .eq('id', profileId)
                        .single()

                    if (verifyProfile?.monthly_budget !== null) {
                        throw new Error('Reset failed. Database value did not update. Please try again.')
                    }

                    // CRITICAL: Clear client auth cache to prevent stale state
                    await supabase.auth.refreshSession()

                    // Force clean slate
                    await clearApplicationData(true)

                    // Force rigorous reload (User suggestion: href is best for destroying in-memory state)
                    window.location.href = '/onboarding'
                    return
                }
                alert('Action completed successfully.')
                setStartDate('')
                setEndDate('')
            }

        } catch (e: any) {
            errorMsg = e.message
            alert('Operation failed: ' + errorMsg)
        }

        setIsLoading(false)
        setConfirmAction(null)
    }

    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-colors duration-300">
            <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="rounded-full bg-orange-100 dark:bg-orange-900 p-2">
                    <Database className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Data Management</h2>
            </div>

            <div className="mt-6 space-y-8">
                {/* Range Deletion */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Delete by Date Range
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-end">
                        <div>
                            <label className="text-xs text-muted-foreground">From</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground">To</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <button
                            onClick={handleDeleteRange}
                            className="flex items-center justify-center gap-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 text-sm font-medium transition-colors"
                        >
                            <Trash2 className="h-4 w-4" /> Delete Range
                        </button>
                    </div>
                </div>

                <div className="border-t border-border"></div>

                {/* Nuclear Options */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Danger Zone
                    </h3>
                    <div className="flex flex-col gap-3 sm:flex-row flex-wrap">
                        <button
                            onClick={() => handleClearAll('expenses')}
                            className="flex items-center justify-center gap-2 rounded-md border border-destructive/30 bg-background px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                        >
                            <Trash2 className="h-4 w-4" /> Clear All Expenses
                        </button>
                        <button
                            onClick={() => handleClearAll('all')}
                            className="flex items-center justify-center gap-2 rounded-md bg-destructive/80 px-4 py-2 text-sm font-medium text-white hover:bg-destructive shadow-sm transition-colors"
                        >
                            <Trash2 className="h-4 w-4" /> Reset Account (Fresh Start)
                        </button>
                        <button
                            onClick={handleDeleteAccount}
                            className="flex items-center justify-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 shadow-sm transition-colors"
                        >
                            <User className="h-4 w-4" /> Delete Account
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Actions are irreversible. "Reset Account" returns you to onboarding. "Delete Account" removes your login.
                    </p>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" /> Confirm Deletion
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to <strong>{confirmAction?.description}</strong>?
                            <br /><br />
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <div className="flex gap-2 w-full sm:justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setConfirmAction(null)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={executeDeletion}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Processing...' : 'Yes, Confirm'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
