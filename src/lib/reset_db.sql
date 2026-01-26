-- ==========================================
-- DANGEROUS: THIS SCRIPT DELETES ALL DATA
-- ==========================================

-- Drop Tables (Order matters due to foreign keys)
DROP TABLE IF EXISTS expense_splits CASCADE;
DROP TABLE IF EXISTS group_expenses CASCADE;
DROP TABLE IF EXISTS group_invites CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS manual_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS savings_goals CASCADE;
DROP TABLE IF EXISTS upcoming_payments CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop Functions
DROP FUNCTION IF EXISTS get_user_id_by_email(text);
DROP FUNCTION IF EXISTS is_group_member(uuid);

-- Drop Storage Policies (Optional cleanup)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update their own avatar" ON storage.objects;

-- Note: We don't drop the 'avatars' bucket itself to avoid losing files, 
-- but you can uncomment this if you want a FULL wipe:
-- DELETE FROM storage.buckets WHERE id = 'avatars';
