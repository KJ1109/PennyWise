'use client'

import { BudgetOverview } from '@/components/analytics/BudgetOverview'
import { CategoryAnalytics } from '@/components/analytics/CategoryAnalytics'
import { YearlyExpensesBarChart } from '@/components/analytics/YearlyExpensesBarChart'
import { AdvancedAnalytics } from '@/components/analytics/AdvancedAnalytics'

interface AnalyticsContentProps {
    monthlyBudget: number
    allExpenses: any[]
    spentThisMonth: number
    spentThisWeek: number
    spentToday: number
}

export function AnalyticsContent({
    monthlyBudget,
    allExpenses,
    spentThisMonth,
    spentThisWeek,
    spentToday
}: AnalyticsContentProps) {
    return (
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
            <div className="col-span-12 lg:col-span-7 h-auto md:h-[350px]">
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
    )
}
