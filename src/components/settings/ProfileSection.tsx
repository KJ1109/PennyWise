'use client'

import { useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { User, Wallet, Upload, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/budget'
import { ProfileData } from './SettingsContent'

interface ProfileSectionProps {
    profile: ProfileData | null
    setProfile: React.Dispatch<React.SetStateAction<ProfileData | null>>
}

export function ProfileSection({ profile, setProfile }: ProfileSectionProps) {
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)

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

    return (
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
    )
}
