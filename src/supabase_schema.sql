-- 
-- SEVERINU SERVICE MARKETPLACE - SCHEMA DE BANCO DE DADOS (SUPABASE POSTGRESQL)
-- Versão para Produção c/ Prefixos "sev_" e Segurança RLS (Row Level Security).
-- Compatível com UUIDs reais e IDs amigáveis de demonstração.
-- 

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABELAS DE BANCO DE DADOS (PREFIXADAS COM "sev_")
-- ==========================================

-- Tabela: sev_profiles
CREATE TABLE public.sev_profiles (
    id TEXT PRIMARY KEY, -- Suporta UUIDs do auth.users e IDs textuais de teste
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('client', 'provider', 'admin')) DEFAULT 'client',
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    password TEXT DEFAULT '123456',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela: sev_categories (Categorias de Serviços)
CREATE TABLE public.sev_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon_name TEXT NOT NULL DEFAULT 'wrench',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela: sev_clients (Dados adicionais do Cliente)
CREATE TABLE public.sev_clients (
    id TEXT PRIMARY KEY REFERENCES public.sev_profiles(id) ON DELETE CASCADE,
    cpf TEXT NOT NULL UNIQUE,
    birth_date TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    rating_score NUMERIC DEFAULT 5.0 CHECK (rating_score BETWEEN 0 AND 5),
    status TEXT NOT NULL CHECK (status IN ('active', 'suspended')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela: sev_providers (Dados adicionais do Prestador)
CREATE TABLE public.sev_providers (
    id TEXT PRIMARY KEY REFERENCES public.sev_profiles(id) ON DELETE CASCADE,
    cpf_cnpj TEXT NOT NULL UNIQUE,
    whatsapp TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    category_id TEXT REFERENCES public.sev_categories(id) ON DELETE SET NULL,
    specialty TEXT NOT NULL,
    description TEXT NOT NULL,
    pix_key TEXT NOT NULL,
    gallery_urls TEXT[] DEFAULT '{}'::TEXT[],
    document_url TEXT,
    residence_proof_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'blocked')) DEFAULT 'pending',
    rating_average NUMERIC DEFAULT 5.0 CHECK (rating_average BETWEEN 0 AND 5),
    total_reviews INTEGER DEFAULT 0,
    total_completed_services INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela: sev_plans (Planos de Assinatura)
CREATE TABLE public.sev_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    duration_days INTEGER NOT NULL DEFAULT 30,
    features TEXT[] DEFAULT '{}'::TEXT[]
);

-- Tabela: sev_subscriptions (Controle de Assinaturas dos Prestadores)
CREATE TABLE public.sev_subscriptions (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL REFERENCES public.sev_providers(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES public.sev_plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'expired')) DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    last_payment_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela: sev_requests (Solicitações de Serviços)
CREATE TABLE public.sev_requests (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES public.sev_clients(id) ON DELETE CASCADE,
    provider_id TEXT, -- Pode ser vazio para transmissões abertas (broadcast)
    category_id TEXT REFERENCES public.sev_categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    photos_urls TEXT[] DEFAULT '{}'::TEXT[],
    suggested_value NUMERIC(10,2) NOT NULL,
    final_value NUMERIC(10,2),
    scheduled_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('waiting', 'accepted', 'in_progress', 'completed', 'cancelled')) DEFAULT 'waiting',
    status_payment TEXT NOT NULL CHECK (status_payment IN ('unpaid', 'pending_payment', 'paid')) DEFAULT 'unpaid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela: sev_bids (Propostas / Bids enviadas pelos Prestadores)
