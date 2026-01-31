'use client'

import { useState, useEffect } from 'react'
import { Plus, X, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function SettleUpDialog({ groupId, members, userId }: { groupId: string, members: any[], userId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const [payerId, setPayerId] = useState(userId)
    const [recipientId, setRecipientId] = useState(members.find(m => m.id !== userId)?.id || members[0]?.id)

    // Auto-calculate debt amount when payer/recipient changes
    useEffect(() => {
        async function fetchDebt() {
            if (payerId === recipientId) return

            const supabase = createClient()
            // Fetch all expense for this group to calculate pairwise
            const { data: groupExpenses } = await supabase
                .from('group_expenses')
                .select(`
                    *,
                    expense_splits(user_id, amount_owed)
                `)
                .eq('group_id', groupId)

            if (!groupExpenses) return

            // Minimal reimplementation of pairwise debt logic
            // 1. Calculate Net Balances
            const balances: Record<string, number> = {}
            groupExpenses.forEach((e: any) => {
                const pId = e.payer_id || e.manual_payer_id
                if (pId) balances[pId] = (balances[pId] || 0) + Number(e.amount)

                e.expense_splits.forEach((s: any) => {
                    const dId = s.user_id || s.manual_member_id
                    if (dId) balances[dId] = (balances[dId] || 0) - Number(s.amount_owed)
                })
            })

            // This gives global net. But Settle Up usually targets specific Payer -> Recipient link.
            // Splitwise style: If I owe you $50, the app should suggest $50.
            // But with multi-person, it's about network flow.
            // Simple approach: Suggest the exact amount Payer owes overall? 
            // Better: Suggest the Pairwise Debt if possible.
            // Let's us the simplified global net. 
            // If Payer owes $100 total, and Recipient is owed $100 total, suggest 100.
            // If Payer owes $100, Recipient is owed $20, suggest 20.

            // Actually, simpler: Just suggest the MIN(abs(payer_net), abs(recipient_net)) if one is negative and other positive.
            const payerNet = balances[payerId] || 0
            const recipientNet = balances[recipientId] || 0

            // If Payer owes money (Net < 0) and Recipient is owed money (Net > 0)
            if (payerNet < -0.01 && recipientNet > 0.01) {
                const suggested = Math.min(Math.abs(payerNet), recipientNet)
                setAmount(suggested.toFixed(2))
            } else {
                // Default to empty if no clear debt relation
                setAmount('')
            }
        }

        if (isOpen) {
            fetchDebt()
        }
    }, [payerId, recipientId, isOpen, groupId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const totalAmount = parseFloat(amount)
        if (!totalAmount || totalAmount <= 0) {
            alert('Enter a valid amount')
            return
        }

        if (payerId === recipientId) {
            alert('Payer and recipient cannot be the same')
            return
        }

        setLoading(true)
        const supabase = createClient()

        const payer = members.find(m => m.id === payerId)
        const recipient = members.find(m => m.id === recipientId)

        if (!payer || !recipient) {
            alert('Invalid member selection')
            setLoading(false)
            return
        }

        // 1. Create Expense
        // Fix: Use Local Time
        const d = new Date()
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - (offset * 60 * 1000))
        const todayString = local.toISOString().split('T')[0]

        const expenseData: any = {
            group_id: groupId,
            amount: totalAmount,
            description: 'Settlement',
            date: todayString
        }

        if (payer.type === 'user') {
            expenseData.payer_id = payer.id
        } else {
            expenseData.manual_payer_id = payer.id
        }

        const { data: expense, error: eError } = await supabase
            .from('group_expenses')
            .insert(expenseData)
            .select()
            .single()

        if (eError || !expense) {
            alert('Failed to create settlement: ' + eError?.message)
            setLoading(false)
            return
        }

        // 2. Create Splits (Recipient owes 100%)
        const splits = [{
            expense_id: expense.id,
            user_id: recipient.type === 'user' ? recipient.id : null,
            manual_member_id: recipient.type === 'manual' ? recipient.id : null,
            amount_owed: totalAmount
        }]

        const { error: sError } = await supabase
            .from('expense_splits')
            .insert(splits)

        if (sError) {
            alert('Failed to create settlement splits: ' + sError.message)
        } else {
            setAmount('')
            setIsOpen(false)
            window.location.reload()
        }
        setLoading(false)
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 rounded-md bg-white border border-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
            >
                Settle Up
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900 dark:border dark:border-gray-800 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold dark:text-white">Settle Up</h2>
                    <button onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="h-5 w-5 dark:text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Payer</label>
                            <select
                                value={payerId}
                                onChange={(e) => {
                                    const newPayerId = e.target.value
                                    setPayerId(newPayerId)
                                    if (newPayerId === recipientId) {
                                        const newRecipient = members.find(m => m.id !== newPayerId)
                                        if (newRecipient) setRecipientId(newRecipient.id)
                                    }
                                }}
                                className="w-full rounded-md border p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            >
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} {m.id === userId ? '(You)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mt-5 text-gray-400">
                            <ArrowRight className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Recipient</label>
                            <select
                                value={recipientId}
                                onChange={(e) => setRecipientId(e.target.value)}
                                className="w-full rounded-md border p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            >
                                {members.filter(m => m.id !== payerId).map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} {m.id === userId ? '(You)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mx-auto text-center mb-2">Amount</label>
                        <div className="relative max-w-[200px] mx-auto">
                            <span className="absolute left-3 top-2 text-lg font-bold text-gray-500">₹</span>
                            <input
                                type="number"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full rounded-md border py-2 pl-8 pr-4 text-center text-lg font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="flex-1 rounded-md bg-gray-100 py-2 font-medium hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 rounded-md bg-green-600 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Settle Up'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
