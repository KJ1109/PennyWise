'use client'

import { useState, useEffect } from 'react'
import { Plus, X, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

type SplitType = 'equal' | 'exact' | 'percentage' | 'shares'

export function AddGroupExpense({ groupId, members, userId }: { groupId: string, members: any[], userId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    // Use local time for default date (YYYY-MM-DD)
    const [date, setDate] = useState(() => {
        const d = new Date()
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - (offset * 60 * 1000))
        return local.toISOString().split('T')[0]
    })
    const [loading, setLoading] = useState(false)
    const [splitType, setSplitType] = useState<SplitType>('equal')
    const [payerId, setPayerId] = useState(userId)

    // Stores inputs for Exact/Percentage/Shares. UserId -> Value
    const [splitValues, setSplitValues] = useState<Record<string, string>>({})

    const router = useRouter()

    // Reset values when switching types or opening
    useEffect(() => {
        if (isOpen) {
            const initial: Record<string, string> = {}
            members.forEach(m => initial[m.id] = '')
            setSplitValues(initial)

            // Allow date to persist if actively editing? No, 'Add' usually implies 'Now'.
            // But if they cancel and repoen, maybe they want to start fresh? 
            // Let's force reset to Today to prevent "Yesterday" bug persistence.
            const d = new Date()
            const offset = d.getTimezoneOffset()
            const local = new Date(d.getTime() - (offset * 60 * 1000))
            setDate(local.toISOString().split('T')[0])
        }
    }, [isOpen, members]) // Removed splitType dependency for date reset to avoid overwriting user input when changing split type

    const calculateSplits = (totalAmount: number) => {
        const splits: { id: string, amount_owed: number }[] = []

        if (splitType === 'equal') {
            const splitAmount = Number((totalAmount / members.length).toFixed(2))
            // Adjust last person for rounding errors
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

            if (totalShares === 0) return [] // Avoid div by zero

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

        setLoading(true)
        const supabase = createClient()
        const rawSplits = calculateSplits(totalAmount)

        const payer = members.find(m => m.id === payerId)
        if (!payer) {
            alert('Invalid payer selected')
            setLoading(false)
            return
        }

        // 1. Create Expense
        const expenseData: any = {
            group_id: groupId,
            amount: totalAmount,
            description,
            date
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
            alert('Failed to create expense: ' + eError?.message)
            setLoading(false)
            return
        }

        // 2. Create Splits
        const formattedSplits = rawSplits.map(s => {
            const member = members.find(m => m.id === s.id)
            return {
                expense_id: expense.id,
                user_id: member?.type === 'user' ? s.id : null,
                manual_member_id: member?.type === 'manual' ? s.id : null,
                amount_owed: s.amount_owed
            }
        })

        const { error: sError } = await supabase
            .from('expense_splits')
            .insert(formattedSplits)

        if (sError) {
            console.error('Split Error', sError)
            // Rollback: Delete the expense we just created
            await supabase.from('group_expenses').delete().eq('id', expense.id)
            alert('Failed to create splits. The expense has been cancelled/deleted. Please try again.')
        } else {
            setAmount('')
            setDescription('')
            // Reset Date to Local Today
            const d = new Date()
            const offset = d.getTimezoneOffset()
            const local = new Date(d.getTime() - (offset * 60 * 1000))
            setDate(local.toISOString().split('T')[0])
            setIsOpen(false)
            setSplitValues({})
            setPayerId(userId)
            window.location.reload()
        }
        setLoading(false)
    }

    const isOnline = useNetworkStatus()

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                disabled={!isOnline}
                className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Plus className="h-4 w-4" />
                Add Expense
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900 dark:border dark:border-gray-800 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold dark:text-white">Add Expense</h2>
                    <button onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="h-5 w-5 dark:text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <input
                            type="text"
                            required
                            autoFocus
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1 w-full rounded-md border p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            placeholder="Dinner, Taxi..."
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                        <input
                            type="number"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="mt-1 w-full rounded-md border p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            placeholder="0.00"
                        />
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

                    {/* Split Type Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Split By</label>
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

                    {/* Dynamic Split Inputs */}
                    {splitType !== 'equal' && (
                        <div className="space-y-2 border-t pt-4 dark:border-gray-800">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {splitType === 'exact' && `Remaining: ${(parseFloat(amount || '0') - members.reduce((acc, m) => acc + parseFloat(splitValues[m.id] || '0'), 0)).toFixed(2)}`}
                                {splitType === 'percentage' && `Total: ${members.reduce((acc, m) => acc + parseFloat(splitValues[m.id] || '0'), 0)}%`}
                            </p>
                            {members.map(member => (
                                <div key={member.id} className="flex items-center gap-2">
                                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                                        {member.name}
                                        {member.id === userId && ' (You)'}
                                    </span>
                                    <div className="relative w-24">
                                        <input
                                            type="number"
                                            value={splitValues[member.id] || ''}
                                            onChange={(e) => setSplitValues(prev => ({ ...prev, [member.id]: e.target.value }))}
                                            className="w-full rounded-md border p-1 text-right text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                            placeholder="0"
                                        />
                                        <span className="absolute right-8 top-1.5 text-xs text-gray-400 pointer-events-none">
                                            {splitType === 'percentage' && '%'}
                                            {splitType === 'shares' && 'pts'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {splitType === 'equal' && (
                        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                            <div className="flex gap-2">
                                <AlertCircle className="h-4 w-4 mt-0.5" />
                                <p>Split equally: <strong>{(parseFloat(amount || '0') / (members.length || 1)).toFixed(2)}</strong> per person</p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 pt-4">
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
                            {loading ? 'Adding...' : 'Add Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