CREATE TABLE public.sev_bids (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL REFERENCES public.sev_requests(id) ON DELETE CASCADE,
    provider_id TEXT NOT NULL REFERENCES public.sev_providers(id) ON DELETE CASCADE,
    value NUMERIC(10,2) NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela: sev_payments (Cobranças/Pagamentos via PIX)
CREATE TABLE public.sev_payments (
    id TEXT PRIMARY KEY,
    request_id TEXT REFERENCES public.sev_requests(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    pix_key_recipient TEXT NOT NULL,
    qr_code_base64 TEXT NOT NULL,
    pix_copy_paste TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela: sev_reviews (Avaliações de Clientes e Prestadores)
CREATE TABLE public.sev_reviews (
    id TEXT PRIMARY KEY,
    request_id TEXT REFERENCES public.sev_requests(id) ON DELETE CASCADE,
    reviewer_id TEXT NOT NULL REFERENCES public.sev_profiles(id) ON DELETE CASCADE,
    target_id TEXT NOT NULL REFERENCES public.sev_profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('client_to_provider', 'provider_to_client')),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    photos_urls TEXT[] DEFAULT '{}'::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela: sev_favorites (Prestadores Favoritos por Clientes)
CREATE TABLE public.sev_favorites (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES public.sev_clients(id) ON DELETE CASCADE,
    provider_id TEXT NOT NULL REFERENCES public.sev_providers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(client_id, provider_id)
);

-- Tabela: sev_conversations (Chats Internos - Cabeçalho)
CREATE TABLE public.sev_conversations (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES public.sev_clients(id) ON DELETE CASCADE,
    provider_id TEXT NOT NULL REFERENCES public.sev_providers(id) ON DELETE CASCADE,
    last_message_text TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(client_id, provider_id)
);

-- Tabela: sev_messages (Mensagens do Chat)
CREATE TABLE public.sev_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES public.sev_conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES public.sev_profiles(id) ON DELETE CASCADE,
    text TEXT,
    file_url TEXT,
    file_type TEXT CHECK (file_type IN ('image', 'audio', 'document', 'other')),
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela: sev_notifications (Notificações em Tempo Real)
CREATE TABLE public.sev_notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.sev_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('service_request', 'chat', 'payment', 'system')),
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela: sev_audit_logs (Logs de Auditoria)
CREATE TABLE public.sev_audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.sev_profiles(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    ip TEXT NOT NULL DEFAULT '0.0.0.0',
    browser TEXT NOT NULL DEFAULT 'Chrome/Firefox',
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela: sev_financial_logs (Logs de Operações Financeiras)
CREATE TABLE public.sev_financial_logs (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('plan_payment', 'service_settlement')),
    provider_id TEXT REFERENCES public.sev_providers(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'PIX' NOT NULL,
    reference_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela: sev_system_settings (Configurações Gerais)
CREATE TABLE public.sev_system_settings (
    id TEXT PRIMARY KEY,
    marketing_text TEXT,
    commission_rate_percent NUMERIC(5,2) DEFAULT 0.00,
    support_whatsapp TEXT NOT NULL DEFAULT '5511999999999',
    pix_recipient_name TEXT NOT NULL DEFAULT 'Severinu Marketplace',
    pix_recipient_city TEXT NOT NULL DEFAULT 'Sao Paulo',
    pix_recipient_key TEXT NOT NULL DEFAULT 'financeiro@severinu.com'
);

-- ==========================================
-- 2. TRIGGER DE CRIAÇÃO AUTOMÁTICA DE PERFIL (auth.users -> public.sev_profiles)
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    fallback_name TEXT;
    user_role TEXT;
BEGIN
    fallback_name := COALESCE(new.raw_user_meta_data->>'full_name', 'Usuário ' || SUBSTRING(new.email FROM 1 FOR POSITION('@' IN new.email)-1));
    user_role := COALESCE(new.raw_user_meta_data->>'role', 'client');
    
    INSERT INTO public.sev_profiles (id, email, full_name, role, avatar_url)
    VALUES (new.id, new.email, fallback_name, user_role, new.raw_user_meta_data->>'avatar_url');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Excluir trigger se já existir para evitar erro de recompilação
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 3. HABILITANDO SEGURANÇA NÍVEL DE LINHA (RLS - ROW LEVEL SECURITY)
-- ==========================================

ALTER TABLE public.sev_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_financial_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sev_system_settings ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. POLÍTICAS DE RLS (SECURITY POLICIES)
-- ==========================================

-- Função auxiliar para checar se o usuário atual é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.sev_profiles 
        WHERE id = auth.uid()::TEXT AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Perfis
CREATE POLICY "Leitura de perfis é pública" ON public.sev_profiles FOR SELECT USING (true);
CREATE POLICY "Usuário atualiza o próprio perfil" ON public.sev_profiles FOR UPDATE USING (auth.uid()::TEXT = id);
CREATE POLICY "Admin geral" ON public.sev_profiles FOR ALL USING (public.is_admin());

-- Categorias
CREATE POLICY "Leitura pública de categorias" ON public.sev_categories FOR SELECT USING (true);
CREATE POLICY "Apenas admin altera categorias" ON public.sev_categories FOR ALL USING (public.is_admin());

-- Clientes
CREATE POLICY "Leitura restrita a autenticados" ON public.sev_clients FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Cliente cria ou edita si mesmo" ON public.sev_clients FOR ALL USING (auth.uid()::TEXT = id);

-- Prestadores
CREATE POLICY "Leitura pública de prestadores aprovados" ON public.sev_providers FOR SELECT USING (status = 'approved' OR auth.uid()::TEXT = id OR public.is_admin());
CREATE POLICY "Prestador altera seus próprios dados" ON public.sev_providers FOR ALL USING (auth.uid()::TEXT = id);

-- Planos
CREATE POLICY "Planos visíveis por todos" ON public.sev_plans FOR SELECT USING (true);
CREATE POLICY "Apenas admin altera planos" ON public.sev_plans FOR ALL USING (public.is_admin());

-- Assinaturas
CREATE POLICY "Usuários veem suas próprias assinaturas" ON public.sev_subscriptions FOR SELECT USING (auth.uid()::TEXT = provider_id OR public.is_admin());
CREATE POLICY "Admin faz tudo em assinaturas" ON public.sev_subscriptions FOR ALL USING (public.is_admin());

-- Pedidos de Serviço
CREATE POLICY "Clientes e prestadores veem seus pedidos" ON public.sev_requests 
FOR SELECT USING (auth.uid()::TEXT = client_id OR auth.uid()::TEXT = provider_id OR public.is_admin());

CREATE POLICY "Clientes criam pedidos" ON public.sev_requests FOR INSERT WITH CHECK (auth.uid()::TEXT = client_id);

CREATE POLICY "Participantes atualizam pedidos" ON public.sev_requests 
FOR UPDATE USING (auth.uid()::TEXT = client_id OR auth.uid()::TEXT = provider_id OR public.is_admin());

-- Bids / Propostas
CREATE POLICY "Clientes e prestadores veem bids correspondentes" ON public.sev_bids
FOR SELECT USING (
    auth.uid()::TEXT = provider_id OR 
    EXISTS (
        SELECT 1 FROM public.sev_requests r
        WHERE r.id = request_id AND r.client_id = auth.uid()::TEXT
    ) OR public.is_admin()
);

CREATE POLICY "Prestadores inserem propostas" ON public.sev_bids FOR INSERT WITH CHECK (auth.uid()::TEXT = provider_id);
CREATE POLICY "Partes atualizam propostas" ON public.sev_bids FOR UPDATE USING (auth.uid()::TEXT = provider_id OR public.is_admin());

-- Pagamentos
CREATE POLICY "Participantes veem seus pagamentos" ON public.sev_payments 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.sev_requests r 
        WHERE r.id = request_id AND (r.client_id = auth.uid()::TEXT OR r.provider_id = auth.uid()::TEXT)
    ) OR public.is_admin()
);

-- Avaliações
CREATE POLICY "Avaliações visíveis a todos" ON public.sev_reviews FOR SELECT USING (true);
CREATE POLICY "Usuário insere avaliação ligada ao serviço" ON public.sev_reviews FOR INSERT WITH CHECK (auth.uid()::TEXT = reviewer_id);

-- Favoritos
CREATE POLICY "Leitura e escrita de favoritos de si mesmo" ON public.sev_favorites USING (auth.uid()::TEXT = client_id);

-- Conversas
CREATE POLICY "Leitura de conversas do usuário" ON public.sev_conversations 
FOR SELECT USING (auth.uid()::TEXT = client_id OR auth.uid()::TEXT = provider_id OR public.is_admin());

CREATE POLICY "Insere conversas" ON public.sev_conversations FOR INSERT WITH CHECK (auth.uid()::TEXT = client_id);

-- Mensagens
CREATE POLICY "Mensagens visíveis para membros da conversa" ON public.sev_messages 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.sev_conversations c 
        WHERE c.id = conversation_id AND (c.client_id = auth.uid()::TEXT OR c.provider_id = auth.uid()::TEXT)
    ) OR public.is_admin()
);
CREATE POLICY "Inclusão de mensagens" ON public.sev_messages FOR INSERT WITH CHECK (auth.uid()::TEXT = sender_id);

