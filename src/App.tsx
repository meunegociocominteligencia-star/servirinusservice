import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Users, Wrench, Shield, Star, Award, 
  LogIn, ChevronRight, Clock, Phone, ArrowUpRight, 
  CheckCircle, Upload, ArrowRight, ClipboardList, LogOut, Check
} from 'lucide-react';
import { 
  Profile, ProviderProfile, Category, ClientProfile 
} from './types';
import { 
  dbMemory, authService, providerService, isRealSupabase 
} from './supabase-service';
import { ClientDashboard } from './components/ClientDashboard';
import { ProviderDashboard } from './components/ProviderDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AIAssistantChatbot } from './components/AIAssistantChatbot';
import { SupabaseDiagnosticsPanel } from './components/SupabaseDiagnosticsPanel';

export default function App() {
  // Global User Session states
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  
  // Database states
  const [categories, setCategories] = useState<Category[]>([]);
  const [approvedProviders, setApprovedProviders] = useState<ProviderProfile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  
  // Navigation & Search states
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  
  // Active details modal
  const [selectedProviderDetailId, setSelectedProviderDetailId] = useState<string | null>(null);

  // Authentication Modals states
  const [authModal, setAuthModal] = useState<'login' | 'registerClient' | 'registerProvider' | null>(null);
  
  // Sign-In credentials form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Registration Forms Fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCpfCnpj, setRegCpfCnpj] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('');
  const [regPostalCode, setRegPostalCode] = useState('');
  const [regPassword, setRegPassword] = useState('');
  
  // Specific Client Sign-Up Fields
  const [regBirthDate, setRegBirthDate] = useState('');

  // Specific Provider Sign-Up Fields
  const [regCategoryId, setRegCategoryId] = useState('');
  const [regSpecialty, setRegSpecialty] = useState('');
  const [regDescription, setRegDescription] = useState('');
  const [regPixKey, setRegPixKey] = useState('');

  // Loading indicator
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refresh data functions
  const handleRefreshData = async () => {
    setCategories(dbMemory.get<Category[]>('sev_categories'));
    setProfiles(dbMemory.get<Profile[]>('sev_profiles'));
    
    // Refresh approved list
    const approved = await providerService.listApproved();
    setApprovedProviders(approved);

    // Get currentUser
    setCurrentUser(dbMemory.getCurrentUser());
  };

  useEffect(() => {
    handleRefreshData();
    
    const handleSyncEvent = () => {
      console.log('React detected Firestore database sync, refreshing state...');
      handleRefreshData();
    };

    window.addEventListener('sev_db_synced', handleSyncEvent);

    // Constant updates in storage
    const timer = setInterval(() => {
      setProfiles(dbMemory.get<Profile[]>('sev_profiles'));
      setCurrentUser(dbMemory.getCurrentUser());
    }, 3000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('sev_db_synced', handleSyncEvent);
    };
  }, []);

  // Fast demo switcher (Super friendly feature for AI Studio reviewer testing!)
  const handleFastLogin = (email: string) => {
    try {
      const match = dbMemory.get<Profile[]>('sev_profiles').find(p => p.email === email);
      if (match) {
        dbMemory.setCurrentUser(match);
        setCurrentUser(match);
        setAuthModal(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    dbMemory.setCurrentUser(null);
    setCurrentUser(null);
  };

  // Submit sign-in action
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;

    setIsSubmitting(true);
    try {
      const profile = await authService.login(loginEmail.trim(), loginPassword);
      setCurrentUser(profile);
      setLoginEmail('');
      setLoginPassword('');
      setAuthModal(null);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Client Registration Action
  const handleRegisterClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regCpfCnpj.trim() || !regBirthDate || !regPhone.trim()) {
      alert('Preencha os campos obrigatórios identificados.');
      return;
    }

    setIsSubmitting(true);
    try {
      const profile = await authService.registerClient({
        fullName: regName,
        email: regEmail,
        cpf: regCpfCnpj,
        birthDate: regBirthDate,
        whatsapp: regPhone,
        address: regAddress || 'Endereço Padrão',
        city: regCity || 'São Paulo',
        state: regState || 'SP',
        postalCode: regPostalCode || '01000-000',
        password: regPassword || '123456'
      });

      dbMemory.setCurrentUser(profile);
      setCurrentUser(profile);
      clearRegisterFields();
      setAuthModal(null);
      alert('Cadastro de cliente concluído com sucesso!');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Provider Registration Action
  const handleRegisterProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regCpfCnpj.trim() || !regCategoryId || !regSpecialty.trim() || !regPixKey.trim()) {
      alert('Preencha os campos obrigatórios da inscrição do profissional.');
      return;
    }

    setIsSubmitting(true);
    try {
      const profile = await authService.registerProvider({
        fullName: regName,
        email: regEmail,
        cpfCnpj: regCpfCnpj,
        whatsapp: regPhone,
        address: regAddress || 'Alameda Paulista',
        city: regCity || 'São Paulo',
        state: regState || 'SP',
        postalCode: regPostalCode || '01000-000',
        categoryId: regCategoryId,
        specialty: regSpecialty,
        description: regDescription,
        pixKey: regPixKey,
        password: regPassword || '123456'
      });

      // Quick auto-login for testing (starts pending!)
      dbMemory.setCurrentUser(profile);
      setCurrentUser(profile);
      clearRegisterFields();
      setAuthModal(null);
      alert('Inscrição efetuada com sucesso! Seu perfil foi encaminhado para a fila de verificação de documentos. Veja em instantes na aba de Administrador para ativá-lo.');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearRegisterFields = () => {
    setRegName('');
    setRegEmail('');
    setRegCpfCnpj('');
    setRegPhone('');
    setRegAddress('');
    setRegCity('');
    setRegState('');
    setRegPostalCode('');
    setRegBirthDate('');
    setRegCategoryId('');
    setRegSpecialty('');
    setRegDescription('');
    setRegPixKey('');
    setRegPassword('');
  };

  // Filter approved list according to inputs
  const filteredProviders = approvedProviders.filter((prov) => {
    const prof = profiles.find(p => p.id === prov.id);
    if (!prof) return false;

    // Search query match
    const matchesSearch = searchQuery 
      ? (prof.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         prov.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
         prov.description.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    // Category slug match
    const categoryDetail = categories.find(c => c.id === prov.category_id);
    const matchesCategory = selectedCategorySlug 
      ? categoryDetail?.slug === selectedCategorySlug
      : true;

    // City match
    const matchesCity = cityFilter
      ? prov.city.toLowerCase().includes(cityFilter.toLowerCase())
      : true;

    return matchesSearch && matchesCategory && matchesCity;
  });

  const selectedProviderDetail = approvedProviders.find(p => p.id === selectedProviderDetailId);
  const selectedProviderProfile = selectedProviderDetail ? profiles.find(p => p.id === selectedProviderDetail.id) : null;

  // Header and layout transitions
  if (currentUser) {
    return (
      <div className="min-h-screen bg-white text-neutral-800 font-sans flex flex-col selection:bg-emerald-100">
        <SupabaseDiagnosticsPanel />
        {currentUser.role === 'client' && (
          <ClientDashboard 
            currentUser={currentUser} 
            onNavigateHome={() => handleLogout()} 
          />
        )}
        {currentUser.role === 'provider' && (
          <ProviderDashboard 
            currentUser={currentUser} 
            onNavigateHome={() => handleLogout()} 
          />
        )}
        {currentUser.role === 'admin' && (
          <AdminDashboard onNavigateHome={handleLogout} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-800 font-sans flex flex-col selection:bg-emerald-100">
      
      {/* Supabase Cloud Connection Diagnostics Indicator */}
      <SupabaseDiagnosticsPanel />
      
      {/* Navigation Menu header */}
      <nav className="bg-white border-b border-neutral-100 py-4 px-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setSelectedCategorySlug(null)}>
            <div className="w-9 h-9 bg-neutral-900 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-xs">
              S
            </div>
            <div>
              <h1 className="text-sm font-black text-neutral-900 tracking-tight leading-none">Severinu Service</h1>
              <p className="text-[9px] text-neutral-400 font-bold">MARKETPLACE DE SERVIÇOS</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-neutral-500">
            <a href="#como-funciona" className="hover:text-black">Como Funciona</a>
            <a href="#categorias" className="hover:text-black">Categorias Disponíveis</a>
            <a href="#prestadores" className="hover:text-black">Profissionais de Destaque</a>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
            <button
              onClick={() => setAuthModal('login')}
              className="py-2.5 px-4 rounded-xl border border-neutral-200 text-neutral-700 hover:text-neutral-900 text-xs font-bold transition-all flex items-center gap-1 active:scale-95 whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" /> Entrar
            </button>
            <button
              onClick={() => setAuthModal('registerProvider')}
              className="py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all active:scale-95 whitespace-nowrap shadow-xs"
            >
              Quero Ser Prestador
            </button>
          </div>
        </div>
      </nav>

      {/* Hero section banner */}
      <section className="bg-linear-to-b from-neutral-50 to-white pt-16 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-1.5 py-1 px-3 bg-neutral-100 rounded-full text-xs font-semibold text-neutral-600 mb-2">
            <Wrench className="w-3.5 h-3.5" /> Plataforma Completa de Assistência Residencial
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-neutral-900 leading-tight tracking-tight">
            Encontre profissionais qualificados para <span className="text-emerald-600">qualquer tipo</span> de serviço rápido!
          </h2>

          <p className="text-sm sm:text-base text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Contrate pintores, eletricistas, diaristas, pedreiros e técnicos de informática com segurança contratual, chat em tempo real e pagamento PIX descomplicado.
          </p>

          {/* Landing page Multi-field search widget */}
          <div className="max-w-2xl mx-auto bg-white p-2.5 rounded-2xl border border-neutral-200 shadow-md flex flex-col sm:flex-row items-stretch gap-2.5 mt-8 text-left">
            <div className="flex-1 flex items-center gap-2 px-3.5 border-b sm:border-b-0 sm:border-r border-neutral-150 pb-2 sm:pb-0">
              <Search className="w-4.5 h-4.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Ex e.g. trocar fiação, encanador caça-vazamento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-0 focus:ring-0 text-xs sm:text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none py-1.5"
              />
            </div>

            <div className="flex items-center gap-2 px-3.5 pb-2 sm:pb-0">
              <MapPin className="w-4.5 h-4.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Filtrar cidade..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-28 bg-transparent border-0 focus:ring-0 text-xs sm:text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none py-1.5"
              />
            </div>

            <button
              onClick={() => {
                const resultsBlock = document.getElementById('prestadores');
                resultsBlock?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="py-3 px-5 sm:px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
            >
              Pesquisar
            </button>
          </div>
        </div>
      </section>

      {/* Categories slide layout */}
      <section id="categorias" className="py-8 bg-white border-y border-neutral-100 px-6">
        <div className="max-w-7xl mx-auto">
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-4">Escolha por Categoria de Urgência</span>
          
          <div className="flex items-center gap-2.5 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-neutral-200">
            <button
              onClick={() => setSelectedCategorySlug(null)}
              className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all whitespace-nowrap active:scale-95 ${
                selectedCategorySlug === null
                  ? 'bg-neutral-900 border-neutral-900 text-white'
                  : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-600'
              }`}
            >
              Ver Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategorySlug(cat.slug)}
                className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all whitespace-nowrap active:scale-95 ${
                  selectedCategorySlug === cat.slug
                    ? 'bg-neutral-900 border-neutral-900 text-white'
                    : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-600'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Modern lists of Featured approved providers */}
      <section id="prestadores" className="py-16 bg-neutral-50/50 px-6 flex-grow">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-neutral-900">Especialistas Disponíveis na rede</h3>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">Clique em qualquer profissional aprovado pela auditoria para ver avaliações e pedir orçamentos</p>
            </div>
            
            <div className="text-[11px] font-bold text-neutral-400">
              Exibindo <strong className="text-neutral-700">{filteredProviders.length}</strong> especialistas {selectedCategorySlug ? `em "${selectedCategorySlug}"` : 'gerais'}
            </div>
          </div>

          {filteredProviders.length === 0 ? (
            <div className="py-16 text-center max-w-md mx-auto">
              <ClipboardList className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <h5 className="font-bold text-neutral-600 text-sm">Sem correspondência no momento</h5>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Nenhum prestador aprovado atendeu aos seguintes filtros de termo ou localização. Tente apagar o filtro de cidade para ampliar suas buscas!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProviders.map((prov) => {
                const profile = profiles.find(p => p.id === prov.id);
                const catName = categories.find(c => c.id === prov.category_id)?.name || 'Especialista';
                if (!profile) return null;

                return (
                  <div 
                    key={prov.id}
                    onClick={() => setSelectedProviderDetailId(prov.id)}
                    className="bg-white p-5 rounded-2xl border border-neutral-150 hover:border-neutral-300 cursor-pointer transition-all duration-200 shadow-sm flex flex-col hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'} 
                          alt="" referrerPolicy="no-referrer" className="w-11 h-11 rounded-full object-cover border border-neutral-100" 
                        />
                        <div>
                          <h4 className="font-bold text-neutral-900 text-sm leading-tight flex items-center gap-1">
                            {profile.full_name}
                            {prov.rating_average >= 4.8 && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 py-0.5 px-1.5 rounded-full font-bold">
                                Multiplicador
                              </span>
                            )}
                          </h4>
                          <span className="text-[10px] text-neutral-400 font-semibold">{catName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{prov.rating_average.toFixed(1)}</span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-500 mt-4 line-clamp-2 leading-relaxed flex-grow">
                      {prov.specialty} — {prov.description}
                    </p>

                    <div className="border-t border-neutral-100 pt-3.5 mt-5 flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {prov.city} ({prov.state})
                      </span>
                      <span className="text-neutral-900 font-black text-xs flex items-center gap-1">
                        Contratar &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Como Funciona Section */}
      <section id="como-funciona" className="py-16 bg-neutral-900 text-white px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="text-emerald-400 font-mono font-bold text-xs uppercase block mb-3">Passo 01</span>
            <h4 className="text-lg font-bold mb-2">Descreva a Necessidade</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Diga o que você precisa consertar na parede, reforma geral ou elétrica rápida. Defina uma data de atendimento e sugira um valor base em Reais.
            </p>
          </div>
          <div>
            <span className="text-emerald-400 font-mono font-bold text-xs uppercase block mb-3">Passo 02</span>
            <h4 className="text-lg font-bold mb-2">Alinhe detalhes no Chat</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              O profissional avalia a fiação ou vazamentos e aceita o agendamento de serviço. O chat é liberado e você pode mandar fotos ou instruções.
            </p>
          </div>
          <div>
            <span className="text-emerald-400 font-mono font-bold text-xs uppercase block mb-3">Passo 03</span>
            <h4 className="text-lg font-bold mb-2">Conclua e Pague via PIX</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Assim que o profissional sinalizar o término da sua tarefa, você faturará com QR Code PIX com compensação automatizada instantânea.
            </p>
          </div>
        </div>
      </section>

      {/* Footer copyright */}
      <footer className="py-8 bg-neutral-950 text-neutral-500 text-center text-[11px] border-t border-neutral-850">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 Severinu Service Ltda. CNPJ: 14.896.711/0001-40. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Políticas de Privacidade</a>
            <a href="#" className="hover:underline">Regulamento de Faturamento PIX</a>
          </div>
        </div>
      </footer>

      {/* AUTH OVERLAYS / MODALS */}
      {authModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-neutral-100 flex flex-col">
            
            <div className="p-6 border-b border-neutral-150 flex items-center justify-between bg-neutral-50">
              <h3 className="font-black text-neutral-900 text-sm uppercase">
                {authModal === 'login' && 'Entrar na Plataforma'}
                {authModal === 'registerClient' && 'Novo Perfil de Cliente'}
                {authModal === 'registerProvider' && 'Novo Perfil de Prestador'}
              </h3>
              <button
                onClick={() => setAuthModal(null)}
                className="text-neutral-400 hover:text-neutral-700 text-xs font-bold"
              >
                X Fechar
              </button>
            </div>

            <div className="p-6">
              {/* LOGIN FLOW */}
              {authModal === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                      Digite seu e-mail cadastrado
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="seu.nome@exemplo.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full p-2.5 text-xs sm:text-sm border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                      Senha de Acesso *
                    </label>
                    <input
                      required
                      type="password"
                      placeholder="Digite sua senha (ex: 123456)"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full p-2.5 text-xs sm:text-sm border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <button
                    type="submit"
                    id="btn-login-submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    Continuar Acesso
                  </button>

                  <div className="flex flex-col items-center gap-1 pt-3 text-center text-xs">
                    <span className="text-neutral-400">Ainda não tem conta no marketplace?</span>
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => setAuthModal('registerClient')} 
                        className="text-emerald-600 font-bold hover:underline"
                      >
                        Sou Cliente
                      </button>
                      <span className="text-neutral-300">|</span>
                      <button 
                        type="button" 
                        onClick={() => setAuthModal('registerProvider')} 
                        className="text-indigo-600 font-bold hover:underline"
                      >
                        Sou Prestador
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* REGISTER CLIENT FLOW */}
              {authModal === 'registerClient' && (
                <form onSubmit={handleRegisterClientSubmit} className="space-y-3.5">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Nome Completo *</label>
                    <input type="text" required placeholder="João da Silva" value={regName} onChange={e => setRegName(e.target.value)} className="w-full p-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">E-mail *</label>
                      <input type="email" required placeholder="joao@gmail.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full p-2 text-xs border border-neutral-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">WhatsApp (Telefone) *</label>
                      <input type="text" required placeholder="11999998888" value={regPhone} onChange={e => setRegPhone(e.target.value)} className="w-full p-2 text-xs border border-neutral-200 rounded-lg" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">CPF *</label>
                      <input type="text" required placeholder="123.456.789-01" value={regCpfCnpj} onChange={e => setRegCpfCnpj(e.target.value)} className="w-full p-2 text-xs border border-neutral-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">Data de Nascimento *</label>
                      <input type="date" required value={regBirthDate} onChange={e => setRegBirthDate(e.target.value)} className="w-full p-2 text-xs border border-neutral-200 rounded-lg" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">Endereço de Correspondência</label>
                      <input type="text" placeholder="Rua das Acácias, 150" value={regAddress} onChange={e => setRegAddress(e.target.value)} className="w-full p-2 text-xs border border-neutral-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">CEP</label>
                      <input type="text" placeholder="01419-000" value={regPostalCode} onChange={e => setRegPostalCode(e.target.value)} className="w-full p-2 text-xs border border-neutral-200 rounded-lg" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">Cidade</label>
                      <input type="text" placeholder="São Paulo" value={regCity} onChange={e => setRegCity(e.target.value)} className="w-full p-2 text-xs border border-neutral-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">Estado (UF)</label>
                      <input type="text" placeholder="SP" value={regState} onChange={e => setRegState(e.target.value)} className="w-full p-2 text-xs border border-neutral-200 rounded-lg" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-900 uppercase">Senha de Acesso *</label>
                    <input type="password" required placeholder="Crie uma senha de acesso" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="w-full p-2 text-xs border border-neutral-250 rounded-lg focus:outline-none focus:border-neutral-900 font-bold" />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl mt-3 transition-colors"
                  >
                    Confirmar Cadastro de Cliente
                  </button>
                </form>
              )}

              {/* REGISTER PROVIDER FLOW */}
              {authModal === 'registerProvider' && (
                <form onSubmit={handleRegisterProviderSubmit} className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Nome Completo / Fantasia *</label>
                    <input type="text" required placeholder="Carlos Eletricista" value={regName} onChange={e => setRegName(e.target.value)} className="w-full p-2 text-xs border border-neutral-200 rounded-lg" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">E-mail Comercial *</label>
                      <input type="email" required placeholder="carlos.eletro@gmail.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full p-2 text-xs border border-neutral-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">WhatsApp (Telefone) *</label>
                      <input type="text" required placeholder="33444555000122" value={regPhone} onChange={e => setRegPhone(e.target.value)} className="w-full p-2 text-xs border border-neutral-200 rounded-lg" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">CPF ou CNPJ *</label>
                      <input type="text" required placeholder="33.444.555/0001-22" value={regCpfCnpj} onChange={e => setRegCpfCnpj(e.target.value)} className="w-full p-2 text-xs border border-neutral-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">Categoria de Serviço *</label>
                      <select required value={regCategoryId} onChange={e => setRegCategoryId(e.target.value)} className="w-full p-2 text-xs border border-neutral-200 rounded-lg">
                        <option value="">Selecione...</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Especialidade Direta (Resumo) *</label>
                    <input type="text" required placeholder="Ex: Eletricista predial habilitado e cabeamento estruturado" value={regSpecialty} onChange={e => setRegSpecialty(e.target.value)} className="w-full p-2 text-xs border border-neutral-200 rounded-lg" />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Descrição Completa e Experiência</label>
                    <textarea rows={2} placeholder="Descreva os tipos de materiais que utiliza e anos de experiência técnica..." value={regDescription} onChange={e => setRegDescription(e.target.value)} className="w-full p-2 text-xs border border-neutral-200 rounded-lg" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">Chave PIX Recebedora *</label>
                      <input type="text" required placeholder="carlos.eletro@pix.com" value={regPixKey} onChange={e => setRegPixKey(e.target.value)} className="w-full p-2 text-xs border border-neutral-200 rounded-lg font-mono" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">CEP</label>
                      <input type="text" placeholder="01311-100" value={regPostalCode} onChange={e => setRegPostalCode(e.target.value)} className="w-full p-2 text-xs border border-neutral-200 rounded-lg" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">Cidade de Atuação</label>
                      <input type="text" placeholder="São Paulo" value={regCity} onChange={e => setRegCity(e.target.value)} className="w-full p-2 text-xs border border-neutral-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">Estado (UF)</label>
                      <input type="text" placeholder="SP" value={regState} onChange={e => setRegState(e.target.value)} className="w-full p-2 text-xs border border-neutral-200 rounded-lg" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-900 uppercase">Senha de Acesso *</label>
                    <input type="password" required placeholder="Crie uma senha de acesso" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="w-full p-2 text-xs border border-neutral-250 rounded-lg focus:outline-none focus:border-neutral-900 font-bold" />
                  </div>

                  {/* Document upload block decoration */}
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-150 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-neutral-700 uppercase block">Anexar Documento Identidade</span>
                      <span className="text-[9px] text-neutral-400">PDF, JPG (Obrigatório para Auditoria)</span>
                    </div>
                    <div className="p-2 bg-neutral-200 text-neutral-600 rounded cursor-pointer hover:bg-neutral-300">
                      <Upload className="w-4 h-4" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl mt-3 transition-colors"
                  >
                    Confirmar Inscrição Operacional
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

      {/* DETAIL OVERLAY MODAL FOR APPROVED PROVIDER */}
      {selectedProviderDetailId && selectedProviderDetail && selectedProviderProfile && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-100 flex flex-col max-h-[90vh]">
            
            {/* Header info */}
            <div className="p-6 bg-neutral-900 text-white flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <img 
                  src={selectedProviderProfile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'} 
                  alt="" referrerPolicy="no-referrer" className="w-14 h-14 rounded-full object-cover border-2 border-neutral-800"
                />
                <div>
                  <h3 className="text-base font-black flex items-center gap-2">
                    {selectedProviderProfile.full_name}
                    <span className="text-[9px] bg-emerald-700 text-white font-bold uppercase rounded py-0.5 px-2">Verificado</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    {categories.find(c => c.id === selectedProviderDetail.category_id)?.name || 'Especialista'} • {selectedProviderDetail.city} ({selectedProviderDetail.state})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedProviderDetailId(null)}
                className="text-neutral-400 hover:text-white font-bold text-sm"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* Rating metrics row */}
              <div className="grid grid-cols-3 gap-2 py-3 bg-neutral-50 rounded-xl border border-neutral-200 text-center text-xs">
                <div>
                  <span className="text-neutral-400 block text-[10px]">Nota Fornecedor</span>
                  <span className="font-black text-neutral-900 text-sm flex items-center justify-center gap-0.5 mt-0.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                    {selectedProviderDetail.rating_average.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">Avaliações</span>
                  <span className="font-black text-neutral-900 text-sm block mt-0.5">
                    {selectedProviderDetail.total_reviews} reviews
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">Trabalhos</span>
                  <span className="font-black text-emerald-600 text-sm block mt-0.5">
                    {selectedProviderDetail.total_completed_services} feitos
                  </span>
                </div>
              </div>

              {/* Specialty & Description */}
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-black block mb-1">Especialidade Direta</span>
                <p className="text-xs font-bold text-neutral-905">{selectedProviderDetail.specialty}</p>
              </div>

              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-black block mb-1">Apresentação Técnica</span>
                <p className="text-xs text-neutral-500 leading-relaxed">{selectedProviderDetail.description}</p>
              </div>

              {/* Gallery of past projects */}
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-black block mb-2">Galeria de Projetos Concluídos</span>
                <div className="grid grid-cols-2 gap-3">
                  {selectedProviderDetail.gallery_urls.map((url, idx) => (
                    <img 
                      key={idx} 
                      src={url} 
                      alt="Serviço feito" 
                      className="w-full h-24 rounded-lg object-cover border border-neutral-100" 
                    />
                  ))}
                </div>
              </div>

              {/* Call to action button */}
              <div className="border-t border-neutral-100 pt-5 mt-4">
                <button
                  onClick={() => {
                    setSelectedProviderDetailId(null);
                    // Open register/login modal or alert instructions
                    setAuthModal('login');
                    alert('Como você não está logado no momento, por favor efetue seu login usando um dos e-mails sugeridos ou sua conta cadastrada para simular a contratação em tempo real!');
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg"
                >
                  <ArrowUpRight className="w-4 h-4" /> Solicitar Orçamento de Serviço Agora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🤖 CHATBOT DE SUPORTE E GUIA INTELIGENTE DA HOME */}
      <AIAssistantChatbot />

    </div>
  );
}
