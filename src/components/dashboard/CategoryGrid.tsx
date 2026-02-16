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
import { HelpCircle, Pencil, Trash2, Settings, MoreVertical } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { EditExpenseDialog } from './EditExpenseDialog'
import { createClient } from '@/lib/supabase/client'
import { useCategories, getCategoryIcon, Category } from '@/lib/categories'
import { AddCategoryDialog } from './AddCategoryDialog'
import { EditCategoryDialog } from './EditCategoryDialog'
import { CategoryManager } from './CategoryManager'
import { Button } from '@/components/ui/button'

interface Transaction {
    id: string
    amount: number
    category: string
    description: string | null
    date: string
}

export function CategoryGrid({ expenses, userId }: { expenses: Transaction[], userId: string }) {
    const { uiCategories, categories: customCategories, refreshCategories } = useCategories(userId)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
    const [editingExpense, setEditingExpense] = useState<Transaction | null>(null)

    // Custom Category Management State
    const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null)

    const router = useRouter()
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()

    // 1. Calculate Statistics for Cards & Drawer Context
    const categoryStats = useMemo(() => {
        const stats: Record<string, { currentMonth: number, yearly: number }> = {}

        // Initialize with ALL available categories (Default + Custom Active)
        uiCategories.forEach(c => stats[c.name] = { currentMonth: 0, yearly: 0 })

        // Also ensure any "orphan" or "archived" categories in expenses are tracked
        expenses.forEach(e => {
            if (!stats[e.category]) stats[e.category] = { currentMonth: 0, yearly: 0 }
        })

        expenses.forEach(e => {
            const d = new Date(e.date)
            // Ensure category exists in map (redundant safety)
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
    }, [expenses, currentYear, currentMonth, uiCategories])

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
            const supabase = createClient()
            const { error } = await supabase.from('expenses').delete().eq('id', id)

            if (error) {
                alert('Failed to delete expense: ' + error.message)
            } else {
                window.location.reload()
            }
        }
    }

    // Identify if a category is custom and getting its full object for editing
    const getCustomCategory = (name: string) => {
        return customCategories.find(c => c.name === name)
    }

    // Filter out categories that have 0 spending AND are not in the UI list (hidden archived ones with no data)
    // But we WANT to show all UI categories (even 0 spent)
    const categoriesToRender = Object.keys(categoryStats).filter(catName => {
        // Show if it exists in UI Categories OR if it has spending data (historical/archived)
        const isUiCategory = uiCategories.some(c => c.name === catName)
        const hasData = categoryStats[catName].yearly > 0 || categoryStats[catName].currentMonth > 0
        return isUiCategory || hasData
    }).sort((a, b) => {
        // Sort: Active UI categories first, then archived/others
        const aIsUi = uiCategories.some(c => c.name === a)
        const bIsUi = uiCategories.some(c => c.name === b)
        if (aIsUi && !bIsUi) return -1
        if (!aIsUi && bIsUi) return 1
        return a.localeCompare(b)
    })

    return (
        <section className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white blue:text-white">Expenses by Category</h2>
                <CategoryManager
                    userId={userId}
                    archivedCategories={customCategories.filter(c => c.is_archived)}
                    onUpdate={refreshCategories}
                />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categoriesToRender.map((cat) => {
                    const stat = categoryStats[cat]
                    const customCat = getCustomCategory(cat) // Is it a custom category?
                    const Icon = getCategoryIcon(cat, customCat?.icon)
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
                                    className="relative flex flex-col items-start gap-3 p-4 bg-white dark:bg-gray-900 blue:bg-card border dark:border-gray-800 rounded-xl hover:shadow-md transition-all text-left group blue:hover:bg-[#1e3a8a] blue:hover:bg-none hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    <div className="flex justify-between w-full">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors blue:bg-white/10 blue:text-white blue:group-hover:bg-[#D6E6F3] blue:group-hover:text-[#000926]">
                                            <Icon size={20} />
                                        </div>
                                        {/* Edit Button for Custom Categories */}
                                        {customCat && !customCat.is_archived && (
                                            <div
                                                role="button"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setCategoryToEdit(customCat)
                                                }}
                                                className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                            >
                                                <Pencil size={14} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-full mt-2">
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 blue:text-gray-400 blue:group-hover:text-[#D6E6F3] truncate pr-2">
                                            {cat} {customCat?.is_archived && '(Archived)'}
                                        </p>
                                        <div className="mt-1 flex flex-col">
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

                {/* Add Category Card */}
                <AddCategoryDialog userId={userId} onCategoryAdded={refreshCategories} />
            </div>

            {/* Edit Dialog - For Expenses */}
            {editingExpense && (
                <EditExpenseDialog
                    expense={editingExpense}
                    onClose={() => setEditingExpense(null)}
                />
            )}

            {/* Edit Dialog - For Custom Categories */}
            {categoryToEdit && (
                <EditCategoryDialog
                    category={categoryToEdit}
                    isOpen={!!categoryToEdit}
                    onClose={() => setCategoryToEdit(null)}
                    onUpdate={refreshCategories}
                />
            )}
        </section>
    )
}

