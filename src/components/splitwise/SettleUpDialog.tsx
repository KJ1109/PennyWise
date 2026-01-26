'use client'

import { useState } from 'react'
import { Plus, X, ArrowRight } from 'lucide-react'
import { addGroupExpense } from '@/app/actions/splitwise'

export function SettleUpDialog({ groupId, members, userId }: { groupId: string, members: any[], userId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const [payerId, setPayerId] = useState(userId)
    const [recipientId, setRecipientId] = useState(members.find(m => m.id !== userId)?.id || members[0]?.id)

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

        const payer = members.find(m => m.id === payerId)
        const recipient = members.find(m => m.id === recipientId)

        if (!payer || !recipient) {
            alert('Invalid member selection')
            setLoading(false)
            return
        }

        // Logic: Payer pays Recipient.
        // We model this as an expense paid by Payer, where the split is 100% assigned to Recipient?
        // Wait, if Payer pays Recipient, Recipient receives money.
        // In standard Splitwise toggle: "Payer paid Recipient".
        // This effectively means Payer covers a debt TO Recipient.
        // If Payer OWED Recipient, Payer gives money.
        // This transaction should REDUCE Payer's debt to Recipient.
        // If we record an expense: Payer = PayerId. Split = [RecipientId ows Amount].
        // Then Payer -> Recipient (Payer paid for Recipient).
        // Recipient owes Payer.
        // If Payer previously owed Recipient, now Recipient owes Payer (counter-acting).
        // So yes, this is the correct modeling.

        // Splits array: Recipient owes the full amount
        const splits = [{
            user_id: recipient.type === 'user' ? recipient.id : undefined,
            manual_member_id: recipient.type === 'manual' ? recipient.id : undefined,
            amount_owed: totalAmount
        }]

        const res = await addGroupExpense(
            groupId,
            totalAmount,
            'Settlement',
            new Date().toISOString().split('T')[0],
            payer.id,
            payer.type,
            splits
        )

        if (res.error) {
            alert(res.error)
        } else {
            setAmount('')
            setIsOpen(false)
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
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900 dark:border dark:border-gray-800">
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
