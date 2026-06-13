import React, { useState, useEffect } from 'react';
import { 
  Briefcase, CheckCircle2, ChevronRight, XCircle, AlertCircle, 
  MessageSquare, Star, Award, TrendingUp, Sparkles, Shield, Compass, Calendar, MapPin, Clock, User
} from 'lucide-react';
import { 
  Profile, ProviderProfile, ServiceRequest, SubscriptionPlan, 
  ProviderSubscription, Review, Category, Conversation, ServiceBid
} from '../types';
import { 
  dbMemory, serviceRequestService, providerService, chatService, reviewService, serviceBidService
} from '../supabase-service';
import { ChatComponent } from './ChatComponent';
import { PixPaymentModal } from './PixPaymentModal';

interface ProviderDashboardProps {
  currentUser: Profile;
  onNavigateHome?: () => void;
}

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({
  currentUser,
  onNavigateHome
}) => {
  // Database states
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<ProviderSubscription | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [availableRequests, setAvailableRequests] = useState<ServiceRequest[]>([]);
  const [bids, setBids] = useState<ServiceBid[]>([]);

  // Selection states
  const [activeChatConvId, setActiveChatConvId] = useState<string | null>(null);
  const [isUpgradingPlan, setIsUpgradingPlan] = useState<SubscriptionPlan | null>(null);

  // Form states for bidding
  const [biddingReqId, setBiddingReqId] = useState<string | null>(null);
  const [bidValue, setBidValue] = useState<number>(100);
  const [bidMessage, setBidMessage] = useState<string>('');

  const loadProviderDashboardData = async () => {
    const allProviders = dbMemory.get<ProviderProfile[]>('sev_providers');
    const matched = allProviders.find(p => p.id === currentUser.id);
    if (matched) {
      setProviderProfile(matched);
    }

    setProfiles(dbMemory.get<Profile[]>('sev_profiles'));
    setCategories(dbMemory.get<Category[]>('sev_categories'));
    setPlans(dbMemory.get<SubscriptionPlan[]>('sev_plans'));

    // Requests assigned to me
    const reqList = await serviceRequestService.listAll();
    setRequests(reqList.filter(r => r.provider_id === currentUser.id));

    // Bids of the system
    const b = await serviceBidService.listAll();
    setBids(b);

    if (matched) {
      const broadcastReqs = reqList.filter(r => 
        r.status === 'waiting' && 
        !r.provider_id && 
        r.category_id === matched.category_id
      );
      setAvailableRequests(broadcastReqs);
    }

    // Subscription
    const subs = dbMemory.get<ProviderSubscription[]>('sev_subscriptions');
    const activeSub = subs.find(s => s.provider_id === currentUser.id && s.status === 'active');
    if (activeSub) {
      setCurrentSubscription(activeSub);
    }

    // Reviews about me
    const userReviews = await reviewService.listForTarget(currentUser.id);
    setReviews(userReviews);

    // Active convas
    const convs = await chatService.getConversationsForUser(currentUser.id);
    setConversations(convs);
  };

  useEffect(() => {
    loadProviderDashboardData();

    // Constant pooling for realistic dashboard sync
    const interval = setInterval(() => {
      loadProviderDashboardData();
    }, 4000);

    return () => clearInterval(interval);
  }, [currentUser.id]);

  // Request status transitions
  const handleTransitionRequest = async (requestId: string, nextStatus: ServiceRequest['status']) => {
    try {
      await serviceRequestService.updateStatus(requestId, nextStatus);
      loadProviderDashboardData();
      alert(`Serviço atualizado com sucesso para: "${nextStatus.toUpperCase()}"`);
    } catch (err) {
      alert(err);
    }
  };

  // Submit bid / proposal
  const handleSendBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!biddingReqId || bidValue <= 0 || !bidMessage.trim()) {
      alert('Preencha os campos de proposta corretamente.');
      return;
    }

    try {
      await serviceBidService.create({
        request_id: biddingReqId,
        provider_id: currentUser.id,
        value: Number(bidValue),
        message: bidMessage,
      });
      alert('Sua proposta de orçamento foi enviada com sucesso! O cliente poderá analisar e lhe contratar a qualquer momento.');
      setBiddingReqId(null);
      setBidMessage('');
      setBidValue(100);
      loadProviderDashboardData();
    } catch (err) {
      alert('Erro ao enviar proposta: ' + (err as Error).message);
    }
  };

  // Subscribe success callback
  const handleSubscribeSuccess = async () => {
    if (!isUpgradingPlan) return;
    try {
      await providerService.subscribe(currentUser.id, isUpgradingPlan.id);
      setIsUpgradingPlan(null);
      loadProviderDashboardData();
      alert(`Parabéns! Sua assinatura foi atualizada para o plano ${isUpgradingPlan.name}! Você já possui os selos e destaques correspondentes.`);
    } catch (err) {
      alert(err);
    }
  };

  // Open Chat thread with client
  const handleOpenChat = async (clientId: string) => {
    try {
      const conv = await chatService.getOrCreateConversation(clientId, currentUser.id);
      setActiveChatConvId(conv.id);
    } catch (err) {
      console.error(err);
    }
  };

  // Calculations
  const currentPlanName = plans.find(p => p.id === currentSubscription?.plan_id)?.name || 'Gratuito';
  const totalCompletedCount = requests.filter(r => r.status === 'completed').length;
  const pendingRequestsCount = requests.filter(r => r.status === 'waiting').length;

  return (
    <div className="min-h-screen bg-neutral-50 pb-16 animate-fade-in">
      {/* Dynamic Header */}
      <nav className="bg-white border-b border-neutral-200 py-4 px-6 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'} 
                alt="" referrerPolicy="no-referrer" className="w-11 h-11 rounded-full object-cover" 
              />
              <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                providerProfile?.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-400'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm font-black text-neutral-900">{currentUser.full_name}</h2>
                <span className={`text-[9px] uppercase font-bold py-0.5 px-2 rounded-full ${
                  providerProfile?.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                  providerProfile?.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-850'
                }`}>
                  Status: {
                    providerProfile?.status === 'approved' ? 'Verificado' :
                    providerProfile?.status === 'pending' ? 'Aguardando Aprovação' : 'Suspenso'
                  }
                </span>

                <span className="text-[9px] uppercase font-bold bg-purple-100 text-purple-800 py-0.5 px-2 rounded-full">
                  Plano: {currentPlanName}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-semibold uppercase mt-0.5">
                {categories.find(c => c.id === providerProfile?.category_id)?.name || 'Especialista'} • {providerProfile?.city} - {providerProfile?.state}
              </p>
            </div>
          </div>

          <div className="flex gap-2.5">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors py-2 px-3 hover:bg-rose-50 rounded-lg flex items-center gap-1"
              >
                Sair da Conta
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Verification notice for brand new ones */}
      {providerProfile?.status === 'pending' && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex gap-3.5">
            <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Seu cadastro está pendente de auditoria operacional!</p>
              <p className="mt-0.5 text-amber-800">
                A Equipe Administrativa recebeu seus documentos digitais enviados no faturamento de inscrição e avaliará em instantes. <strong>Aviso de Simulação:</strong> Você pode usar a aba de Administrador (no cabeçalho superior esquerdo) para aprovar sua própria credencial de teste com 1 clique!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main dashboard content */}
      <main className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left main pane: request dispatcher, schedule flow */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs">
            <h3 className="text-base font-black text-neutral-900 mb-1">Tarefas de Serviço Vinculadas</h3>
            <p className="text-xs text-neutral-400 mb-6">Acompanhe orçamentos solicitados por clientes perto de você</p>

            {requests.length === 0 ? (
              <div className="text-center py-12 border border-neutral-200 border-dashed rounded-xl max-w-md mx-auto">
                <Briefcase className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                <h5 className="font-bold text-neutral-700 text-sm">Nenhuma incumbência de reparo</h5>
                <p className="text-xs text-neutral-400 mt-1">
                  Assim que clientes solicitarem serviços sob medida para sua especialidade, as tarefas aparecerão qualificadas neste espaço! Well done.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => {
                  const clientProfile = profiles.find(p => p.id === req.client_id);
                  const clientDetail = dbMemory.get<any[]>('sev_clients').find(c => c.id === req.client_id);
                  
                  return (
                    <div 
                      key={req.id} 
                      className="p-5 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-black uppercase tracking-wider py-0.5 px-2 rounded-full ${
                            req.status === 'waiting' ? 'bg-amber-100 text-amber-800' :
                            req.status === 'accepted' ? 'bg-sky-100 text-sky-800' :
                            req.status === 'in_progress' ? 'bg-indigo-100 text-indigo-800' :
                            req.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-700'
                          }`}>
                            Faturamento: {
                              req.status === 'waiting' ? 'Aguardando Aprovação' :
                              req.status === 'accepted' ? 'Confirmado' :
                              req.status === 'in_progress' ? 'Execução' :
                              req.status === 'completed' ? 'Concluído' : 'Cancelado'
                            }
                          </span>

                          <span className={`text-[10px] uppercase font-bold py-0.5 px-2 rounded-full ${
                            req.status_payment === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-805'
                          }`}>
                            Transação Bancária: {req.status_payment === 'paid' ? 'PIX Compensado' : 'Aguardando PIX cliente'}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-neutral-900 text-sm">{req.title}</h4>
                          <p className="text-xs text-neutral-500 mt-1">{req.description}</p>
                        </div>

                        <div className="flex items-center gap-4 flex-wrap text-[11px] text-neutral-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Compass className="w-3.5 h-3.5 text-neutral-400" />
                            Contratante: <strong>{clientProfile?.full_name || 'Cliente'}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-neutral-400" />
                            Agendado: {new Date(req.scheduled_date).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                            {req.address}, {req.city}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-neutral-100 pt-3 md:pt-0 gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-neutral-400 block font-semibold uppercase">Faturamento Líquido</span>
                          <span className="text-base font-black text-emerald-600">R$ {req.final_value || req.suggested_value}</span>
                        </div>

                        <div className="flex gap-2">
                          {/* Accept request trigger */}
                          {req.status === 'waiting' && providerProfile?.status === 'approved' && (
                            <button
                              onClick={() => handleTransitionRequest(req.id, 'accepted')}
                              className="py-1 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                            >
                              Aceitar Serviço
                            </button>
                          )}

                          {/* Initiate executions */}
                          {req.status === 'accepted' && (
                            <button
                              onClick={() => handleTransitionRequest(req.id, 'in_progress')}
                              className="py-1 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
                            >
                              Iniciar Trabalho
                            </button>
                          )}

                          {/* Conclude service requests */}
                          {req.status === 'in_progress' && (
                            <button
                              onClick={() => handleTransitionRequest(req.id, 'completed')}
                              className="py-1 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors glow-emerald"
                            >
                              Finalizar Trabalho e Solicitar PIX
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenChat(req.client_id)}
                            className="p-2 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                            title="Chat do Atendimento"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Oportunidades de Trabalho (Auction Bidding list) */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="text-base font-black text-neutral-900 leading-tight">Oportunidades de Trabalho</h3>
                <p className="text-[11px] text-neutral-400">Serviços abertos na sua categoria aguardando orçamentos</p>
              </div>
            </div>

            {availableRequests.length === 0 ? (
              <div className="text-center py-10 border border-neutral-200 border-dashed rounded-xl max-w-sm mx-auto">
                <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-2 animate-pulse" />
                <h5 className="font-bold text-neutral-700 text-xs">Nenhum orçamento aberto</h5>
                <p className="text-[10px] text-neutral-400 mt-1 max-w-[280px] mx-auto">
                  Clientes de sua categoria não publicaram solicitações de orçamento aberto recentemente.
                </p>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {availableRequests.map((req) => {
                  const clientProfile = profiles.find(p => p.id === req.client_id);
                  const existingBid = bids.find(b => b.request_id === req.id && b.provider_id === currentUser.id);
                  const isBiddingThis = biddingReqId === req.id;

                  return (
                    <div 
                      key={req.id} 
                      className="p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-all bg-white flex flex-col justify-between gap-3 text-neutral-800"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                            Pedido Aberto ({categories.find(c => c.id === req.category_id)?.name || 'Especialidade'})
                          </span>
                          <h4 className="font-bold text-neutral-900 text-sm mt-1.5">{req.title}</h4>
                          <p className="text-xs text-neutral-500 mt-1">{req.description}</p>
                        </div>
                        <div className="sm:text-right flex-shrink-0">
                          <span className="text-[9px] uppercase font-bold text-neutral-400 block">Cidade</span>
                          <span className="text-xs font-semibold text-neutral-800">{req.city} - {req.state}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-[10px] text-neutral-400 font-bold uppercase mt-1">
                        <span>Cliente: <strong className="text-neutral-700">{clientProfile?.full_name || 'Usuário'}</strong></span>
                        <span>Previsão: <strong className="text-neutral-700">{new Date(req.scheduled_date).toLocaleDateString('pt-BR')}</strong></span>
                      </div>

                      <div className="border-t border-neutral-100 pt-3 mt-1.5">
                        {existingBid && !isBiddingThis ? (
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div>
                              <p className="text-xs text-emerald-800 font-bold">✓ Proposta enviada: <strong className="text-sm border-b border-dashed border-emerald-500">R$ {existingBid.value.toFixed(2)}</strong></p>
                              {existingBid.message && (
                                <p className="text-[11px] text-emerald-700 italic mt-0.5">"{existingBid.message}"</p>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setBiddingReqId(req.id);
                                setBidValue(existingBid.value);
                                setBidMessage(existingBid.message);
                              }}
                              className="text-[10px] font-bold text-neutral-700 hover:text-neutral-900 underline uppercase cursor-pointer"
                            >
                              Alterar Valor
                            </button>
                          </div>
                        ) : isBiddingThis ? (
                          <form onSubmit={handleSendBidSubmit} className="space-y-3 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                            <h5 className="text-[10px] font-black uppercase text-neutral-500">Enviar sua Proposta</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                              <div>
                                <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">Seu Orçamento (R$)</label>
                                <input
                                  type="number"
                                  required
                                  min={10}
                                  value={bidValue}
                                  onChange={e => setBidValue(Number(e.target.value))}
                                  className="w-full text-xs p-2 bg-white border border-neutral-200 rounded-lg focus:outline-none"
                                />
                              </div>
                              <div className="sm:col-span-3">
                                <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">Mensagem de Apresentação / Agendamento</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Mencione quando pode vir e os detalhes para o cliente..."
                                  value={bidMessage}
                                  onChange={e => setBidMessage(e.target.value)}
                                  className="w-full text-xs p-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => setBiddingReqId(null)}
                                className="px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-500 font-bold text-[10px] uppercase transition-colors"
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase transition-colors shadow-xs"
                              >
                                {existingBid ? 'Salvar Alteração' : 'Enviar Orçamento'}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex justify-end">
                            <button
                              onClick={() => {
                                setBiddingReqId(req.id);
                                setBidValue(120);
                                setBidMessage('');
                              }}
                              className="px-4 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-[10px] uppercase tracking-wider transition-colors"
                            >
                              Enviar Orçamento / Proposta
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right side: subscription pricing cards, reputations and chat */}
        <div className="space-y-6">
          
          {/* Active chatting placeholder */}
          {activeChatConvId ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Discussão de Termos</span>
                <button 
                  onClick={() => setActiveChatConvId(null)}
                  className="text-neutral-500 hover:text-neutral-900 font-bold text-xs hover:underline"
                >
                  X Fechar Chat
                </button>
              </div>
              <ChatComponent 
                conversationId={activeChatConvId}
                currentUser={currentUser}
                onBack={() => setActiveChatConvId(null)}
              />
            </div>
          ) : (
            /* Subscriptions and Upgrades pricing */
            <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-indigo-700">
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm uppercase text-neutral-900">Assinaturas e Multiplicadores</h3>
              </div>
              <p className="text-xs text-neutral-400">
                Seu plano de faturamento atual é o <strong>{currentPlanName}</strong>. Faça upgrades rápidos para obter visibilidade instantânea no topo das pesquisas de clientes.
              </p>

              <div className="space-y-3.5 pt-2">
                {plans.map((pl) => {
                  const isCurrent = pl.name === currentPlanName;
                  return (
                    <div 
                      key={pl.id} 
                      className={`p-3.5 rounded-xl border transition-all ${
                        isCurrent 
                          ? 'bg-neutral-900 text-white border-neutral-950' 
                          : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300 text-neutral-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">{pl.name}</span>
                        <span className="text-xs font-mono font-black">
                          {pl.price === 0 ? 'Grátis' : `R$ ${pl.price.toFixed(2)}/mês`}
                        </span>
                      </div>
                      
                      <ul className="mt-2.5 space-y-1 text-[10px] opacity-80 list-disc list-inside">
                        {pl.features.map((feat, idx) => (
                          <li key={idx} className="truncate">{feat}</li>
                        ))}
                      </ul>

                      {!isCurrent && (
                        <button
                          onClick={() => setIsUpgradingPlan(pl)}
                          className="w-full mt-3 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
                        >
                          Assinar {pl.name} via PIX
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reputation review listings */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-150 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
              <h3 className="text-sm font-bold uppercase text-neutral-900">Avaliações e Histórico ({reviews.length})</h3>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-neutral-400 py-4 text-center">Nenhum feedback de cliente efetuado para o momento.</p>
            ) : (
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                {reviews.map((rev) => {
                  const reviewer = profiles.find(p => p.id === rev.reviewer_id);
                  return (
                    <div key={rev.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs">
                      <div className="flex items-center justify-between font-bold mb-1">
                        <span>{reviewer?.full_name || 'Cliente'}</span>
                        <span className="text-amber-500 font-mono">{'★'.repeat(rev.rating)}</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 italic">"{rev.comment}"</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* PIX Upgrade plan modal popup */}
      {isUpgradingPlan && (
        <PixPaymentModal
          id={isUpgradingPlan.id}
          title={`Assinatura do Plano ${isUpgradingPlan.name}`}
          recipientName="Severinu Marketplace Corporativo"
          amount={isUpgradingPlan.price}
          onPaymentSuccess={handleSubscribeSuccess}
          onClose={() => setIsUpgradingPlan(null)}
        />
      )}
    </div>
  );
};
