'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { clearApplicationData } from '@/lib/reset-app-store'
import { useTheme } from 'next-themes'
import { LogOut, Moon, Sun, Monitor, User, Wallet, Check, Palette, Upload, Droplet } from 'lucide-react'
import { formatCurrency } from '@/lib/budget'
import { useRouter } from 'next/navigation'
import { Database, Trash2, AlertTriangle, Calendar } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
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
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
    const router = useRouter()
    const { setTheme, theme } = useTheme()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)

    // Profile State
    const [profile, setProfile] = useState<{
        id: string
        full_name: string
        monthly_budget: number
        currency: string
        email?: string
        avatar_url?: string
    } | null>(null)

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            if (!event.target.files || event.target.files.length === 0) {
                return
            }

            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${profile?.id}-${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const supabase = createSupabaseBrowser()

            // Upload to 'avatars' bucket
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)

            // Update Profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', profile?.id)

            if (updateError) throw updateError

            setProfile(prev => prev ? ({ ...prev, avatar_url: publicUrl }) : null)
        } catch (error: any) {
            console.error(error)
            alert('Error uploading avatar: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    useEffect(() => {
        async function fetchProfile() {
            const supabase = createSupabaseBrowser()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.replace('/login')
                return
            }

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (data) {
                setProfile({ ...data, email: user.email })
            }
            setLoading(false)
        }
        fetchProfile()
    }, [router])

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSaving(true)
        const formData = new FormData(e.currentTarget)
        const supabase = createSupabaseBrowser()

        const fullName = formData.get('fullName') as string
        const monthlyBudget = Number(formData.get('monthlyBudget'))
        const currency = formData.get('currency') as string

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                monthly_budget: monthlyBudget,
                currency: currency,
                updated_at: new Date().toISOString()
            })
            .eq('id', profile?.id)

        if (error) {
            alert(error.message)
        } else {
            // Optimistic update
            setProfile(prev => prev ? ({
                ...prev,
                full_name: fullName,
                monthly_budget: monthlyBudget,
                currency: currency
            }) : null)
            alert('Profile Updated!')
        }
        setSaving(false)
    }

    const handleThemeUpdate = async (newTheme: string) => {
        setTheme(newTheme) // Client side immediate
        if (!profile?.id) return

        const supabase = createSupabaseBrowser()
        await supabase
            .from('profiles')
            .update({ theme: newTheme })
            .eq('id', profile.id)
    }

    const handleSignOut = async () => {
        const supabase = createSupabaseBrowser()
        await supabase.auth.signOut()
        await clearApplicationData(false)
    }

    if (loading) return <div className="p-8 text-foreground animate-pulse">Loading settings...</div>

    return (
        <main className="flex-1 w-full min-h-screen flex flex-col gap-8 p-4 pb-24 md:pb-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">Manage your profile and preferences.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Profile & Budget Settings */}
                <form onSubmit={handleUpdate} className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-sm transition-colors duration-300">
                    <div className="flex items-center gap-3 border-b border-border pb-4">
                        <div className="rounded-full bg-primary/10 p-2">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground">Profile & Budget</h2>
                    </div>

                    <div className="flex flex-col items-center gap-4 mb-6 pt-4">
                        <div className="relative h-24 w-24 rounded-full overflow-hidden bg-muted border-2 border-border shadow-sm group">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary text-3xl font-bold">
                                    {profile?.full_name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <label className="cursor-pointer flex flex-col items-center text-white text-xs font-medium w-full h-full justify-center">
                                    <Upload className="h-5 w-5 mb-1" />
                                    Change
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarUpload}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                        </div>
                        {uploading && <p className="text-xs text-muted-foreground animate-pulse">Uploading...</p>}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-foreground">Full Name</label>
                            <input
                                name="fullName"
                                defaultValue={profile?.full_name}
                                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-foreground">Email (Read Only)</label>
                            <input
                                value={profile?.email || ''}
                                readOnly
                                className="w-full cursor-not-allowed rounded-lg border border-input bg-muted px-4 py-2 text-sm text-muted-foreground"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">Monthly Budget</label>
                                <input
                                    name="monthlyBudget"
                                    type="number"
                                    defaultValue={profile?.monthly_budget}
                                    className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">Currency</label>
                                <select
                                    name="currency"
                                    defaultValue={profile?.currency}
                                    className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                    <option value="INR">INR (₹)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                </select>
                            </div>
                        </div>

                        {/* Budget Preview */}
                        <div className="rounded-lg bg-primary/5 p-4 border border-primary/20">
                            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                                <Wallet className="h-4 w-4" /> Budget Breakdown
                            </h3>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Daily Target:</span>
                                <span className="font-medium text-foreground">
                                    {formatCurrency(Number(profile?.monthly_budget || 0) / 30)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Weekly Target:</span>
                                <span className="font-medium text-foreground">
                                    {formatCurrency(Number(profile?.monthly_budget || 0) / 4)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        {saving ? 'Saving...' : <><Check className="h-4 w-4" /> Save Changes</>}
                    </button>
                </form>

                {/* App Preferences */}
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

                {/* Data Management Section */}
                <DataManagementSection profileId={profile?.id} />

            </div>
        </main>
    )
}

