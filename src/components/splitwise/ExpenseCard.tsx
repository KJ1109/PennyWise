'use client'

import { EditGroupExpenseDialog } from './EditGroupExpenseDialog'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { formatCurrency } from '@/lib/budget'
import { createClient } from '@/lib/supabase/client'

export function ExpenseCard({
    expense,
    groupId,
    members,
    userId
}: {
    expense: any,
    groupId: string,
    members: any[],
    userId: string
}) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this expense?')) return

        setIsDeleting(true)
        const supabase = createClient()
        const { error } = await supabase
            .from('group_expenses')
            .delete()
            .eq('id', expense.id)
            .eq('group_id', groupId)

        if (error) {
            alert('Failed to delete expense: ' + error.message)
            setIsDeleting(false)
        } else {
            window.location.reload()
        }
    }

    const payerName = expense.profiles?.full_name || expense.manual_members?.name || 'Unknown'

    return (
        <>
            <div className={`flex flex-col rounded-lg border bg-white p-4 shadow-sm transition-opacity dark:bg-gray-900 dark:border-gray-800 ${isDeleting ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-start">
                    <div>
                        <span className="font-semibold dark:text-white block">{expense.description}</span>
                        <div className="text-xs text-gray-500 mt-1">
                            Paid by {payerName} • {new Date(expense.date).toLocaleDateString()}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-bold dark:text-white">{formatCurrency(expense.amount)}</span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                title="Edit Expense"
                            >
                                <Pencil className="h-4 w-4" />
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                title="Delete Expense"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isEditing && (
                <EditGroupExpenseDialog
                    isOpen={isEditing}
                    onClose={() => setIsEditing(false)}
                    expense={expense}
                    groupId={groupId}
                    members={members}
                    userId={userId}
                />
            )}
        </>
    )
}
