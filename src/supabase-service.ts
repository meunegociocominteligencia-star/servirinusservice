/**
 * Unified Database and Service Layer for Severinu Service.
 * Implements standard Supabase client initialization AND a stateful localStorage mock fallback
 * to provide a 100% functional, data-persistent preview immediately.
 */

import { createClient } from '@supabase/supabase-js';
import { 
  Profile, ClientProfile, ProviderProfile, Category, 
  ServiceRequest, Payment, SubscriptionPlan, ProviderSubscription, 
  Review, Favorite, Conversation, Message, Notification, 
  AuditLog, FinancialLog, SystemSettings, ServiceBid
} from './types';
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';

// Environment variables
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isRealSupabase = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// Official Supabase client instances (optional)
export const supabase = isRealSupabase 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

// ==========================================
// SEED MOCK DATA (Fallback to LocalStorage)
// ==========================================

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Encanador', slug: 'encanador', icon_name: 'plumbing', description: 'Vazamentos, pias, torneiras, tubulações e desentupimento geral.', created_at: new Date().toISOString() },
  { id: 'cat-2', name: 'Eletricista', slug: 'eletricista', icon_name: 'electrical_services', description: 'Manutenção elétrica residencial, tomadas, fiação e curtos.', created_at: new Date().toISOString() },
  { id: 'cat-3', name: 'Pedreiro', slug: 'pedreiro', icon_name: 'construction', description: 'Reformas estruturais, paredes, acabamentos, reboco.', created_at: new Date().toISOString() },
  { id: 'cat-4', name: 'Pintor', slug: 'pintor', icon_name: 'brush', description: 'Pintura residencial interna, externa, texturas, massa corrida.', created_at: new Date().toISOString() },
  { id: 'cat-5', name: 'Jardineiro', slug: 'jardineiro', icon_name: 'flower', description: 'Corte de grama, podas de árvores, paisagismo básico e jardins.', created_at: new Date().toISOString() },
  { id: 'cat-6', name: 'Chaveiro', slug: 'chaveiro', icon_name: 'key', description: 'Abertura de portas, cópias de chaves, troca de segredos.', created_at: new Date().toISOString() },
  { id: 'cat-7', name: 'Marceneiro', slug: 'marceneiro', icon_name: 'hammer', description: 'Reparos de móveis, fabricação sob medida e acabamentos.', created_at: new Date().toISOString() },
  { id: 'cat-8', name: 'Mecânico', slug: 'mecanico', icon_name: 'car', description: 'Manutenção preventiva e corretiva de veículos de passeio.', created_at: new Date().toISOString() },
  { id: 'cat-9', name: 'Diarista', slug: 'diarista', icon_name: 'cleaning_services', description: 'Limpeza residencial de rotina, faxinas profundas e organização.', created_at: new Date().toISOString() },
  { id: 'cat-10', name: 'Técnico em Informática', slug: 'tecnico-informatica', icon_name: 'computer', description: 'Formatação, redes de dados, remoção de vírus e reparos.', created_at: new Date().toISOString() },
  { id: 'cat-11', name: 'Montador de Móveis', slug: 'montador-moveis', icon_name: 'layout', description: 'Montagem de móveis comprados na internet ou em mudanças.', created_at: new Date().toISOString() },
  { id: 'cat-12', name: 'Outros', slug: 'outros', icon_name: 'wrench', description: 'Outros serviços de assistência e ajudas gerais do dia a dia.', created_at: new Date().toISOString() }
];

const INITIAL_PLANS: SubscriptionPlan[] = [
  { id: 'plan-basic', name: 'Gratuito', price: 0, duration_days: 30, features: ['Exibição nas buscas padrão', 'Até 3 solicitações por mês', 'Suporte via Chat'] },
  { id: 'plan-professional', name: 'Profissional', price: 30.00, duration_days: 30, features: ['Destaque Prata nos resultados', 'Solicitações ilimitadas', 'Selos exclusivos de perfil', 'Suporte prioritário'] },
  { id: 'plan-premium', name: 'Premium', price: 50.90, duration_days: 30, features: ['Destaque Máximo Ouro no topo', 'Visualização de propostas concorrentes', 'Galeria de fotos ampliada', 'Compartilhamento WhatsApp direto no perfil', 'Suporte 24h via WhatsApp'] }
];

