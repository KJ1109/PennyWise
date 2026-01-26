'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteExpense(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/')
    return { success: true }
}

export async function updateExpense(id: string, formData: FormData) {
    const supabase = await createClient()

    const amount = Number(formData.get('amount'))
    const category = formData.get('category') as string
    const description = formData.get('description') as string
    const date = formData.get('date') as string

    if (!amount || !category || !date) {
        return { error: 'Missing required fields' }
    }

    const { error } = await supabase
        .from('expenses')
        .update({
            amount: amount,
            category: category,
            description: description,
            date: date,
        })
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/')
    return { success: true }
}
