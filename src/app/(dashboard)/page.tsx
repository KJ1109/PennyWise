'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { ExpenseForm } from '@/components/dashboard/ExpenseForm'
import { CategoryGrid } from '@/components/dashboard/CategoryGrid'
import { calculateDailyBudget, formatCurrency } from '@/lib/budget'
import { Plus } from 'lucide-react'
import { RightPanel } from '@/components/layout/RightPanel'
import { UpcomingPayments } from '@/components/dashboard/UpcomingPayments'
import { SavingsGoals } from '@/components/dashboard/SavingsGoals'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [data, setData] = useState<{
        expenses: any[]
        payments: any[]
        goals: any[]
        monthlyBudget: number
        userId: string | null
    }>({
        expenses: [],
        payments: [],
        goals: [],
        monthlyBudget: 0,
        userId: null
    })

    useEffect(() => {
        async function loadDashboardData() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.replace('/login')
                return
            }

            // Parallel Fetch
            const [
                { data: profile },
                { data: expenses },
                { data: payments },
                { data: goals }
            ] = await Promise.all([
                supabase.from('profiles').select('monthly_budget').eq('id', user.id).single(),
                supabase.from('expenses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
                supabase.from('upcoming_payments').select('*').eq('user_id', user.id).eq('is_paid', false).order('due_date', { ascending: true }),
                supabase.from('savings_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
            ])

            setData({
                expenses: expenses || [],
                payments: payments || [],
                goals: goals || [],
                monthlyBudget: profile?.monthly_budget || 0,
                userId: user.id
            })
            setIsLoading(false)
        }

        loadDashboardData()
    }, [router])

    if (isLoading || !data.userId) {
        return (
            <>
                <main className="flex-1 pb-24 md:pb-0 overflow-y-auto">
                    <DashboardSkeleton />
                </main>
                <div className="hidden xl:block w-[350px]"></div> {/* Spacer for RightPanel */}
            </>
        )
    }

    // Calculations for THIS MONTH Only
    // Fix: Use Local Date for "Today" calculation to match user input
    const today = new Date()
    const offset = today.getTimezoneOffset()
    const localToday = new Date(today.getTime() - (offset * 60 * 1000))
    const todayString = localToday.toISOString().split('T')[0]

    const spentToday = data.expenses
        .filter(e => {
            return e.date === todayString || e.date.startsWith(todayString)
        })
        .reduce((sum, e) => sum + Number(e.amount), 0)

    const dailyBudget = calculateDailyBudget(data.monthlyBudget)
    const remainingToday = Math.max(dailyBudget - spentToday, 0)
    const percentage = dailyBudget > 0 ? Math.min((spentToday / dailyBudget) * 100, 100) : 0
    const degrees = (percentage / 100) * 360

    return (
        <>
            <main className="flex-1 pb-24 md:pb-0 overflow-y-auto">
                <div className="flex h-full flex-col p-6 md:p-8 space-y-8">
                    {/* Header */}
                    <header className="flex justify-between items-center mb-2">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Today's Overview</h1>
                            <p className="text-muted-foreground mt-1">Welcome back, here's your spending summary.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Monthly Budget</p>
                                <p className="text-xl font-bold text-primary">₹{formatCurrency(data.monthlyBudget).replace('₹', '')}</p>
                            </div>
                            <ExpenseForm userId={data.userId}>
                                <button className="bg-primary hover:opacity-90 transition-opacity text-primary-foreground p-3 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                                    <Plus className="h-6 w-6" />
                                </button>
                            </ExpenseForm>
                        </div>
                    </header>

                    <div className="grid grid-cols-12 gap-6">
                        {/* Left Card: Circular Progress */}
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

                        {/* Right Grid: Categories */}
                        <div className="col-span-12 lg:col-span-7">
                            <CategoryGrid expenses={data.expenses} />
                        </div>
                    </div>

                    <div className="flex-1">
                        <RecentTransactions transactions={data.expenses} />
                    </div>
                    {/* Mobile/Tablet Content (Visible only on screens smaller than XL) */}
                    <div className="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                        <div className="bg-card rounded-2xl border border-border overflow-hidden h-auto min-h-[400px] shadow-sm">
                            <UpcomingPayments initialPayments={data.payments || []} />
                        </div>
                        <div className="bg-card rounded-2xl border border-border overflow-hidden h-auto min-h-[400px] shadow-sm">
                            <SavingsGoals initialGoals={data.goals || []} />
                        </div>
                    </div>
                </div>
            </main>
            <RightPanel payments={data.payments || []} goals={data.goals || []} />
        </>
    )
}
