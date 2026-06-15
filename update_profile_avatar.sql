-- 
-- UPDATE PROFILE AVATAR AND DETAILS FOR SUPABASE
-- Execute this script in your Supabase SQL Editor if you want to ensure 
-- that the avatar_url column and update functions are completely configured.
-- 

-- 1. Ensure avatar_url column exists on sev_profiles
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'sev_profiles' 
          AND column_name = 'avatar_url'
    ) THEN 
        ALTER TABLE public.sev_profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- 2. Ensure clients can have avatar strings or custom details
-- Default profiles already link via id. No changes needed since they reference sev_profiles.

-- 3. Pre-fill any user profile avatars that might be null with high-quality place-holders
UPDATE public.sev_profiles 
SET avatar_url = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' 
WHERE avatar_url IS NULL;

-- 4. Enable any Row Level Security (RLS) policies for updates if active
-- Ensure users can update their own row:
-- CREATE POLICY "Permitir que usuários editem o próprio perfil" 
-- ON public.sev_profiles FOR UPDATE 
-- USING (auth.uid()::text = id);
