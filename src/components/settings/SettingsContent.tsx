'use client'

import { useState } from 'react'
import { ProfileSection } from './ProfileSection'
import { AppearanceSection } from './AppearanceSection'
import { DataManagementSection } from './DataManagementSection'

export interface ProfileData {
    id: string
    full_name: string
    monthly_budget: number
    currency: string
    email?: string
    avatar_url?: string
}

export function SettingsContent({ initialProfile }: { initialProfile: ProfileData | null }) {
    const [profile, setProfile] = useState<ProfileData | null>(initialProfile)

    return (
        <main className="flex-1 w-full min-h-screen flex flex-col gap-8 p-4 pb-24 md:pb-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">Manage your profile and preferences.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <ProfileSection profile={profile} setProfile={setProfile} />
                <AppearanceSection profileId={profile?.id} />
                <DataManagementSection profileId={profile?.id} />
            </div>
        </main>
    )
}
