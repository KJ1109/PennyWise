import { createClient } from '@/lib/supabase/server'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { ExpenseForm } from '@/components/dashboard/ExpenseForm'
import { CategoryGrid } from '@/components/dashboard/CategoryGrid'
import { formatCurrency } from '@/lib/budget'
import { Plus } from 'lucide-react'
import { RightPanel } from '@/components/layout/RightPanel'
import { UpcomingPayments } from '@/components/dashboard/UpcomingPayments'
import { SavingsGoals } from '@/components/dashboard/SavingsGoals'
import { DailyOverview } from '@/components/dashboard/DailyOverview'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Parallel Fetch
    const [
        { data: profile },
        { data: expensesRaw },
        { data: paymentsRaw },
        { data: goalsRaw }
    ] = await Promise.all([
        supabase.from('profiles').select('monthly_budget').eq('id', user.id).single(),
        supabase.from('expenses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('upcoming_payments').select('*').eq('user_id', user.id).eq('is_paid', false).order('due_date', { ascending: true }),
        supabase.from('savings_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    ])

    const expenses = expensesRaw || []
    const payments = paymentsRaw || []
    const goals = goalsRaw || []
    const monthlyBudget = profile?.monthly_budget || 0

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
                        {/* Left Card: Circular Progress (Client Component for Local Time) */}
                        <DailyOverview expenses={expenses} monthlyBudget={monthlyBudget} />

                        {/* Right Grid: Categories */}
                        <div className="col-span-12 lg:col-span-7">
                            <CategoryGrid expenses={expenses} />
                        </div>
                    </div>

                    <div className="flex-1">
                        <RecentTransactions transactions={expenses} />
                    </div>
                    {/* Mobile/Tablet Content (Visible only on screens smaller than XL) */}
                    <div className="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                        <div className="bg-card rounded-2xl border border-border overflow-hidden h-auto min-h-[400px] shadow-sm">
                            <UpcomingPayments initialPayments={payments} />
                        </div>
                        <div className="bg-card rounded-2xl border border-border overflow-hidden h-auto min-h-[400px] shadow-sm">
                            <SavingsGoals initialGoals={goals} />
                        </div>
                    </div>
                </div>
            </main>
            <RightPanel payments={payments} goals={goals} />
        </>
    )
}
