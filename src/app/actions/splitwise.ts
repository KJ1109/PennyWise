'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateBalances } from '@/lib/split'

export async function addMemberByEmail(groupId: string, email: string) {
    const supabase = await createClient()

    // 0. Resolve Input (Email or Username)
    let lookupEmail = email
    if (!email.includes('@')) {
        // Assume username input -> convert to internal email format
        lookupEmail = `${email.toLowerCase().replace(/\s+/g, '')}@finance.com`
    }

    // 1. Resolve Email to ID
    const { data: userId, error: lookupError } = await supabase.rpc('get_user_id_by_email', {
        lookup_email: lookupEmail
    })

    if (lookupError) {
        return { error: 'Database error: ' + lookupError.message }
    }

    if (!userId) {
        return { error: 'User not found. Make sure they have a registered account with this email.' }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 2. Check if already a member
    const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single()

    if (existingMember) {
        return { error: 'User is already a member of this group.' }
    }

    // 3. Check for Pending Invite
    const { data: existingInvite } = await supabase
        .from('group_invites')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .single()

    if (existingInvite) {
        return { error: 'An invitation is already pending for this user.' }
    }

    // 4. Create Invite
    const { error: insertError } = await supabase
        .from('group_invites')
        .insert({
            group_id: groupId,
            user_id: userId,
            invited_by: user.id,
            status: 'pending'
        })

    if (insertError) {
        return { error: 'Failed to send invitation: ' + insertError.message }
    }

    return { success: true, message: 'Invitation sent successfully!' }
}

// ... imports

export async function addManualMember(groupId: string, name: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('manual_members')
        .insert({
            group_id: groupId,
            name,
        })

    if (error) {
        return { error: 'Failed to add member: ' + error.message }
    }

    revalidatePath(`/splitwise/${groupId}`)
    return { success: true }
}

type Split = {
    user_id?: string
    manual_member_id?: string
    amount_owed: number
}

export async function addGroupExpense(
    groupId: string,
    amount: number,
    description: string,
    date: string,
    payerId: string,
    payerType: 'user' | 'manual',
    splits: Split[]
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    // 1. Create Expense
    const expenseData: any = {
        group_id: groupId,
        amount,
        description,
        date
    }

    if (payerType === 'user') {
        expenseData.payer_id = payerId
    } else {
        expenseData.manual_payer_id = payerId
    }

    const { data: expense, error: eError } = await supabase
        .from('group_expenses')
        .insert(expenseData)
        .select()
        .single()

    if (eError || !expense) {
        return { error: 'Failed to create expense: ' + eError?.message }
    }

    // 2. Create Splits
    const formattedSplits = splits.map(s => ({
        expense_id: expense.id,
        user_id: s.user_id || null,
        manual_member_id: s.manual_member_id || null,
        amount_owed: s.amount_owed
    }))

    const { error: sError } = await supabase
        .from('expense_splits')
        .insert(formattedSplits)

    if (sError) {
        console.error('Split Error', sError)
        return { error: 'Failed to create splits. Expense was created but splits failed.' }
    }

    revalidatePath(`/splitwise/${groupId}`)
    return { success: true }
}


export async function createGroup(name: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // 1. Create Group
    const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
            name,
            created_by: user.id,
        })
        .select()
        .single()

    if (groupError) {
        console.error('Group Creation Error:', groupError)
        return { error: 'Failed to create group. ' + groupError.message }
    }

    if (!group) {
        return { error: 'Group created but could not retrieve details (RLS).' }
    }

    // 2. Add creator as member
    const { error: memberError } = await supabase
        .from('group_members')
        .insert({
            group_id: group.id,
            user_id: user.id,
        })

    if (memberError) {
        return { error: 'Failed to join group. ' + memberError.message }
    }

    revalidatePath('/splitwise')
    return { success: true, groupId: group.id }
}

