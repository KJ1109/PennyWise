'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// --- Schemas ---

const PaymentSchema = z.object({
    title: z.string().min(1, "Title is required"),
    amount: z.coerce.number().positive("Amount must be positive"),
    due_date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
    category: z.string().optional(),
})

const GoalSchema = z.object({
    title: z.string().min(1, "Title is required"),
    target_amount: z.coerce.number().positive("Target amount must be positive"),
    current_amount: z.coerce.number().min(0, "Current amount cannot be negative").default(0),
    target_date: z.string().nullable().optional(),
    icon_name: z.string().optional(),
})

// --- Upcoming Payments Actions ---

export async function addPayment(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const rawData = {
        title: formData.get('title'),
        amount: formData.get('amount'),
        due_date: formData.get('due_date'),
        category: formData.get('category'),
    }

    const validated = PaymentSchema.safeParse(rawData)
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const { error } = await supabase.from('upcoming_payments').insert({
        user_id: user.id,
        ...validated.data,
    })

    if (error) return { error: error.message }
    revalidatePath('/')
    return { success: true }
}

export async function deletePayment(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('upcoming_payments').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/')
    return { success: true }
}

export async function togglePaymentStatus(id: string, is_paid: boolean) {
    const supabase = await createClient()
    const { error } = await supabase.from('upcoming_payments').update({ is_paid }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/')
    return { success: true }
}

export async function updatePayment(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const id = formData.get('id') as string
    if (!id) return { error: 'Missing ID' }

    const rawData = {
        title: formData.get('title'),
        amount: formData.get('amount'),
        due_date: formData.get('due_date'),
        category: formData.get('category'),
    }

    const validated = PaymentSchema.safeParse(rawData)
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const { error } = await supabase
        .from('upcoming_payments')
        .update(validated.data)
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/')
    return { success: true }
}

// --- Savings Goals Actions ---

export async function addGoal(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const targetDate = formData.get('target_date') as string

    const rawData = {
        title: formData.get('title'),
        target_amount: formData.get('target_amount'),
        current_amount: formData.get('current_amount'),
        target_date: targetDate === '' ? undefined : targetDate,
        icon_name: formData.get('icon_name'),
    }

    const validated = GoalSchema.safeParse(rawData)
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const { error } = await supabase.from('savings_goals').insert({
        user_id: user.id,
        ...validated.data,
    })

    if (error) return { error: error.message }
    revalidatePath('/')
    return { success: true }
}

export async function updateGoalAmount(id: string, current_amount: number) {
    const supabase = await createClient()
    const { error } = await supabase.from('savings_goals').update({ current_amount }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/')
    return { success: true }
}

export async function deleteGoal(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('savings_goals').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/')
    return { success: true }
}

export async function updateGoal(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const id = formData.get('id') as string
    if (!id) return { error: 'Missing ID' }

    const targetDate = formData.get('target_date') as string

    const rawData = {
        title: formData.get('title'),
        target_amount: formData.get('target_amount'),
        current_amount: formData.get('current_amount'),
        target_date: targetDate === '' ? null : targetDate, // Send null to clear date if empty, or undefined if not provided
        icon_name: formData.get('icon_name'),
    }

    const validated = GoalSchema.safeParse(rawData)
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const { error } = await supabase.from('savings_goals').update(validated.data).eq('id', id).eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/')
    return { success: true }
}
