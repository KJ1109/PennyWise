import { UpcomingPayments } from '@/components/dashboard/UpcomingPayments'
import { SavingsGoals } from '@/components/dashboard/SavingsGoals'

interface RightPanelProps {
    payments: any[]
    goals: any[]
}

export function RightPanel({ payments, goals }: RightPanelProps) {
    return (
        <aside className="w-80 flex-shrink-0 bg-sidebar pink:bg-[#F7A1C4] border-l border-border hidden xl:flex flex-col h-screen sticky top-0 overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0">
                <UpcomingPayments initialPayments={payments} />
            </div>
            <div className="border-t border-border mx-6 shrink-0"></div>
            <div className="flex-1 flex flex-col min-h-0">
                <SavingsGoals initialGoals={goals} />
            </div>
        </aside>
    )
}
