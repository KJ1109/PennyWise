'use client'

import { CategoryAnalytics } from '@/components/analytics/CategoryAnalytics'
import { YearlyExpensesBarChart } from '@/components/analytics/YearlyExpensesBarChart'
import { AdvancedAnalytics } from '@/components/analytics/AdvancedAnalytics'

interface ChartsIslandProps {
    allExpenses: any[]
    monthlyBudget: number
}

export function ChartsIsland({ allExpenses, monthlyBudget }: ChartsIslandProps) {
    return (
        <>
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
        </>
    )
}
