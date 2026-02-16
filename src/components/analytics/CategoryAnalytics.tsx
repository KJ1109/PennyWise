'use client'

import { useState, useMemo, useEffect } from 'react'
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts'
import { formatCurrency } from '@/lib/budget'
import {
    PieChart as PieIcon, LineChart as LineIcon, Utensils, TrendingUp,
    Car, Home, ShoppingBag, Gamepad2, Plane, Gift, Zap, DollarSign, Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { useCategories, getCategoryIcon } from '@/lib/categories'

const PINK_COLORS = ['#EF2B7C', '#FF69B4', '#F7A1C4', '#CA054D', '#FFB7D5', '#E04F80', '#FF85C0', '#F9A8D4', '#BE185D', '#9D174D']
const DEFAULT_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658', '#FF6B6B', '#a0c4ff', '#bdb2ff', '#ffc6ff']
const DARK_COLORS = ['#a855f7', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#6366f1', '#84cc16', '#f97316', '#ec4899', '#cbd5e1']
const BLUE_COLORS = ['#0F52BA', '#A6C5D7', '#D6E6F3', '#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#1d4ed8', '#1e40af']

export function CategoryAnalytics({ expenses, userId }: { expenses: any[], userId: string }) {
    const { theme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const { uiCategories, categories: customCategories } = useCategories(userId)

    useEffect(() => setMounted(true), [])

    const currentTheme = resolvedTheme || theme
    const isPink = currentTheme === 'pink'
    const isBlue = currentTheme === 'blue'
    const isDark = currentTheme === 'dark'

    const COLORS = isPink ? PINK_COLORS : (isBlue ? BLUE_COLORS : (isDark ? DARK_COLORS : DEFAULT_COLORS))
    const mainColor = isPink ? '#EF2B7C' : (isBlue ? '#0F52BA' : (isDark ? '#ffffff' : '#3b82f6'))

    const buttonActiveClass = isPink
        ? 'bg-white shadow text-[#EF2B7C] dark:bg-zinc-800 dark:text-[#FF69B4]'
        : (isBlue
            ? 'bg-[#0F52BA] text-white shadow-sm border border-[#1e3a8a]'
            : (isDark
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'bg-white shadow text-blue-600 dark:bg-gray-700 dark:text-blue-400'))

    const [chartType, setChartType] = useState<'pie' | 'line'>('pie')
    const [viewMode, setViewMode] = useState<'yearly' | 'monthly'>('monthly')
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
    const [selectedCategory, setSelectedCategory] = useState<string>('All')
    const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

    // Helper to get icon for a given category name (using shared logic)
    const getIconForCategory = (catName: string) => {
        const customCat = customCategories.find(c => c.name === catName)
        return getCategoryIcon(catName, customCat?.icon)
    }

    // 1. Extract Unique Categories & Years
    const categories = useMemo(() => {
        // We use all categories present in the EXPENSES data + UI Categories
        // This ensures archived categories with historical data are shown
        const dynamicCats = new Set(expenses.map(e => e.category))

        // Also include all defined UI categories (so selector has them even if 0 spend)
        uiCategories.forEach(c => dynamicCats.add(c.name))

        return ['All', ...Array.from(dynamicCats)].sort()
    }, [expenses, uiCategories])

    const years = useMemo(() => {
        return Array.from(new Set(expenses.map(e => new Date(e.date).getFullYear()))).sort((a, b) => b - a)
    }, [expenses])

    // Ensure current year is in list
    if (!years.includes(new Date().getFullYear())) years.unshift(new Date().getFullYear())


    // 2. Filter Logic & Insights
    const { chartData, insights } = useMemo(() => {
        // Base Time Filter
        let timeFiltered = expenses.filter(e => new Date(e.date).getFullYear() === selectedYear)
        if (viewMode === 'monthly') {
            timeFiltered = timeFiltered.filter(e => new Date(e.date).getMonth() === selectedMonth)
        }

        // --- Insights Calculation (Based on timeFiltered - showing stats for the PERIOD) ---
        const categoryTotals: Record<string, number> = {}
        timeFiltered.forEach(e => {
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
        })
        const topCatName = Object.keys(categoryTotals).reduce((a, b) => categoryTotals[a] > categoryTotals[b] ? a : b, '')
        const topCatAmount = topCatName ? categoryTotals[topCatName] : 0
        const maxTransaction = timeFiltered.reduce((max: any, e: any) => (e.amount > (max?.amount || 0) ? e : max), null)

        const insightsData = {
            topCategory: { name: topCatName || 'None', amount: topCatAmount },
            maxTxn: maxTransaction
        }

        // --- Chart Data Preparation ---
        let finalChartData = []

        if (chartType === 'pie') {
            // Group by Category for Pie
            finalChartData = Object.entries(categoryTotals)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
        } else {
            // Line Chart Logic
            let categoryFiltered = timeFiltered
            if (selectedCategory !== 'All') {
                categoryFiltered = timeFiltered.filter(e => e.category === selectedCategory)
            }

            if (viewMode === 'yearly') {
                finalChartData = Array.from({ length: 12 }, (_, i) => {
                    const monthName = new Date(0, i).toLocaleString('default', { month: 'short' })
                    const total = categoryFiltered
                        .filter(e => new Date(e.date).getMonth() === i)
                        .reduce((sum, e) => sum + Number(e.amount), 0)
                    return { name: monthName, total }
                })
            } else {
                finalChartData = Array.from({ length: 5 }, (_, i) => {
                    const weekLabel = `Week ${i + 1}`
                    const total = categoryFiltered
                        .filter(e => Math.floor((new Date(e.date).getDate() - 1) / 7) === i)
                        .reduce((sum, e) => sum + Number(e.amount), 0)
                    return { name: weekLabel, total }
                })
            }
        }

        return { chartData: finalChartData, insights: insightsData }
    }, [expenses, chartType, viewMode, selectedYear, selectedMonth, selectedCategory])


    if (!mounted) return <div className="bg-white p-6 rounded-3xl shadow-sm border dark:bg-gray-900 dark:border-gray-800 h-full animate-pulse" />

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border dark:bg-gray-900 dark:border-gray-800 h-full flex flex-col">
            {/* Header Controls */}
            <div className="flex flex-col gap-4 mb-2 shrink-0">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Category Analytics</h3>
                    <div className="flex bg-gray-100 p-1 rounded-lg dark:bg-zinc-900/50">
                        <button onClick={() => setChartType('pie')} className={`p-2 rounded-md transition-all ${chartType === 'pie' ? buttonActiveClass : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`} title="Distribution (Pie)">
                            <PieIcon size={18} />
                        </button>
                        <button onClick={() => setChartType('line')} className={`p-2 rounded-md transition-all ${chartType === 'line' ? buttonActiveClass : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`} title="Trends (Line)">
                            <LineIcon size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div className="flex rounded-md bg-gray-100 p-1 dark:bg-zinc-900/50 h-9">
                        <button onClick={() => setViewMode('yearly')} className={`px-3 text-xs font-medium rounded transition-all ${viewMode === 'yearly' ? buttonActiveClass : 'text-gray-500 dark:text-gray-400'}`}>Yearly</button>
                        <button onClick={() => setViewMode('monthly')} className={`px-3 text-xs font-medium rounded transition-all ${viewMode === 'monthly' ? buttonActiveClass : 'text-gray-500 dark:text-gray-400'}`}>Monthly</button>
                    </div>
                    <div className="flex gap-2">
                        {chartType === 'line' && (
                            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="h-9 px-2 border rounded text-sm bg-transparent dark:bg-zinc-900 dark:border-gray-700 dark:text-white blue:bg-[#000926] blue:text-white blue:border-blue-900 max-w-[120px]">
                                {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        )}
                        {viewMode === 'monthly' && (
                            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="h-9 px-2 border rounded text-sm bg-transparent dark:bg-zinc-900 dark:border-gray-700 dark:text-white blue:bg-[#000926] blue:text-white blue:border-blue-900">
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'short' })}</option>
                                ))}
                            </select>
                        )}
                        <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="h-9 px-2 border rounded text-sm bg-transparent dark:bg-zinc-900 dark:border-gray-700 dark:text-white blue:bg-[#000926] blue:text-white blue:border-blue-900">
                            {years.map((y: number) => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 w-full min-h-[260px] flex items-center justify-center">
                {chartData.length > 0 && chartData.some((d: any) => d.value > 0 || d.total > 0) ? (
                    <>
                        {chartType === 'pie' ? (
                            <div className="w-full flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-8 h-full items-center pl-0 lg:pl-2">
                                {/* Donut Chart */}
                                <div className="relative w-full h-[240px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={75}
                                                outerRadius={105}
                                                paddingAngle={4}
                                                dataKey="value"
                                                stroke="none"
                                                onMouseEnter={(_, index) => setActiveIndex(index)}
                                                onMouseLeave={() => setActiveIndex(undefined)}
                                            >
                                                {chartData.map((entry: any, index: number) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={COLORS[index % COLORS.length]}
                                                        className="outline-none focus:outline-none transition-all duration-300"
                                                        opacity={activeIndex !== undefined && activeIndex !== index ? 0.6 : 1}
                                                    />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Center Text - Dynamic */}
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none transition-all duration-300">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 blue:text-gray-400 font-semibold tracking-widest uppercase mb-1">
                                            {activeIndex !== undefined ? chartData[activeIndex]?.name : 'Total'}
                                        </span>
                                        <span className="text-2xl font-extrabold text-gray-900 dark:text-white blue:text-white font-display">
                                            {activeIndex !== undefined
                                                ? formatCurrency((chartData[activeIndex] as any)?.value || (chartData[activeIndex] as any)?.total)
                                                : formatCurrency(chartData.reduce((acc: any, c: any) => acc + (c.value || c.total || 0), 0))
                                            }
                                        </span>
                                    </div>
                                </div>
                                {/* Legend */}
                                <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 content-center overflow-y-auto max-h-[260px] pr-2 custom-scrollbar">
                                    {chartData.map((entry: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/5 blue:bg-[#000926] blue:border-blue-900 transition-all hover:scale-[1.02]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: COLORS[index % COLORS.length], color: COLORS[index % COLORS.length] }}></div>
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 blue:text-gray-300 font-display truncate max-w-[80px]" title={entry.name}>{entry.name}</span>
                                            </div>
                                            <span className="text-xs font-bold text-gray-900 dark:text-white blue:text-white font-display">{formatCurrency(entry.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} dx={-10} />
                                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} cursor={{ stroke: mainColor, strokeWidth: 1 }} />
                                    <Line type="monotone" dataKey="total" stroke={mainColor} strokeWidth={3} dot={{ r: 4, fill: mainColor }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data available</div>
                )}
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gray-100 dark:bg-gray-800 my-4 shrink-0"></div>

            {/* Footer Insights (Merged from Home Page) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                {/* Top Spending */}
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/30 border border-transparent hover:border-gray-200 dark:hover:border-white/5 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                        {(() => {
                            const Icon = getIconForCategory(insights.topCategory.name)
                            return <Icon size={20} />
                        })()}
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Top Category</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{insights.topCategory.name}</p>
                            <p className="text-sm font-medium text-gray-400">{formatCurrency(insights.topCategory.amount)}</p>
                        </div>
                    </div>
                </div>
                {/* Biggest Expense */}
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/30 border border-transparent hover:border-gray-200 dark:hover:border-white/5 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Biggest Expense</p>
                        {insights.maxTxn ? (
                            <div className="flex flex-col">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{insights.maxTxn.description}</p>
                                <p className="text-xs font-medium text-red-500">{formatCurrency(insights.maxTxn.amount)}</p>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-xs">No expenses</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

