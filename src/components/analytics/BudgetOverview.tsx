'use client'

import { FinanceCircle } from '@/components/dashboard/FinanceCircle'
import { calculateDailyBudget } from '@/lib/budget'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

interface BudgetOverviewProps {
    monthlyBudget: number
    spentThisMonth: number
    spentThisWeek: number
    spentToday: number
}

function MiniCircle({ label, budget, spent, color }: { label: string, budget: number, spent: number, color: string }) {
    const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
    const remaining = Math.max(budget - spent, 0)

    return (
        <div className="flex flex-col items-center">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-900/50 blue:bg-zinc-900/50">
                <svg className="absolute h-full w-full rotate-[-90deg]" viewBox="0 0 100 100">
                    <circle
                        className="stroke-gray-200 dark:stroke-zinc-800"
                        cx="50"
                        cy="50"
                        r="40"
                        strokeWidth="8"
                        fill="none"
                    />
                    <circle
                        style={{ stroke: color }}
                        className="transition-all duration-1000 ease-out"
                        cx="50"
                        cy="50"
                        r="40"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * percentage) / 100}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="flex flex-col items-center">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white blue:text-white">
                        {Math.round(percentage)}%
                    </span>
                    <span className="text-[10px] text-gray-500 blue:text-gray-400">Used</span>
                </div>
            </div>
            <div className="mt-2 text-center">
                <p className="text-sm font-medium text-gray-900 dark:text-white blue:text-white">{label}</p>
                <p className="text-xs text-gray-500">Rem: ₹{remaining.toLocaleString()}</p>
            </div>
        </div>
    )
}

export function BudgetOverview({ monthlyBudget, spentThisMonth, spentThisWeek, spentToday }: BudgetOverviewProps) {
    const dailyBudget = calculateDailyBudget(monthlyBudget)
    const weeklyBudget = Math.round(monthlyBudget / 4)
    const { theme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return <div className="bg-white p-6 rounded-3xl shadow-sm border dark:bg-gray-900 dark:border-gray-800 h-full animate-pulse" />

    const isPink = theme === 'pink'
    const isDark = theme === 'dark'
    const mainColor = isPink ? '#EF2B7C' : (isDark ? '#ffffff' : '#3b82f6')

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border dark:bg-gray-900 dark:border-gray-800 h-full">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white blue:text-white font-display">Budget Overview</h3>
                <span className={`text-xs font-semibold px-2 py-1 rounded-md uppercase tracking-wider ${isPink ? 'bg-[#FDF2F8] text-[#EF2B7C] dark:bg-[#EF2B7C]/20 dark:text-[#FF69B4]' : (isDark ? 'bg-zinc-800 text-white border border-zinc-700' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 blue:bg-blue-900/20 blue:text-blue-300')}`}>
                    Active
                </span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 md:gap-4">
                <MiniCircle label="Daily" budget={dailyBudget} spent={spentToday} color={mainColor} />
                <MiniCircle label="Weekly" budget={weeklyBudget} spent={spentThisWeek} color={mainColor} />
                <MiniCircle label="Monthly" budget={monthlyBudget} spent={spentThisMonth} color={mainColor} />
            </div>
        </div>
    )
}

