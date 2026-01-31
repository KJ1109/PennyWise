'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { BudgetOverview } from '@/components/analytics/BudgetOverview'
import { CategoryAnalytics } from '@/components/analytics/CategoryAnalytics'
import { YearlyExpensesBarChart } from '@/components/analytics/YearlyExpensesBarChart'
import { AdvancedAnalytics } from '@/components/analytics/AdvancedAnalytics'
import { AnalyticsSkeleton } from '@/components/analytics/AnalyticsSkeleton'
import { Utensils, PiggyBank, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/budget'

export default function AnalyticsPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [data, setData] = useState<{
        monthlyBudget: number
        allExpenses: any[]
        spentThisMonth: number
        spentThisWeek: number
        spentToday: number
    }>({
        monthlyBudget: 0,
        allExpenses: [],
        spentThisMonth: 0,
        spentThisWeek: 0,
        spentToday: 0
    })

    useEffect(() => {
        async function loadData() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.replace('/login')
                return
            }

            // Parallel Fetch
            const [
                { data: profile },
                { data: expenses }
            ] = await Promise.all([
                supabase.from('profiles').select('monthly_budget').eq('id', user.id).single(),
                supabase.from('expenses').select('amount, date, category, description').eq('user_id', user.id).order('date', { ascending: false })
            ])

            const monthlyBudget = profile?.monthly_budget || 0
            const allExpenses = expenses || []

            // Calculations
            const today = new Date()
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
            const startOfWeek = new Date(today)
            startOfWeek.setDate(today.getDate() - today.getDay())
            const todayString = today.toISOString().split('T')[0]

            const spentThisMonth = allExpenses
                .filter(e => new Date(e.date) >= startOfMonth)
                .reduce((sum, e) => sum + e.amount, 0)

            const effectiveStartOfWeek = new Date(Math.max(startOfMonth.getTime(), startOfWeek.getTime()))

            const spentThisWeek = allExpenses
                .filter(e => new Date(e.date) >= effectiveStartOfWeek)
                .reduce((sum, e) => sum + e.amount, 0)

            const spentToday = allExpenses
                .filter(e => e.date === todayString)
                .reduce((sum, e) => sum + e.amount, 0)

            setData({
                monthlyBudget,
                allExpenses,
                spentThisMonth,
                spentThisWeek,
                spentToday
            })
            setIsLoading(false)
        }

        loadData()
    }, [router])

    if (isLoading) {
        return <AnalyticsSkeleton />
    }

    return (
        <main className="flex-1 w-full min-h-screen flex flex-col p-4 md:p-8 space-y-6 md:space-y-8 pb-24 md:pb-8">
            <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white blue:text-white font-display">Analytics Dashboard</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Visualize your financial performance and spending habits.</p>
                </div>
                <div></div>
            </header>

            <div className="grid grid-cols-12 gap-6">
                {/* Row 1 */}
                <div className="col-span-12 lg:col-span-5 h-auto md:h-[350px]">
                    <BudgetOverview
                        monthlyBudget={data.monthlyBudget}
                        spentThisMonth={data.spentThisMonth}
                        spentThisWeek={data.spentThisWeek}
                        spentToday={data.spentToday}
                    />
                </div>
                <div className="col-span-12 lg:col-span-7 h-auto md:h-[350px]">
                    <YearlyExpensesBarChart expenses={data.allExpenses} monthlyBudget={data.monthlyBudget} />
                </div>

                {/* Row 2 */}
                <div className="col-span-12 lg:col-span-8 h-auto md:h-[550px]">
                    <CategoryAnalytics expenses={data.allExpenses} />
                </div>
                <div className="col-span-12 lg:col-span-4 h-auto md:h-[550px]">
                    <AdvancedAnalytics expenses={data.allExpenses} monthlyBudget={data.monthlyBudget} />
                </div>
            </div>
        </main>
    )
}
