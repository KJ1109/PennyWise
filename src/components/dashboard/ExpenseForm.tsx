'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function ExpenseForm({ userId, children }: { userId: string, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    // Use local time for default date (YYYY-MM-DD) to prevent "yesterday" bug in positive timezones
    const [date, setDate] = useState(() => {
        const d = new Date()
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - (offset * 60 * 1000))
        return local.toISOString().split('T')[0]
    })
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.from('expenses').insert({
            user_id: userId,
            amount: parseFloat(amount),
            category,
            description,
            date: date,
        })

        if (!error) {
            setAmount('')
            setCategory('')
            setDescription('')
            setDate(new Date().toISOString().split('T')[0])
            setIsOpen(false)
            setIsOpen(false)
            // Force reload to update all dashboard components (Analytics, Recent Transactions)
            window.location.reload()
        } else {
            alert('Error adding expense')
        }
        setLoading(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Expense</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label htmlFor="date" className="text-sm font-medium">Date</label>
                        <input
                            id="date"
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="amount" className="text-sm font-medium">Amount</label>
                        <input
                            id="amount"
                            type="number"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="0.00"
                        />
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="category" className="text-sm font-medium">Category</label>
                        <select
                            id="category"
                            required
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">Select Category</option>
                            <option value="Food">Food</option>
                            <option value="Transport">Transport</option>
                            <option value="Shopping">Shopping</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Bills">Bills</option>
                            <option value="Rent">Rent</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="description" className="text-sm font-medium">Description (Optional)</label>
                        <input
                            id="description"
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Lunch, Taxi, etc."
                        />
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Adding...' : 'Add Expense'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
