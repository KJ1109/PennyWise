'use client'

import { useMemo } from 'react'
import { formatCurrency, calculateDailyBudget } from '@/lib/budget'

interface DailyOverviewProps {
    expenses: any[]
    monthlyBudget: number
}

export function DailyOverview({ expenses, monthlyBudget }: DailyOverviewProps) {
    const { spentToday, remainingToday, dailyBudget, degrees } = useMemo(() => {
        // Fix: Use Local Date for "Today" calculation to match user input
        // Using a similar logic to previous implementation to ensure consistency
        const today = new Date()
        const offset = today.getTimezoneOffset() // minutes
        const localToday = new Date(today.getTime() - (offset * 60 * 1000))
        const todayString = localToday.toISOString().split('T')[0]

        const spent = expenses
            .filter(e => {
                // e.date is YYYY-MM-DD
                return e.date === todayString || e.date.startsWith(todayString)
            })
            .reduce((sum, e) => sum + Number(e.amount), 0)

        const daily = calculateDailyBudget(monthlyBudget)
        const remaining = Math.max(daily - spent, 0)
        const percentage = daily > 0 ? Math.min((spent / daily) * 100, 100) : 0
        const deg = (percentage / 100) * 360

        return {
            spentToday: spent,
            remainingToday: remaining,
            dailyBudget: daily,
            degrees: deg
        }
    }, [expenses, monthlyBudget])

    return (
        <div className="col-span-12 lg:col-span-5 bg-card p-8 rounded-3xl shadow-sm border border-border flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>

            <div className="relative z-10 text-center w-full">
                <div className="mb-8 flex justify-center">
                    <div
                        className="relative h-48 w-48 rounded-full shadow-xl grid place-items-center bg-card"
                        style={{
                            background: `conic-gradient(var(--primary) ${degrees}deg, var(--muted) 0deg)`
                        }}
                    >
                        {/* Inner Circle to create ring effect */}
                        <div className="absolute h-[84%] w-[84%] bg-card rounded-full z-10"></div>

                        <div className="flex flex-col items-center z-20 relative">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Remaining Today</span>
                            <span className="text-4xl font-bold mt-1 text-foreground">₹{formatCurrency(remainingToday).replace('₹', '')}</span>
                            <span className="text-xs text-muted-foreground mt-1 italic font-light">of ₹{formatCurrency(dailyBudget).replace('₹', '')} total</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 w-full border-t border-border pt-8">
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Spent Today</p>
                        <p className="text-xl font-bold text-foreground">{formatCurrency(spentToday)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Daily Budget</p>
                        <p className="text-xl font-bold text-foreground">{formatCurrency(dailyBudget)}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
