'use client'

import { useState, useEffect } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type SplitType = 'equal' | 'exact' | 'percentage' | 'shares'

export function EditGroupExpenseDialog({
    isOpen,
    onClose,
    expense,
    groupId,
    members,
    userId
}: {
    isOpen: boolean
    onClose: () => void
    expense: any
    groupId: string
    members: any[]
    userId: string
}) {
    const [amount, setAmount] = useState(expense.amount.toString())
    const [description, setDescription] = useState(expense.description)
    // Fix: Use simple string split for date to preserve YYYY-MM-DD regardless of timezone
    const [date, setDate] = useState(typeof expense.date === 'string' ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0])
    const [loading, setLoading] = useState(false)
    const [payerId, setPayerId] = useState(expense.payer_id || expense.manual_payer_id)

    // Determine initial split type and values would be complex to reverse engineer perfectly
    // For MVP, we default to 'equal' if we can't easily guess, or just let them reset.
    // To make it better: check if all splits are equal?
    const [splitType, setSplitType] = useState<SplitType>('equal')
    const [splitValues, setSplitValues] = useState<Record<string, string>>({})

    // Initialize state when opening
    useEffect(() => {
        if (isOpen) {
            setAmount(expense.amount.toString())
            setDescription(expense.description)
            // Fix: Use Local Time for date input to prevent off-by-one day shift
            const d = new Date(expense.date)
            // If expense.date is YYYY-MM-DD string, new Date() treats it as UTC.
            // We want to preserve the calendar date.
            const dateStr = expense.date.split('T')[0]
            setDate(dateStr)

            setPayerId(expense.payer_id || expense.manual_payer_id)
            // Ideally we parse existing splits here to populate inputs
            // For now, simpler to start fresh or equal
            setSplitType('equal')
            const initial: Record<string, string> = {}
            members.forEach(m => initial[m.id] = '')
            setSplitValues(initial)
        }
    }, [isOpen, expense, members])

    const calculateSplits = (totalAmount: number) => {
        const splits: { id: string, amount_owed: number }[] = []

        if (splitType === 'equal') {
            const splitAmount = Number((totalAmount / members.length).toFixed(2))
            let currentSum = 0
            members.forEach((m, i) => {
                let owed = splitAmount
                if (i === members.length - 1) {
                    owed = Number((totalAmount - currentSum).toFixed(2))
                }
                splits.push({ id: m.id, amount_owed: owed })
                currentSum += owed
            })
        } else if (splitType === 'exact') {
            members.forEach(m => {
                const val = parseFloat(splitValues[m.id] || '0')
                splits.push({ id: m.id, amount_owed: val })
            })
        } else if (splitType === 'percentage') {
            members.forEach(m => {
                const pct = parseFloat(splitValues[m.id] || '0')
                const val = Number((totalAmount * (pct / 100)).toFixed(2))
                splits.push({ id: m.id, amount_owed: val })
            })
        } else if (splitType === 'shares') {
            let totalShares = 0
            members.forEach(m => totalShares += parseFloat(splitValues[m.id] || '0'))
            if (totalShares === 0) return []
            members.forEach(m => {
                const shares = parseFloat(splitValues[m.id] || '0')
                const val = Number((totalAmount * (shares / totalShares)).toFixed(2))
                splits.push({ id: m.id, amount_owed: val })
            })
        }
        return splits
    }

    const validate = (totalAmount: number) => {
        if (!totalAmount || totalAmount <= 0) return 'Enter a valid amount'
        if (!description) return 'Enter a description'
        if (splitType === 'exact') {
            const sum = members.reduce((acc, m) => acc + parseFloat(splitValues[m.id] || '0'), 0)
            if (Math.abs(sum - totalAmount) > 0.05) return `Total split (${sum}) does not match expense amount (${totalAmount})`
        }
        if (splitType === 'percentage') {
            const sum = members.reduce((acc, m) => acc + parseFloat(splitValues[m.id] || '0'), 0)
            if (Math.abs(sum - 100) > 0.1) return `Percentages must add up to 100% (Current: ${sum}%)`
        }
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const totalAmount = parseFloat(amount)
        const error = validate(totalAmount)
        if (error) {
            alert(error)
            return
        }

        const payer = members.find(m => m.id === payerId)
        if (!payer) {
            alert('Invalid payer selected')
            return
        }

        setLoading(true)
        const supabase = createClient()
        const rawSplits = calculateSplits(totalAmount)
        const finalSplits = rawSplits.map(s => {
            const member = members.find(m => m.id === s.id)
            return {
                expense_id: expense.id,
                user_id: member?.type === 'user' ? s.id : null,
                manual_member_id: member?.type === 'manual' ? s.id : null,
                amount_owed: s.amount_owed
            }
        })

        // 1. Update Expense
        const expenseData: any = {
            amount: totalAmount,
            description,
            date
        }
        if (payer.type === 'user') {
            expenseData.payer_id = payer.id
            expenseData.manual_payer_id = null
        } else {
            expenseData.manual_payer_id = payer.id
            expenseData.payer_id = null
        }

        const { error: updateError } = await supabase
            .from('group_expenses')
            .update(expenseData)
            .eq('id', expense.id)

        if (updateError) {
            alert('Update failed: ' + updateError.message)
            setLoading(false)
            return
        }

        // 2. Delete Old Splits
        const { error: deleteError } = await supabase
            .from('expense_splits')
            .delete()
            .eq('expense_id', expense.id)

        if (deleteError) {
            alert('Failed to clear old splits: ' + deleteError.message)
            setLoading(false)
            return
        }

        // 3. Insert New Splits
        const { error: insertError } = await supabase
            .from('expense_splits')
            .insert(finalSplits)

        if (insertError) {
            alert('Failed to insert new splits: ' + insertError.message)
        } else {
            onClose()
            window.location.reload()
        }
        setLoading(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900 dark:border dark:border-gray-800 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold dark:text-white">Edit Expense</h2>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="h-5 w-5 dark:text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <input
                            type="text"
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1 w-full rounded-md border p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                            <input
                                type="number"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="mt-1 w-full rounded-md border p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="mt-1 w-full rounded-md border p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Paid By</label>
                        <select
                            value={payerId}
                            onChange={(e) => setPayerId(e.target.value)}
                            className="mt-1 w-full rounded-md border p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        >
                            {members.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.name} {m.id === userId ? '(You)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Split Update (Defaults to Equal)</label>
                        <div className="flex rounded-md bg-gray-100 p-1 dark:bg-gray-800">
                            {(['equal', 'exact', 'percentage', 'shares'] as SplitType[]).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setSplitType(type)}
                                    className={`flex-1 rounded py-1 text-xs font-medium capitalize transition-colors ${splitType === type
                                        ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-white'
                                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                                        }`}
                                >
                                    {type === 'percentage' ? '%' : type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {splitType !== 'equal' && (
                        <div className="space-y-2 border-t pt-4 dark:border-gray-800">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {splitType === 'exact' && `Remaining: ${(parseFloat(amount || '0') - members.reduce((acc, m) => acc + parseFloat(splitValues[m.id] || '0'), 0)).toFixed(2)}`}
                                {splitType === 'percentage' && `Total: ${members.reduce((acc, m) => acc + parseFloat(splitValues[m.id] || '0'), 0)}%`}
                            </p>
                            {members.map(member => (
                                <div key={member.id} className="flex items-center gap-2">
                                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{member.name}</span>
                                    <div className="relative w-24">
                                        <input
                                            type="number"
                                            value={splitValues[member.id] || ''}
                                            onChange={(e) => setSplitValues(prev => ({ ...prev, [member.id]: e.target.value }))}
                                            className="w-full rounded-md border p-1 text-right text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 rounded-md bg-gray-100 py-2 font-medium hover:bg-gray-200 dark:bg-gray-800 dark:text-white">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 rounded-md bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                            {loading ? 'Updating...' : 'Update Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