const INITIAL_PROFILES: Profile[] = [
  { id: 'user-admin', email: 'admin@severinu.com', role: 'admin', full_name: 'Gustavo Santos (Supervisor)', avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
  
  { id: 'user-client-1', email: 'joao.silva@gmail.com', role: 'client', full_name: 'João Silva', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
  { id: 'user-client-2', email: 'marina.souza@gmail.com', role: 'client', full_name: 'Marina Souza', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
  { id: 'user-client-3', email: 'lucas.oliveira@gmail.com', role: 'client', full_name: 'Lucas Oliveira', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
  { id: 'user-client-4', email: 'patricia.alves@gmail.com', role: 'client', full_name: 'Patrícia Alves', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
  { id: 'user-client-5', email: 'roberto.mendes@gmail.com', role: 'client', full_name: 'Roberto Mendes', avatar_url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
  
  { id: 'user-provider-1', email: 'carlos.moraes@outlook.com', role: 'provider', full_name: 'Carlos Moraes', avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
  { id: 'user-provider-2', email: 'elena.rodrigues@hotmail.com', role: 'provider', full_name: 'Elena Rodrigues', avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
  { id: 'user-provider-3', email: 'marcus.thorn@gmail.com', role: 'provider', full_name: 'Marcos de Souza', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
  { id: 'user-provider-4', email: 'ricardo.pintura@gmail.com', role: 'provider', full_name: 'Ricardo Oliveira', avatar_url: 'https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=150&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
  { id: 'user-provider-5', email: 'fernanda.jardim@gmail.com', role: 'provider', full_name: 'Fernanda Lima', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', created_at: new Date().toISOString() }
];

const INITIAL_CLIENTS: ClientProfile[] = [
  { id: 'user-client-1', cpf: '123.456.789-01', birth_date: '1988-04-12', whatsapp: '5511988887777', address: 'Rua das Flores, 123, Jardins', city: 'São Paulo', state: 'SP', postal_code: '01419-000', rating_score: 4.8, status: 'active', created_at: new Date().toISOString() },
  { id: 'user-client-2', cpf: '987.654.321-09', birth_date: '1995-12-05', whatsapp: '5521977776666', address: 'Av. Copacabana, 500, Bloco B', city: 'Rio de Janeiro', state: 'RJ', postal_code: '22020-002', rating_score: 5.0, status: 'active', created_at: new Date().toISOString() },
  { id: 'user-client-3', cpf: '234.567.890-12', birth_date: '1992-07-24', whatsapp: '5511977771234', address: 'Rua Augusta, 450, Consolação', city: 'São Paulo', state: 'SP', postal_code: '01304-000', rating_score: 4.9, status: 'active', created_at: new Date().toISOString() },
  { id: 'user-client-4', cpf: '345.678.901-23', birth_date: '1989-11-14', whatsapp: '5521988884321', address: 'Av. Atlântica, 1200, Copacabana', city: 'Rio de Janeiro', state: 'RJ', postal_code: '22021-001', rating_score: 4.7, status: 'active', created_at: new Date().toISOString() },
  { id: 'user-client-5', cpf: '456.789.012-34', birth_date: '1994-03-09', whatsapp: '5531999998888', address: 'Rua da Bahia, 320, Centro', city: 'Belo Horizonte', state: 'MG', postal_code: '30160-011', rating_score: 5.0, status: 'active', created_at: new Date().toISOString() }
];

const INITIAL_PROVIDERS: ProviderProfile[] = [
  { 
    id: 'user-provider-1', 
    cpf_cnpj: '33.444.555/0001-22', 
    whatsapp: '5511999991111', 
    address: 'Av. Paulista, 1000', 
    city: 'São Paulo', 
    state: 'SP', 
    postal_code: '01311-100', 
    category_id: 'cat-2', // Eletricista
    specialty: 'Instalações inteligentes, cabeamento estruturado e reparos gerais', 
    description: 'Eletricista altamente capacitado com certificação técnica e mais de 10 anos de experiência prestando serviços residenciais e corporativos. Especialista em automação e diagnóstico rápido de panes.', 
    pix_key: 'carlos.moraes@seupix.com', 
    gallery_urls: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=350&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=350&auto=format&fit=crop&q=80'
    ],
    document_url: 'doc_carlos_id.pdf',
    residence_proof_url: 'comprovante_carlos.pdf',
    status: 'approved',
    rating_average: 4.9,
    total_reviews: 24,
    total_completed_services: 45,
    created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year ago
  },
  { 
    id: 'user-provider-2', 
    cpf_cnpj: '222.333.444-55', 
    whatsapp: '5511988882222', 
    address: 'Alameda Lorena, 45', 
    city: 'São Paulo', 
    state: 'SP', 
    postal_code: '01424-001', 
    category_id: 'cat-9', // Diarista (Limpeza)
    specialty: 'Diarista premium, organização cuidadosa e passadoria profissional', 
    description: 'Ofereço serviços especializados de limpeza residencial, comercial e organização pós-obra. Foco absoluto no detalhamento, pontualidade e discrição. Produtos biodegradáveis disponíveis sob consulta.', 
    pix_key: 'elena.diarista@pix.com', 
    gallery_urls: [
      'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=350&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=350&auto=format&fit=crop&q=80'
    ],
    document_url: 'doc_elena_id.pdf',
    residence_proof_url: 'comprovante_elena.pdf',
    status: 'approved',
    rating_average: 5.0,
    total_reviews: 18,
    total_completed_services: 32,
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
  },
  { 
    id: 'user-provider-3', 
    cpf_cnpj: '444.555.666-77', 
    whatsapp: '5519966663333', 
    address: 'Rua São Paulo, 203', 
    city: 'Campinas', 
    state: 'SP', 
    postal_code: '13012-000', 
    category_id: 'cat-1', // Encanador
    specialty: 'Vazamentos ocultos, caça vazamento digital e desentupimentos', 
    description: 'Encanador profissional com equipamentos de geofone computadorizado para localizar vazamentos na parede sem quebrar nada. Atendimento emergencial 24 horas para reparos em válvulas e tubulações.', 
    pix_key: 'marcus.vazamento@chavepix.com', 
    gallery_urls: [
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=350&auto=format&fit=crop&q=80'
    ],
    document_url: 'doc_marcus_id.pdf',
    residence_proof_url: 'comprovante_marcus.pdf',
    status: 'pending',
    rating_average: 4.5,
    total_reviews: 2,
    total_completed_services: 3,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  { 
    id: 'user-provider-4', 
    cpf_cnpj: '11.222.333/0001-44', 
    whatsapp: '5511976543210', 
    address: 'Rua Vergueiro, 1500', 
    city: 'São Paulo', 
    state: 'SP', 
    postal_code: '04102-000', 
    category_id: 'cat-4', // Pintor
    specialty: 'Pinturas decorativas, texturas, aplicação de massa corrida e verniz', 
    description: 'Pintor profissional detalhista com mais de 8 anos de experiência focado em acabamentos de alto padrão para ambientes internos e externos. Trabalho limpo, rápido e organizado.', 
    pix_key: 'ricardo.pintura@pix.com', 
    gallery_urls: [
      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=350&auto=format&fit=crop&q=80'
    ],
    document_url: 'doc_ricardo_id.pdf',
    residence_proof_url: 'comprovante_ricardo.pdf',
    status: 'approved',
    rating_average: 4.8,
    total_reviews: 15,
    total_completed_services: 22,
    created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
  },
  { 
    id: 'user-provider-5', 
    cpf_cnpj: '55.666.777/0001-88', 
    whatsapp: '5511965432109', 
    address: 'Av. Rebouças, 2500', 
    city: 'São Paulo', 
    state: 'SP', 
    postal_code: '05402-300', 
    category_id: 'cat-5', // Jardineiro
    specialty: 'Poda ornamental, adubação técnica, paisagismo e controle de pragas', 
    description: 'Especialista em revitalização e manutenção periódica de jardins residenciais, áreas comuns de condomínios e vasos de varanda. Amor pelo verde e precisão no serviço.', 
    pix_key: 'fernanda.jardins@pix.com', 
    gallery_urls: [
      'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=350&auto=format&fit=crop&q=80'
    ],
    document_url: 'doc_fernanda_id.pdf',
    residence_proof_url: 'comprovante_fernanda.pdf',
    status: 'approved',
    rating_average: 4.9,
    total_reviews: 12,
    total_completed_services: 18,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const INITIAL_SUBSCRIPTIONS: ProviderSubscription[] = [
  { id: 'sub-1', provider_id: 'user-provider-1', plan_id: 'plan-premium', status: 'active', start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), last_payment_value: 50.90, created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'sub-2', provider_id: 'user-provider-2', plan_id: 'plan-professional', status: 'active', start_date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), last_payment_value: 30.00, created_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'sub-3', provider_id: 'user-provider-3', plan_id: 'plan-basic', status: 'active', start_date: new Date().toISOString(), end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), last_payment_value: 0.00, created_at: new Date().toISOString() },
  { id: 'sub-4', provider_id: 'user-provider-4', plan_id: 'plan-premium', status: 'active', start_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), end_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), last_payment_value: 50.90, created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'sub-5', provider_id: 'user-provider-5', plan_id: 'plan-professional', status: 'active', start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), end_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), last_payment_value: 30.00, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
];

const INITIAL_REQUESTS: ServiceRequest[] = [
  {
    id: 'req-1',
    client_id: 'user-client-1',
    provider_id: 'user-provider-1',
    category_id: 'cat-2',
    title: 'Curto-circuito em tomadas da cozinha',
    description: 'Três tomadas da cozinha pararam de funcionar repentinamente, exalando um leve cheiro de queimado quando liguei o forno elétrico. Preciso de reparo urgente nas conexões e possivelmente trocar os disjuntores da fiação.',
    address: 'Rua das Flores, 123, Bloco A, Jardins',
    city: 'São Paulo',
    state: 'SP',
    photos_urls: [
      'https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=350&auto=format&fit=crop&q=80'
    ],
    suggested_value: 120.00,
    final_value: 150.00,
    scheduled_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    status_payment: 'paid',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'req-2',
    client_id: 'user-client-2',
    provider_id: 'user-provider-2',
    category_id: 'cat-9',
    title: 'Faxina pós-reforma em apartamento',
    description: 'Apartamento de 80m² acabou de ser reformado (pintura e reparos em gesso) e precisa de uma remoção completa de poeira, marcas no piso e lavagem minuciosa de banheiros e área de serviço.',
    address: 'Av. Copacabana, 500, Bloco B',
    city: 'Rio de Janeiro',
    state: 'RJ',
    photos_urls: [],
    suggested_value: 280.00,
    final_value: 320.00,
    scheduled_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'accepted',
    status_payment: 'pending_payment',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'req-3',
    client_id: 'user-client-1',
    provider_id: 'user-provider-2',
    category_id: 'cat-9',
    title: 'Limpeza periódica bimestral',
    description: 'Limpeza padrão de conservação em apartamento pequeno de 1 quarto. Aspirar pó, passar pano, limpar fogão, geladeira por fora e organizar a mesa de trabalho.',
    address: 'Rua das Flores, 123, Jardins',
    city: 'São Paulo',
    state: 'SP',
    photos_urls: [],
    suggested_value: 150.00,
    final_value: 150.00,
    scheduled_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    status_payment: 'paid',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    request_id: 'req-1',
    reviewer_id: 'user-client-1',
    target_id: 'user-provider-1',
    type: 'client_to_provider',
    rating: 5,
    comment: 'Excelente eletricista! Descobriu o curto-circuito na fiação velha rapidamente e trocou as conexões danificadas, recomendando disjuntores adequados. Super educado.',
    photos_urls: [],
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'rev-2',
    request_id: 'req-1',
    reviewer_id: 'user-provider-1',
    target_id: 'user-client-1',
    type: 'provider_to_client',
    rating: 5,
    comment: 'Cliente muito educado, explicou perfeitamente o problema e fez o pagamento PIX instantâneo logo após a finalização do serviço. Super recomendo!',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const INITIAL_CONVERSATIONS: Conversation[] = [
  { id: 'conv-1', client_id: 'user-client-1', provider_id: 'user-provider-1', last_message_text: 'Obrigado Carlos! Tudo resolvido nas tomadas.', updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'conv-2', client_id: 'user-client-2', provider_id: 'user-provider-2', last_message_text: 'Combinado! Chegarei por volta das 8:30 no local.', updated_at: new Date().toISOString(), created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
];

const INITIAL_MESSAGES: Message[] = [
  { id: 'msg-1', conversation_id: 'conv-1', sender_id: 'user-client-1', text: 'Olá Carlos, você teria horário livre para examinar as tomadas amanhã?', is_read: true, created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'msg-2', conversation_id: 'conv-1', sender_id: 'user-provider-1', text: 'Olá João! Tenho sim, posso ir na parte da tarde às 14h. Fica bom para você?', is_read: true, created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'msg-3', conversation_id: 'conv-1', sender_id: 'user-client-1', text: 'Perfeito, agendado. Obrigado!', is_read: true, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'msg-4', conversation_id: 'conv-1', sender_id: 'user-client-1', text: 'Obrigado Carlos! Tudo resolvido nas tomadas.', is_read: true, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  
  { id: 'msg-5', conversation_id: 'conv-2', sender_id: 'user-client-2', text: 'Oi Elena, preciso da faxina pós reforma no apartamento para quinta-feira cedo, tudo bem?', is_read: true, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'msg-6', conversation_id: 'conv-2', sender_id: 'user-provider-2', text: 'Olá Marina, aceito a solicitação do serviço. Levarei materiais padrão comigo.', is_read: true, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'msg-7', conversation_id: 'conv-2', sender_id: 'user-provider-2', text: 'Combinado! Chegarei por volta das 8:30 no local.', is_read: false, created_at: new Date().toISOString() }
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'not-1', user_id: 'user-provider-1', title: 'Novo Serviço Solicitado', message: 'João Silva solicitou reparo em tomadas na cozinha.', type: 'service_request', is_read: false, created_at: new Date().toISOString() },
  { id: 'not-2', user_id: 'user-client-2', title: 'Serviço Aceito', message: 'Elena Rodrigues aceitou sua solicitação de faxina.', type: 'service_request', is_read: false, created_at: new Date().toISOString() }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'log-1', user_id: 'user-admin', user_email: 'admin@severinu.com', action: 'Login', ip: '192.168.0.15', browser: 'Chrome 125.0', details: 'Autenticação bem sucedida como admin', created_at: new Date().toISOString() },
  { id: 'log-2', user_id: 'user-provider-1', user_email: 'carlos.moraes@outlook.com', action: 'Cadastro', ip: '189.15.22.41', browser: 'Safari Mobile', details: 'Inscrição de novo prestador finalizada', created_at: new Date(Date.now() - 365*24*60*60*1000).toISOString() },
  { id: 'log-3', user_id: 'user-client-1', user_email: 'joao.silva@gmail.com', action: 'Criação de serviço', ip: '200.41.33.2', browser: 'Firefox 126', details: 'Novo pedido criado: req-1', created_at: new Date(Date.now() - 6*24*60*60*1000).toISOString() },
  { id: 'log-4', user_id: 'user-client-1', user_email: 'joao.silva@gmail.com', action: 'Pagamento', ip: '200.41.33.2', browser: 'Firefox 126', details: 'Pagamento PIX confirmado de R$ 150,00 para Carlos Moraes', created_at: new Date(Date.now() - 4*24*60*60*1000).toISOString() }
];

const INITIAL_FINANCIAL_LOGS: FinancialLog[] = [
  { id: 'fin-1', type: 'plan_payment', provider_id: 'user-provider-1', amount: 50.90, payment_method: 'PIX', reference_id: 'sub-1', status: 'completed', created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'fin-2', type: 'plan_payment', provider_id: 'user-provider-2', amount: 30.00, payment_method: 'PIX', reference_id: 'sub-2', status: 'completed', created_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'fin-3', type: 'service_settlement', provider_id: 'user-provider-1', amount: 150.00, payment_method: 'PIX', reference_id: 'req-1', status: 'completed', created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }
];

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    request_id: 'req-1',
    amount: 150.00,
    pix_key_recipient: 'carlos.moraes@seupix.com',
    qr_code_base64: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKiLYcAEiU34u1Fj3z5C-40yoHptMu7pe2f6m7niZgDbxSwKcrW38OzmrcDuQ8tj27EPJQcqea93hFdX3UjpGcZ4u17zp9Kg414C-CZo8rOhNv18-oRG1VDO-nc4Xyro33bfzSuyep19Hnp5g9wbKkqzp0eUKf9nGW4wLcO_3l0f6vpQi9DcurTexvyZn6fuIcNfq2Zaq1Nhyv1wdV7IgOMUYEPjACF3kU7KOqOy2k1OTFFZDQeae6kc0IS5ZbzTmymNv4IxSfSBzC',
    pix_copy_paste: '00020126580014BR.GOV.BCB.PIX01366572e9d2-432a-4311-b0e2-7634f1073867-amount=150.00',
    status: 'completed',
    paid_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Helper to initialize database in LocalStorage
function initLocalStorageDB() {
  const checkAndSet = (key: string, initial: any) => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(initial));
    }
  };

  checkAndSet('sev_categories', INITIAL_CATEGORIES);
  checkAndSet('sev_plans', INITIAL_PLANS);
  checkAndSet('sev_profiles', INITIAL_PROFILES);
  checkAndSet('sev_clients', INITIAL_CLIENTS);
  checkAndSet('sev_providers', INITIAL_PROVIDERS);
  checkAndSet('sev_subscriptions', INITIAL_SUBSCRIPTIONS);
  checkAndSet('sev_requests', INITIAL_REQUESTS);
  checkAndSet('sev_reviews', INITIAL_REVIEWS);
  checkAndSet('sev_conversations', INITIAL_CONVERSATIONS);
  checkAndSet('sev_messages', INITIAL_MESSAGES);
  checkAndSet('sev_notifications', INITIAL_NOTIFICATIONS);
  checkAndSet('sev_audit_logs', INITIAL_AUDIT_LOGS);
  checkAndSet('sev_financial_logs', INITIAL_FINANCIAL_LOGS);
  checkAndSet('sev_payments', INITIAL_PAYMENTS);
  checkAndSet('sev_favorites', [] as Favorite[]);
  checkAndSet('sev_bids', [] as Array<any>);
  
  if (!localStorage.getItem('sev_currentUser')) {
    // Default to the first client so the app runs logged-in out of the box!
    localStorage.setItem('sev_currentUser', JSON.stringify(INITIAL_PROFILES[1]));
  }
}

async function saveArrayToFirestore(key: string, data: any[]) {
  try {
    if (!Array.isArray(data)) return;
    for (const item of data) {
      if (item && item.id) {
        await setDoc(doc(db, key, item.id), item);
      }
    }
  } catch (err) {
    console.error(`Error saving ${key} to Firestore:`, err);
  }
}

async function saveArrayToSupabase(key: string, data: any[]) {
  if (!isRealSupabase || !supabase) return;
  try {
    if (!Array.isArray(data)) return;
    for (const item of data) {
      if (item && item.id) {
        const { error } = await supabase.from(key).upsert(item);
        if (error) {
          console.error(`Error saving ${key} to Supabase:`, error);
        }
      }
    }
  } catch (err) {
    console.error(`Error in saveArrayToSupabase for ${key}:`, err);
  }
}

export async function syncWithSupabase() {
  if (!isRealSupabase || !supabase) return;
  const collections = [
    'sev_categories',
    'sev_plans',
    'sev_profiles',
    'sev_clients',
    'sev_providers',
    'sev_subscriptions',
    'sev_requests',
    'sev_bids',
    'sev_payments',
    'sev_reviews',
    'sev_conversations',
    'sev_messages',
    'sev_notifications',
    'sev_audit_logs',
    'sev_financial_logs',
    'sev_favorites'
  ];

  try {
    const { data: categoriesCheck, error: checkError } = await supabase
      .from('sev_categories')
      .select('id')
      .limit(1);

    if (checkError) {
      console.warn('Supabase tables are not yet created or are inaccessible. Please copy and execute the script from /src/supabase_schema.sql in your Supabase SQL Editor. Error details:', checkError.message);
      // Abort sync since tables are missing, allowing the user code to fall back to existing localStorage state gracefully without console error flood
      return;
    }

    if (categoriesCheck && categoriesCheck.length === 0) {
      console.log('Seeding Supabase database with initial records...');
      const seeds: Record<string, any[]> = {
        'sev_categories': INITIAL_CATEGORIES,
        'sev_plans': INITIAL_PLANS,
        'sev_profiles': INITIAL_PROFILES,
        'sev_clients': INITIAL_CLIENTS,
        'sev_providers': INITIAL_PROVIDERS,
        'sev_subscriptions': INITIAL_SUBSCRIPTIONS,
        'sev_requests': INITIAL_REQUESTS,
        'sev_reviews': INITIAL_REVIEWS,
        'sev_conversations': INITIAL_CONVERSATIONS,
        'sev_messages': INITIAL_MESSAGES,
        'sev_notifications': INITIAL_NOTIFICATIONS,
        'sev_audit_logs': INITIAL_AUDIT_LOGS,
        'sev_financial_logs': INITIAL_FINANCIAL_LOGS,
        'sev_payments': INITIAL_PAYMENTS,
        'sev_favorites': [],
        'sev_bids': []
      };

      for (const col of collections) {
        const list = seeds[col] || [];
        for (const item of list) {
          if (item && item.id) {
            const { error: insertErr } = await supabase.from(col).insert(item);
            if (insertErr) {
              console.error(`Seed insert error on table ${col}:`, insertErr.message);
            }
          }
        }
      }
      console.log('Supabase seeding finished successfully.');
    }

    // Now, fetch all records from Supabase to synchronize local cache
    for (const col of collections) {
      const { data, error } = await supabase.from(col).select('*');
      if (error) {
        console.error(`Error querying ${col} from Supabase:`, error.message);
        continue;
      }
      localStorage.setItem(col, JSON.stringify(data || []));
    }
    
    window.dispatchEvent(new CustomEvent('sev_db_synced'));
    console.log('Database synced with Supabase successfully.');
  } catch (err) {
    console.error('Error during Supabase syncWithSupabase operation:', err);
  }
}

export async function syncWithFirestore() {
  const collections = [
    'sev_categories',
    'sev_plans',
    'sev_profiles',
    'sev_clients',
    'sev_providers',
    'sev_subscriptions',
    'sev_requests',
    'sev_bids',
    'sev_payments',
    'sev_reviews',
    'sev_conversations',
    'sev_messages',
    'sev_notifications',
    'sev_audit_logs',
    'sev_financial_logs',
    'sev_favorites'
  ];

  try {
    let querySnapshot;
    try {
      querySnapshot = await getDocs(collection(db, 'sev_categories'));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'sev_categories');
      return;
    }

    if (querySnapshot.empty) {
      console.log('Seeding Cloud Firestore with initial marketplace records...');
      const seeds: Record<string, any[]> = {
        'sev_categories': INITIAL_CATEGORIES,
        'sev_plans': INITIAL_PLANS,
        'sev_profiles': INITIAL_PROFILES,
        'sev_clients': INITIAL_CLIENTS,
        'sev_providers': INITIAL_PROVIDERS,
        'sev_subscriptions': INITIAL_SUBSCRIPTIONS,
        'sev_requests': INITIAL_REQUESTS,
        'sev_reviews': INITIAL_REVIEWS,
        'sev_conversations': INITIAL_CONVERSATIONS,
        'sev_messages': INITIAL_MESSAGES,
        'sev_notifications': INITIAL_NOTIFICATIONS,
        'sev_audit_logs': INITIAL_AUDIT_LOGS,
        'sev_financial_logs': INITIAL_FINANCIAL_LOGS,
        'sev_payments': INITIAL_PAYMENTS,
        'sev_favorites': [],
        'sev_bids': []
      };

      for (const col of collections) {
        const list = seeds[col] || [];
        for (const item of list) {
          if (item && item.id) {
            try {
              await setDoc(doc(db, col, item.id), item);
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, `${col}/${item.id}`);
            }
          }
        }
      }
      console.log('Seeding completed successfully!');
    }

    for (const col of collections) {
      let snap;
      try {
        snap = await getDocs(collection(db, col));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, col);
        return;
      }
      const items: any[] = [];
      snap.forEach((d) => {
        items.push({ ...d.data(), id: d.id });
      });
      localStorage.setItem(col, JSON.stringify(items));
    }
    window.dispatchEvent(new CustomEvent('sev_db_synced'));
    console.log('Database synchronization with Cloud Firestore succeeded!');
  } catch (error) {
    console.error('Error in Firestore sync:', error);
  }
}

// Execute DB initialization immediately
initLocalStorageDB();
if (isRealSupabase) {
  syncWithSupabase();
} else {
  syncWithFirestore();
}

// ==========================================
// STATE RETRIEVAL AND MUTATION INTERFACES
// ==========================================

export const dbMemory = {
  // Get data
  get: <T>(key: string): T => {
    return JSON.parse(localStorage.getItem(key) || '[]') as T;
  },
  
  // Save data
  save: <T>(key: string, data: T): void => {
    localStorage.setItem(key, JSON.stringify(data));
    if (Array.isArray(data)) {
      saveArrayToFirestore(key, data);
      if (isRealSupabase) {
        saveArrayToSupabase(key, data);
      }
    }
  },

  getCurrentUser(): Profile | null {
    const raw = localStorage.getItem('sev_currentUser');
    return raw ? JSON.parse(raw) as Profile : null;
  },

  setCurrentUser(profile: Profile | null): void {
    if (profile) {
      localStorage.setItem('sev_currentUser', JSON.stringify(profile));
      dbMemory.addAuditLog(profile.id, profile.email, 'Login', 'Usuário se autenticou no sistema');
    } else {
      const current = dbMemory.getCurrentUser();
      if (current) {
        dbMemory.addAuditLog(current.id, current.email, 'Logout', 'Usuário efetuou logoff');
      }
      localStorage.removeItem('sev_currentUser');
    }
  },

  // Audit Log Helper
  addAuditLog(userId?: string, userEmail?: string, action: string = 'Ação', details?: string) {
    const logs = dbMemory.get<AuditLog[]>('sev_audit_logs');
    const newLog: AuditLog = {
      id: Math.random().toString(36).substring(2, 11),
      user_id: userId,
      user_email: userEmail,
      action,
      ip: '172.56.89.124',
      browser: navigator.userAgent.substring(0, 50),
      details,
      created_at: new Date().toISOString()
    };
    logs.unshift(newLog);
    dbMemory.save('sev_audit_logs', logs);
  },

  // Financial Log Helper
  addFinancialLog(type: 'plan_payment' | 'service_settlement', providerId: string | undefined, amount: number, referenceId: string) {
    const logs = dbMemory.get<FinancialLog[]>('sev_financial_logs');
    const newLog: FinancialLog = {
      id: 'fin-' + Math.random().toString(36).substring(2, 8),
      type,
      provider_id: providerId,
      amount,
      payment_method: 'PIX',
      reference_id: referenceId,
      status: 'completed',
      created_at: new Date().toISOString()
    };
    logs.unshift(newLog);
    dbMemory.save('sev_financial_logs', logs);
  }
};

// ==========================================
// BUSINESS LOGIC SERVICES (SUPABASE & FALLBACK)
// ==========================================

export const authService = {
  async registerClient(fields: {
    fullName: string;
    email: string;
    cpf: string;
    birthDate: string;
    whatsapp: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    avatarUrl?: string;
  }): Promise<Profile> {
    if (isRealSupabase && supabase) {
      const cleanCpf = fields.cpf.replace(/\D/g, '');
      const cleanWhatsapp = fields.whatsapp.replace(/\D/g, '');

      // Check pre-existing rules
      const { data: existingProfiles, error: profileCheckErr } = await supabase
        .from('sev_profiles')
        .select('id')
        .eq('email', fields.email.toLowerCase());
      if (profileCheckErr) throw new Error(profileCheckErr.message);
      if (existingProfiles && existingProfiles.length > 0) {
        throw new Error('Já existe uma conta registrada com este endereço de e-mail.');
      }

      const { data: existingClients, error: clientCheckErr } = await supabase
        .from('sev_clients')
        .select('id')
        .eq('cpf', fields.cpf);
      if (clientCheckErr) throw new Error(clientCheckErr.message);
      if (existingClients && existingClients.length > 0) {
        throw new Error('Este CPF já está associado a outro cliente cadastrado.');
      }

      const userId = 'user-client-' + Math.random().toString(36).substring(2, 9);
      
      const newProfile: Profile = {
        id: userId,
        email: fields.email,
        role: 'client',
        full_name: fields.fullName,
        avatar_url: fields.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString()
      };

      const newClient: ClientProfile = {
        id: userId,
        cpf: fields.cpf,
        birth_date: fields.birthDate,
        whatsapp: cleanWhatsapp,
        address: fields.address,
        city: fields.city,
        state: fields.state,
        postal_code: fields.postalCode,
        rating_score: 5.0,
        status: 'active',
        created_at: new Date().toISOString()
      };

      const { error: pError } = await supabase.from('sev_profiles').insert(newProfile);
      if (pError) throw new Error(pError.message);

      const { error: cError } = await supabase.from('sev_clients').insert(newClient);
      if (cError) throw new Error(cError.message);

      // Local storage backup
      const profiles = dbMemory.get<Profile[]>('sev_profiles');
      const clients = dbMemory.get<ClientProfile[]>('sev_clients');
      profiles.push(newProfile);
      clients.push(newClient);
      localStorage.setItem('sev_profiles', JSON.stringify(profiles));
      localStorage.setItem('sev_clients', JSON.stringify(clients));

      dbMemory.addAuditLog(userId, fields.email, 'Cadastro', `Cadastro de cliente efetuado com sucesso (CPF: ${fields.cpf})`);
      return newProfile;
    }

    // Client registration with fallback persistence
    const profiles = dbMemory.get<Profile[]>('sev_profiles');
    const clients = dbMemory.get<ClientProfile[]>('sev_clients');

    // Check pre-existing unique rules
    const nameFormatted = fields.fullName;
    const cleanCpf = fields.cpf.replace(/\D/g, '');
    const cleanWhatsapp = fields.whatsapp.replace(/\D/g, '');

    if (profiles.some(p => p.email.toLowerCase() === fields.email.toLowerCase())) {
      throw new Error('Já existe uma conta registrada com este endereço de e-mail.');
    }
    if (clients.some(c => c.cpf.replace(/\D/g, '') === cleanCpf)) {
      throw new Error('Este CPF já está associado a outro cliente cadastrado.');
    }

    const userId = 'user-client-' + Math.random().toString(36).substring(2, 9);
    
    // 1. Create Base Profile
    const newProfile: Profile = {
      id: userId,
      email: fields.email,
      role: 'client',
      full_name: nameFormatted,
      avatar_url: fields.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString()
    };

    // 2. Create Client Profile
    const newClient: ClientProfile = {
      id: userId,
      cpf: fields.cpf,
      birth_date: fields.birthDate,
      whatsapp: cleanWhatsapp,
      address: fields.address,
      city: fields.city,
      state: fields.state,
      postal_code: fields.postalCode,
      rating_score: 5.0,
      status: 'active',
      created_at: new Date().toISOString()
    };

    profiles.push(newProfile);
    clients.push(newClient);

    dbMemory.save('sev_profiles', profiles);
    dbMemory.save('sev_clients', clients);
    
    dbMemory.addAuditLog(userId, fields.email, 'Cadastro', `Cadastro de cliente efetuado com sucesso (CPF: ${fields.cpf})`);
    
    return newProfile;
  },

  async registerProvider(fields: {
    fullName: string;
    email: string;
    cpfCnpj: string;
    whatsapp: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    categoryId: string;
    specialty: string;
    description: string;
    pixKey: string;
    avatarUrl?: string;
    galleryUrls?: string[];
    documentUrl?: string;
    residenceProofUrl?: string;
  }): Promise<Profile> {
    if (isRealSupabase && supabase) {
      const cleanCpfCnpj = fields.cpfCnpj.replace(/\D/g, '');
      const cleanWhatsapp = fields.whatsapp.replace(/\D/g, '');

      // Check pre-existing rules
      const { data: existingProfiles, error: profileCheckErr } = await supabase
        .from('sev_profiles')
        .select('id')
        .eq('email', fields.email.toLowerCase());
      if (profileCheckErr) throw new Error(profileCheckErr.message);
      if (existingProfiles && existingProfiles.length > 0) {
        throw new Error('E-mail já cadastrado.');
      }

      const { data: existingProviders, error: providerCheckErr } = await supabase
        .from('sev_providers')
        .select('id')
        .eq('cpf_cnpj', fields.cpfCnpj);
      if (providerCheckErr) throw new Error(providerCheckErr.message);
      if (existingProviders && existingProviders.length > 0) {
        throw new Error('Este CPF ou CNPJ já está cadastrado na plataforma.');
      }

      const providerId = 'user-provider-' + Math.random().toString(36).substring(2, 9);
      
      const newProfile: Profile = {
        id: providerId,
        email: fields.email,
        role: 'provider',
        full_name: fields.fullName,
        avatar_url: fields.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString()
      };

      const newProvider: ProviderProfile = {
        id: providerId,
        cpf_cnpj: fields.cpfCnpj,
        whatsapp: cleanWhatsapp,
        address: fields.address,
        city: fields.city,
        state: fields.state,
        postal_code: fields.postalCode,
        category_id: fields.categoryId,
        specialty: fields.specialty,
        description: fields.description,
        pix_key: fields.pixKey,
        gallery_urls: fields.galleryUrls || [
          'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=350&auto=format&fit=crop&q=80'
        ],
        document_url: fields.documentUrl || 'documento_pdf_identidade.pdf',
        residence_proof_url: fields.residenceProofUrl || 'comprovante_residencia.pdf',
        status: 'pending',
        rating_average: 5.0,
        total_reviews: 0,
        total_completed_services: 0,
        created_at: new Date().toISOString()
      };

      const newSubscription: ProviderSubscription = {
        id: 'sub-' + Math.random().toString(36).substring(2, 9),
        provider_id: providerId,
        plan_id: 'plan-basic',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        last_payment_value: 0,
        created_at: new Date().toISOString()
      };

      const { error: pError } = await supabase.from('sev_profiles').insert(newProfile);
      if (pError) throw new Error(pError.message);

      const { error: prError } = await supabase.from('sev_providers').insert(newProvider);
      if (prError) throw new Error(prError.message);

      const { error: subError } = await supabase.from('sev_subscriptions').insert(newSubscription);
      if (subError) throw new Error(subError.message);

      // Local storage backup
      const profiles = dbMemory.get<Profile[]>('sev_profiles');
      const providers = dbMemory.get<ProviderProfile[]>('sev_providers');
      const subscriptions = dbMemory.get<ProviderSubscription[]>('sev_subscriptions');
      profiles.push(newProfile);
      providers.push(newProvider);
      subscriptions.push(newSubscription);
      localStorage.setItem('sev_profiles', JSON.stringify(profiles));
      localStorage.setItem('sev_providers', JSON.stringify(providers));
      localStorage.setItem('sev_subscriptions', JSON.stringify(subscriptions));

      dbMemory.addAuditLog(providerId, fields.email, 'Cadastro', `Prestador se inscreveu CPF/CNPJ: ${fields.cpfCnpj}. Status pendente de aprovação.`);
      return newProfile;
    }

    const profiles = dbMemory.get<Profile[]>('sev_profiles');
    const providers = dbMemory.get<ProviderProfile[]>('sev_providers');
    const subscriptions = dbMemory.get<ProviderSubscription[]>('sev_subscriptions');

    const cleanCpfCnpj = fields.cpfCnpj.replace(/\D/g, '');
    const cleanWhatsapp = fields.whatsapp.replace(/\D/g, '');

    if (profiles.some(p => p.email.toLowerCase() === fields.email.toLowerCase())) {
      throw new Error('E-mail já cadastrado.');
    }
    if (providers.some(p => p.cpf_cnpj.replace(/\D/g, '') === cleanCpfCnpj)) {
      throw new Error('Este CPF ou CNPJ já está cadastrado na plataforma.');
    }

    const providerId = 'user-provider-' + Math.random().toString(36).substring(2, 9);

    // 1. Base Profile
    const newProfile: Profile = {
      id: providerId,
      email: fields.email,
      role: 'provider',
      full_name: fields.fullName,
      avatar_url: fields.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString()
    };

    // 2. Provider Profile
    const newProvider: ProviderProfile = {
      id: providerId,
      cpf_cnpj: fields.cpfCnpj,
      whatsapp: cleanWhatsapp,
      address: fields.address,
      city: fields.city,
      state: fields.state,
      postal_code: fields.postalCode,
      category_id: fields.categoryId,
      specialty: fields.specialty,
      description: fields.description,
      pix_key: fields.pixKey,
      gallery_urls: fields.galleryUrls || [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=350&auto=format&fit=crop&q=80'
      ],
      document_url: fields.documentUrl || 'documento_pdf_identidade.pdf',
      residence_proof_url: fields.residenceProofUrl || 'comprovante_residencia.pdf',
      status: 'pending', // Starts pending! Requires Admin approval
      rating_average: 5.0,
      total_reviews: 0,
      total_completed_services: 0,
      created_at: new Date().toISOString()
    };

    // 3. Initiate Free Subscription implicitly
    const newSubscription: ProviderSubscription = {
      id: 'sub-' + Math.random().toString(36).substring(2, 9),
      provider_id: providerId,
      plan_id: 'plan-basic',
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      last_payment_value: 0,
      created_at: new Date().toISOString()
    };

    profiles.push(newProfile);
    providers.push(newProvider);
    subscriptions.push(newSubscription);

    dbMemory.save('sev_profiles', profiles);
    dbMemory.save('sev_providers', providers);
    dbMemory.save('sev_subscriptions', subscriptions);

    dbMemory.addAuditLog(providerId, fields.email, 'Cadastro', `Prestador se inscreveu CPF/CNPJ: ${fields.cpfCnpj}. Status pendente de aprovação.`);

    return newProfile;
  },

  async login(email: string): Promise<Profile> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase
        .from('sev_profiles')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) {
        throw new Error('E-mail não cadastrado em nossa base de dados.');
      }

      if (data.role === 'provider') {
        const { data: pData, error: pError } = await supabase
          .from('sev_providers')
          .select('*')
          .eq('id', data.id)
          .maybeSingle();

        if (pError) throw new Error(pError.message);
        if (pData?.status === 'blocked') {
          throw new Error('Esta conta de Prestador está bloqueada por violação de termos de uso.');
        }
      }

      dbMemory.setCurrentUser(data as Profile);
      return data as Profile;
    }

    const profiles = dbMemory.get<Profile[]>('sev_profiles');
    const matched = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
    
    if (!matched) {
      throw new Error('E-mail não cadastrado em nossa base de dados.');
    }

    // Lock account checks if roles have restrictions
    if (matched.role === 'provider') {
      const providers = dbMemory.get<ProviderProfile[]>('sev_providers');
      const providerInfo = providers.find(p => p.id === matched.id);
      if (providerInfo?.status === 'blocked') {
        throw new Error('Esta conta de Prestador está bloqueada por violação de termos de uso.');
      }
    }

    dbMemory.setCurrentUser(matched);
    return matched;
  }
};

