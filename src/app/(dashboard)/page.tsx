import { createClient } from '@/lib/supabase/server'
import { getCachedUser } from '@/lib/auth-cache'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { ExpenseForm } from '@/components/dashboard/ExpenseForm'
import { CategoryGrid } from '@/components/dashboard/CategoryGrid'
import { calculateDailyBudget, formatCurrency } from '@/lib/budget'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { RightPanel } from '@/components/layout/RightPanel'
import { UpcomingPayments } from '@/components/dashboard/UpcomingPayments'
import { SavingsGoals } from '@/components/dashboard/SavingsGoals'

export default async function DashboardPage() {
    const { user } = await getCachedUser()

    if (!user) {
        redirect('/login')
    }

    const supabase = await createClient()

    // Parallel Data Fetching
    const [
        { data: profile },
        { data: expenses },
        { data: payments },
        { data: goals }
    ] = await Promise.all([
        // 1. Profile (for Budget)
        supabase.from('profiles').select('monthly_budget').eq('id', user.id).single(),

        // 2. All Expenses (for Charts/History)
        supabase.from('expenses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),

        // 3. Upcoming Payments (for RightPanel)
        supabase.from('upcoming_payments').select('*').eq('user_id', user.id).eq('is_paid', false).order('due_date', { ascending: true }),

        // 4. Savings Goals (for RightPanel)
        supabase.from('savings_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    ])

    if (!profile) redirect('/onboarding')

    const monthlyBudget = profile.monthly_budget || 0
    const allExpenses = expenses || []

    // Calculations for THIS MONTH Only
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // const spentThisMonth = allExpenses.filter(e => new Date(e.date) >= startOfMonth).reduce((sum, e) => sum + Number(e.amount), 0)

    // Filter for today's expenses specifically
    const todayString = today.toISOString().split('T')[0]

    const spentToday = allExpenses
        .filter(e => {
            // Simple string match for YYYY-MM-DD
            const match = e.date === todayString || e.date.startsWith(todayString)
            return match
        })
        .reduce((sum, e) => sum + Number(e.amount), 0)

    const dailyBudget = calculateDailyBudget(monthlyBudget)
    const remainingToday = Math.max(dailyBudget - spentToday, 0)
    const percentage = Math.min((spentToday / dailyBudget) * 100, 100)

    // Calculate degrees for conic gradient (360 degrees = 100%)
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
                                <p className="text-xl font-bold text-primary">₹{formatCurrency(monthlyBudget).replace('₹', '')}</p>
                            </div>
                            <ExpenseForm userId={user.id}>
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
                            <CategoryGrid expenses={allExpenses} />
                        </div>
                    </div>

                    <div className="flex-1">
                        <RecentTransactions transactions={allExpenses} />
                    </div>
                    {/* Mobile/Tablet Content (Visible only on screens smaller than XL) */}
                    <div className="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                        <div className="bg-card rounded-2xl border border-border overflow-hidden h-auto min-h-[400px] shadow-sm">
                            <UpcomingPayments initialPayments={payments || []} />
                        </div>
                        <div className="bg-card rounded-2xl border border-border overflow-hidden h-auto min-h-[400px] shadow-sm">
                            <SavingsGoals initialGoals={goals || []} />
                        </div>
                    </div>
                </div>
            </main>
            <RightPanel payments={payments || []} goals={goals || []} />
        </>
    )
}
