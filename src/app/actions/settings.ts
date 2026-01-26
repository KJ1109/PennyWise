'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const fullName = formData.get('fullName') as string
    const monthlyBudget = Number(formData.get('monthlyBudget'))
    const currency = formData.get('currency') as string

    if (!fullName || !monthlyBudget || !currency) {
        return { error: 'Missing required fields' }
    }

    // Security: Validate Currency to prevent injection of invalid codes
    const ALLOWED_CURRENCIES = ['INR', 'USD', 'EUR']
    if (!ALLOWED_CURRENCIES.includes(currency)) {
        return { error: 'Invalid currency selection' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            full_name: fullName,
            monthly_budget: monthlyBudget,
            currency: currency,
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/settings')
    revalidatePath('/') // Dashboard needs new budget info
    return { success: true }
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    return { success: true }
}

export async function updateTheme(theme: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('profiles')
        .update({ theme, updated_at: new Date().toISOString() })
        .eq('id', user.id)

    if (error) return { error: error.message }
    return { success: true }
}
