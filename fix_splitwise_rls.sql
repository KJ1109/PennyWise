-- Fix RLS policy to allow invited users to view the group
drop policy "Groups visible to members" on groups;

create policy "Groups visible to members and invitees" on groups
  for select using (
    created_by = auth.uid() 
    OR 
    is_group_member(id)
    OR
    exists (
       select 1 from group_invites
       where group_invites.group_id = groups.id
       and group_invites.user_id = auth.uid()
       and group_invites.status = 'pending'
    )
  );
