'use client'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreVertical, LogOut, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateBalances } from '@/lib/split'

export function GroupSettingsMenu({
    groupId,
    isCreator
}: {
    groupId: string
    isCreator: boolean
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Helper to check if user has non-zero balance
    const checkBalance = async (userId: string) => {
        const supabase = createClient()
        const { data: expenses } = await supabase
            .from('group_expenses')
            .select(`
                *,
                expense_splits(user_id, manual_member_id, amount_owed)
            `)
            .eq('group_id', groupId)

        // Minimal stub for calculateBalances
        const membersStub = [{ id: userId }]
        // Map expenses to match calculateBalances expectation if needed, or if it works directly with Supabase response
        // calculateBalances expects: expenses joined with splits.
        // Let's assume calculateBalances is robust or we perform simple check manually.
        const balances = calculateBalances(membersStub, expenses || [])
        return balances[userId] || 0
    }

    const handleDelete = async () => {
        setLoading(true)
        const supabase = createClient()

        // 1. Strict Check: Are there any unsettled debts in the group?
        // Fetch all group expenses to calculate full web of debts
        const { data: groupExpenses } = await supabase
            .from('group_expenses')
            .select(`
                *,
                expense_splits(user_id, manual_member_id, amount_owed)
            `)
            .eq('group_id', groupId)

        // Calculate balances for EVERYONE
        const balances: Record<string, number> = {}
        groupExpenses?.forEach((e: any) => {
            const payerId = e.payer_id || e.manual_payer_id
            if (payerId) balances[payerId] = (balances[payerId] || 0) + Number(e.amount)

            e.expense_splits.forEach((s: any) => {
                const debtorId = s.user_id || s.manual_member_id
                if (debtorId) balances[debtorId] = (balances[debtorId] || 0) - Number(s.amount_owed)
            })
        })

        // Check if any balance is non-zero
        const hasDebts = Object.values(balances).some(b => Math.abs(b) > 0.05)

        if (hasDebts) {
            alert('Cannot delete group. There are unsettled debts between members. Please settle up all balances first.')
            setLoading(false)
            return
        }

        if (!confirm('Are you sure you want to DELETE this group? This action helps no one and cannot be undone.')) {
            setLoading(false)
            return
        }

        const { error } = await supabase
            .from('groups')
            .delete()
            .eq('id', groupId)

        setLoading(false)

        if (error) {
            alert('Failed to delete group: ' + error.message)
        } else {
            router.push('/splitwise')
            router.refresh()
        }
    }

    const handleLeave = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            setLoading(false)
            return
        }

        // 1. Check Balance
        const balance = await checkBalance(user.id)
        if (Math.abs(balance) > 0.01) {
            alert(`Cannot leave group. You have an outstanding balance of ${balance.toFixed(2)}. Settle up first.`)
            setLoading(false)
            return
        }

        if (!confirm('Are you sure you want to leave this group?')) {
            setLoading(false)
            return
        }

        // 2. Leave
        const { error } = await supabase
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', user.id)

        setLoading(false)

        if (error) {
            alert('Failed to leave group: ' + error.message)
        } else {
            router.push('/splitwise')
            router.refresh()
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={loading}>
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Group Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {isCreator ? (
                    <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                        onClick={handleDelete}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Group
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                        onClick={handleLeave}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Leave Group
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
