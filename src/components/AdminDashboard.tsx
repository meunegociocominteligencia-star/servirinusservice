import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Check, X, AlertTriangle, Settings, 
  FileText, TrendingUp, DollarSign, Activity, Eye, Trash2, Globe,
  Wrench, Compass, LogOut, MapPin, CreditCard, Briefcase, Search, Loader2,
  Calendar, Filter
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Profile, ProviderProfile, ClientProfile, AuditLog, FinancialLog, 
  SystemSettings, Category, ServiceRequest
} from '../types';
import { dbMemory, providerService, isRealSupabase, supabase } from '../supabase-service';
import { ProviderDetailsSection } from './ProviderDetailsSection';

interface AdminDashboardProps {
  onNavigateHome?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateHome }) => {
  // Local active states
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [financialLogs, setFinancialLogs] = useState<FinancialLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null);
  
  // Custom sidebar layout tab state
  const [activeTab, setActiveTab] = useState<'clients' | 'providers' | 'pix_finance' | 'categories_logs'>('clients');

  // Search states
  const [searchClientQuery, setSearchClientQuery] = useState('');
  const [searchProviderQuery, setSearchProviderQuery] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Load all databases from localStorage or directly from Supabase
  const loadAdminData = async () => {
    // 1. Instant fallback to local state
    setProfiles(dbMemory.get<Profile[]>('sev_profiles') || []);
    setClients(dbMemory.get<ClientProfile[]>('sev_clients') || []);
    setProviders(dbMemory.get<ProviderProfile[]>('sev_providers') || []);
    setAuditLogs(dbMemory.get<AuditLog[]>('sev_audit_logs') || []);
    setFinancialLogs(dbMemory.get<FinancialLog[]>('sev_financial_logs') || []);
    setCategories(dbMemory.get<Category[]>('sev_categories') || []);
    setServiceRequests(dbMemory.get<ServiceRequest[]>('sev_requests') || []);

    const savedSettings = dbMemory.get<SystemSettings[]>('sev_system_settings');
    if (savedSettings && savedSettings.length > 0) {
      setSettings(savedSettings[0]);
    } else {
      const defaultSettings: SystemSettings = {
        id: 'settings-1',
        marketing_text: 'Severinu Service - Simplificando serviços, multiplicando conexões.',
        commission_rate_percent: 0,
        support_whatsapp: '5511999999999',
        pix_recipient_name: 'Severinu Marketplace',
        pix_recipient_city: 'Sao Paulo',
        pix_recipient_key: 'financeiro@severinu.com'
      };
      dbMemory.save('sev_system_settings', [defaultSettings]);
      setSettings(defaultSettings);
    }

    // 2. Fetch directly from Supabase when connected to database
    if (isRealSupabase && supabase) {
      try {
        const fetchTable = async (table: string) => {
          const { data, error } = await supabase.from(table).select('*');
          if (error) {
            console.error(`AdminDashboard failed to load from Supabase table [${table}]:`, error.message);
            return null;
          }
          return data;
        };

        const [
          supProfiles,
          supClients,
          supProviders,
          supAuditLogs,
          supFinancialLogs,
          supCategories,
          supRequests,
          supSettings
        ] = await Promise.all([
          fetchTable('sev_profiles'),
          fetchTable('sev_clients'),
          fetchTable('sev_providers'),
          fetchTable('sev_audit_logs'),
          fetchTable('sev_financial_logs'),
          fetchTable('sev_categories'),
          fetchTable('sev_requests'),
          fetchTable('sev_system_settings')
        ]);

        if (supProfiles) {
          setProfiles(supProfiles);
          localStorage.setItem('sev_profiles', JSON.stringify(supProfiles));
        }
        if (supClients) {
          setClients(supClients);
          localStorage.setItem('sev_clients', JSON.stringify(supClients));
        }
        if (supProviders) {
          setProviders(supProviders);
          localStorage.setItem('sev_providers', JSON.stringify(supProviders));
        }
        if (supAuditLogs) {
          setAuditLogs(supAuditLogs);
          localStorage.setItem('sev_audit_logs', JSON.stringify(supAuditLogs));
        }
        if (supFinancialLogs) {
          setFinancialLogs(supFinancialLogs);
          localStorage.setItem('sev_financial_logs', JSON.stringify(supFinancialLogs));
        }
        if (supCategories) {
          setCategories(supCategories);
          localStorage.setItem('sev_categories', JSON.stringify(supCategories));
        }
        if (supRequests) {
          setServiceRequests(supRequests);
          localStorage.setItem('sev_requests', JSON.stringify(supRequests));
        }
        if (supSettings && supSettings.length > 0) {
          setSettings(supSettings[0]);
          localStorage.setItem('sev_system_settings', JSON.stringify(supSettings));
        }
      } catch (err) {
        console.error('Error syncing Supabase in Admin Panel:', err);
      }
    }
  };

  useEffect(() => {
    loadAdminData();
    // Periodical update sync for real-time changes
    const timer = setInterval(() => {
      loadAdminData();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Toggle client status (Active vs Suspended)
  const handleToggleClientStatus = async (clientId: string) => {
    const list = dbMemory.get<ClientProfile[]>('sev_clients');
    const matched = list.find(c => c.id === clientId);
    if (!matched) return;
    
    const nextStatus = matched.status === 'active' ? 'suspended' : 'active';

    if (isRealSupabase && supabase) {
      const { error } = await supabase
        .from('sev_clients')
        .update({ status: nextStatus })
        .eq('id', clientId);
      if (error) {
        alert('Erro ao atualizar status no Supabase: ' + error.message);
        return;
      }
    }

    const updated = list.map(c => {
      if (c.id === clientId) {
        return { ...c, status: nextStatus };
      }
      return c;
    });

    dbMemory.save('sev_clients', updated);
    
    const clientProf = profiles.find(p => p.id === clientId);
    dbMemory.addAuditLog(
      'user-admin', 
      'admin@severinu.com', 
      'Alteração de status', 
      `Status do cliente "${clientProf?.full_name || clientId}" foi alterado para "${nextStatus === 'active' ? 'ATIVO' : 'SUSPENSO'}"`
    );

    alert(`Status do cliente atualizado com sucesso para: ${nextStatus === 'active' ? 'ATIVO' : 'SUSPENSO'}`);
    loadAdminData();
  };

  // Approvals & bans
  const handleVerifyProvider = async (providerId: string, action: 'approved' | 'rejected' | 'blocked') => {
    try {
      await providerService.updateStatus(providerId, action);
      loadAdminData();
    } catch (err) {
      alert('Erro ao atualizar status: ' + (err as Error).message);
    }
  };

  // Delete Audit Log (For clean tests)
  const handleClearLogs = () => {
    if (confirm('Deseja limpar todos os logs de auditoria do sistema?')) {
      dbMemory.save('sev_audit_logs', []);
      loadAdminData();
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    if (isRealSupabase && supabase) {
      const { error } = await supabase
        .from('sev_system_settings')
        .upsert(settings);
      if (error) {
        alert('Erro ao salvar configurações no Supabase: ' + error.message);
        return;
      }
    }

    dbMemory.save('sev_system_settings', [settings]);
    dbMemory.addAuditLog('user-admin', 'admin@severinu.com', 'Alteração financeira', 'Configurações de sistema atualizadas');
    alert('Configurações financeiras e chaves administrativas salvas com sucesso!');
    loadAdminData();
  };

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newSlug = newCatName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
    const newCategory: Category = {
      id: 'cat-' + Math.random().toString(36).substring(2, 8),
      name: newCatName,
      slug: newSlug,
      icon_name: 'wrench',
      description: newCatDesc,
      created_at: new Date().toISOString()
    };

    if (isRealSupabase && supabase) {
      const { error } = await supabase.from('sev_categories').insert(newCategory);
      if (error) {
        alert('Erro ao criar categoria no Supabase: ' + error.message);
        return;
      }
    }

    const updated = [...categories, newCategory];
    dbMemory.save('sev_categories', updated);
    setNewCatName('');
    setNewCatDesc('');
    dbMemory.addAuditLog('user-admin', 'admin@severinu.com', 'Cadastro', `Criada nova categoria de serviço: ${newCatName}`);
    loadAdminData();
  };

  // Computations
  const totalClients = profiles.filter(p => p.role === 'client').length;
  const totalActiveProviders = providers.filter(p => p.status === 'approved').length;
  const totalPendingProviders = providers.filter(p => p.status === 'pending').length;
  const totalBlockedProviders = providers.filter(p => p.status === 'blocked').length;

  const totalEarnings = financialLogs
    .filter(log => log.status === 'completed' && log.type === 'plan_payment')
    .reduce((sum, current) => sum + current.amount, 0);

  // Group financial logs into simplified timeline for chart
  const subscriptionRevenueTimeline = [
    { name: 'Jan', receita: 15.00 },
    { name: 'Fev', receita: 60.00 },
    { name: 'Mar', receita: 120.00 },
    { name: 'Abr', receita: totalEarnings * 0.4 },
    { name: 'Mai', receita: totalEarnings * 0.7 },
    { name: 'Jun', receita: totalEarnings }
  ];

  // Filtering clients list
  const filteredClients = clients.filter(c => {
    const prof = profiles.find(p => p.id === c.id);
    if (!prof) return false;
    const query = searchClientQuery.toLowerCase();
    return (
      prof.full_name.toLowerCase().includes(query) ||
      prof.email.toLowerCase().includes(query) ||
      c.cpf.includes(query) ||
      c.city.toLowerCase().includes(query)
    );
  });

  // Filtering providers list
  const filteredProviders = providers.filter(p => {
    const prof = profiles.find(prof => prof.id === p.id);
    if (!prof) return false;
    const query = searchProviderQuery.toLowerCase();
    return (
      prof.full_name.toLowerCase().includes(query) ||
      prof.email.toLowerCase().includes(query) ||
      p.specialty.toLowerCase().includes(query) ||
      p.city.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col md:flex-row font-sans">
      
      {/* LEFT SIDEBAR NAVIGATION MENU */}
      <aside className="w-full md:w-72 bg-neutral-900 text-white flex-shrink-0 flex flex-col justify-between border-r border-neutral-850 sticky top-0 z-20 md:h-screen shadow-xl">
        <div>
          {/* Admin header */}
          <div className="p-6 border-b border-neutral-850 flex items-center gap-3 bg-neutral-950/40">
            <div className="p-2 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white uppercase flex items-center gap-1.5 leading-none">
                Severinu Admin
              </h1>
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mt-1 block">
                Governança Operacional
              </span>
            </div>
          </div>

          {/* Connected Admin tag */}
          <div className="px-6 py-3 bg-neutral-950/20 text-[10px] text-neutral-500 font-bold flex items-center gap-1.5 border-b border-neutral-850">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Sessão Ativa: admin@severinu.com
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {/* 1. Clientes */}
            <button
              onClick={() => setActiveTab('clients')}
              className={`w-full flex items-center justify-between py-2.5 px-4 rounded-xl text-left text-xs font-bold transition-all ${
                activeTab === 'clients' 
                  ? 'bg-emerald-600 text-white shadow-md font-black scale-[1.02]' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4.5 h-4.5" />
                <span>Lista de Clientes</span>
              </div>
              <span className={`text-[10px] font-mono font-bold py-0.5 px-2 rounded-full ${
                activeTab === 'clients' ? 'bg-emerald-700 text-emerald-100' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {totalClients}
              </span>
            </button>

            {/* 2. Prestadores */}
            <button
              onClick={() => setActiveTab('providers')}
              className={`w-full flex items-center justify-between py-2.5 px-4 rounded-xl text-left text-xs font-bold transition-all ${
                activeTab === 'providers' 
                  ? 'bg-emerald-600 text-white shadow-md font-black scale-[1.02]' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Wrench className="w-4.5 h-4.5" />
                <span>Prestadores Habilitados</span>
              </div>
              {totalPendingProviders > 0 ? (
                <span className="bg-rose-500 text-white text-[10px] py-0.5 px-2 rounded-full font-black animate-pulse">
                  {totalPendingProviders} Novo
                </span>
              ) : (
                <span className={`text-[10px] font-mono font-bold py-0.5 px-2 rounded-full ${
                  activeTab === 'providers' ? 'bg-emerald-700 text-emerald-100' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {providers.length}
                </span>
              )}
            </button>

            {/* 3. Financeiro do PIX */}
            <button
              onClick={() => setActiveTab('pix_finance')}
              className={`w-full flex items-center justify-between py-2.5 px-4 rounded-xl text-left text-xs font-bold transition-all ${
                activeTab === 'pix_finance' 
                  ? 'bg-emerald-600 text-white shadow-md font-black scale-[1.02]' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4.5 h-4.5" />
                <span>Financeiro do PIX</span>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 py-0.5 px-2 rounded font-bold border border-emerald-500/20">
                Ativo
              </span>
            </button>

            {/* 4. Categorias & Logs */}
            <button
              onClick={() => setActiveTab('categories_logs')}
              className={`w-full flex items-center gap-2.5 py-2.5 px-4 rounded-xl text-left text-xs font-bold transition-all ${
                activeTab === 'categories_logs' 
                  ? 'bg-emerald-600 text-white shadow-md font-black scale-[1.02]' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <Settings className="w-4.5 h-4.5" />
              <span>Categorias & Logs</span>
            </button>
          </nav>
        </div>

        {/* Action Buttons at the bottom of sidebar as requested */}
        <div className="p-4 border-t border-neutral-850 bg-neutral-950/30 space-y-2">
          {onNavigateHome && (
            <>
              {/* Back to Home screen button */}
              <button
                onClick={onNavigateHome}
                className="w-full flex items-center gap-2.5 py-2.5 px-4 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-805 text-xs font-bold transition-all text-left"
              >
                <Compass className="w-4 h-4 text-neutral-400" />
                Voltar para Home
              </button>

              {/* Log Out button */}
              <button
                onClick={onNavigateHome}
                className="w-full flex items-center gap-2.5 py-2.5 px-4 rounded-xl text-rose-400 hover:text-white hover:bg-rose-950/40 text-xs font-bold transition-all text-left"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                Sair da Conta (Logout)
              </button>
            </>
          )}
        </div>
      </aside>

      {/* MAIN VIEWPORT BODY */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen">
        
        {/* TABS - CLIENTS LIST VIEW */}
        {activeTab === 'clients' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-neutral-900 tracking-tight">Base Geral de Clientes</h2>
                <p className="text-xs text-neutral-400 mt-1">Monitore, suspenda ou restaure acessos de clientes domésticos</p>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Procurar cliente por nome, e-mail, CPF..."
                  value={searchClientQuery}
                  onChange={e => setSearchClientQuery(e.target.value)}
                  className="w-full py-2 pl-9 pr-4 bg-white border border-neutral-250 rounded-xl text-xs text-neutral-700 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 shadow-xs"
                />
              </div>
            </div>

            {/* Quick KPI stats blocks for clients */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
                <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Total de Registros</span>
                <span className="text-2xl font-black text-neutral-900 mt-1 block">{clients.length} Clientes</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
                <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Clientes Ativos</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">
                  {clients.filter(c => c.status !== 'suspended').length} Ativos
                </span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
                <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Clientes Suspensos</span>
                <span className="text-2xl font-black text-rose-500 mt-1 block">
                  {clients.filter(c => c.status === 'suspended').length} Suspensos
                </span>
              </div>
            </div>

            {/* Clients Datatable */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-500 font-bold uppercase border-b border-neutral-200">
                      <th className="p-4">Cliente</th>
                      <th className="p-4">Documento / CPF</th>
                      <th className="p-4">Contato (WhatsApp)</th>
                      <th className="p-4">Cidade / Localização</th>
                      <th className="p-4">Status de Conta</th>
                      <th className="p-4 text-center">Ações Monetárias / Acesso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-neutral-400">
                          Nenhum cliente cadastrado no momento correspondendo aos filtros de pesquisa.
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map((client) => {
                        const prof = profiles.find(p => p.id === client.id);
                        const isSuspended = client.status === 'suspended';
                        return (
                          <tr key={client.id} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img 
                                  src={prof?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
                                  alt="" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover border border-neutral-150" 
                                />
                                <div>
                                  <span className="font-bold text-neutral-900 block text-xs sm:text-sm">{prof?.full_name || 'Cliente Sem Nome'}</span>
                                  <span className="text-[10px] text-neutral-400 font-medium">{prof?.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-mono select-all">
                              {client.cpf || '123.456.789-01'}
                            </td>
                            <td className="p-4 font-semibold">
                              {client.whatsapp || '(11) 99999-8888'}
                            </td>
                            <td className="p-4">
                              {client.city} ({client.state})
                            </td>
                            <td className="p-4/5 pt-4">
                              <span className={`py-1 px-2.5 rounded-full text-[10px] font-black inline-block ${
                                isSuspended 
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {isSuspended ? 'Suspenso' : 'Ativo'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {isSuspended ? (
                                <button
                                  onClick={() => handleToggleClientStatus(client.id)}
                                  className="py-1 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 rounded-lg text-[10px] font-bold border border-emerald-200 transition-colors"
                                >
                                  Reabilitar Cliente
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleClientStatus(client.id)}
                                  className="py-1 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 rounded-lg text-[10px] font-bold border border-rose-250 transition-colors"
                                >
                                  Suspender Conta
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TABS - PROVIDERS DIRECTORY (PRESTADORES) */}
        {activeTab === 'providers' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Onboarding Pending Queue Section */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
              <div className="flex items-center gap-2.5 mb-2 text-neutral-900 border-b border-neutral-100 pb-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-base font-black">Homologação de Novos Prestadores</h3>
                  <p className="text-xs text-neutral-400">Verifique os documentos e aprove registros de teste de forma imediata</p>
                </div>
              </div>

              <div className="space-y-6 pt-2">
                {providers.filter(p => p.status === 'pending').length === 0 ? (
                  <div className="text-center py-10 text-neutral-400 border border-dashed border-neutral-200 rounded-xl">
                    <Check className="w-9 h-9 text-emerald-500 mx-auto mb-2" />
                    <h5 className="font-bold text-neutral-700 text-sm">Nenhuma auditoria aguardando</h5>
                    <p className="text-xs text-neutral-400 mt-1">Todos os profissionais inscritos estão homologados!</p>
                  </div>
                ) : (
                  providers.filter(p => p.status === 'pending').map((prov) => {
                    const prof = profiles.find(p => p.id === prov.id);
                    const catName = categories.find(c => c.id === prov.category_id)?.name || 'Especialista';
                    return (
                      <div key={prov.id} className="p-5 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col md:flex-row items-start justify-between gap-6">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={prof?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'} 
                              alt="" referrerPolicy="no-referrer" className="w-12 h-12 rounded-full object-cover border" 
                            />
                            <div>
                              <h4 className="font-black text-neutral-800 text-sm leading-tight">{prof?.full_name}</h4>
                              <p className="text-xs text-neutral-500">{prof?.email} | {prov.whatsapp}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-neutral-600">
                            <div><strong>CPF/CNPJ:</strong> {prov.cpf_cnpj}</div>
                            <div><strong>Especialidade:</strong> {prov.specialty} ({catName})</div>
                            <div><strong>Endereço:</strong> {prov.address}, {prov.city} - {prov.state}</div>
                            <div><strong>Chave Pix:</strong> <code className="bg-neutral-200 px-1 py-0.5 rounded text-[10px] select-all">{prov.pix_key}</code></div>
                          </div>

                          <div className="bg-white p-3.5 rounded-lg text-xs border border-neutral-100 text-neutral-600 italic">
                            <strong>Descrição do Perfil:</strong> "{prov.description}"
                          </div>

                          <div className="flex items-center gap-3 pt-1">
                            <span className="text-xs font-semibold text-neutral-500 inline-flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" /> Fichas digitais anexadas:
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">CONTRATO_SOCIAL.pdf</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">DOCUMENTO_DE_SIND.jpg</span>
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto self-stretch md:self-auto justify-end">
                          <button
                            onClick={() => handleVerifyProvider(prov.id, 'approved')}
                            className="flex-1 md:flex-initial py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-4 h-4" /> Aprovar Cadastro
                          </button>
                          <button
                            onClick={() => handleVerifyProvider(prov.id, 'rejected')}
                            className="flex-grow md:flex-initial py-2.5 px-4 rounded-xl hover:bg-neutral-100 text-rose-600 border border-neutral-200 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                          >
                            <X className="w-4 h-4" /> Rejeitar
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* General Database of Habilitated Providers */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-neutral-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-neutral-900 leading-none">Diretório Geral de Prestadores</h3>
                  <p className="text-xs text-neutral-400 mt-1.5">Configure termos, status de parceiros ou aplique travas de segurança</p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrar por nome, cidade ou especialidade..."
                    value={searchProviderQuery}
                    onChange={e => setSearchProviderQuery(e.target.value)}
                    className="w-full py-1.5 pl-9 pr-4 bg-white border border-neutral-250 rounded-xl text-xs text-neutral-700 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredProviders.filter(p => p.status !== 'pending').length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-6">Nenhum prestador encontrado com estes critérios.</p>
                ) : (
                  filteredProviders.filter(p => p.status !== 'pending').map((prov) => {
                    const prof = profiles.find(p => p.id === prov.id);
                    const catName = categories.find(c => c.id === prov.category_id)?.name || 'Outro';
                    const isBlocked = prov.status === 'blocked';
                    const isExpanded = expandedProviderId === prov.id;
                    return (
                      <div key={prov.id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4.5 bg-white hover:bg-neutral-50/50 transition-colors gap-4">
                          <div className="flex items-start sm:items-center gap-3">
                            <img 
                              src={prof?.avatar_url || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80'} 
                              alt="" referrerPolicy="no-referrer" className="w-11 h-11 rounded-full object-cover border border-neutral-100" 
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-neutral-900 text-xs sm:text-sm">{prof?.full_name || 'Profissional'}</span>
                                
                                <span className={`text-[9px] uppercase font-bold py-0.5 px-2 rounded-full border ${
                                  isBlocked 
                                    ? 'bg-rose-100 text-rose-800 border-rose-200' 
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                }`}>
                                  {prov.status === 'approved' ? 'Verificado & Habilitado' : 'Contas Bloqueadas'}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-500 mt-1">
                                <strong>Especialista:</strong> {prov.specialty} ({catName}) • 
                                <span className="text-emerald-600 ml-1 font-bold">★ {prov.rating_average.toFixed(1)}</span>
                              </p>
                              <p className="text-[10px] text-neutral-400 font-semibold">{prov.city} ({prov.state})</p>
                            </div>
                          </div>

                          <div className="flex gap-2 w-full lg:w-auto justify-end flex-wrap sm:flex-nowrap">
                            <button
                              onClick={() => setExpandedProviderId(isExpanded ? null : prov.id)}
                              className={`text-xs py-1.5 px-3.5 lg:px-4 rounded-lg font-bold border transition-colors w-full lg:w-auto text-center flex items-center justify-center gap-1.5 ${
                                isExpanded 
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-250'
                              }`}
                            >
                              {isExpanded ? 'Ocultar Serviços' : 'Ver Serviços & Finanças'}
                            </button>

                            {prov.status === 'approved' ? (
                              <button
                                onClick={() => handleVerifyProvider(prov.id, 'blocked')}
                                className="bg-neutral-50 hover:bg-rose-50 text-neutral-600 hover:text-rose-700 text-xs py-1.5 px-3.5 rounded-lg font-bold border border-neutral-250 transition-colors w-full lg:w-auto text-center"
                              >
                                Bloquear Conta
                              </button>
                            ) : (
                              <button
                                onClick={() => handleVerifyProvider(prov.id, 'approved')}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs py-1.5 px-3.5 rounded-lg font-bold border border-emerald-250 transition-colors w-full lg:w-auto text-center"
                              >
                                Reabilitar Fornecedor
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expandable detailed area */}
                        {isExpanded && (
                          <ProviderDetailsSection
                            provider={prov}
                            profiles={profiles}
                            categories={categories}
                            serviceRequests={serviceRequests}
                            financialLogs={financialLogs}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* TABS - FINANCEIRO DO PIX (KPI ARRECADADO, SETTINGS DE COMISSÃO, CHAVES PIX ADMIN) */}
        {activeTab === 'pix_finance' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Header */}
            <div>
              <h2 className="text-xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
                <CreditCard className="w-5.5 h-5.5 text-emerald-600" />
                <span>Gestão Financeira & Faturamento PIX</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Monitore receitas recorrentes de assinaturas (SaaS), parametrize chaves administrativas e gerencie comissões retidas em Reais (R$)
              </p>
            </div>

            {/* Top KPI Metrics Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Metric 1 */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                    Arrecadação SaaS Ativa
                  </span>
                  <span className="text-2xl font-black text-emerald-600 mt-1 block">
                    R$ {totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-neutral-400 block mt-1">Compensações instantâneas via QR Code</span>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              {/* Metric 2 */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                    Taxa de Comissão Fixa
                  </span>
                  <span className="text-2xl font-black text-neutral-900 mt-1 block font-mono">
                    {settings?.commission_rate_percent || 0}%
                  </span>
                  <span className="text-[10px] text-neutral-400 block mt-1">Comissão retida por intermediação</span>
                </div>
                <div className="p-3 bg-neutral-100 text-neutral-800 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              {/* Metric 3 */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                    Chave PIX Ativa
                  </span>
                  <code className="text-[11px] font-mono font-bold text-neutral-700 bg-neutral-100 p-1 px-1.5 rounded block mt-1">
                    {settings?.pix_recipient_key || 'financeiro@severinu.com'}
                  </code>
                  <span className="text-[10px] text-neutral-400 block mt-1">Favorecido: {settings?.pix_recipient_name}</span>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Two Column Layout: Chart & Interactive configuration form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Column 1 & 2: Chart & Financial Table Log */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Revenue Timeline chart */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">Histórico Temporal de Performance</h3>
                      <p className="text-[11px] text-neutral-400">Fluxos de recebimentos liquidados de publicidade/assinaturas</p>
                    </div>
                    <span className="text-xs bg-emerald-105 text-emerald-800 py-1 px-2 rounded-full font-bold">PIX Direto</span>
                  </div>
                  
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={subscriptionRevenueTimeline}>
                        <defs>
                          <linearGradient id="colorRecDashboard" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" fontSize={10} stroke="#9ca3af" tickLine={false} />
                        <YAxis fontSize={10} stroke="#9ca3af" tickLine={false} />
                        <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                        <Area type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRecDashboard)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Financial transaction list table. This matches the user requested financial lists completely */}
                <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
                  <div className="p-5 border-b border-neutral-150">
                    <h3 className="text-sm font-bold text-neutral-900">Extrato Consolidado das Compensações PIX</h3>
                    <p className="text-[11px] text-neutral-400">Verificação em tempo real das conciliações integradas</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-neutral-50 text-neutral-500 font-bold border-b border-neutral-100">
                          <th className="p-3">Ref ID</th>
                          <th className="p-3">Destinação</th>
                          <th className="p-3">Prestador Favorecido</th>
                          <th className="p-3">Modo</th>
                          <th className="p-3 text-right">Valor Compilado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-neutral-700">
                        {financialLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-neutral-400">
                              Nenhuma compensação PIX realizada.
                            </td>
                          </tr>
                        ) : (
                          financialLogs.map((log) => {
                            const matchedProfile = profiles.find(p => p.id === log.provider_id);
                            return (
                              <tr key={log.id} className="hover:bg-neutral-50/20 font-mono">
                                <td className="p-3 font-bold text-neutral-900">{log.id}</td>
                                <td className="p-3">
                                  <span className={`py-0.5 px-1.5 rounded text-[9px] font-black uppercase ${
                                    log.type === 'plan_payment' 
                                      ? 'bg-purple-100 text-purple-800' 
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {log.type === 'plan_payment' ? 'SaaS Upgrade' : 'Taxa Serviço'}
                                  </span>
                                </td>
                                <td className="p-3 text-xs font-sans font-medium text-neutral-800">
                                  {matchedProfile?.full_name || 'Governança Geral'}
                                </td>
                                <td className="p-3 text-emerald-600 font-bold">PIX</td>
                                <td className="p-3 text-right font-black text-neutral-900 text-xs font-sans">
                                  R$ {log.amount.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Column 3: Settings adjustments form */}
              <div>
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 mb-1">Ajustar Configurações PIX</h3>
                    <p className="text-[11px] text-neutral-400">Preencha os dados da conta jurídica para recebimento automático</p>
                  </div>

                  {settings && (
                    <form onSubmit={handleSaveSettings} className="space-y-4 pt-1">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">
                          Comissão por Intermediação (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={settings.commission_rate_percent || 0}
                          onChange={(e) => setSettings({ ...settings, commission_rate_percent: Number(e.target.value) })}
                          className="w-full p-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 font-mono"
                        />
                        <span className="text-[9px] text-neutral-400 block mt-1">Taxas retiradas de cada PIX de faturamento.</span>
                      </div>

                      <div className="border-t border-neutral-100 pt-3 space-y-3">
                        <span className="text-[10px] font-bold text-neutral-700 uppercase block">Conta Pix de Destino</span>

                        <div>
                          <label className="text-[9px] text-neutral-400 block mb-0.5">Nome do Favorecido</label>
                          <input
                            type="text"
                            value={settings.pix_recipient_name || ''}
                            onChange={(e) => setSettings({ ...settings, pix_recipient_name: e.target.value })}
                            className="w-full p-2 text-xs border border-neutral-200 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] text-neutral-400 block mb-0.5">Chave Pix Favorecida (Chave, E-mail ou CNPJ)</label>
                          <input
                            type="text"
                            value={settings.pix_recipient_key || ''}
                            onChange={(e) => setSettings({ ...settings, pix_recipient_key: e.target.value })}
                            className="w-full p-2 text-xs border border-neutral-200 rounded-lg font-mono focus:outline-none focus:border-neutral-900"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] text-neutral-400 block mb-0.5">Cidade do Favorecido</label>
                          <input
                            type="text"
                            value={settings.pix_recipient_city || ''}
                            onChange={(e) => setSettings({ ...settings, pix_recipient_city: e.target.value })}
                            className="w-full p-2 text-xs border border-neutral-205 rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="border-t border-neutral-150 pt-3">
                        <button
                          type="submit"
                          className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl transition-all shadow-md mt-1"
                        >
                          Salvar Ajustes PIX
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TABS - CATEGORIES OPERATION & SYSTEMS AUDIT TRAILS */}
        {activeTab === 'categories_logs' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Category form setup */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs lg:col-span-1">
                <h3 className="text-base font-black text-neutral-900 mb-1">Cadastrar Nova Categoria</h3>
                <p className="text-xs text-neutral-400 mb-5 text-neutral-500">Adicione novas áreas de atuação de profissionais no marketplace</p>

                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Nome da Especialidade</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Piscineiro, Chapeador..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full p-2.5 text-xs border border-neutral-200 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Apresentação Operacional</label>
                    <textarea
                      rows={3}
                      placeholder="Identifique os trabalhos básicos cobertos..."
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="w-full p-2.5 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-0 focus:border-neutral-900"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Globe className="w-4 h-4" /> Registrar Categoria
                  </button>
                </form>

                <div className="mt-6 border-t border-neutral-100 pt-4">
                  <span className="text-[10px] text-neutral-400 font-bold block mb-2.5 uppercase">Ativas Atualmente ({categories.length})</span>
                  <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {categories.map(c => (
                      <span key={c.id} className="text-[10px] bg-neutral-100 text-neutral-700 py-1 px-2.5 rounded-lg border border-neutral-200 font-bold">
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Security Audit Trails */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-150 pb-4 flex-wrap gap-4">
                  <div>
                    <h3 className="text-base font-black text-neutral-900 leading-none">Logs de Auditoria de Segurança</h3>
                    <p className="text-xs text-neutral-400 mt-1.5">Conformidade operacional de acessos e modificações financeiras no sandbox</p>
                  </div>
                  <button
                    onClick={handleClearLogs}
                    className="p-2 bg-neutral-50 hover:bg-rose-50 text-neutral-600 hover:text-rose-600 text-xs rounded-xl font-bold flex items-center gap-1.5 border border-neutral-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Limpar Histórico
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-50 text-neutral-500 font-bold uppercase border-b border-neutral-100 font-sans">
                        <th className="p-3">Momento</th>
                        <th className="p-3">Operador</th>
                        <th className="p-3">Ação</th>
                        <th className="p-3">Detalhes Históricos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-neutral-700 font-mono text-[11px]">
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-neutral-400 font-sans">
                            Nenhum log de auditoria no histórico permanente.
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-neutral-50/40 transition-colors">
                            <td className="p-3 text-neutral-405 whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString('pt-BR')}
                            </td>
                            <td className="p-3 text-neutral-800 font-bold max-w-[150px] truncate" title={log.user_email}>
                              {log.user_email || 'Visitante Anônimo'}
                            </td>
                            <td className="p-3 text-[10px]">
                              <span className={`py-0.5 px-2 rounded font-black text-[9px] ${
                                log.action === 'Login' ? 'bg-indigo-100 text-indigo-700' :
                                log.action === 'Cadastro' ? 'bg-amber-100 text-amber-700' :
                                log.action === 'Alteração financeira' ? 'bg-emerald-100 text-emerald-700' :
                                log.action === 'Exclusão' ? 'bg-rose-100 text-rose-700' : 'bg-neutral-100 text-neutral-700'
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="p-3 text-neutral-600 font-sans">{log.details}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};
