'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/budget'
import { Pencil, Trash2, Calendar, CreditCard, ChevronDown, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { EditExpenseDialog } from './EditExpenseDialog'
import { createClient } from '@/lib/supabase/client'

interface Transaction {
    id: string
    amount: number
    category: string
    description: string | null
    date: string
}

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
    const router = useRouter()
    const [editingExpense, setEditingExpense] = useState<Transaction | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    // Flat list of recent 5 transactions
    const recentTransactions = transactions.slice(0, 5)

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

    if (transactions.length === 0) {
        return (
            <div className="rounded-lg border bg-white p-8 text-center text-gray-500 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400">
                No recent transactions.
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full group select-none"
            >
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white blue:text-white">Recent Activity</h3>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                        Latest 5
                    </span>
                </div>
                {isOpen ? <ChevronDown className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transaction-colors" /> : <ChevronRight className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transaction-colors" />}
            </button>

            {isOpen && (
                <div
                    className="flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200"
                    style={{ contentVisibility: 'auto', contain: 'layout paint' } as React.CSSProperties}
                >
                    {recentTransactions.map((t) => (
                        <div key={t.id} className="rounded-xl border bg-white p-4 shadow-sm dark:bg-gray-900 dark:border-gray-800 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                                    <CreditCard size={18} />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white blue:text-white">{t.description || t.category}</h4>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>{new Date(t.date).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>{t.category}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className="font-bold text-gray-900 dark:text-white blue:text-white">
                                    -{formatCurrency(t.amount)}
                                </span>

                                {/* Hover Actions */}
                                <div className="hidden group-hover:flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditingExpense(t); }}
                                        className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 rounded-md dark:hover:bg-gray-700 blue:text-gray-400 blue:hover:bg-[#D6E6F3] blue:hover:text-[#000926]"
                                        title="Edit"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                                        className="p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-md dark:hover:bg-red-900/20 blue:text-gray-400 blue:hover:bg-[#D6E6F3] blue:hover:text-red-600"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!isOpen && (
                <div
                    onClick={() => setIsOpen(true)}
                    className="cursor-pointer rounded-lg border border-dashed p-4 text-center text-sm text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 transition-colors"
                >
                    Expand to see latest {recentTransactions.length} transactions...
                </div>
            )}

            {editingExpense && (
                <EditExpenseDialog
                    expense={editingExpense}
                    onClose={() => setEditingExpense(null)}
                />
            )}
        </div>
    )
}
