import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { CapacitorAppListener } from '../CapacitorAppListener'

interface AppShellProps {
    children: React.ReactNode
    user: { name: string; email: string; avatarUrl?: string }
}

export function AppShell({ children, user }: AppShellProps) {
    return (
        <div className="flex min-h-screen bg-muted transition-colors duration-300 pt-[env(safe-area-inset-top)]">
            <CapacitorAppListener />
            <Sidebar user={user} />
            {children}
            <BottomNav />
        </div>
    )
}
