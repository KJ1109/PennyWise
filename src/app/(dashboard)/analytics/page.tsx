import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BudgetOverview } from '@/components/analytics/BudgetOverview'
import { CategoryAnalytics } from '@/components/analytics/CategoryAnalytics'
import { YearlyExpensesBarChart } from '@/components/analytics/YearlyExpensesBarChart'
import { AdvancedAnalytics } from '@/components/analytics/AdvancedAnalytics'
import { Utensils, PiggyBank, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/budget'

export default async function AnalyticsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('monthly_budget')
        .eq('id', user.id)
        .single()

    const monthlyBudget = profile?.monthly_budget || 0

    // Fetch All Expenses
    const { data: expenses } = await supabase
        .from('expenses')
        .select('amount, date, category, description')
        .eq('user_id', user.id) // Explicit security filter
        .order('date', { ascending: false })

    const allExpenses = expenses || []

    // Calculate Budget Metrics
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay()) // Starts Sunday
    const todayString = today.toISOString().split('T')[0]

    const spentThisMonth = allExpenses
        .filter(e => new Date(e.date) >= startOfMonth)
        .reduce((sum, e) => sum + e.amount, 0)

    // Note: This week calculation is rough approximation
    // Fix: Ensure we don't count previous month's expenses if week straddles months
    const effectiveStartOfWeek = new Date(Math.max(startOfMonth.getTime(), startOfWeek.getTime()))

    const spentThisWeek = allExpenses
        .filter(e => new Date(e.date) >= effectiveStartOfWeek)
        .reduce((sum, e) => sum + e.amount, 0)

    const spentToday = allExpenses
        .filter(e => e.date === todayString)
        .reduce((sum, e) => sum + e.amount, 0)

    // Calc Bottom Cards Data
    // Top Drain
    const categoryTotals: Record<string, number> = {}
    const thisMonthExpenses = allExpenses.filter(e => new Date(e.date) >= startOfMonth)

    thisMonthExpenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
    })

    const topDrainCategory = Object.keys(categoryTotals).reduce((a, b) => categoryTotals[a] > categoryTotals[b] ? a : b, '')
    const topDrainAmount = topDrainCategory ? categoryTotals[topDrainCategory] : 0

    // Biggest Transaction in Top Drain Category
    const topDrainAndMonthExpenses = thisMonthExpenses.filter(e => e.category === topDrainCategory)
    const maxTxn = topDrainAndMonthExpenses.reduce((max: any, e: any) => (e.amount > (max?.amount || 0) ? e : max), null)

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
                        monthlyBudget={monthlyBudget}
                        spentThisMonth={spentThisMonth}
                        spentThisWeek={spentThisWeek}
                        spentToday={spentToday}
                    />
                </div>
                <div className="col-span-12 lg:col-span-7 h-[350px]">
                    <YearlyExpensesBarChart expenses={allExpenses} monthlyBudget={monthlyBudget} />
                </div>

                {/* Row 2 */}
                <div className="col-span-12 lg:col-span-8 h-auto md:h-[550px]">
                    <CategoryAnalytics expenses={allExpenses} />
                </div>
                <div className="col-span-12 lg:col-span-4 h-auto md:h-[550px]">
                    <AdvancedAnalytics expenses={allExpenses} monthlyBudget={monthlyBudget} />
                </div>
            </div>
        </main>
    )
}
