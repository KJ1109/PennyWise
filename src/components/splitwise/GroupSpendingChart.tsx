'use client'
import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label } from 'recharts'
import { formatCurrency } from '@/lib/budget'
import { useTheme } from 'next-themes'

const PINK_COLORS = ['#EF2B7C', '#FF69B4', '#F7A1C4', '#CA054D', '#FFB7D5', '#E04F80', '#FF85C0', '#F9A8D4', '#BE185D', '#9D174D']
const DEFAULT_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658', '#FF6B6B', '#a0c4ff', '#bdb2ff', '#ffc6ff']
const DARK_COLORS = ['#a855f7', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#6366f1', '#84cc16', '#f97316', '#ec4899', '#cbd5e1']
const BLUE_COLORS = ['#0F52BA', '#A6C5D7', '#D6E6F3', '#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#1d4ed8', '#1e40af']

interface GroupSpendingChartProps {
    expenses: any[]
    members: any[]
}

export function GroupSpendingChart({ expenses, members }: GroupSpendingChartProps) {
    const { theme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    // Aggregate spending by payer
    const spendingByMember: Record<string, number> = {}

    expenses
        .filter(e => e.description !== 'Settlement')
        .forEach(e => {
            const payerId = e.payer_id || e.manual_payer_id
            if (payerId) {
                spendingByMember[payerId] = (spendingByMember[payerId] || 0) + Number(e.amount)
            }
        })

    const data = Object.entries(spendingByMember)
        .map(([id, amount]) => {
            const member = members.find(m => m.id === id)
            return {
                name: member?.name || 'Unknown',
                value: amount
            }
        })
        .filter(d => d.value > 0)
        .sort((a, b) => b.value - a.value)

    const totalSpending = Object.values(spendingByMember).reduce((a, b) => a + b, 0)

    if (!mounted) return <div className="flex h-full items-center justify-center rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800 animate-pulse" />

    const currentTheme = resolvedTheme || theme
    const isPink = currentTheme === 'pink'
    const isBlue = currentTheme === 'blue'
    const isDark = currentTheme === 'dark'
    const COLORS = isPink ? PINK_COLORS : (isBlue ? BLUE_COLORS : (isDark ? DARK_COLORS : DEFAULT_COLORS))
    const labelFill = isPink ? '#2B1B2A' : (isBlue ? '#ffffff' : (isDark ? '#fafafa' : '#111827'))

    if (data.length === 0) {
        return (
            <div className="flex h-full items-center justify-center rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800 blue:border-[#1e3a8a]">
                <p className="text-gray-500 blue:text-gray-400">No spending data yet</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800 blue:border-[#1e3a8a]">
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-white blue:text-white">Total Spending</h3>
            <div className="flex-1 min-h-[200px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            <Label
                                value={formatCurrency(totalSpending)}
                                position="center"
                                className="font-bold text-lg"
                                style={{ fill: labelFill }}
                            />
                        </Pie>
                        <Tooltip
                            formatter={(value: any) => [formatCurrency(Number(value)), 'Spending']}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: isBlue ? '#000926' : (isDark ? '#1f2937' : '#fff'), color: (isDark || isBlue) ? '#fff' : '#000' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
