'use client'

import { formatCurrency } from '@/lib/budget'
import { User, UserCircle } from 'lucide-react'
import { AddMemberDialog } from './AddMemberDialog'

interface GroupNetBalanceProps {
    members: any[]
    balances: Record<string, number>
    currentUserId: string
    groupId: string
}

export function GroupNetBalance({ members, balances, currentUserId, groupId }: GroupNetBalanceProps) {
    const userBalance = balances[currentUserId] || 0
    const sortedMembers = [...members].sort((a, b) => (balances[b.id] || 0) - (balances[a.id] || 0))

    // Check if balance renders as 0 (due to rounding in formatCurrency)
    const isZero = Math.round(Math.abs(userBalance)) === 0

    return (
        <div className="rounded-xl border bg-white shadow-sm dark:bg-gray-900 dark:border-gray-800 flex flex-col h-full">
            {/* User Balance Header */}
            <div className="p-6 border-b dark:border-gray-800">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Balance</h3>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className={`text-3xl font-bold ${isZero ? 'text-gray-900 dark:text-white blue:text-white' : userBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {/* If zero, usually show no sign, or just formatting. formatCurrency(0) handles it. */}
                        {isZero ? formatCurrency(0) : `${userBalance > 0 ? '+' : ''}${formatCurrency(userBalance)}`}
                    </span>
                </div>
                {isZero ? (
                    <p className="mt-1 text-sm text-gray-500">You are all settled up</p>
                ) : (
                    <p className="mt-1 text-sm text-gray-500">
                        {userBalance > 0 ? "You are owed in total" : "You owe in total"}
                    </p>
                )}
            </div>

            {/* Members List */}
            <div className="p-4 flex-1 overflow-y-auto">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Group Members</h4>
                <div className="space-y-3">
                    {sortedMembers.map(member => {
                        const balance = balances[member.id] || 0
                        const isUser = member.id === currentUserId
                        // Use same rounding check for member balances
                        const memberIsZero = Math.round(Math.abs(balance)) === 0

                        let statusColor = 'text-gray-400 dark:text-gray-500'
                        let statusText = 'Settled'

                        if (!memberIsZero) {
                            if (balance > 0) {
                                statusColor = 'text-green-600'
                                statusText = `Gets back ${formatCurrency(balance)}`
                            } else {
                                statusColor = 'text-red-600'
                                statusText = `Owes ${formatCurrency(Math.abs(balance))}`
                            }
                        }

                        if (isUser) {
                            statusText = memberIsZero ? 'Settled' : `${balance > 0 ? 'You are owed' : 'You owe'} ${formatCurrency(Math.abs(balance))}`
                            statusColor = memberIsZero ? 'text-gray-400' : balance > 0 ? 'text-green-600' : 'text-red-600'
                        }

                        return (
                            <div key={member.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="relative h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                        {member.avatarUrl ? (
                                            <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                                                {member.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-white blue:text-white flex items-center gap-2">
                                            {member.name}
                                            {isUser && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-300">You</span>}
                                        </div>
                                        {/* Status Text Below Name */}
                                        <div className={`text-xs font-medium ${statusColor}`}>
                                            {statusText}
                                        </div>
                                    </div>
                                </div>
                                {/* Removed Right-side Balance */}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Footer with Invite Friend */}
            <div className="p-4 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 blue:bg-blue-900/20">
                <div className="w-full flex justify-center">
                    <AddMemberDialog groupId={groupId} />
                </div>
            </div>
        </div>
    )
}
