'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/budget'
import { simplifyDebts, calculatePairwiseDebts, calculateBalances } from '@/lib/split'
import { ArrowRight, ArrowRightLeft, Scale } from 'lucide-react'

type ViewMode = 'balances' | 'settle-up'

export function DebtSummary({
    members,
    expenses,
    currentUserId
}: {
    members: any[]
    expenses: any[]
    currentUserId: string
}) {
    const [viewMode, setViewMode] = useState<ViewMode>('balances')

    // 1. Calculate Net Balances for "Your Balance"
    const netBalances = calculateBalances(members, expenses)

    // 2. Calculate Settlements based on Mode
    let settlements: { from: string, to: string, amount: number }[] = []

    // Check if everyone is effectively settled (Net Balance ~ 0)
    // If so, we shouldn't show circular debts even in Direct mode
    const allSettled = Object.values(netBalances).every(b => Math.abs(b) < 0.01)

    if (!allSettled) {
        if (viewMode === 'balances') {
            settlements = calculatePairwiseDebts(expenses, members)
        } else {
            settlements = simplifyDebts(netBalances)
        }
    }

    // Filter out settlements that round to 0 (e.g. < 0.5) to avoid "Pays ₹0"
    settlements = settlements.filter(s => Math.round(s.amount) > 0)

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white blue:text-white">Settlements</h3>
                <div className="flex bg-gray-100 p-1 rounded-lg dark:bg-gray-800">
                    <button
                        onClick={() => setViewMode('balances')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${viewMode === 'balances'
                            ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white blue:text-white'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                            }`}
                        title="Show all direct debts"
                    >
                        <ArrowRightLeft className="h-3 w-3" />
                        Direct
                    </button>
                    <button
                        onClick={() => setViewMode('settle-up')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${viewMode === 'settle-up'
                            ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-white blue:text-white'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                            }`}
                        title="Simplify debts to minimize transactions"
                    >
                        <Scale className="h-3 w-3" />
                        Simplified
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                {settlements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3 dark:bg-green-900/20">
                            <Scale className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-gray-900 font-medium dark:text-white blue:text-white">All settled up!</p>
                        <p className="text-xs text-gray-500 mt-1">No pending debts between members.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {viewMode === 'settle-up' && (
                            <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 flex gap-2">
                                <Scale className="h-4 w-4 shrink-0" />
                                <p>Debts are simplified to minimize the number of transactions required to settle up.</p>
                            </div>
                        )}
                        {settlements.map((s, i) => {
                            const fromMember = members.find(m => m.id === s.from)
                            const toMember = members.find(m => m.id === s.to)
                            const isCurrentUserInvolved = s.from === currentUserId || s.to === currentUserId

                            // Mock avatars or text fallback
                            const FromAvatar = () => (
                                <div className="h-10 w-10 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center dark:bg-gray-700 dark:border-gray-800">
                                    {fromMember?.avatarUrl ? (
                                        <img src={fromMember.avatarUrl} alt={fromMember.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{fromMember?.name?.charAt(0)}</span>
                                    )}
                                </div>
                            )

                            const ToAvatar = () => (
                                <div className="h-10 w-10 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center dark:bg-gray-700 dark:border-gray-800">
                                    {toMember?.avatarUrl ? (
                                        <img src={toMember.avatarUrl} alt={toMember.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{toMember?.name?.charAt(0)}</span>
                                    )}
                                </div>
                            )

                            return (
                                <div key={i} className={`relative flex items-center justify-between p-4 rounded-xl border transition-all ${isCurrentUserInvolved
                                    ? 'bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800 blue:bg-blue-900/40'
                                    : 'bg-white border-gray-100 dark:bg-gray-800/50 dark:border-gray-800 blue:bg-card'
                                    }`}>
                                    <div className="flex items-center gap-3 z-10">
                                        <FromAvatar />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white blue:text-white">{fromMember?.name}</span>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Payer</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center px-4 z-10">
                                        <span className="text-xs font-bold text-gray-400 mb-1">pays</span>
                                        <div className="flex items-center text-gray-300 dark:text-gray-600">
                                            <div className="h-[1px] w-8 bg-current"></div>
                                            <ArrowRight className="h-3 w-3 -ml-1" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 mt-1 dark:text-white blue:text-white">{formatCurrency(s.amount)}</span>
                                    </div>

                                    <div className="flex items-center gap-3 z-10 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white blue:text-white">{toMember?.name}</span>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Receiver</span>
                                        </div>
                                        <ToAvatar />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
