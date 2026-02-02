'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { NAV_ITEMS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Wallet, LogOut } from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase/client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { clearApplicationData } from '@/lib/reset-app-store'

interface SidebarProps {
    user: {
        name: string
        email: string
        avatarUrl?: string
    }
}

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { setTheme } = useTheme()

    const [isCollapsed, setIsCollapsed] = useState(false)

    const handleSignOut = async () => {
        setTheme('dark')
        await clearApplicationData(false)
    }

    return (
        <div
            className={cn(
                "hidden h-screen flex-col border-r border-border bg-sidebar transition-all duration-300 md:flex relative",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-9 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-accent text-foreground"
            >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            <div className={cn("mb-6 flex items-center gap-3 px-6 pt-6", isCollapsed && "justify-center px-2")}>
                <div className="h-14 w-14 shrink-0 flex items-center justify-center">
                    <img src="/logo.png" alt="Pennywise" className="h-full w-full object-contain drop-shadow-md" />
                </div>
                {!isCollapsed && (
                    <span className="text-xl font-bold text-sidebar-foreground tracking-tight whitespace-nowrap overflow-hidden">
                        Pennywise
                    </span>
                )}
            </div>

            <nav className="flex flex-1 flex-col gap-2 px-3">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group",
                                isActive
                                    ? "bg-sidebar-active-bg text-sidebar-active-fg shadow-sm"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                isCollapsed && "justify-center px-2"
                            )}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <Icon className={cn("h-5 w-5 shrink-0 transition-transform group-hover:scale-110")} />
                            {!isCollapsed && <span>{item.label}</span>}
                        </Link>
                    )
                })}
            </nav>

            {!isCollapsed && (
                <div className="p-4 mt-auto mb-4 mx-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="h-10 w-10 rounded-full bg-slate-200 shrink-0 overflow-hidden flex items-center justify-center text-primary bg-primary/20 font-bold border border-sidebar-border relative">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                                ) : (
                                    user.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-sidebar-foreground truncate" title={user.name}>{user.name}</p>
                                <p className="text-xs text-sidebar-foreground/60 truncate" title={user.email}>{user.email}</p>
                            </div>
                        </div>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button
                                    className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
                                    title="Sign Out"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Sign Out</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to sign out of your account?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleSignOut} className="bg-red-600 hover:bg-red-700 text-white">
                                        Sign Out
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            )}
        </div>
    )
}
