'use client'

import { formatCurrency } from '@/lib/budget'

interface FinanceCircleProps {
    dailyBudget: number
    spentToday: number
}

export function FinanceCircle({ dailyBudget, spentToday }: FinanceCircleProps) {
    const percentage = dailyBudget > 0 ? Math.min((spentToday / dailyBudget) * 100, 100) : 0
    const remaining = Math.max(dailyBudget - spentToday, 0)
    const isOverBudget = spentToday > dailyBudget

    // SVG parameters
    const radius = 120
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
        <div className="flex flex-col items-center justify-center py-8">
            <div className="relative flex h-80 w-80 items-center justify-center">
                {/* Background Circle */}
                <svg className="absolute h-full w-full rotate-[-90deg]">
                    <circle
                        cx="50%"
                        cy="50%"
                        r={radius}
                        fill="transparent"
                        stroke="#e5e7eb" // gray-200
                        strokeWidth="20"
                        strokeLinecap="round"
                    />
                    {/* Progress Circle */}
                    <circle
                        cx="50%"
                        cy="50%"
                        r={radius}
                        fill="transparent"
                        stroke={isOverBudget ? '#ef4444' : '#2563eb'} // red-500 or blue-600
                        strokeWidth="20"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>

                {/* Center Text */}
                <div className="absolute flex flex-col items-center text-center">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Remaining Today</span>
                    <span className={`text-4xl font-bold ${isOverBudget ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                        {formatCurrency(remaining)}
                    </span>
                    <span className="mt-1 text-xs text-gray-400">
                        of {formatCurrency(dailyBudget)}
                    </span>
                </div>
            </div>

            <div className="mt-4 flex gap-8">
                <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Spent Today</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{formatCurrency(spentToday)}</p>
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Daily Budget</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{formatCurrency(dailyBudget)}</p>
                </div>
            </div>
        </div>
    )
}
