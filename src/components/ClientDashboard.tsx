import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Calendar, MapPin, DollarSign, MessageSquare, 
  Star, CheckCircle2, ChevronRight, XCircle, Bell, User, Clock, ShieldAlert
} from 'lucide-react';
import { 
  Profile, ServiceRequest, ProviderProfile, Category, 
  Message, Conversation, Notification, Review, ServiceBid
} from '../types';
import { 
  dbMemory, serviceRequestService, chatService, reviewService, serviceBidService
} from '../supabase-service';
import { ChatComponent } from './ChatComponent';
import { PixPaymentModal } from './PixPaymentModal';

interface ClientDashboardProps {
  currentUser: Profile;
  onNavigateHome?: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  currentUser,
  onNavigateHome
}) => {
  // Database states
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bids, setBids] = useState<ServiceBid[]>([]);
  const [bidSortBy, setBidSortBy] = useState<'price' | 'rating'>('price');

  // Selection states
  const [activeRequest, setActiveRequest] = useState<ServiceRequest | null>(null);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  
  // Create Request Form Fields
  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqAddress, setReqAddress] = useState('');
  const [reqCity, setReqCity] = useState('');
  const [reqState, setReqState] = useState('');
  const [reqValue, setReqValue] = useState(150);
  const [reqDate, setReqDate] = useState('');

  // Active Chats / Checkout
  const [activeChatConvId, setActiveChatConvId] = useState<string | null>(null);
  const [payingRequest, setPayingRequest] = useState<ServiceRequest | null>(null);
  const [reviewingRequest, setReviewingRequest] = useState<ServiceRequest | null>(null);

  // Review form fields
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Notifications toggle
  const [showNotifications, setShowNotifications] = useState(false);

  const loadClientDashboardData = async () => {
    const list = await serviceRequestService.listAll();
    const clientRequests = list.filter(r => r.client_id === currentUser.id);
    setRequests(clientRequests);

    setProviders(dbMemory.get<ProviderProfile[]>('sev_providers'));
    setProfiles(dbMemory.get<Profile[]>('sev_profiles'));
    setCategories(dbMemory.get<Category[]>('sev_categories'));

    const convs = await chatService.getConversationsForUser(currentUser.id);
    setConversations(convs);

    const b = await serviceBidService.listAll();
    setBids(b);

    const notifs = dbMemory.get<Notification[]>('sev_notifications').filter(n => n.user_id === currentUser.id);
    setNotifications(notifs);
  };

  useEffect(() => {
    loadClientDashboardData();

    // Auto-update feed for mock real-time feedback
    const interval = setInterval(() => {
      loadClientDashboardData();
    }, 4000);

    return () => clearInterval(interval);
  }, [currentUser.id]);

  // Handle new request submit
  const handleCreateRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId || !reqTitle.trim() || !reqDesc.trim() || !reqDate) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      await serviceRequestService.create({
        client_id: currentUser.id,
        provider_id: 'broadcast',
        category_id: selectedCategoryId,
        title: reqTitle,
        description: reqDesc,
        address: reqAddress || 'Rua Padrão do Cliente',
        city: reqCity || 'São Paulo',
        state: reqState || 'SP',
        suggested_value: 0, // client doesn't suggest price
        scheduled_date: new Date(reqDate).toISOString()
      });

      // Clear input fields
      setReqTitle('');
      setReqDesc('');
      setReqValue(0);
      setReqDate('');
      setIsCreatingRequest(false);
      
      loadClientDashboardData();
      alert('Solicitação de orçamento publicada com sucesso! Os prestadores desta categoria receberam o seu pedido e em breve enviarão propostas de valor.');
    } catch (err) {
      alert('Erro ao registrar pedido: ' + (err as Error).message);
    }
  };

  // Open Chat thread with provider
  const handleOpenChat = async (providerId: string) => {
    try {
      const conv = await chatService.getOrCreateConversation(currentUser.id, providerId);
      setActiveChatConvId(conv.id);
    } catch (err) {
      console.error(err);
    }
  };

  // Confirm cancel
  const handleCancelRequest = async (requestId: string) => {
    if (confirm('Deseja realmente cancelar este pedido de serviço?')) {
      try {
        await serviceRequestService.updateStatus(requestId, 'cancelled');
        loadClientDashboardData();
      } catch (err) {
        alert(err);
      }
    }
  };

  // Accept provider bid
  const handleAcceptBid = async (bidId: string) => {
    if (confirm('Deseja aceitar esta proposta e contratar este prestador?')) {
      try {
        await serviceBidService.acceptBid(bidId);
        alert('Proposta aceita com sucesso! Um chat foi iniciado para vocês alinharem os detalhes de execução.');
        loadClientDashboardData();
      } catch (err) {
        alert('Erro ao aceitar proposta: ' + (err as Error).message);
      }
    }
  };

  // Confirm payment webhook simulated
  const handlePaySuccess = async () => {
    if (!payingRequest) return;
    try {
      await serviceRequestService.confirmPayment(payingRequest.id);
      // Automatically prompt ratings block
      const rReq = payingRequest;
      setPayingRequest(null);
      setReviewingRequest(rReq);
      loadClientDashboardData();
    } catch (err) {
      alert(err);
    }
  };

  // Submit Review Form
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingRequest) return;

    try {
      await reviewService.add({
        requestId: reviewingRequest.id,
        reviewerId: currentUser.id,
        targetId: reviewingRequest.provider_id,
        type: 'client_to_provider',
        rating,
        comment: reviewComment
      });

      // Reciprocate automatic mock rating from provider to client for interactivity!
      await reviewService.add({
        requestId: reviewingRequest.id,
        reviewerId: reviewingRequest.provider_id,
        targetId: currentUser.id,
        type: 'provider_to_client',
        rating: 5,
        comment: 'Excelente cliente! Resposta rápida, forneceu todas as indicações e pagou o combinado via PIX.'
      });

      setReviewingRequest(null);
      setReviewComment('');
      setRating(5);
      loadClientDashboardData();
      alert('Avaliação enviada com sucesso! O prestador também avaliou você com 5 estrelas em seu perfil de cliente.');
    } catch (err) {
      alert(err);
    }
  };

  // Clear single notifications
  const handleMarkNotificationRead = (nId: string) => {
    const list = dbMemory.get<Notification[]>('sev_notifications');
    const updated = list.map(n => n.id === nId ? { ...n, is_read: true } : n);
    dbMemory.save('sev_notifications', updated);
    loadClientDashboardData();
  };

  const activeRequestsCount = requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length;

  return (
    <div className="min-h-screen bg-neutral-50 pb-12 animate-fade-in">
      {/* Header Widget */}
      <header className="bg-white border-b border-neutral-200 py-4 px-6 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold">
              {currentUser.avatar_url ? (
                <img src={currentUser.avatar_url} referrerPolicy="no-referrer" alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User />
              )}
            </div>
            <div>
              <h2 className="text-sm font-black text-neutral-900">Olá, {currentUser.full_name}</h2>
              <p className="text-[10px] text-neutral-400 font-semibold uppercase">Área do Cliente • CPF Ativo</p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors py-2 px-3 hover:bg-rose-50 rounded-lg flex items-center gap-1 whitespace-nowrap"
              >
                Sair da Conta
              </button>
            )}

            {/* Notification bell and badge */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-neutral-400 hover:text-neutral-800 rounded-lg hover:bg-neutral-100 transition-all"
                title="Notificações"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2.5 w-76 bg-white rounded-xl shadow-xl border border-neutral-100 py-2 z-30 max-h-[300px] overflow-y-auto">
                  <div className="px-4 py-1.5 border-b border-neutral-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Notificações Recentes</span>
                    {notifications.length > 0 && (
                      <button 
                        onClick={() => {
                          const n = dbMemory.get<Notification[]>('sev_notifications').map(not => not.user_id === currentUser.id ? { ...not, is_read: true } : not);
                          dbMemory.save('sev_notifications', n);
                          loadClientDashboardData();
                        }}
                        className="text-[9px] text-emerald-600 font-bold"
                      >
                        Ler todas
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-neutral-400 p-4 text-center">Nenhuma notificação nova no momento.</p>
                  ) : (
                    notifications.map((not) => (
                      <div 
                        key={not.id} 
                        onClick={() => handleMarkNotificationRead(not.id)}
                        className={`p-3 text-xs border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors cursor-pointer ${!not.is_read ? 'bg-emerald-50/40' : ''}`}
                      >
                        <div className="flex items-center justify-between font-bold text-neutral-900">
                          <span>{not.title}</span>
                          <span className="text-[8px] text-neutral-400 font-medium">{new Date(not.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-1">{not.message}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Services lists and active tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h3 className="text-base font-black text-neutral-900">Suas Solicitações de Serviço</h3>
                <p className="text-xs text-neutral-400">Acompanhe as propostas e andamento de suas tarefas contratadas</p>
              </div>

              <button
                onClick={() => setIsCreatingRequest(true)}
                className="py-2 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" /> Nova Solicitação
              </button>
            </div>

            {/* Request cards list */}
            {requests.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-neutral-200 rounded-xl max-w-lg mx-auto">
                <ShieldAlert className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                <h5 className="font-bold text-neutral-700 text-sm">Nenhum serviço solicitado até agora</h5>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                  Você pode solicitar um serviço personalizado escolhendo qualquer especialista aprovado em nossa plataforma!
                </p>
                <button
                  onClick={() => setIsCreatingRequest(true)}
                  className="mt-4 px-3.5 py-1.5 bg-neutral-100 text-neutral-700 font-bold text-xs rounded-xl hover:bg-neutral-200"
                >
                  Solicitar Agora
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => {
                  const providerProfile = profiles.find(p => p.id === req.provider_id);
                  const catName = categories.find(c => c.id === req.category_id)?.name || 'Reparos';
                  const isBroadcast = !req.provider_id;
                  const reqBids = bids.filter(b => b.request_id === req.id);
                  
                  // Sort bids
                  const sortedBids = [...reqBids].sort((a, b) => {
                    if (bidSortBy === 'price') {
                      return a.value - b.value;
                    } else {
                      const ratingA = providers.find(p => p.id === a.provider_id)?.rating_average || 0;
                      const ratingB = providers.find(p => p.id === b.provider_id)?.rating_average || 0;
                      return ratingB - ratingA;
                    }
                  });

                  return (
                    <div key={req.id} className="border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                      {/* Upper block: Request summary info */}
                      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 bg-white">
                        <div className="space-y-2.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-black uppercase tracking-wider py-0.5 px-2 rounded-full ${
                              req.status === 'waiting' ? 'bg-amber-100 text-amber-800' :
                              req.status === 'accepted' ? 'bg-sky-100 text-sky-850' :
                              req.status === 'in_progress' ? 'bg-indigo-100 text-indigo-800' :
                              req.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-700'
                            }`}>
                              Status: {
                                req.status === 'waiting' ? (isBroadcast ? 'Aguardando Orçamentos' : 'Aguardando Aprovação') :
                                req.status === 'accepted' ? 'Agendado/Contratado' :
                                req.status === 'in_progress' ? 'Em Progresso' :
                                req.status === 'completed' ? 'Concluído' : 'Cancelado'
                              }
                            </span>

                            <span className={`text-[10px] uppercase font-bold py-0.5 px-2 rounded-full ${
                              req.status_payment === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              Pagamento: {req.status_payment === 'paid' ? 'Pago' : 'Pendente'}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-bold text-neutral-900 text-sm">{req.title}</h4>
                            <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{req.description}</p>
                          </div>

                          <div className="flex items-center gap-4 flex-wrap text-[11px] text-neutral-500 font-medium">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-neutral-400" />
                              Profissional: {isBroadcast && req.status === 'waiting' ? (
                                <strong className="text-amber-600 bg-amber-50 px-1 py-0.5 rounded text-[10px]">Aberto para Propostas (Categoria: {catName})</strong>
                              ) : (
                                <strong>{providerProfile?.full_name || 'Especialista'}</strong>
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                              Marcar: {new Date(req.scheduled_date).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                              {req.city}
                            </span>
                          </div>
                        </div>

                        {/* Side transactional interface */}
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center pt-3 md:pt-0 gap-3">
                          <div className="text-right">
                            <span className="text-[10px] text-neutral-400 block font-semibold uppercase">Valor do Serviço</span>
                            <span className="text-base font-black text-neutral-900">
                              {req.final_value ? `R$ ${req.final_value}` : 'Sob Orçamento'}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            {req.status === 'completed' && req.status_payment !== 'paid' && (
                              <button
                                onClick={() => setPayingRequest(req)}
                                className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1"
                              >
                                Pagar com PIX
                              </button>
                            )}

                            {req.provider_id && (
                              <button
                                onClick={() => handleOpenChat(req.provider_id)}
                                className="p-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-150"
                                title="Chat de Alinhamento"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            )}

                            {req.status === 'waiting' && (
                              <button
                                onClick={() => handleCancelRequest(req.id)}
                                className="p-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                                title="Cancelar Solicitação"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lower block: Bids/Offers list (Only for broadcast waiting requests) */}
                      {isBroadcast && req.status === 'waiting' && (
                        <div className="bg-neutral-50 p-5 border-t border-neutral-100">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="text-[11px] font-black uppercase text-neutral-500 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-550" />
                              Propostas Recebidas ({reqBids.length})
                            </h5>
                            
                            {reqBids.length > 0 && (
                              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-bold uppercase">
                                <span>Ordenar por:</span>
                                <button 
                                  onClick={() => setBidSortBy('price')}
                                  className={`px-2 py-1 rounded transition-colors ${bidSortBy === 'price' ? 'bg-neutral-200 text-neutral-800' : 'hover:bg-neutral-150'}`}
                                >
                                  Menor Valor
                                </button>
                                <button 
                                  onClick={() => setBidSortBy('rating')}
                                  className={`px-2 py-1 rounded transition-colors ${bidSortBy === 'rating' ? 'bg-neutral-200 text-neutral-800' : 'hover:bg-neutral-150'}`}
                                >
                                  Melhor Avaliação
                                </button>
                              </div>
                            )}
                          </div>

                          {reqBids.length === 0 ? (
                            <div className="py-6 text-center">
                              <div className="animate-pulse flex flex-col items-center">
                                <div className="h-2 w-24 bg-neutral-200 rounded mb-2"></div>
                                <span className="text-xs text-neutral-400 mt-1">Aguardando que os profissionais enviem propostas de preço...</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {sortedBids.map(bid => {
                                const bProvider = providers.find(p => p.id === bid.provider_id);
                                const bProfile = profiles.find(p => p.id === bid.provider_id);
                                return (
                                  <div key={bid.id} className="p-4 rounded-xl border border-neutral-150 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                                    <div className="flex gap-3">
                                      <img 
                                        src={bProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                                        alt={bProfile?.full_name} 
                                        className="w-10 h-10 rounded-full object-cover border border-neutral-100"
                                        referrerPolicy="no-referrer"
                                      />
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <strong className="text-xs text-neutral-950 font-bold">{bProfile?.full_name}</strong>
                                          <span className="flex items-center text-[10px] text-amber-500 font-bold bg-amber-50 px-1 rounded">
                                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500 mr-0.5" />
                                            {bProvider?.rating_average || '5.0'}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-neutral-400 font-medium">{bProvider?.specialty || 'Profissional da categoria'}</p>
                                        <p className="text-xs text-neutral-600 mt-1.5 italic font-medium">"{bid.message}"</p>
                                      </div>
                                    </div>

                                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 border-t sm:border-0 border-neutral-100 pt-2.5 sm:pt-0 sm:min-w-[120px]">
                                      <div className="text-left sm:text-right">
                                        <span className="text-[9px] uppercase font-bold text-neutral-400 block">Proposta</span>
                                        <span className="text-sm font-black text-emerald-650">R$ {bid.value.toFixed(2)}</span>
                                      </div>
                                      <button
                                        onClick={() => handleAcceptBid(bid.id)}
                                        className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-[10px] uppercase tracking-wider transition-colors"
                                      >
                                        Aceitar e Contratar
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Chat panel or Custom solicitar form */}
        <div className="space-y-6">
          
          {/* Create Service request block */}
          {isCreatingRequest ? (
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-neutral-900 uppercase">Solicitar Novo Serviço</h3>
                <button 
                  onClick={() => setIsCreatingRequest(false)}
                  className="text-neutral-400 hover:text-neutral-700 font-bold text-xs"
                >
                  X Fechar
                </button>
              </div>

              <form onSubmit={handleCreateRequestSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Escolher Categoria de Serviço</label>
                  <select
                    required
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full text-xs p-2.5 border border-neutral-200 rounded-xl focus:outline-none"
                  >
                    <option value="">Selecione a categoria desejada...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Título do Serviço</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Trocar fiação do chuveiro, consertar pia..."
                    value={reqTitle}
                    onChange={(e) => setReqTitle(e.target.value)}
                    className="w-full text-xs p-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Mencione os detalhes do problema</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Mencione detalhes, quantidade de tomadas ou o tipo de material disponível..."
                    value={reqDesc}
                    onChange={(e) => setReqDesc(e.target.value)}
                    className="w-full text-xs p-2.5 border border-neutral-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Data Agendada Pretendida</label>
                  <input
                    type="date"
                    required
                    value={reqDate}
                    onChange={(e) => setReqDate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-neutral-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Endereço de Execução</label>
                    <input type="text" placeholder="Rua..." value={reqAddress} onChange={e => setReqAddress(e.target.value)} className="w-full text-xs p-2 border border-neutral-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Cidade</label>
                    <input type="text" placeholder="S.P..." value={reqCity} onChange={e => setReqCity(e.target.value)} className="w-full text-xs p-2 border border-neutral-200 rounded-lg" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md"
                >
                  Confirmar e Abrir Solicitação
                </button>
              </form>
            </div>
          ) : activeChatConvId ? (
            /* Active chatting interface */
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Conversando no Chat</span>
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
            /* Simple user support card */
            <div className="bg-neutral-950 text-white p-6 rounded-2xl border border-neutral-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/10 blur-xl rounded-full" />
              
              <h4 className="text-sm font-black tracking-wider uppercase text-emerald-400">Canal de Ajuda Severinu</h4>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Nossa assessoria está disponível via chat ou WhatsApp centralizado. Para reportar atrasos, divergência de valores ou sinistros durante a prestação de serviços, fale conosco.
              </p>
              
              <div className="mt-5 border-t border-neutral-850 pt-4 flex items-center justify-between">
                <span className="text-[10px] text-neutral-500 uppercase">Suporte Oficial</span>
                <a 
                  href={`https://wa.me/5511999999999`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs text-emerald-400 font-bold hover:underline"
                >
                  Chamar Central &rarr;
                </a>
              </div>
            </div>
          )}

          {/* Review prompt component */}
          {reviewingRequest && (
            <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-lg animate-pulse-once">
              <div className="flex items-center gap-2 mb-3 text-emerald-700">
                <Star className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                <h4 className="font-bold text-xs uppercase">Avaliar Prestador</h4>
              </div>

              <p className="text-xs text-neutral-600 mb-4">
                Como foi sua experiência com o especialista 
                strong {profiles.find(p => p.id === reviewingRequest.provider_id)?.full_name || 'Profissional'} 
                no serviço de "{reviewingRequest.title}"?
              </p>

              <form onSubmit={handleSubmitReview} className="space-y-3">
                <div className="flex gap-1.5 justify-center py-2 bg-neutral-50 rounded-lg">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRating(val)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${val <= rating ? 'fill-amber-400 text-amber-500' : 'text-neutral-300'}`} />
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Mande sua mensagem de agradecimento ou feedback profissional..."
                  required
                  className="w-full p-2.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-800"
                />

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500 transition-colors"
                >
                  Enviar Avaliação de Serviço
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Reusable PIX payment drawer */}
      {payingRequest && (
        <PixPaymentModal
          id={payingRequest.id}
          title={`Pagamento pelo serviço "${payingRequest.title}"`}
          recipientName={profiles.find(p => p.id === payingRequest.provider_id)?.full_name || 'Severinu Provider'}
          amount={payingRequest.final_value || payingRequest.suggested_value}
          recipientKey={providers.find(p => p.id === payingRequest.provider_id)?.pix_key}
          paymentType="service"
          onPaymentSuccess={handlePaySuccess}
          onClose={() => setPayingRequest(null)}
        />
      )}
    </div>
  );
};
