'use client'

import { useState } from 'react'
import { updateExpense } from '@/app/actions/expenses'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface EditExpenseDialogProps {
    expense: {
        id: string
        amount: number
        category: string
        description: string | null
        date: string
    }
    onClose: () => void
}

export function EditExpenseDialog({ expense, onClose }: EditExpenseDialogProps) {
    const [amount, setAmount] = useState(expense.amount.toString())
    const [category, setCategory] = useState(expense.category)
    const [description, setDescription] = useState(expense.description || '')
    const [date, setDate] = useState(expense.date)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData()
        formData.append('amount', amount)
        formData.append('category', category)
        formData.append('description', description)
        formData.append('date', date)

        const res = await updateExpense(expense.id, formData)

        if (res.error) {
            alert(res.error)
        } else {
            router.refresh()
            onClose()
        }
        setLoading(false)
    }

    // Handle open change: if false, Trigger onClose
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            onClose()
        }
    }

    return (
        <Dialog open={true} onOpenChange={handleOpenChange}>
            {/* Added z-[60] to ensure it sits above the Sheet (z-50) */}
            <DialogContent className="sm:max-w-md z-[60]" onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>Edit Expense</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="mt-1 w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white bg-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                        <input
                            type="number"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="mt-1 w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white bg-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                        <select
                            required
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="mt-1 w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white bg-transparent"
                        >
                            <option value="Food">Food</option>
                            <option value="Transport">Transport</option>
                            <option value="Shopping">Shopping</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Bills">Bills</option>
                            <option value="Rent">Rent</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1 w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white bg-transparent"
                        />
                    </div>

                    <DialogFooter>
                        <div className="flex w-full gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 rounded-md bg-gray-100 py-2 font-medium hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 rounded-md bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