export const providerService = {
  async listAll(): Promise<ProviderProfile[]> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('sev_providers').select('*');
      if (!error && data) {
         localStorage.setItem('sev_providers', JSON.stringify(data));
         return data;
      }
    }
    return dbMemory.get<ProviderProfile[]>('sev_providers');
  },

  async listApproved(): Promise<ProviderProfile[]> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('sev_providers').select('*').eq('status', 'approved');
      if (!error && data) {
         return data;
      }
    }
    const list = await this.listAll();
    return list.filter(p => p.status === 'approved');
  },

  async updateStatus(providerId: string, status: 'approved' | 'rejected' | 'blocked' | 'pending'): Promise<ProviderProfile> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase
        .from('sev_providers')
        .update({ status })
        .eq('id', providerId)
        .select()
        .single();
      if (error) throw new Error(error.message);

      const { data: pProfile } = await supabase.from('sev_profiles').select('*').eq('id', providerId).single();
      const currentUser = dbMemory.getCurrentUser();
      dbMemory.addAuditLog(currentUser?.id, currentUser?.email, 'Alteração financeira', `Prestador "${pProfile?.full_name}" status alterado para: ${status}`);

      const newNotification = {
        id: Math.random().toString(36).substring(2, 9),
        user_id: providerId,
        title: `Status da Conta: ${status === 'approved' ? 'Aprovado!' : status === 'blocked' ? 'Bloqueada' : 'Atualizado'}`,
        message: status === 'approved' 
          ? 'Sua conta de prestador de serviços foi aprovada! Você já pode receber solicitações de clientes.'
          : `O status do seu perfil de prestador foi atualizado para ${status}. Entre em contato para justificativas.`,
        type: 'system',
        is_read: false,
        created_at: new Date().toISOString()
      };
      await supabase.from('sev_notifications').insert(newNotification);

      // Save to local cache
      const list = dbMemory.get<ProviderProfile[]>('sev_providers');
      const idx = list.findIndex(p => p.id === providerId);
      if (idx !== -1) {
        list[idx].status = status;
        localStorage.setItem('sev_providers', JSON.stringify(list));
      }

      return data as ProviderProfile;
    }

    const providers = dbMemory.get<ProviderProfile[]>('sev_providers');
    const index = providers.findIndex(p => p.id === providerId);
    if (index === -1) throw new Error('Prestador não encontrado.');
    
    providers[index].status = status;
    dbMemory.save('sev_providers', providers);

    const profiles = dbMemory.get<Profile[]>('sev_profiles');
    const p = profiles.find(pr => pr.id === providerId);

    const currentUser = dbMemory.getCurrentUser();
    dbMemory.addAuditLog(currentUser?.id, currentUser?.email, 'Alteração financeira', `Prestador "${p?.full_name}" status alterado para: ${status}`);

    // Push system notification for the provider
    const notifications = dbMemory.get<Notification[]>('sev_notifications');
    notifications.unshift({
      id: Math.random().toString(36).substring(2, 9),
      user_id: providerId,
      title: `Status da Conta: ${status === 'approved' ? 'Aprovado!' : status === 'blocked' ? 'Bloqueada' : 'Atualizado'}`,
      message: status === 'approved' 
        ? 'Sua conta de prestador de serviços foi aprovada! Você já pode receber solicitações de clientes.'
        : `O status do seu perfil de prestador foi atualizado para ${status}. Entre em contato para justificativas.`,
      type: 'system',
      is_read: false,
      created_at: new Date().toISOString()
    });
    dbMemory.save('sev_notifications', notifications);

    return providers[index];
  },

  async subscribe(providerId: string, planId: string): Promise<ProviderSubscription> {
    if (isRealSupabase && supabase) {
      const { data: plans, error: plansErr } = await supabase.from('sev_plans').select('*');
      if (plansErr) throw new Error(plansErr.message);
      const chosenPlan = plans?.find(pl => pl.id === planId);
      if (!chosenPlan) throw new Error('Plano de assinatura inválido.');

      // Suspend existing active subscriptions
      await supabase
        .from('sev_subscriptions')
        .update({ status: 'expired' })
        .eq('provider_id', providerId)
        .eq('status', 'active');

      const newSub: ProviderSubscription = {
        id: 'sub-' + Math.random().toString(36).substring(2, 9),
        provider_id: providerId,
        plan_id: planId,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + chosenPlan.duration_days * 24 * 60 * 60 * 1000).toISOString(),
        last_payment_value: chosenPlan.price,
        created_at: new Date().toISOString()
      };

      const { error: subErr } = await supabase.from('sev_subscriptions').insert(newSub);
      if (subErr) throw new Error(subErr.message);

      // Logs
      const { data: matchedProfile } = await supabase.from('sev_profiles').select('*').eq('id', providerId).single();
      dbMemory.addAuditLog(providerId, matchedProfile?.email, 'Alteração financeira', `Assinou plano ${chosenPlan.name} por R$ ${chosenPlan.price}`);
      if (chosenPlan.price > 0) {
        dbMemory.addFinancialLog('plan_payment', providerId, chosenPlan.price, newSub.id);
      }

      // Sync local cache
      const subs = dbMemory.get<ProviderSubscription[]>('sev_subscriptions');
      const updatedSubs = subs.map(s => s.provider_id === providerId && s.status === 'active' ? { ...s, status: 'expired' as const } : s);
      updatedSubs.push(newSub as any);
      localStorage.setItem('sev_subscriptions', JSON.stringify(updatedSubs));

      return newSub as any;
    }

    const plans = dbMemory.get<SubscriptionPlan[]>('sev_plans');
    const chosenPlan = plans.find(pl => pl.id === planId);
    if (!chosenPlan) throw new Error('Plano de assinatura inválido.');

    const subs = dbMemory.get<ProviderSubscription[]>('sev_subscriptions');
    
    // Suspend existing active subscriptions
    const updatedSubs = subs.map(sub => {
      if (sub.provider_id === providerId && sub.status === 'active') {
        return { ...sub, status: 'expired' as const };
      }
      return sub;
    });

    const newSub: ProviderSubscription = {
      id: 'sub-' + Math.random().toString(36).substring(2, 9),
      provider_id: providerId,
      plan_id: planId,
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + chosenPlan.duration_days * 24 * 60 * 60 * 1000).toISOString(),
      last_payment_value: chosenPlan.price,
      created_at: new Date().toISOString()
    };

    updatedSubs.push(newSub);
    dbMemory.save('sev_subscriptions', updatedSubs);

    // Logs
    const profiles = dbMemory.get<Profile[]>('sev_profiles');
    const matchedProfile = profiles.find(p => p.id === providerId);

    dbMemory.addAuditLog(providerId, matchedProfile?.email, 'Alteração financeira', `Assinou plano ${chosenPlan.name} por R$ ${chosenPlan.price}`);
    if (chosenPlan.price > 0) {
      dbMemory.addFinancialLog('plan_payment', providerId, chosenPlan.price, newSub.id);
    }

    return newSub;
  }
};

