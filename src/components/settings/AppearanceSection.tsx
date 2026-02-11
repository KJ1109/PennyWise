'use client'

import { useTheme } from 'next-themes'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { clearApplicationData } from '@/lib/reset-app-store'
import { Monitor, Sun, Moon, Palette, Droplet, LogOut } from 'lucide-react'
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

interface AppearanceSectionProps {
    profileId?: string
}

export function AppearanceSection({ profileId }: AppearanceSectionProps) {
    const { setTheme, theme } = useTheme()

    const handleThemeUpdate = async (newTheme: string) => {
        setTheme(newTheme) // Client side immediate
        if (!profileId) return

        const supabase = createSupabaseBrowser()
        await supabase
            .from('profiles')
            .update({ theme: newTheme })
            .eq('id', profileId)
    }

    const handleSignOut = async () => {
        const supabase = createSupabaseBrowser()
        await supabase.auth.signOut()
        await clearApplicationData(false)
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-colors duration-300">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                    <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-2">
                        <Monitor className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                    <label className="text-sm font-medium text-foreground">Theme Preference</label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 rounded-lg bg-muted p-1">
                        <button
                            type="button"
                            onClick={() => handleThemeUpdate('light')}
                            className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${theme === 'light' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Sun className="h-4 w-4" /> Light
                        </button>
                        <button
                            type="button"
                            onClick={() => handleThemeUpdate('dark')}
                            className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${theme === 'dark' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Moon className="h-4 w-4" /> Dark
                        </button>
                        <button
                            type="button"
                            onClick={() => handleThemeUpdate('pink')}
                            className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${theme === 'pink' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Palette className="h-4 w-4" /> Pink
                        </button>
                        <button
                            type="button"
                            onClick={() => handleThemeUpdate('blue')}
                            className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${theme === 'blue' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Droplet className="h-4 w-4" /> Blue
                        </button>
                        <button
                            type="button"
                            onClick={() => handleThemeUpdate('system')}
                            className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${theme === 'system' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Monitor className="h-4 w-4" /> System
                        </button>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-colors duration-300">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                    <div className="rounded-full bg-destructive/10 p-2">
                        <LogOut className="h-5 w-5 text-destructive" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Session</h2>
                </div>
                <div className="mt-6">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/20 transition-colors"
                            >
                                <LogOut className="h-4 w-4" /> Sign Out
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Sign Out</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to sign out? You will need to log in again to access your data.
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
        </div>
    )
}
