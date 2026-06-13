-- ===========================================
-- MIGRATION SCRIPT FOR SEVERINU PLATFORM
-- Run this in your Supabase SQL Editor
-- This adds the "password" field to existing profiles safely
-- ===========================================

-- 1. Add the password column to the 'sev_profiles' table if it does not already exist
ALTER TABLE public.sev_profiles 
ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '123456';

-- 2. Fill in the default password for any pre-existing accounts that might have a NULL value
UPDATE public.sev_profiles 
SET password = '123456' 
WHERE password IS NULL;

-- 3. (Optional) Informational feedback
-- This ensures all users can now log in using '123456' as their initial placeholder password, 
-- which they or the administrator can change in the app panels.