export const serviceRequestService = {
  async listAll(): Promise<ServiceRequest[]> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('sev_requests').select('*');
      if (!error && data) {
        localStorage.setItem('sev_requests', JSON.stringify(data));
        return data;
      }
    }
    return dbMemory.get<ServiceRequest[]>('sev_requests');
  },

  async create(payload: {
    client_id: string;
    provider_id: string;
    category_id: string;
    title: string;
    description: string;
    address: string;
    city: string;
    state: string;
    suggested_value: number;
    scheduled_date: string;
  }): Promise<ServiceRequest> {
    const reqs = dbMemory.get<ServiceRequest[]>('sev_requests');
    const isBroadcast = !payload.provider_id || payload.provider_id === 'broadcast' || payload.provider_id === 'waiting_bids';
    
    const newReq: ServiceRequest = {
      id: 'req-' + Math.random().toString(36).substring(2, 9),
      client_id: payload.client_id,
      provider_id: isBroadcast ? '' : payload.provider_id,
      category_id: payload.category_id,
      title: payload.title,
      description: payload.description,
      address: payload.address,
      city: payload.city,
      state: payload.state,
      photos_urls: [],
      suggested_value: payload.suggested_value || 0,
      final_value: isBroadcast ? undefined : payload.suggested_value,
      scheduled_date: payload.scheduled_date,
      status: 'waiting',
      status_payment: 'unpaid',
      created_at: new Date().toISOString()
    };

    reqs.unshift(newReq);
    dbMemory.save('sev_requests', reqs);

    // Logs and Notification
    const clientUser = dbMemory.get<Profile[]>('sev_profiles').find(p => p.id === payload.client_id);
    const notifications = dbMemory.get<Notification[]>('sev_notifications');
    const categoriesList = dbMemory.get<Category[]>('sev_categories');
    const categoryName = categoriesList.find(c => c.id === payload.category_id)?.name || 'sua categoria';

    if (isBroadcast) {
      const providers = dbMemory.get<ProviderProfile[]>('sev_providers');
      const catProviders = providers.filter(p => p.category_id === payload.category_id && p.status === 'approved');
      
      catProviders.forEach(p => {
        notifications.unshift({
          id: Math.random().toString(36).substring(2, 9),
          user_id: p.id,
          title: `Novo pedido em ${categoryName}`,
          message: `${clientUser?.full_name || 'Um cliente'} enviou um pedido de orçamento: "${payload.title}". Envie sua proposta de valor!`,
          type: 'service_request',
          is_read: false,
          created_at: new Date().toISOString()
        });
      });
      dbMemory.save('sev_notifications', notifications);
      dbMemory.addAuditLog(payload.client_id, clientUser?.email, 'Criação de serviço', `Criou pedido público para a categoria ${categoryName}. ID: ${newReq.id}`);
    } else {
      notifications.unshift({
        id: Math.random().toString(36).substring(2, 9),
        user_id: payload.provider_id,
        title: 'Nova Solicitação recebida',
        message: `${clientUser?.full_name || 'Um cliente'} solicitou o serviço: "${payload.title}". Valor sugerido de R$ ${payload.suggested_value}.`,
        type: 'service_request',
        is_read: false,
        created_at: new Date().toISOString()
      });
      dbMemory.save('sev_notifications', notifications);
      dbMemory.addAuditLog(payload.client_id, clientUser?.email, 'Criação de serviço', `Criou pedido direto para o prestador. ID: ${newReq.id}`);
    }

    return newReq;
  },

  async updateStatus(requestId: string, status: ServiceRequest['status']): Promise<ServiceRequest> {
    const reqs = dbMemory.get<ServiceRequest[]>('sev_requests');
    const index = reqs.findIndex(r => r.id === requestId);
    if (index === -1) throw new Error('Pedido de serviço não encontrado.');

    const oldStatus = reqs[index].status;
    reqs[index].status = status;

    if (status === 'completed') {
      reqs[index].status_payment = 'pending_payment'; // transition to pending pix payment screen
      
      // Increment provider completed total counts
      const providers = dbMemory.get<ProviderProfile[]>('sev_providers');
      const pIndex = providers.findIndex(p => p.id === reqs[index].provider_id);
      if (pIndex !== -1) {
        providers[pIndex].total_completed_services += 1;
        dbMemory.save('sev_providers', providers);
      }
    }

    dbMemory.save('sev_requests', reqs);

    const currentUser = dbMemory.getCurrentUser();
    dbMemory.addAuditLog(currentUser?.id, currentUser?.email, 
      status === 'cancelled' ? 'Cancelamento' : 'Criação de serviço', 
      `Serviço ${requestId} status de "${oldStatus}" alterado para "${status}"`
    );

    // Notify reciprocal actor
    const targetUserId = currentUser?.role === 'client' ? reqs[index].provider_id : reqs[index].client_id;
    const notifications = dbMemory.get<Notification[]>('sev_notifications');
    notifications.unshift({
      id: Math.random().toString(36).substring(2, 9),
      user_id: targetUserId,
      title: `Status do Serviço atualizado`,
      message: `O serviço "${reqs[index].title}" foi categorizado como: ${status.toUpperCase()} por ${currentUser?.full_name}.`,
      type: 'service_request',
      is_read: false,
      created_at: new Date().toISOString()
    });
    dbMemory.save('sev_notifications', notifications);

    return reqs[index];
  },

  async confirmPayment(requestId: string): Promise<ServiceRequest> {
    const reqs = dbMemory.get<ServiceRequest[]>('sev_requests');
    const index = reqs.findIndex(r => r.id === requestId);
    if (index === -1) throw new Error('Pedido de serviço não encontrado.');

    reqs[index].status_payment = 'paid';
    dbMemory.save('sev_requests', reqs);

    // Add financial log
    dbMemory.addFinancialLog('service_settlement', reqs[index].provider_id, reqs[index].final_value || reqs[index].suggested_value, requestId);

    // Log & notify
    const provider = dbMemory.get<Profile[]>('sev_profiles').find(p => p.id === reqs[index].provider_id);
    dbMemory.addAuditLog(reqs[index].client_id, undefined, 'Pagamento', `Pagamento confirmado para o serviço "${reqs[index].title}" no valor de R$ ${reqs[index].final_value || reqs[index].suggested_value}`);

    const notifications = dbMemory.get<Notification[]>('sev_notifications');
    notifications.unshift({
      id: Math.random().toString(36).substring(2, 9),
      user_id: reqs[index].provider_id,
      title: 'Pagamento PIX recebido!',
      message: `Recebido pagamento de R$ ${reqs[index].final_value || reqs[index].suggested_value} pelo serviço concluído: "${reqs[index].title}".`,
      type: 'payment',
      is_read: false,
      created_at: new Date().toISOString()
    });
    dbMemory.save('sev_notifications', notifications);

    return reqs[index];
  }
};

