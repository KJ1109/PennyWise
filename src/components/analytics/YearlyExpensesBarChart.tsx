'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts'
import { formatCurrency } from '@/lib/budget'
import { useTheme } from 'next-themes'

export function YearlyExpensesBarChart({ expenses, monthlyBudget }: { expenses: any[], monthlyBudget: number }) {
    const weeklyBudget = monthlyBudget / 4
    const { theme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [viewMode, setViewMode] = useState<'yearly' | 'monthly'>('yearly')
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())

    useEffect(() => setMounted(true), [])

    if (!mounted) return <div className="bg-white p-6 rounded-3xl shadow-sm border dark:bg-gray-900 dark:border-gray-800 h-full animate-pulse" />

    const currentTheme = resolvedTheme || theme
    const isPink = currentTheme === 'pink'
    const isBlue = currentTheme === 'blue'
    const isDark = currentTheme === 'dark'

    const mainColor = isPink ? '#EF2B7C' : (isBlue ? '#0F52BA' : (isDark ? '#ffffff' : '#3b82f6'))
    const buttonActiveClass = isPink
        ? 'bg-white text-[#EF2B7C] shadow-sm dark:bg-zinc-800 dark:text-[#FF69B4]'
        : (isBlue
            ? 'bg-[#0F52BA] text-white shadow-sm border border-[#1e3a8a]'
            : (isDark ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-white'))
    const ringClass = isPink ? 'focus:ring-[#EF2B7C]' : (isBlue ? 'focus:ring-[#0F52BA]' : (isDark ? 'focus:ring-white' : 'focus:ring-blue-500'))



    const years = Array.from(new Set(expenses.map(e => new Date(e.date).getFullYear()))).sort((a, b) => b - a)
    if (!years.includes(new Date().getFullYear())) years.unshift(new Date().getFullYear())

    // Prepare Data
    let chartData = []

    if (viewMode === 'yearly') {
        // Aggregate by month (Existing Logic)
        chartData = Array.from({ length: 12 }, (_, i) => {
            const monthName = new Date(0, i).toLocaleString('default', { month: 'short' })
            const total = expenses
                .filter(e => {
                    const d = new Date(e.date)
                    return d.getFullYear() === selectedYear && d.getMonth() === i
                })
                .reduce((sum, e) => sum + Number(e.amount), 0)

            const limit = monthlyBudget
            const withinBudget = Math.min(total, limit)
            const overBudget = Math.max(0, total - limit)

            return { name: monthName, total, withinBudget, overBudget, limit }
        })
    } else {
        // Aggregate by Week (1-4/5) for selected Month
        // Logic: Get week number of the month
        chartData = Array.from({ length: 5 }, (_, i) => {
            const weekLabel = `Week ${i + 1}`
            const total = expenses
                .filter(e => {
                    const d = new Date(e.date)
                    const isSameMonth = d.getFullYear() === selectedYear && d.getMonth() === selectedMonth
                    if (!isSameMonth) return false

                    // Simple week calc: 1-7 = W1, 8-14 = W2, etc.
                    const day = d.getDate()
                    const weekIndex = Math.floor((day - 1) / 7)
                    return weekIndex === i
                })
                .reduce((sum, e) => sum + Number(e.amount), 0)

            const limit = weeklyBudget
            const withinBudget = Math.min(total, limit)
            const overBudget = Math.max(0, total - limit)

            return { name: weekLabel, total, withinBudget, overBudget, limit }
        })
        // Filter out empty Week 5 if relevant? No, keep consistant axis.
    }

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border dark:bg-gray-900 dark:border-gray-800 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white blue:text-white font-display">
                    {viewMode === 'yearly' ? 'Yearly Trends' : 'Monthly Breakdown'}
                </h3>

                <div className="flex items-center gap-3">
                    {/* Toggle View Mode */}
                    <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                        <button
                            onClick={() => setViewMode('yearly')}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${viewMode === 'yearly' ? buttonActiveClass : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            Year
                        </button>
                        <button
                            onClick={() => setViewMode('monthly')}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${viewMode === 'monthly' ? buttonActiveClass : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            Month
                        </button>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2">
                        {viewMode === 'monthly' && (
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className={`px-2 py-1 border border-gray-200 dark:border-gray-700 blue:border-[#1e3a8a] rounded-lg text-xs font-semibold bg-transparent dark:bg-zinc-900 blue:bg-[#000926] blue:text-white outline-none focus:ring-1 ${ringClass}`}
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'short' })}</option>
                                ))}
                            </select>
                        )}
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className={`px-2 py-1 border border-gray-200 dark:border-gray-700 blue:border-[#1e3a8a] rounded-lg text-xs font-semibold bg-transparent dark:bg-zinc-900 blue:bg-[#000926] blue:text-white outline-none focus:ring-1 ${ringClass}`}
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={mainColor} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={mainColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.1)" />
                        <XAxis
                            dataKey="name"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: 'rgba(156, 163, 175, 0.8)' }}
                            tickFormatter={(value) => value.toString().slice(0, 3)}
                            interval="preserveStartEnd"
                            minTickGap={5}
                            tickMargin={10}
                            padding={{ left: 10, right: 10 }}
                        />
                        <YAxis
                            width={45}
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `₹${value / 1000}k`}
                            tick={{ fill: 'rgba(156, 163, 175, 0.8)' }}
                            tickMargin={10}
                        />
                        <Tooltip
                            formatter={(value: any) => [formatCurrency(Number(value)), 'Spend']}
                            cursor={{ stroke: mainColor, strokeWidth: 1, strokeDasharray: '5 5' }}
                            contentStyle={{
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                                color: '#fff',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke={mainColor}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