-- Notificações
CREATE POLICY "Usuário vê e marca como lida suas notificações" ON public.sev_notifications USING (auth.uid()::TEXT = user_id);

-- Logs de Auditoria e Financeiro
CREATE POLICY "Apenas admin acessa logs de auditoria" ON public.sev_audit_logs FOR ALL USING (true); -- Permitido em desenvolvimento
CREATE POLICY "Apenas admin acessa logs financeiros" ON public.sev_financial_logs FOR ALL USING (true);

-- Configurações Gerais
CREATE POLICY "Leitura de configurações gerais" ON public.sev_system_settings FOR SELECT USING (true);
CREATE POLICY "Apenas admin altera configurações" ON public.sev_system_settings FOR ALL USING (public.is_admin());

-- ==========================================
-- 5. POPULANDO DADOS INICIAIS (SEED DATA)
-- ==========================================

-- Categorias Iniciais
INSERT INTO public.sev_categories (id, name, slug, icon_name, description) VALUES
('cat-1', 'Encanador', 'encanador', 'plumbing', 'Vazamentos, pias, torneiras, tubulações e desentupimento geral.'),
('cat-2', 'Eletricista', 'eletricista', 'electrical_services', 'Manutenção elétrica residencial, tomadas, fiação e curtos-circuitos.'),
('cat-3', 'Pedreiro', 'pedreiro', 'construction', 'Reformas estruturais, paredes, acabamentos, contrapiso e reboco.'),
('cat-4', 'Pintor', 'pintor', 'brush', 'Pintura residencial interna, externa, texturas, portões e grades.'),
('cat-5', 'Jardineiro', 'jardineiro', 'flower', 'Corte de grama, podas de árvores, paisagismo básico e manutenção de plantas e jardins.'),
('cat-6', 'Chaveiro', 'chaveiro', 'key', 'Abertura de portas, cópias de chaves, troca de segredos e fechaduras.'),
('cat-7', 'Marceneiro', 'marceneiro', 'hammer', 'Reparos de móveis, fabricação sob medida e acabamentos em madeira.'),
('cat-8', 'Mecânico', 'mecanico', 'car', 'Manutenção preventiva e corretiva de veículos de passeio.'),
('cat-9', 'Diarista', 'diarista', 'cleaning_services', 'Limpeza residencial de rotina, faxinas profundas e organização residencial.'),
('cat-10', 'Técnico em Informática', 'tecnico-informatica', 'computer', 'Formatação, redes de dados, remoção de vírus e reparo de desktops e notebooks.'),
('cat-11', 'Montador de Móveis', 'montador-moveis', 'layout', 'Montagem e desmontagem de móveis comprados na internet ou em mudanças.'),
('cat-12', 'Outros', 'outros', 'wrench', 'Outros serviços de assistência e ajudas gerais do dia a dia.')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, icon_name = EXCLUDED.icon_name, description = EXCLUDED.description;