export const serviceBidService = {
  async listAll(): Promise<ServiceBid[]> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('sev_bids').select('*');
      if (!error && data) {
        localStorage.setItem('sev_bids', JSON.stringify(data));
        return data;
      }
    }
    return dbMemory.get<ServiceBid[]>('sev_bids') || [];
  },

  async listByRequestId(requestId: string): Promise<ServiceBid[]> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('sev_bids').select('*').eq('request_id', requestId);
      if (!error && data) {
         return data;
      }
    }
    const bids = dbMemory.get<ServiceBid[]>('sev_bids') || [];
    return bids.filter(b => b.request_id === requestId);
  },

  async create(payload: {
    request_id: string;
    provider_id: string;
    value: number;
    message: string;
  }): Promise<ServiceBid> {
    const bids = dbMemory.get<ServiceBid[]>('sev_bids') || [];
    const existingIndex = bids.findIndex(b => b.request_id === payload.request_id && b.provider_id === payload.provider_id);
    
    if (existingIndex !== -1) {
      bids[existingIndex].value = payload.value;
      bids[existingIndex].message = payload.message;
      bids[existingIndex].created_at = new Date().toISOString();
      bids[existingIndex].status = 'pending';
      
      dbMemory.save('sev_bids', bids);
      
      const reqs = dbMemory.get<ServiceRequest[]>('sev_requests');
      const req = reqs.find(r => r.id === payload.request_id);
      const providerUser = dbMemory.get<Profile[]>('sev_profiles').find(p => p.id === payload.provider_id);
      if (req) {
        const notifications = dbMemory.get<Notification[]>('sev_notifications');
        notifications.unshift({
          id: Math.random().toString(36).substring(2, 9),
          user_id: req.client_id,
          title: 'Proposta Atualizada',
          message: `${providerUser?.full_name || 'Um profissional'} atualizou a proposta para "${req.title}" para o valor de R$ ${payload.value}.`,
          type: 'service_request',
          is_read: false,
          created_at: new Date().toISOString()
        });
        dbMemory.save('sev_notifications', notifications);
      }
      return bids[existingIndex];
    }
    
    const newBid: ServiceBid = {
      id: 'bid-' + Math.random().toString(36).substring(2, 9),
      request_id: payload.request_id,
      provider_id: payload.provider_id,
      value: payload.value,
      message: payload.message,
      created_at: new Date().toISOString(),
      status: 'pending'
    };

    bids.unshift(newBid);
    dbMemory.save('sev_bids', bids);

    const reqs = dbMemory.get<ServiceRequest[]>('sev_requests');
    const req = reqs.find(r => r.id === payload.request_id);
    const providerUser = dbMemory.get<Profile[]>('sev_profiles').find(p => p.id === payload.provider_id);
    if (req) {
      const notifications = dbMemory.get<Notification[]>('sev_notifications');
      notifications.unshift({
        id: Math.random().toString(36).substring(2, 9),
        user_id: req.client_id,
        title: 'Nova Proposta Recebida',
        message: `${providerUser?.full_name || 'Um profissional'} enviou uma proposta de R$ ${payload.value} para o seu pedido "${req.title}".`,
        type: 'service_request',
        is_read: false,
        created_at: new Date().toISOString()
      });
      dbMemory.save('sev_notifications', notifications);
    }

    const matchedProfile = dbMemory.get<Profile[]>('sev_profiles').find(p => p.id === payload.provider_id);
    dbMemory.addAuditLog(payload.provider_id, matchedProfile?.email, 'Criação de serviço', `Enviou proposta de R$ ${payload.value} para o pedido ${payload.request_id}`);

    return newBid;
  },

  async acceptBid(bidId: string): Promise<void> {
    const bids = dbMemory.get<ServiceBid[]>('sev_bids') || [];
    const bidIndex = bids.findIndex(b => b.id === bidId);
    if (bidIndex === -1) throw new Error('Proposta não encontrada.');

    const acceptedBid = bids[bidIndex];
    
    const reqs = dbMemory.get<ServiceRequest[]>('sev_requests');
    const reqIndex = reqs.findIndex(r => r.id === acceptedBid.request_id);
    if (reqIndex === -1) throw new Error('Pedido de serviço não encontrado.');

    const req = reqs[reqIndex];
    req.provider_id = acceptedBid.provider_id;
    req.final_value = acceptedBid.value;
    req.status = 'accepted';
    
    dbMemory.save('sev_requests', reqs);

    bids.forEach(b => {
      if (b.request_id === acceptedBid.request_id) {
        if (b.id === bidId) {
          b.status = 'accepted';
        } else {
          b.status = 'rejected';
        }
      }
    });
    dbMemory.save('sev_bids', bids);

    const clientUser = dbMemory.get<Profile[]>('sev_profiles').find(p => p.id === req.client_id);
    const providerUser = dbMemory.get<Profile[]>('sev_profiles').find(p => p.id === acceptedBid.provider_id);
    const notifications = dbMemory.get<Notification[]>('sev_notifications');
    
    notifications.unshift({
      id: Math.random().toString(36).substring(2, 9),
      user_id: acceptedBid.provider_id,
      title: 'Proposta Aceita! 🎉',
      message: `${clientUser?.full_name || 'Um cliente'} aceitou sua proposta de R$ ${acceptedBid.value} para o serviço "${req.title}".`,
      type: 'service_request',
      is_read: false,
      created_at: new Date().toISOString()
    });
    dbMemory.save('sev_notifications', notifications);

    dbMemory.addAuditLog(req.client_id, clientUser?.email, 'Alteração financeira', `Aceitou proposta de R$ ${acceptedBid.value} de ${providerUser?.full_name} para o pedido ${req.id}`);

    const conv = await chatService.getOrCreateConversation(req.client_id, acceptedBid.provider_id);
    await chatService.sendMessage(
      conv.id,
      req.client_id,
      `Olá! Aceitei a sua proposta no valor de R$ ${acceptedBid.value} para o serviço "${req.title}". Vamos acertar os detalhes por aqui!`
    );
  }
};