export async function deleteGroupExpense(expenseId: string, groupId: string) {
    // 1. Verify Authentication & Membership
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: member } = await authClient
        .from('group_members')
        .select('group_id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single()

    if (!member) return { error: 'You do not have permission to modify this group.' }

    // 2. Perform Action as Admin
    const supabase = await createAdminClient()

    const { error } = await supabase
        .from('group_expenses')
        .delete()
        .eq('id', expenseId)

    if (error) {
        console.error('Delete Error', error)
        return { error: 'Failed to delete expense' }
    }

    revalidatePath(`/splitwise/${groupId}`)
    return { success: true }
}

export async function updateGroupExpense(
    expenseId: string,
    groupId: string,
    amount: number,
    description: string,
    date: string,
    payerId: string,
    payerType: 'user' | 'manual',
    splits: any[]
) {
    // 1. Verify Authentication & Membership
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: member } = await authClient
        .from('group_members')
        .select('group_id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single()

    if (!member) return { error: 'You do not have permission to modify this group.' }

    // 2. Perform Action as Admin
    const supabase = await createAdminClient()

    // 1. Update Expense Details
    const expenseData: any = { amount, description, date }
    if (payerType === 'user') {
        expenseData.payer_id = payerId
        expenseData.manual_payer_id = null
    } else {
        expenseData.manual_payer_id = payerId
        expenseData.payer_id = null
    }

    const { error: updateError } = await supabase
        .from('group_expenses')
        .update(expenseData)
        .eq('id', expenseId)

    if (updateError) return { error: 'Update failed: ' + updateError.message }

    // 2. Replace Splits (Delete All -> Insert New)
    const { error: deleteError } = await supabase
        .from('expense_splits')
        .delete()
        .eq('expense_id', expenseId)

    if (deleteError) return { error: 'Failed to clear old splits: ' + deleteError.message }

    const formattedSplits = splits.map(s => ({
        expense_id: expenseId,
        user_id: s.user_id || null,
        manual_member_id: s.manual_member_id || null,
        amount_owed: s.amount_owed
    }))

    const { error: insertError } = await supabase
        .from('expense_splits')
        .insert(formattedSplits)

    if (insertError) return { error: 'Failed to insert new splits: ' + insertError.message }

    revalidatePath(`/splitwise/${groupId}`)
    return { success: true }
}

export async function removeGroupMember(groupId: string, memberId: string, memberType: 'user' | 'manual') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // 1. Verify Requestor is Group Creator
    const { data: group } = await supabase
        .from('groups')
        .select('created_by')
        .eq('id', groupId)
        .single()

    if (!group) return { error: 'Group not found' }
    if (group.created_by !== user.id) {
        return { error: 'Only the group creator can remove members.' }
    }

    if (memberType === 'user' && memberId === user.id) {
        return { error: 'You cannot remove yourself. Delete the group instead.' }
    }

    // 2. Verify Member Authorization (Admin Client needed for deletion?)
    // Actually, we can just use the user client if RLS allows creator to delete members.
    // Let's check RLS: "Users can delete own expenses"?
    // RLS for group_members usually allows "Users can leave" or "Admins can remove".
    // Our RLS: "Members visible...", "Users can add...".
    // We probably didn't add DELETE policy for group_members yet.
    // If not, we might need createAdminClient for the deletion part.

    // 3. Check for Outstanding Balance
    // Fetch all expenses/splits to calculate balance
    const { data: expenses } = await supabase
        .from('group_expenses')
        .select(`
            *,
            expense_splits(user_id, manual_member_id, amount_owed)
        `)
        .eq('group_id', groupId)

    const membersStub = [{ id: memberId }] // Hack to check just this user

    // We need to map the expenses to match what calculateBalances expects in lib/split
    // split.ts: e.expense_splits -> s.user_id || s.manual_member_id
    // It seems compatible.

    const balances = calculateBalances(membersStub, expenses || [])
    const balance = balances[memberId] || 0

    if (Math.abs(balance) > 0.01) {
        return { error: `Cannot remove member. They have an outstanding balance of ${balance.toFixed(2)}. Settle up first.` }
    }

    // 4. Delete Member
    const adminClient = await createAdminClient() // Use admin to bypass potential missing RLS for delete
    let deleteError

    if (memberType === 'user') {
        const { error } = await adminClient
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', memberId)
        deleteError = error
    } else {
        const { error } = await adminClient
            .from('manual_members')
            .delete()
            .eq('group_id', groupId)
            .eq('id', memberId)
        deleteError = error
    }

    if (deleteError) {
        return { error: 'Failed to remove member: ' + deleteError.message }
    }

    revalidatePath(`/splitwise/${groupId}`)
    return { success: true }
}

