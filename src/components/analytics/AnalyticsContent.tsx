'use client'

import { BudgetOverview } from '@/components/analytics/BudgetOverview'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const ChartsIsland = dynamic(() => import('@/components/analytics/ChartsIsland').then(mod => mod.ChartsIsland), {
    ssr: false, // Charts are client-heavy, skipping SSR for them can speed up initial HTML delivery if they are heavy to render
    loading: () => <div className="h-[350px] w-full animate-pulse rounded-3xl bg-muted/50" />
})

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
            {/* Row 1: Budget Overview (Critical Path) */}
            <div className="col-span-12 lg:col-span-5 h-auto md:h-[350px]">
                <BudgetOverview
                    monthlyBudget={monthlyBudget}
                    spentThisMonth={spentThisMonth}
                    spentThisWeek={spentThisWeek}
                    spentToday={spentToday}
                />
            </div>

            {/* Heavy Charts Isolated */}
            <Suspense fallback={<div className="col-span-12 lg:col-span-7 h-[350px] w-full animate-pulse rounded-3xl bg-muted/50" />}>
                <ChartsIsland allExpenses={allExpenses} monthlyBudget={monthlyBudget} />
            </Suspense>
        </div>
    )
}
