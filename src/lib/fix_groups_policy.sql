-- ==========================================
-- FIX: Allow users to delete their own groups
-- ==========================================

-- 1. Create Policy for Deleting Groups
-- This was missing, preventing users from deleting groups they created.
CREATE POLICY "Users can delete own groups" ON groups
  FOR DELETE USING (auth.uid() = created_by);

-- 2. Ensure RLS is enabled (Safe Check)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