export async function deleteGroup(groupId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // 1. Verify Requestor is Group Creator
    const { data: group } = await supabase
        .from('groups')
        .select('created_by')
        .eq('id', groupId)
        .single()

    if (!group) return { error: 'Group not found' }
    if (group.created_by !== user.id) {
        return { error: 'Only the group creator can delete this group.' }
    }

    // 2. Delete Group (Cascade will handle members and expenses)
    const adminClient = await createAdminClient()
    const { error } = await adminClient
        .from('groups')
        .delete()
        .eq('id', groupId)

    if (error) {
        return { error: 'Failed to delete group: ' + error.message }
    }

    revalidatePath('/splitwise')
    return { success: true }
}

export async function leaveGroup(groupId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // 1. Check for Outstanding Balance
    const { data: expenses } = await supabase
        .from('group_expenses')
        .select(`
            *,
            expense_splits(user_id, manual_member_id, amount_owed)
        `)
        .eq('group_id', groupId)

    const membersStub = [{ id: user.id }]
    const balances = calculateBalances(membersStub, expenses || [])
    const balance = balances[user.id] || 0

    if (Math.abs(balance) > 0.01) {
        return { error: `Cannot leave group. You have an outstanding balance of ${balance.toFixed(2)}. Settle up first.` }
    }

    // 2. Remove Member
    const adminClient = await createAdminClient()
    const { error: deleteError } = await adminClient
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id)

    revalidatePath('/splitwise')
    return { success: true }
}

export async function getPendingInvites() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Use Admin Client to bypass RLS on 'groups' table, 
    // because the user is not a member yet and thus cannot 'see' the group details via standard RLS.
    const supabaseAdmin = await createAdminClient()

    const { data } = await supabaseAdmin
        .from('group_invites')
        .select(`
            id,
            created_at,
            groups (
                id,
                name
            ),
            profiles!group_invites_invited_by_fkey (
                full_name,
                avatar_url
            )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

    return data || []
}

export async function respondToInvite(inviteId: string, accept: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // 1. Verify Invite exists and belongs to user
    const { data: invite } = await supabase
        .from('group_invites')
        .select('*')
        .eq('id', inviteId)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single()

    if (!invite) return { error: 'Invite not found or already processed.' }

    if (accept) {
        // Transaction: Add Member + Update Invite
        const { error: memberError } = await supabase
            .from('group_members')
            .insert({
                group_id: invite.group_id,
                user_id: user.id
            })

        if (memberError) {
            // If already member, just update invite
            if (memberError.code !== '23505') {
                return { error: 'Failed to join group: ' + memberError.message }
            }
        }

        const { error: updateError } = await supabase
            .from('group_invites')
            .update({ status: 'accepted' })
            .eq('id', inviteId)

        if (updateError) return { error: 'Failed to update invite status' }

        revalidatePath('/splitwise')
        revalidatePath(`/splitwise/${invite.group_id}`)
        return { success: true }

    } else {
        // Reject
        const { error: updateError } = await supabase
            .from('group_invites')
            .update({ status: 'rejected' })
            .eq('id', inviteId)

        if (updateError) return { error: 'Failed to reject invite' }

        revalidatePath('/splitwise')
        return { success: true }
    }
}

export async function checkUserExists(identifier: string) {
    const supabase = await createClient()

    // 0. Resolve Input (Email or Username)
    let lookupEmail = identifier
    if (!identifier.includes('@')) {
        lookupEmail = `${identifier.toLowerCase().replace(/\s+/g, '')}@finance.com`
    }

    // 1. Resolve to ID
    const { data: userId } = await supabase.rpc('get_user_id_by_email', {
        lookup_email: lookupEmail
    })

    if (!userId) {
        return { exists: false }
    }

    // 2. Optional: Get Profile Details (Name/Avatar) for better UX
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', userId)
        .single()

    return {
        exists: true,
        user: profile
    }
}
