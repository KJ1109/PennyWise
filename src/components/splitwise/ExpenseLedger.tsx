'use client'

import { formatCurrency } from '@/lib/budget'
import { EditGroupExpenseDialog } from './EditGroupExpenseDialog'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ExpenseLedgerProps {
    expenses: any[]
    members: any[]
    groupId: string
    currentUserId: string
    onUpdate?: () => void
}

export function ExpenseLedger({ expenses, members, groupId, currentUserId, onUpdate }: ExpenseLedgerProps) {
    const [editingExpense, setEditingExpense] = useState<any>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const router = useRouter()

    const handleDelete = async (expenseId: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return

        setDeletingId(expenseId)
        const supabase = createClient()
        const { error } = await supabase
            .from('group_expenses')
            .delete()
            .eq('id', expenseId)
            .eq('group_id', groupId)

        if (error) {
            alert('Failed to delete expense: ' + error.message)
            setDeletingId(null)
        } else {
            onUpdate?.()
            router.refresh()
        }
    }

    if (expenses.length === 0) {
        return (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed bg-gray-50 p-8 text-center dark:bg-gray-900/50 dark:border-gray-800">
                <p className="text-gray-500">No expenses recorded yet.</p>
            </div>
        )
    }

    return (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden dark:bg-gray-900 dark:border-gray-800">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400 blue:bg-blue-900/20 blue:text-gray-400">
                        <tr>
                            <th className="px-6 py-4 font-medium">Date</th>
                            <th className="px-6 py-4 font-medium">Description</th>
                            <th className="px-6 py-4 font-medium">Paid By</th>
                            <th className="px-6 py-4 font-medium text-right">Amount</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {expenses.map((expense) => {
                            const payer = members.find(
                                m => m.id === (expense.payer_id || expense.manual_payer_id)
                            )
                            const isPayer = payer?.id === currentUserId

                            return (
                                <tr key={expense.id} className={`group hover:bg-gray-50 dark:hover:bg-gray-800/50 blue:hover:bg-[#1e3a8a] blue:hover:bg-none ${deletingId === expense.id ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                        {new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white blue:text-white blue:group-hover:text-[#D6E6F3]">
                                        {expense.description}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold overflow-hidden dark:bg-gray-700">
                                                {payer?.avatarUrl ? (
                                                    <img src={payer.avatarUrl} alt={payer?.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    payer?.name?.[0]?.toUpperCase() || '?'
                                                )}
                                            </div>
                                            <span className="text-gray-700 dark:text-gray-300 truncate max-w-[100px] blue:text-gray-300 blue:group-hover:text-[#D6E6F3]">
                                                {isPayer ? 'You' : payer?.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white whitespace-nowrap blue:text-white blue:group-hover:text-[#D6E6F3]">
                                        {formatCurrency(expense.amount)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 transition-opacity">
                                            <button
                                                onClick={() => setEditingExpense(expense)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors dark:hover:bg-blue-900/20"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(expense.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {editingExpense && (
                <EditGroupExpenseDialog
                    isOpen={!!editingExpense}
                    onClose={() => setEditingExpense(null)}
                    expense={editingExpense}
                    groupId={groupId}
                    members={members}
                    userId={currentUserId}
                    onUpdate={onUpdate}
                />
            )}
        </div>
    )
}