export const chatService = {
  async getConversationsForUser(userId: string): Promise<Conversation[]> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase
        .from('sev_conversations')
        .select('*')
        .or(`client_id.eq.${userId},provider_id.eq.${userId}`);
      if (!error && data) {
        return data;
      }
    }
    const convs = dbMemory.get<Conversation[]>('sev_conversations');
    return convs.filter(c => c.client_id === userId || c.provider_id === userId);
  },

  async getMessagesForConversation(convId: string): Promise<Message[]> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase
        .from('sev_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });
      if (!error && data) {
        return data;
      }
    }
    const msgs = dbMemory.get<Message[]>('sev_messages');
    return msgs.filter(m => m.conversation_id === convId);
  },

  async getOrCreateConversation(clientId: string, providerId: string): Promise<Conversation> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase
        .from('sev_conversations')
        .select('*')
        .eq('client_id', clientId)
        .eq('provider_id', providerId)
        .maybeSingle();

      if (!error && data) {
        return data;
      }

      const newConv: Conversation = {
        id: 'conv-' + Math.random().toString(36).substring(2, 9),
        client_id: clientId,
        provider_id: providerId,
        last_message_text: '',
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const { error: insErr } = await supabase.from('sev_conversations').insert(newConv);
      if (insErr) {
        console.error('Error creating conversation in Supabase:', insErr.message);
      }

      // Local storage backup
      const convs = dbMemory.get<Conversation[]>('sev_conversations');
      convs.unshift(newConv);
      localStorage.setItem('sev_conversations', JSON.stringify(convs));

      return newConv;
    }

    const convs = dbMemory.get<Conversation[]>('sev_conversations');
    let matched = convs.find(c => c.client_id === clientId && c.provider_id === providerId);
    
    if (!matched) {
      matched = {
        id: 'conv-' + Math.random().toString(36).substring(2, 9),
        client_id: clientId,
        provider_id: providerId,
        last_message_text: '',
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      convs.unshift(matched);
      dbMemory.save('sev_conversations', convs);
    }
    return matched;
  },

  async sendMessage(conversationId: string, senderId: string, text?: string, fileUrl?: string, fileType?: Message['file_type']): Promise<Message> {
    if (isRealSupabase && supabase) {
      const newMessage: Message = {
        id: 'msg-' + Math.random().toString(36).substring(2, 9),
        conversation_id: conversationId,
        sender_id: senderId,
        text,
        file_url: fileUrl,
        file_type: fileType,
        is_read: false,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('sev_messages').insert(newMessage);
      if (error) throw new Error(error.message);

      // Update last message in conversation
      await supabase
        .from('sev_conversations')
        .update({
          last_message_text: text || `[Enviou um arquivo: ${fileType}]`,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      // Save locally as cache
      const messages = dbMemory.get<Message[]>('sev_messages');
      messages.push(newMessage);
      localStorage.setItem('sev_messages', JSON.stringify(messages));

      const convs = dbMemory.get<Conversation[]>('sev_conversations');
      const cIndex = convs.findIndex(c => c.id === conversationId);
      if (cIndex !== -1) {
        convs[cIndex].last_message_text = text || `[Enviou um arquivo: ${fileType}]`;
        convs[cIndex].updated_at = new Date().toISOString();
        localStorage.setItem('sev_conversations', JSON.stringify(convs));
        
        // Trigger simulated automatic reply for responsive demo
        const targetUserRole = convs[cIndex].client_id === senderId ? 'provider' : 'client';
        const targetUserId = targetUserRole === 'provider' ? convs[cIndex].provider_id : convs[cIndex].client_id;
        const autoReply: Message = {
          id: 'msg-' + Math.random().toString(36).substring(2, 9),
          conversation_id: conversationId,
          sender_id: targetUserId,
          text: `Olá! Recebi sua mensagem sobre o agendamento de serviço. Vou avaliar esta informação e retorno via WhatsApp ou diretamente por aqui para alinharmos os detalhes finais das ferramentas. Muito obrigado!`,
          is_read: false,
          created_at: new Date().toISOString()
        };

        setTimeout(async () => {
          await supabase.from('sev_messages').insert(autoReply);
          await supabase.from('sev_conversations').update({
            last_message_text: autoReply.text,
            updated_at: new Date().toISOString()
          }).eq('id', conversationId);

          const curMsgs = dbMemory.get<Message[]>('sev_messages');
          curMsgs.push(autoReply);
          localStorage.setItem('sev_messages', JSON.stringify(curMsgs));

          const curConvs = dbMemory.get<Conversation[]>('sev_conversations');
          const tIdx = curConvs.findIndex(c => c.id === conversationId);
          if (tIdx !== -1) {
            curConvs[tIdx].last_message_text = autoReply.text;
            curConvs[tIdx].updated_at = new Date().toISOString();
            localStorage.setItem('sev_conversations', JSON.stringify(curConvs));
          }

          // Emit sync trigger
          window.dispatchEvent(new CustomEvent('sev_db_synced'));
        }, 2000);
      }

      return newMessage;
    }

    const messages = dbMemory.get<Message[]>('sev_messages');
    const convs = dbMemory.get<Conversation[]>('sev_conversations');

    const newMessage: Message = {
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      conversation_id: conversationId,
      sender_id: senderId,
      text,
      file_url: fileUrl,
      file_type: fileType,
      is_read: false,
      created_at: new Date().toISOString()
    };

    messages.push(newMessage);
    dbMemory.save('sev_messages', messages);

    // Update conversation last text header
    const cIndex = convs.findIndex(c => c.id === conversationId);
    if (cIndex !== -1) {
      convs[cIndex].last_message_text = text || `[Enviou um arquivo: ${fileType}]`;
      convs[cIndex].updated_at = new Date().toISOString();
      dbMemory.save('sev_conversations', convs);

      // Trigger automatic simulated micro replies after 2 seconds to make the real-time chat interactive!
      const targetUserRole = convs[cIndex].client_id === senderId ? 'provider' : 'client';
      const targetUserId = targetUserRole === 'provider' ? convs[cIndex].provider_id : convs[cIndex].client_id;
      const profiles = dbMemory.get<Profile[]>('sev_profiles');

      setTimeout(() => {
        const msgs = dbMemory.get<Message[]>('sev_messages');
        const cns = dbMemory.get<Conversation[]>('sev_conversations');
        
        const autoReply: Message = {
          id: 'msg-' + Math.random().toString(36).substring(2, 9),
          conversation_id: conversationId,
          sender_id: targetUserId,
          text: `Olá! Recebi sua mensagem sobre o agendamento de serviço. Vou avaliar esta informação e retorno via WhatsApp ou diretamente por aqui para alinharmos os detalhes finais das ferramentas. Muito obrigado!`,
          is_read: false,
          created_at: new Date().toISOString()
        };
        msgs.push(autoReply);
        dbMemory.save('sev_messages', msgs);

        const targetIndex = cns.findIndex(c => c.id === conversationId);
        if (targetIndex !== -1) {
          cns[targetIndex].last_message_text = autoReply.text;
          cns[targetIndex].updated_at = new Date().toISOString();
          dbMemory.save('sev_conversations', cns);
        }

        // Notify client or provider
        const notifs = dbMemory.get<Notification[]>('sev_notifications');
        const replierProfile = profiles.find(p => p.id === targetUserId);
        notifs.unshift({
          id: Math.random().toString(36).substring(2, 9),
          user_id: senderId,
          title: `Nova mensagem de ${replierProfile?.full_name}`,
          message: `${replierProfile?.full_name}: "${autoReply.text?.substring(0, 30)}..."`,
          type: 'chat',
          is_read: false,
          created_at: new Date().toISOString()
        });
        dbMemory.save('sev_notifications', notifs);
      }, 2500);
    }

    return newMessage;
  }
};

export const reviewService = {
  async add(payload: {
    requestId: string;
    reviewerId: string;
    targetId: string;
    type: 'client_to_provider' | 'provider_to_client';
    rating: number;
    comment: string;
  }): Promise<Review> {
    if (isRealSupabase && supabase) {
      const newReview: Review = {
        id: 'rev-' + Math.random().toString(36).substring(2, 9),
        request_id: payload.requestId,
        reviewer_id: payload.reviewerId,
        target_id: payload.targetId,
        type: payload.type,
        rating: payload.rating,
        comment: payload.comment,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('sev_reviews').insert(newReview);
      if (error) throw new Error(error.message);

      // Recalculate average scores in database
      if (payload.type === 'client_to_provider') {
        const { data: list } = await supabase.from('sev_reviews').select('*').eq('target_id', payload.targetId).eq('type', 'client_to_provider');
        const sum = list ? list.reduce((total, curr) => total + curr.rating, 0) : payload.rating;
        const totalReviews = list ? list.length : 1;
        const avg = Number((sum / totalReviews).toFixed(1));

        await supabase.from('sev_providers').update({
          rating_average: avg,
          total_reviews: totalReviews
        }).eq('id', payload.targetId);

        // Update local memory
        const providers = dbMemory.get<ProviderProfile[]>('sev_providers');
        const pIdx = providers.findIndex(p => p.id === payload.targetId);
        if (pIdx !== -1) {
          providers[pIdx].rating_average = avg;
          providers[pIdx].total_reviews = totalReviews;
          localStorage.setItem('sev_providers', JSON.stringify(providers));
        }
      } else {
        const { data: list } = await supabase.from('sev_reviews').select('*').eq('target_id', payload.targetId).eq('type', 'provider_to_client');
        const sum = list ? list.reduce((total, curr) => total + curr.rating, 0) : payload.rating;
        const totalReviews = list ? list.length : 1;
        const score = Number((sum / totalReviews).toFixed(1));

        await supabase.from('sev_clients').update({
          rating_score: score
        }).eq('id', payload.targetId);

        // Update local memory
        const clients = dbMemory.get<ClientProfile[]>('sev_clients');
        const cIdx = clients.findIndex(c => c.id === payload.targetId);
        if (cIdx !== -1) {
          clients[cIdx].rating_score = score;
          localStorage.setItem('sev_clients', JSON.stringify(clients));
        }
      }

      // Local storage backup
      const reviews = dbMemory.get<Review[]>('sev_reviews');
      reviews.unshift(newReview);
      localStorage.setItem('sev_reviews', JSON.stringify(reviews));

      const { data: reviewer } = await supabase.from('sev_profiles').select('*').eq('id', payload.reviewerId).single();
      dbMemory.addAuditLog(payload.reviewerId, reviewer?.email, 'Avaliação', `Enviou avaliação nota ${payload.rating} para ID: ${payload.targetId}`);

      return newReview;
    }

    const reviews = dbMemory.get<Review[]>('sev_reviews');
    
    const newReview: Review = {
      id: 'rev-' + Math.random().toString(36).substring(2, 9),
      request_id: payload.requestId,
      reviewer_id: payload.reviewerId,
      target_id: payload.targetId,
      type: payload.type,
      rating: payload.rating,
      comment: payload.comment,
      created_at: new Date().toISOString()
    };

    reviews.unshift(newReview);
    dbMemory.save('sev_reviews', reviews);

    // Recalculate average score for provider or client
    if (payload.type === 'client_to_provider') {
      const providers = dbMemory.get<ProviderProfile[]>('sev_providers');
      const pIndex = providers.findIndex(p => p.id === payload.targetId);
      if (pIndex !== -1) {
        const pReviews = reviews.filter(r => r.target_id === payload.targetId && r.type === 'client_to_provider');
        const sum = pReviews.reduce((total, curr) => total + curr.rating, 0);
        providers[pIndex].rating_average = Number((sum / pReviews.length).toFixed(1));
        providers[pIndex].total_reviews = pReviews.length;
        dbMemory.save('sev_providers', providers);
      }
    } else {
      const clients = dbMemory.get<ClientProfile[]>('sev_clients');
      const cIndex = clients.findIndex(c => c.id === payload.targetId);
      if (cIndex !== -1) {
        const cReviews = reviews.filter(r => r.target_id === payload.targetId && r.type === 'provider_to_client');
        const sum = cReviews.reduce((total, curr) => total + curr.rating, 0);
        clients[cIndex].rating_score = Number((sum / cReviews.length).toFixed(1));
        dbMemory.save('sev_clients', clients);
      }
    }

    const reviewer = dbMemory.get<Profile[]>('sev_profiles').find(p => p.id === payload.reviewerId);
    dbMemory.addAuditLog(payload.reviewerId, reviewer?.email, 'Avaliação', `Enviou avaliação nota ${payload.rating} para ID: ${payload.targetId}`);

    return newReview;
  },

  async listForTarget(targetId: string): Promise<Review[]> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase
        .from('sev_reviews')
        .select('*')
        .eq('target_id', targetId);
      if (!error && data) {
        return data;
      }
    }
    const list = dbMemory.get<Review[]>('sev_reviews');
    return list.filter(r => r.target_id === targetId);
  }
};

// Real-time Database Diagnostics
export interface DiagnosticResult {
  isConnected: boolean;
  keysConfigured: boolean;
  error?: string;
  tables: {
    [tableName: string]: {
      exists: boolean;
      error?: string;
      count?: number;
    }
  };
}

export const databaseDiagnostic = {
  async runCheck(): Promise<DiagnosticResult> {
    const keysConfigured = !!((import.meta as any).env?.VITE_SUPABASE_URL && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY);
    if (!keysConfigured) {
      return {
        isConnected: false,
        keysConfigured: false,
        error: 'Chaves VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não encontradas nas variáveis de ambiente.',
        tables: {}
      };
    }

    if (!supabase) {
      return {
        isConnected: false,
        keysConfigured: true,
        error: 'Não foi possível instanciar o cliente do Supabase.',
        tables: {}
      };
    }

    const tablesToCheck = [
      'sev_profiles',
      'sev_categories',
      'sev_clients',
      'sev_providers',
      'sev_plans',
      'sev_subscriptions',
      'sev_requests',
      'sev_bids',
      'sev_payments',
      'sev_reviews',
      'sev_favorites',
      'sev_conversations',
      'sev_messages',
      'sev_notifications',
      'sev_audit_logs',
      'sev_financial_logs',
      'sev_system_settings'
    ];

    const tables: DiagnosticResult['tables'] = {};
    let isConnected = true;
    let globalError: string | undefined = undefined;

    await Promise.all(
      tablesToCheck.map(async (table) => {
        try {
          const { error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .limit(1);

          if (error) {
            // Postgres / PostgREST signals relation does not exist
            if (
              error.code === 'PGRST116' || 
              error.code === '42P01' ||
              error.message.includes('not found') || 
              error.message.includes('does not exist') ||
              error.message.includes('não existe')
            ) {
              tables[table] = { exists: false, error: 'Tabela não existente ou inacessível no Supabase.' };
            } else {
              tables[table] = { exists: true, error: error.message };
            }
          } else {
            tables[table] = { exists: true, count: count || 0 };
          }
        } catch (err: any) {
          tables[table] = { exists: false, error: err.message || 'Erro de conexão/timeout.' };
        }
      })
    );

    // If all tables fail to query due to connection issues or incorrect credentials
    const allFailedWithConnection = Object.values(tables).every(t => t.error && (t.error.includes('Failed to fetch') || t.error.includes('invalid')));
    if (allFailedWithConnection && tablesToCheck.length > 0) {
      isConnected = false;
      globalError = 'Falha de rede ou chave inválida. O domínio do Supabase rejeitou do cabeçalho anon ou está offline.';
    }

    return {
      isConnected,
      keysConfigured,
      error: globalError,
      tables
    };
  },

  async seedDatabase(): Promise<boolean> {
    if (!isRealSupabase || !supabase) return false;
    try {
      console.log('Induzindo seeding manual de dados padrão via diagnostics...');
      await syncWithSupabase();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
};

