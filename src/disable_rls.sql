-- 
-- SCRIPT DE BANCO DE DADOS - SEVERINU SERVICE
-- DESABILITAR ROW LEVEL SECURITY (RLS) PARA TODAS AS TABELAS
-- 
-- Execute este script no SQL Editor do seu painel do Supabase para
-- desativar as restrições de permissão nível de linha (RLS), permitindo
-- que qualquer usuário de teste ou cliente front-end leia e grave em
-- todas as tabelas livremente sem requisições bloqueadas.
-- 

ALTER TABLE public.sev_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_bids DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_financial_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_system_settings DISABLE ROW LEVEL SECURITY;

-- 
-- Para habilitar de volta no futuro, se necessário:
-- 
-- ALTER TABLE public.sev_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sev_categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sev_clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sev_providers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sev_plans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sev_subscriptions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sev_requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sev_bids ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sev_payments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sev_reviews ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sev_favorites ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sev_conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sev_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sev_notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sev_audit_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sev_financial_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sev_system_settings ENABLE ROW LEVEL SECURITY;
