'use client'

import { useState, useMemo, useEffect } from 'react'
import { getBiggestMoneyDrain, predictMonthlySpend, calculateConsistencyScore } from '@/lib/analytics-logic'
import { formatCurrency } from '@/lib/budget'
import { TrendingUp, TrendingDown, Info } from 'lucide-react'
import { useTheme } from 'next-themes'

// Reusable Bar Component
function ScoreBar({ label, score, colorClass, info, hoverTextColorClass }: {
    label: string,
    score: number,
    colorClass: string,
    info: { desc: string, good: string, normal: string, bad: string },
    hoverTextColorClass: string
}) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 blue:text-gray-300 font-display">
                <div className="flex items-center gap-1.5 relative">
                    <span>{label}</span>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`focus:outline-none ${isOpen ? 'text-gray-900 dark:text-white' : 'text-gray-300'}`}
                    >
                        <Info size={12} className={`transition-colors ${hoverTextColorClass}`} />
                    </button>

                    {/* Tooltip */}
                    {isOpen && (
                        <div
                            className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-xl shadow-xl border border-gray-700 z-50 normal-case font-sans tracking-normal"
                            onClick={() => setIsOpen(false)} // Close on click
                        >
                            <p className="mb-2 font-medium text-gray-200 leading-snug">{info.desc}</p>
                            <div className="space-y-1 text-[10px] text-gray-400 border-t border-gray-700 pt-2">
                                <div className="flex justify-between items-center"><span className="text-emerald-400 font-bold">Good (80-100)</span> <span>{info.good}</span></div>
                                <div className="flex justify-between items-center"><span className="text-yellow-400 font-bold">Normal (60-79)</span> <span>{info.normal}</span></div>
                                <div className="flex justify-between items-center"><span className="text-red-400 font-bold">Bad (0-59)</span> <span>{info.bad}</span></div>
                            </div>
                            {/* Arrow */}
                            <div className="absolute top-full left-4 -mt-px border-4 border-transparent border-t-gray-800"></div>
                        </div>
                    )}
                </div>
                <span className={colorClass.replace('bg-', 'text-')}>{Math.round(score)}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                    className={`h-full ${colorClass}`}
                    style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                ></div>
            </div>
        </div>
    )
}

export function AdvancedAnalytics({ expenses, monthlyBudget }: { expenses: any[], monthlyBudget: number }) {
    const { theme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])



    const currentTheme = resolvedTheme || theme
    const isPink = currentTheme === 'pink'
    const isBlue = currentTheme === 'blue'
    const isDark = currentTheme === 'dark'

    const mainColorClass = isPink ? 'bg-[#EF2B7C]' : (isBlue ? 'bg-[#0F52BA]' : (isDark ? 'bg-white' : 'bg-blue-500'))
    const trendTextColorClass = isPink ? 'text-[#EF2B7C]' : (isBlue ? 'text-[#0F52BA]' : (isDark ? 'text-white' : 'text-blue-500'))
    const hoverTextColorClass = isPink ? 'group-hover:text-[#EF2B7C]' : (isBlue ? 'group-hover:text-[#0F52BA]' : (isDark ? 'group-hover:text-white' : 'group-hover:text-blue-500'))

    // 1. Consistency Logic
    const { finalScore, components } = useMemo(() =>
        calculateConsistencyScore(expenses, monthlyBudget),
        [expenses, monthlyBudget])

    // 2. Prediction Logic
    const prediction = useMemo(() =>
        predictMonthlySpend(expenses, monthlyBudget),
        [expenses, monthlyBudget])

    const { status, predictedMonthlySpend } = prediction

    if (!mounted) return <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border dark:bg-gray-900 dark:border-gray-800 h-full animate-pulse" />

    // Colors
    let scoreColor = '#ef4444' // red
    if (finalScore >= 80) scoreColor = '#10b981' // green
    else if (finalScore >= 60) scoreColor = '#f59e0b' // yellow/orange
    else if (finalScore >= 40) scoreColor = '#f97316' // orange

    // Gauge Maths
    const radius = 40
    const stroke = 10
    const normalizedScore = Math.min(100, Math.max(0, finalScore))
    const circumference = radius * Math.PI
    const strokeDashoffset = circumference - (normalizedScore / 100) * circumference

    return (
        <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border dark:bg-gray-900 dark:border-gray-800 h-full flex flex-col justify-between">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white blue:text-white font-display">Financial Health <span className="text-xs font-normal text-gray-400 ml-1">(Last 30 Days)</span></h3>

            {/* Gauge Section */}
            <div className="relative flex flex-col items-center">
                <div className="relative w-40 h-20 overflow-hidden">
                    <svg className="w-full" viewBox="0 0 100 50">
                        {/* Bg Arc */}
                        <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="rgba(255,255,255,0.1)" strokeLinecap="round" strokeWidth={stroke} className="stroke-gray-100 dark:stroke-white/5" />
                        {/* Value Arc */}
                        <path
                            d="M10,50 A40,40 0 0,1 90,50"
                            fill="none"
                            stroke={scoreColor}
                            strokeLinecap="round"
                            strokeWidth={stroke}
                            strokeDasharray={125.6} // approx pi * 40
                            strokeDashoffset={125.6 - (125.6 * normalizedScore / 100)}
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                </div>
                <div className="text-center -mt-4">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white blue:text-white font-display">{Math.round(finalScore)}</span>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Consistency Score</p>
                </div>
            </div>

            {/* Bars */}
            <div className="space-y-3 w-full">
                <ScoreBar
                    label="Daily Spend Variance"
                    score={components.varianceScore}
                    colorClass={mainColorClass}
                    hoverTextColorClass={hoverTextColorClass}
                    info={{
                        desc: "How uneven your daily spending is. High score means consistent, predictable spending.",
                        good: "Very Consistent",
                        normal: "Some Spikes",
                        bad: "Highly Volatile"
                    }}
                />
                <ScoreBar
                    label="Budget Adherence"
                    score={components.budgetScore}
                    colorClass="bg-emerald-500"
                    hoverTextColorClass={hoverTextColorClass}
                    info={{
                        desc: "How often you stay within your daily budget. High score means you rarely overspend.",
                        good: "Always on track",
                        normal: "Occasional slips",
                        bad: "Frequent overspend"
                    }}
                />
                <ScoreBar
                    label="Category Balance"
                    score={components.categoryScore}
                    colorClass="bg-purple-500"
                    hoverTextColorClass={hoverTextColorClass}
                    info={{
                        desc: "Whether your spending is skewed. High score means diverse spending across categories.",
                        good: "Well Balanced",
                        normal: "Moderate skew",
                        bad: "Single category heavy"
                    }}
                />
            </div>

            {/* Footer: Prediction */}
            <div className="pt-6 border-t border-gray-100 dark:border-white/10 w-full">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Predicted Spend</p>
                        <p className={`text-xl font-extrabold font-display ${predictedMonthlySpend > monthlyBudget ? 'text-red-500' : 'text-emerald-500'}`}>
                            {formatCurrency(predictedMonthlySpend)}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className={`flex items-center gap-1 text-xs font-bold ${status === 'Potential savings' ? 'text-emerald-500' : trendTextColorClass}`}>
                            {status === 'Potential savings' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                            <span>{status}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
