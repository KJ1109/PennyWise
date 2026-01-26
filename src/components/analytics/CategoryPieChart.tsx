'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '@/lib/budget'

interface CategoryData {
    name: string
    value: number
    color: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658', '#FF6B6B']

export function CategoryPieChart({ expenses }: { expenses: any[] }) {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())

    // Filter expenses by selected month
    const filteredExpenses = expenses.filter(e => new Date(e.date).getMonth() === selectedMonth)

    // Group by category
    const dataDisplay = filteredExpenses.reduce((acc: any[], expense) => {
        const existing = acc.find(item => item.name === expense.category)
        if (existing) {
            existing.value += expense.amount
        } else {
            acc.push({ name: expense.category, value: expense.amount })
        }
        return acc
    }, [])

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border dark:bg-gray-900 dark:border-gray-800 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Spending by Category</h3>
                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="p-1 border rounded text-sm bg-transparent dark:border-gray-700 dark:text-white"
                >
                    {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                </select>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
                {dataDisplay.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={dataDisplay}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {dataDisplay.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        No data used for this month
                    </div>
                )}
            </div>
        </div>
    )
}