function DataManagementSection({ profileId }: { profileId?: string }) {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [confirmAction, setConfirmAction] = useState<{
        type: 'range' | 'all' | 'delete_account',
        dataType?: 'expenses' | 'all',
        description: string
    } | null>(null)

    const handleDeleteRange = () => {
        if (!startDate || !endDate) {
            alert('Please select both start and end dates')
            return
        }
        setConfirmAction({
            type: 'range',
            dataType: 'expenses',
            description: `delete all expenses between ${startDate} and ${endDate}`
        })
    }

    const handleClearAll = (dataType: 'expenses' | 'all') => {
        const desc = dataType === 'all'
            ? 'RESET YOUR ACCOUNT (Clears Profile, Expenses, Groups - Starts Fresh)'
            : 'delete all expenses'

        setConfirmAction({
            type: 'all',
            dataType,
            description: desc
        })
    }

    const handleDeleteAccount = () => {
        setConfirmAction({
            type: 'delete_account',
            description: 'PERMANENTLY DELETE YOUR ACCOUNT (All data + Login Access will be removed)'
        })
    }

    const checkDebts = async (supabase: any, uid: string) => {
        // 1. Get all groups user is in
        const { data: memberGroups } = await supabase.from('group_members').select('group_id').eq('user_id', uid)
        const groupIds = memberGroups?.map((g: any) => g.group_id) || []

        if (groupIds.length > 0) {
            // 2. Calculate Balances for these groups
            // We fetch ALL expenses for these groups to calculate net balance properly
            const { data: groupExpenses } = await supabase
                .from('group_expenses')
                .select(`
                    *,
                    expense_splits(user_id, amount_owed)
                `)
                .in('group_id', groupIds)

            // Calculate User's Net Balance
            let netBalance = 0
            groupExpenses?.forEach((e: any) => {
                // Paid by user? (+ Credit)
                if (e.payer_id === uid) {
                    netBalance += Number(e.amount)
                }
                // Splits owed by user? (- Debit)
                e.expense_splits.forEach((s: any) => {
                    if (s.user_id === uid) {
                        netBalance -= Number(s.amount_owed)
                    }
                })
            })

            // 3. Block if unsettled
            if (Math.abs(netBalance) > 0.05) { // 5 cents tolerance
                throw new Error(`You have unsettled debts/credits (Net: ${formatCurrency(netBalance)}). Please settle up in all groups before performing this action.`)
            }
        }
    }

    const executeDeletion = async () => {
        if (!confirmAction || !profileId) return

        setIsLoading(true)
        const supabase = createSupabaseBrowser()
        let success = false
        let errorMsg = ''

        try {
            // STRICT DEBT CHECK for ALL Destructive Splitwise-related or Account-level actions
            // The user requested: "only if the user has not pending owing to anyone if owes the user shouldnt be able to delete expenses or reset account or delete account"
            // We interpret this as: Block "Clear All Expenses", "Reset Account", "Delete Account".
            // Range deletion might be fine, but to be safe/strict as requested, let's block heavy actions.
            if (confirmAction.type === 'all' || confirmAction.type === 'delete_account') {
                await checkDebts(supabase, profileId)
            }

            if (confirmAction.type === 'range' && confirmAction.dataType === 'expenses') {
                const { error } = await supabase
                    .from('expenses')
                    .delete()
                    .eq('user_id', profileId)
                    .gte('date', startDate)
                    .lte('date', endDate)
                if (error) throw error
                success = true
            } else if (confirmAction.type === 'all' && (confirmAction.dataType === 'expenses' || confirmAction.dataType === 'all')) {
                // Delete Personal Expenses
                const { error } = await supabase.from('expenses').delete().eq('user_id', profileId)
                if (error) throw error

                if (confirmAction.dataType === 'all') {
                    // --- Deep Reset ---
                    // 1. Delete Savings Goals
                    const { error: goalsError } = await supabase.from('savings_goals').delete().eq('user_id', profileId)
                    if (goalsError) throw new Error('Failed to delete savings goals: ' + goalsError.message)

                    // 2. Delete Upcoming Payments
                    const { error: paymentsError } = await supabase.from('upcoming_payments').delete().eq('user_id', profileId)
                    if (paymentsError) throw new Error('Failed to delete upcoming payments: ' + paymentsError.message)

                    // 3. Delete Groups Created by User
                    const { error: groupsError } = await supabase.from('groups').delete().eq('created_by', profileId)
                    if (groupsError) throw new Error('Failed to delete groups: ' + groupsError.message)

                    // 4. Leave other groups
                    const { error: membersError } = await supabase.from('group_members').delete().eq('user_id', profileId)
                    if (membersError) throw new Error('Failed to leave groups: ' + membersError.message)

                    // 5. Reset Profile
                    const { error: profileError } = await supabase.from('profiles').update({
                        full_name: null,
                        monthly_budget: null,
                        currency: 'INR',
                        avatar_url: null,
                        updated_at: new Date().toISOString()
                    }).eq('id', profileId)
                    if (profileError) throw new Error('Failed to reset profile: ' + profileError.message)
                }
                success = true
            } else if (confirmAction.type === 'delete_account') {
                const { error } = await supabase.rpc('delete_own_user')
                if (error) throw error

                // Strict cleanup (Kill session)
                await clearApplicationData(false)
                return
            }

            if (success) {
                if (confirmAction.type === 'all' && confirmAction.dataType === 'all') {
                    // Verify Update
                    const { data: verifyProfile } = await supabase
                        .from('profiles')
                        .select('monthly_budget')
                        .eq('id', profileId)
                        .single()

                    if (verifyProfile?.monthly_budget !== null) {
                        throw new Error('Reset failed. Database value did not update. Please try again.')
                    }

                    // CRITICAL: Clear client auth cache to prevent stale state
                    await supabase.auth.refreshSession()

                    // Force clean slate
                    await clearApplicationData(true)

                    // Force rigorous reload (User suggestion: href is best for destroying in-memory state)
                    window.location.href = '/onboarding'
                    return
                }
                alert('Action completed successfully.')
                setStartDate('')
                setEndDate('')
            }

        } catch (e: any) {
            errorMsg = e.message
            alert('Operation failed: ' + errorMsg)
        }

        setIsLoading(false)
        setConfirmAction(null)
    }

    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-colors duration-300">
            <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="rounded-full bg-orange-100 dark:bg-orange-900 p-2">
                    <Database className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Data Management</h2>
            </div>

            <div className="mt-6 space-y-8">
                {/* Range Deletion */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Delete by Date Range
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-end">
                        <div>
                            <label className="text-xs text-muted-foreground">From</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground">To</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <button
                            onClick={handleDeleteRange}
                            className="flex items-center justify-center gap-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 text-sm font-medium transition-colors"
                        >
                            <Trash2 className="h-4 w-4" /> Delete Range
                        </button>
                    </div>
                </div>

                <div className="border-t border-border"></div>

                {/* Nuclear Options */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Danger Zone
                    </h3>
                    <div className="flex flex-col gap-3 sm:flex-row flex-wrap">
                        <button
                            onClick={() => handleClearAll('expenses')}
                            className="flex items-center justify-center gap-2 rounded-md border border-destructive/30 bg-background px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                        >
                            <Trash2 className="h-4 w-4" /> Clear All Expenses
                        </button>
                        <button
                            onClick={() => handleClearAll('all')}
                            className="flex items-center justify-center gap-2 rounded-md bg-destructive/80 px-4 py-2 text-sm font-medium text-white hover:bg-destructive shadow-sm transition-colors"
                        >
                            <Trash2 className="h-4 w-4" /> Reset Account (Fresh Start)
                        </button>
                        <button
                            onClick={handleDeleteAccount}
                            className="flex items-center justify-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 shadow-sm transition-colors"
                        >
                            <User className="h-4 w-4" /> Delete Account
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Actions are irreversible. "Reset Account" returns you to onboarding. "Delete Account" removes your login.
                    </p>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" /> Confirm Deletion
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to <strong>{confirmAction?.description}</strong>?
                            <br /><br />
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <div className="flex gap-2 w-full sm:justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setConfirmAction(null)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={executeDeletion}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Processing...' : 'Yes, Confirm'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