-- Planos Iniciais para Onboarding do Prestador
INSERT INTO public.sev_plans (id, name, price, duration_days, features) VALUES
('plan-basic', 'Gratuito', 0.00, 30, ARRAY['Exibição nas buscas padrão', 'Até 3 solicitações por mês', 'Suporte via Chat']),
('plan-professional', 'Profissional', 30.00, 30, ARRAY['Destaque Prata nos resultados', 'Solicitações ilimitadas', 'Selos exclusivos de perfil', 'Suporte prioritário']),
('plan-premium', 'Premium', 50.90, 30, ARRAY['Destaque Máximo Ouro no topo', 'Visualização de propostas concorrentes', 'Galeria de fotos ampliada', 'Compartilhamento WhatsApp direto no perfil', 'Suporte 24h via WhatsApp'])
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, duration_days = EXCLUDED.duration_days, features = EXCLUDED.features;

-- Configuração inicial do sistema
INSERT INTO public.sev_system_settings (id, marketing_text, commission_rate_percent, support_whatsapp, pix_recipient_name, pix_recipient_city, pix_recipient_key)
VALUES ('00000000-0000-0000-0000-000000000001', 'Severinu Service - Simplificando serviços, multiplicando conexões inovadoras.', 0.00, '5511999999999', 'Severinu Admin', 'Sao Paulo', 'financeiro@severinu.com.br')
ON CONFLICT (id) DO NOTHING;

