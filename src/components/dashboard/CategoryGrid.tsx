'use client'

import { useState, useMemo } from 'react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { formatCurrency } from '@/lib/budget'
import { ShoppingBag, Coffee, Car, Film, Receipt, Home, HelpCircle, Pencil, Trash2 } from 'lucide-react'
import { deleteExpense } from '@/app/actions/expenses'
import { useRouter } from 'next/navigation'
import { EditExpenseDialog } from './EditExpenseDialog'

// Icon mapping
const categoryIcons: Record<string, any> = {
    'Food': Coffee,
    'Transport': Car,
    'Shopping': ShoppingBag,
    'Entertainment': Film,
    'Bills': Receipt,
    'Rent': Home,
    'Other': HelpCircle
}

interface Transaction {
    id: string
    amount: number
    category: string
    description: string | null
    date: string
}

export function CategoryGrid({ expenses }: { expenses: Transaction[] }) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
    const [editingExpense, setEditingExpense] = useState<Transaction | null>(null)

    const router = useRouter()
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()

    // 1. Calculate Statistics for Cards & Drawer Context
    const categoryStats = useMemo(() => {
        const stats: Record<string, { currentMonth: number, yearly: number }> = {}
        const cats = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Rent', 'Other']

        // Initialize
        cats.forEach(c => stats[c] = { currentMonth: 0, yearly: 0 })

        expenses.forEach(e => {
            const d = new Date(e.date)
            // Ensure category exists in map
            if (!stats[e.category]) stats[e.category] = { currentMonth: 0, yearly: 0 }

            // Add to Yearly (Current Year)
            if (d.getFullYear() === currentYear) {
                stats[e.category].yearly += e.amount

                // Add to Current Month
                if (d.getMonth() === currentMonth) {
                    stats[e.category].currentMonth += e.amount
                }
            }
        })
        return stats
    }, [expenses, currentYear, currentMonth])

    // 2. Filter expenses for the Drawer based on selection
    const drawerExpenses = useMemo(() => {
        if (!selectedCategory) return []
        return expenses.filter(e => {
            const d = new Date(e.date)
            const isCategory = e.category === selectedCategory
            const isYear = d.getFullYear() === selectedYear
            const isMonth = d.getMonth() === selectedMonth
            return isCategory && isYear && isMonth
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [expenses, selectedCategory, selectedYear, selectedMonth])

    // Calculate Total for the SELECTED Year (not just current year)
    const drawerYearlyTotal = useMemo(() => {
        if (!selectedCategory) return 0
        return expenses
            .filter(e => {
                const d = new Date(e.date)
                return e.category === selectedCategory && d.getFullYear() === selectedYear
            })
            .reduce((sum, e) => sum + e.amount, 0)
    }, [expenses, selectedCategory, selectedYear])

    const drawerTotal = drawerExpenses.reduce((sum, e) => sum + e.amount, 0)

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this expense?')) {
            const res = await deleteExpense(id)
            if (res.error) {
                alert(res.error)
            } else {
                router.refresh()
            }
        }
    }

    return (
        <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white blue:text-white">Expenses by Category</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(categoryStats).map(([cat, stat]) => {
                    const Icon = categoryIcons[cat] || HelpCircle
                    const isOpen = selectedCategory === cat

                    return (
                        <Sheet
                            key={cat}
                            open={isOpen}
                            onOpenChange={(open) => {
                                if (open) {
                                    setSelectedCategory(cat)
                                    // Reset to current month when opening
                                    setSelectedYear(currentYear)
                                    setSelectedMonth(currentMonth)
                                } else {
                                    // Prevent closing if an edit dialog is currently open!
                                    if (editingExpense) return
                                    setSelectedCategory(null)
                                }
                            }}
                        >
                            <SheetTrigger asChild>
                                <button
                                    className="flex flex-col items-start gap-3 p-4 bg-white dark:bg-gray-900 blue:bg-card border dark:border-gray-800 rounded-xl hover:shadow-md transition-all text-left group blue:hover:bg-[#1e3a8a] blue:hover:bg-none hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    <div className="flex justify-between w-full">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors blue:bg-white/10 blue:text-white blue:group-hover:bg-[#D6E6F3] blue:group-hover:text-[#000926]">
                                            <Icon size={20} />
                                        </div>
                                    </div>

                                    <div className="w-full mt-2">
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 blue:text-gray-400 blue:group-hover:text-[#D6E6F3] truncate">{cat}</p>
                                        <div className="mt-1 flex flex-col">
                                            {/* Removed Total text here as requested */}
                                            <span className="text-lg font-bold text-gray-900 dark:text-white blue:text-white blue:group-hover:text-[#D6E6F3]">
                                                {formatCurrency(stat.currentMonth)}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            </SheetTrigger>

                            <SheetContent side="right" className="w-full sm:w-[400px]">
                                <SheetHeader>
                                    <SheetTitle className="flex items-center gap-2">
                                        <Icon size={24} className="text-blue-600" />
                                        {cat} Expenses
                                    </SheetTitle>
                                    <SheetDescription>
                                        View details for {new Date(0, selectedMonth).toLocaleString('default', { month: 'long' })} {selectedYear}
                                    </SheetDescription>
                                </SheetHeader>

                                <div className="mt-6 space-y-6">
                                    {/* Filters */}
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                            className="flex-1 h-10 px-3 rounded-md border text-sm dark:bg-gray-900 dark:border-gray-800"
                                        >
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                                            className="w-24 h-10 px-3 rounded-md border text-sm dark:bg-gray-900 dark:border-gray-800"
                                        >
                                            {[currentYear, currentYear - 1].map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Summary Card - Yearly + Monthly */}
                                    <div className="flex flex-col gap-2">
                                        {/* Yearly Total (Above Monthly) */}
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex justify-between items-center border border-blue-100 dark:border-blue-900/30">
                                            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Yearly Total ({selectedYear})</span>
                                            <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(drawerYearlyTotal)}</span>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg flex justify-between items-center">
                                            <span className="text-sm font-medium">Monthly Total</span>
                                            <span className="text-xl font-bold text-gray-900 dark:text-white blue:text-white">{formatCurrency(drawerTotal)}</span>
                                        </div>
                                    </div>

                                    {/* List */}
                                    <div className="space-y-3 h-[60vh] overflow-y-auto pr-2 pb-10">
                                        {drawerExpenses.length > 0 ? (
                                            drawerExpenses.map((expense) => (
                                                <div key={expense.id} className="flex flex-col p-3 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-lg shadow-sm gap-3">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm text-gray-900 dark:text-white blue:text-white">{expense.description || 'Expense'}</span>
                                                            <span className="text-xs text-gray-500 blue:text-gray-400">{new Date(expense.date).toLocaleDateString()}</span>
                                                        </div>
                                                        <span className="font-semibold text-gray-900 dark:text-white blue:text-white">
                                                            {formatCurrency(expense.amount)}
                                                        </span>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex gap-2 border-t pt-2 dark:border-gray-800">
                                                        <button
                                                            onClick={() => setEditingExpense(expense)}
                                                            className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                                        >
                                                            <Pencil size={12} /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(expense.id)}
                                                            className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/30 text-red-600"
                                                        >
                                                            <Trash2 size={12} /> Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10 text-gray-500 text-sm">
                                                No expenses found for this month
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    )
                })}
            </div>

            {/* Edit Dialog */}
            {editingExpense && (
                <EditExpenseDialog
                    expense={editingExpense}
                    onClose={() => setEditingExpense(null)}
                />
            )}
        </section>
    )
}
