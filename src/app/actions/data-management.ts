'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteDataByRange(
    startDate: string,
    endDate: string,
    dataType: 'expenses' | 'all'
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    try {
        if (dataType === 'expenses' || dataType === 'all') {
            // Delete expenses within range
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('user_id', user.id)
                .gte('date', startDate)
                .lte('date', endDate)

            if (error) throw error
        }

        // If we had groups, we would add logic here. 
        // For now 'all' just acts like expenses, but extensible.

        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function clearAllData(dataType: 'expenses' | 'all') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    try {
        if (dataType === 'expenses' || dataType === 'all') {
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('user_id', user.id)

            if (error) throw error
        }

        if (dataType === 'all') {
            // Delete Group Memberships
            await supabase.from('group_members').delete().eq('user_id', user.id)

            // Delete Groups created by user (Cascades to expenses/members usually)
            await supabase.from('groups').delete().eq('created_by', user.id)

            // Reset Profile (Deep Reset)
            await supabase.from('profiles').update({
                full_name: null,
                monthly_budget: null,
                currency: 'INR', // Default
                avatar_url: null,
                updated_at: new Date().toISOString()
            }).eq('id', user.id)
        }

        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function deleteAccount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    try {
        const { error } = await supabase.rpc('delete_own_user')
        if (error) throw error

        // Sign out is implicit as user is gone, but let's be safe client-side
        return { success: true }
    } catch (error: any) {
        console.error('Delete Account Error:', error)
        return { error: error.message || 'Failed to delete account' }
    }
}