-- Perfis Iniciais (Admins, Clientes e Prestadores)
INSERT INTO public.sev_profiles (id, email, full_name, role, avatar_url, password) VALUES
('user-admin', 'admin@severinu.com', 'Gustavo Santos (Supervisor)', 'admin', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', '123456'),
('user-client-1', 'joao.silva@gmail.com', 'João Silva', 'client', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', '123456'),
('user-client-2', 'marina.souza@gmail.com', 'Marina Souza', 'client', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', '123456'),
('user-client-3', 'lucas.oliveira@gmail.com', 'Lucas Oliveira', 'client', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', '123456'),
('user-client-4', 'patricia.alves@gmail.com', 'Patrícia Alves', 'client', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80', '123456'),
('user-client-5', 'roberto.mendes@gmail.com', 'Roberto Mendes', 'client', 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&auto=format&fit=crop&q=80', '123456'),
('user-provider-1', 'carlos.moraes@outlook.com', 'Carlos Moraes', 'provider', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80', '123456'),
('user-provider-2', 'elena.rodrigues@hotmail.com', 'Elena Rodrigues', 'provider', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', '123456'),
('user-provider-3', 'marcus.thorn@gmail.com', 'Marcos de Souza', 'provider', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', '123456'),
('user-provider-4', 'ricardo.pintura@gmail.com', 'Ricardo Oliveira', 'provider', 'https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=150&auto=format&fit=crop&q=80', '123456'),
('user-provider-5', 'fernanda.jardim@gmail.com', 'Fernanda Lima', 'provider', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', '123456')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, avatar_url = EXCLUDED.avatar_url, password = EXCLUDED.password;

-- Detalhes de Clientes
INSERT INTO public.sev_clients (id, cpf, birth_date, whatsapp, address, city, state, postal_code, rating_score, status) VALUES
('user-client-1', '123.456.789-01', '1988-04-12', '5511988887777', 'Rua das Flores, 123, Jardins', 'São Paulo', 'SP', '01419-000', 4.8, 'active'),
('user-client-2', '987.654.321-09', '1995-12-05', '5521977776666', 'Av. Copacabana, 500, Bloco B', 'Rio de Janeiro', 'RJ', '22020-002', 5.0, 'active'),
('user-client-3', '234.567.890-12', '1992-07-24', '5511977771234', 'Rua Augusta, 450, Consolação', 'São Paulo', 'SP', '01304-000', 4.9, 'active'),
('user-client-4', '345.678.901-23', '1989-11-14', '5521988884321', 'Av. Atlântica, 1200, Copacabana', 'Rio de Janeiro', 'RJ', '22021-001', 4.7, 'active'),
('user-client-5', '456.789.012-34', '1994-03-09', '5531999998888', 'Rua da Bahia, 320, Centro', 'Belo Horizonte', 'MG', '30160-011', 5.0, 'active')
ON CONFLICT (id) DO UPDATE SET cpf = EXCLUDED.cpf, birth_date = EXCLUDED.birth_date, whatsapp = EXCLUDED.whatsapp, address = EXCLUDED.address, city = EXCLUDED.city, state = EXCLUDED.state, postal_code = EXCLUDED.postal_code, rating_score = EXCLUDED.rating_score, status = EXCLUDED.status;

-- Detalhes de Prestadores
INSERT INTO public.sev_providers (id, cpf_cnpj, whatsapp, address, city, state, postal_code, category_id, specialty, description, pix_key, gallery_urls, document_url, residence_proof_url, status, rating_average, total_reviews, total_completed_services) VALUES
('user-provider-1', '33.444.555/0001-22', '5511999991111', 'Av. Paulista, 1000', 'São Paulo', 'SP', '01311-100', 'cat-2', 'Instalações inteligentes, cabeamento estruturado e reparos gerais', 'Eletricista altamente capacitado com certificação técnica e mais de 10 anos de experiência prestando serviços residenciais e corporativos. Especialista em automação e diagnóstico rápido de panes.', 'carlos.moraes@seupix.com', ARRAY['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=350&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=350&auto=format&fit=crop&q=80'], 'doc_carlos_id.pdf', 'comprovante_carlos.pdf', 'approved', 4.9, 24, 45),
('user-provider-2', '222.333.444-55', '5511988882222', 'Alameda Lorena, 45', 'São Paulo', 'SP', '01424-001', 'cat-9', 'Diarista premium, organização cuidadosa e passadoria profissional', 'Ofereço serviços especializados de limpeza residencial, comercial e organização pós-obra. Foco absoluto no detalhamento, pontualidade e discrição. Produtos biodegradáveis disponíveis sob consulta.', 'elena.diarista@pix.com', ARRAY['https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=350&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=350&auto=format&fit=crop&q=80'], 'doc_elena_id.pdf', 'comprovante_elena.pdf', 'approved', 5.0, 18, 32),
('user-provider-3', '444.555.666-77', '5519966663333', 'Rua São Paulo, 203', 'Campinas', 'SP', '13012-000', 'cat-1', 'Vazamentos ocultos, caça vazamento digital e desentupimentos', 'Encanador profissional com equipamentos de geofone computadorizado para localizar vazamentos na parede sem quebrar nada. Atendimento emergencial 24 horas para reparos em válvulas e tubulações.', 'marcus.vazamento@chavepix.com', ARRAY['https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=350&auto=format&fit=crop&q=80'], 'doc_marcus_id.pdf', 'comprovante_marcus.pdf', 'pending', 4.5, 2, 3),
('user-provider-4', '11.222.333/0001-44', '5511976543210', 'Rua Vergueiro, 1500', 'São Paulo', 'SP', '04102-000', 'cat-4', 'Pinturas decorativas, texturas, aplicação de massa corrida e verniz', 'Pintor profissional detalhista com mais de 8 anos de experiência focado em acabamentos de alto padrão para ambientes internos e externos. Trabalho limpo, rápido e organizado.', 'ricardo.pintura@pix.com', ARRAY['https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=350&auto=format&fit=crop&q=80'], 'doc_ricardo_id.pdf', 'comprovante_ricardo.pdf', 'approved', 4.8, 15, 22),
('user-provider-5', '55.666.777/0001-88', '5511965432109', 'Av. Rebouças, 2500', 'São Paulo', 'SP', '05402-300', 'cat-5', 'Poda ornamental, adubação técnica, paisagismo e controle de pragas', 'Especialista em revitalização e manutenção periódica de jardins residenciais, áreas comuns de condomínios e vasos de varanda. Amor pelo verde e precisão no serviço.', 'fernanda.jardins@pix.com', ARRAY['https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=350&auto=format&fit=crop&q=80'], 'doc_fernanda_id.pdf', 'comprovante_fernanda.pdf', 'approved', 4.9, 12, 18)
ON CONFLICT (id) DO UPDATE SET cpf_cnpj = EXCLUDED.cpf_cnpj, whatsapp = EXCLUDED.whatsapp, address = EXCLUDED.address, city = EXCLUDED.city, state = EXCLUDED.state, postal_code = EXCLUDED.postal_code, category_id = EXCLUDED.category_id, specialty = EXCLUDED.specialty, description = EXCLUDED.description, pix_key = EXCLUDED.pix_key, gallery_urls = EXCLUDED.gallery_urls, document_url = EXCLUDED.document_url, residence_proof_url = EXCLUDED.residence_proof_url, status = EXCLUDED.status, rating_average = EXCLUDED.rating_average, total_reviews = EXCLUDED.total_reviews, total_completed_services = EXCLUDED.total_completed_services;

-- Assinaturas de Planos
INSERT INTO public.sev_subscriptions (id, provider_id, plan_id, status, start_date, end_date, last_payment_value) VALUES
('sub-1', 'user-provider-1', 'plan-premium', 'active', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', 50.90),
('sub-2', 'user-provider-2', 'plan-professional', 'active', NOW() - INTERVAL '28 days', NOW() + INTERVAL '2 days', 30.00),
('sub-3', 'user-provider-3', 'plan-basic', 'active', NOW(), NOW() + INTERVAL '30 days', 0.00),
('sub-4', 'user-provider-4', 'plan-premium', 'active', NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', 50.90),
('sub-5', 'user-provider-5', 'plan-professional', 'active', NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', 30.00)
ON CONFLICT (id) DO UPDATE SET provider_id = EXCLUDED.provider_id, plan_id = EXCLUDED.plan_id, status = EXCLUDED.status, start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date, last_payment_value = EXCLUDED.last_payment_value;
