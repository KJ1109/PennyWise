import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

interface AppShellProps {
    children: React.ReactNode
    user: { name: string; email: string; avatarUrl?: string }
}

export function AppShell({ children, user }: AppShellProps) {
    return (
        <div className="flex min-h-screen bg-muted transition-colors duration-300">
            <Sidebar user={user} />
            {children}
            <BottomNav />
        </div>
    )
}
