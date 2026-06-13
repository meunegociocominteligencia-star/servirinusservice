import React, { useState, useMemo } from 'react';
import { 
  Calendar, Filter, DollarSign, ChevronDown, ChevronUp, 
  Clock, CheckCircle, Briefcase
} from 'lucide-react';
import { Profile, ProviderProfile, ServiceRequest, FinancialLog, Category } from '../types';

interface ProviderDetailsSectionProps {
  provider: ProviderProfile;
  profiles: Profile[];
  categories: Category[];
  serviceRequests: ServiceRequest[];
  financialLogs: FinancialLog[];
}

export const ProviderDetailsSection: React.FC<ProviderDetailsSectionProps> = ({
  provider,
  profiles,
  categories,
  serviceRequests,
  financialLogs,
}) => {
  // Independent local state filters for isolated provider viewing
  const [filterDay, setFilterDay] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');

  // Find all service requests for this provider
  const providerServices = useMemo(() => {
    return serviceRequests.filter(req => req.provider_id === provider.id);
  }, [serviceRequests, provider.id]);

  // Find all financial logs for this provider
  const providerFinancials = useMemo(() => {
    return financialLogs.filter(log => log.provider_id === provider.id);
  }, [financialLogs, provider.id]);

  // Months name helper
  const months = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  // Years options based on current date + existing records
  const years = ['2024', '2025', '2026', '2027'];

  // Days options (1 to 31)
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

  // Filter service requests based on Day, Month, Year
  const filteredServices = useMemo(() => {
    return providerServices.filter(req => {
      if (!req.scheduled_date) return false;
      const d = new Date(req.scheduled_date);
      
      const dayMatches = filterDay === 'all' || d.getDate() === parseInt(filterDay);
      const monthMatches = filterMonth === 'all' || (d.getMonth() + 1) === parseInt(filterMonth);
      const yearMatches = filterYear === 'all' || d.getFullYear() === parseInt(filterYear);

      return dayMatches && monthMatches && yearMatches;
    });
  }, [providerServices, filterDay, filterMonth, filterYear]);

  // Filter financial logs based on Day, Month, Year as well (movimentação financeira por período)
  const filteredFinancials = useMemo(() => {
    return providerFinancials.filter(log => {
      if (!log.created_at) return false;
      const d = new Date(log.created_at);

      const dayMatches = filterDay === 'all' || d.getDate() === parseInt(filterDay);
      const monthMatches = filterMonth === 'all' || (d.getMonth() + 1) === parseInt(filterMonth);
      const yearMatches = filterYear === 'all' || d.getFullYear() === parseInt(filterYear);

      return dayMatches && monthMatches && yearMatches;
    });
  }, [providerFinancials, filterDay, filterMonth, filterYear]);

  // Calculate total services value for filtered scope in Real
  const totalServicesValue = useMemo(() => {
    return filteredServices.reduce((sum, req) => {
      const val = req.final_value ?? req.suggested_value ?? 0;
      return sum + val;
    }, 0);
  }, [filteredServices]);

  // Calculate total services value overall for this provider (unfiltered) or just completed ones
  const totalCompletedValueAllTime = useMemo(() => {
    return providerServices
      .filter(req => req.status === 'completed')
      .reduce((sum, req) => sum + (req.final_value ?? req.suggested_value ?? 0), 0);
  }, [providerServices]);

  // Helper to format currency
  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-black uppercase">Concluído</span>;
      case 'accepted':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-black uppercase">Aceito</span>;
      case 'in_progress':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-black uppercase">Em Progresso</span>;
      case 'cancelled':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-black uppercase">Cancelado</span>;
      case 'waiting':
      default:
        return <span className="bg-neutral-100 text-neutral-600 border border-neutral-200 px-2 py-0.5 rounded text-[10px] font-black uppercase">Aguardando</span>;
    }
  };

  const getFinancialTypeBadge = (type: string) => {
    switch (type) {
      case 'plan_payment':
        return <span className="text-[10px] bg-purple-50 text-purple-700 ring-1 ring-purple-600/10 rounded px-1.5 py-0.5 font-bold uppercase">Upgrade de Plano</span>;
      case 'service_settlement':
        return <span className="text-[10px] bg-sky-50 text-sky-700 ring-1 ring-sky-600/10 rounded px-1.5 py-0.5 font-bold uppercase">Taxa Intermediação</span>;
      default:
        return <span className="text-[10px] bg-neutral-100 text-neutral-600 ring-1 ring-neutral-300 rounded px-1.5 py-0.5 font-bold uppercase">{type}</span>;
    }
  };

  return (
    <div className="bg-neutral-50/90 border-t border-neutral-150 p-6 animate-fade-in space-y-6">
      
      {/* Filtering Header / Selection toolbar */}
      <div className="bg-white p-4.5 rounded-xl border border-neutral-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Title block */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <Filter className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-neutral-900">Operações & Consolidações Financeiras</h4>
            <p className="text-[11px] text-neutral-400">Filtre por dia, mês e ano para auditar e auditar serviços do prestador</p>
          </div>
        </div>

        {/* Dynamic Filters Selectors */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Day Selector */}
          <div className="flex flex-col">
            <span className="text-[9px] text-neutral-400 font-bold uppercase mb-1">Dia</span>
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="px-2 py-1 bg-neutral-50 hover:bg-neutral-105 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-700 focus:outline-none min-w-[70px]"
            >
              <option value="all">Todos</option>
              {days.map(d => (
                <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <div className="flex flex-col">
            <span className="text-[9px] text-neutral-400 font-bold uppercase mb-1">Mês</span>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-2 py-1 bg-neutral-50 hover:bg-neutral-105 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-700 focus:outline-none min-w-[95px]"
            >
              <option value="all">Todos</option>
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="flex flex-col">
            <span className="text-[9px] text-neutral-400 font-bold uppercase mb-1">Ano</span>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-2 py-1 bg-neutral-50 hover:bg-neutral-105 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-700 focus:outline-none min-w-[80px]"
            >
              <option value="all">Todos</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {(filterDay !== 'all' || filterMonth !== 'all' || filterYear !== 'all') && (
            <button
              onClick={() => {
                setFilterDay('all');
                setFilterMonth('all');
                setFilterYear('all');
              }}
              className="mt-3.5 px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-[10px] font-bold text-neutral-600 rounded-lg transition-all"
            >
              Limpar Filtros
            </button>
          )}

        </div>
      </div>

      {/* Financial KPIs Blocks (isolated provider faturamento) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* KPI 1: Faturamento do Período */}
        <div className="bg-white p-4.5 rounded-xl border border-neutral-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Faturamento Filtrado</span>
            <span className="text-xl font-black text-emerald-600 mt-1 block">
              {formatBRL(totalServicesValue)}
            </span>
            <span className="text-[10.5px] font-medium text-neutral-400 mt-0.5 block">
              Soma dos valores no período selecionado
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-650 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Arrecadado Geral Concluído */}
        <div className="bg-white p-4.5 rounded-xl border border-neutral-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Histórico Geral Aceito</span>
            <span className="text-xl font-black text-neutral-800 mt-1 block">
              {formatBRL(totalCompletedValueAllTime)}
            </span>
            <span className="text-[10.5px] font-medium text-neutral-400 mt-0.5 block">
              Soma total de serviços Concluídos
            </span>
          </div>
          <div className="p-2.5 bg-neutral-100 text-neutral-700 rounded-lg">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Serviços Encontrados */}
        <div className="bg-white p-4.5 rounded-xl border border-neutral-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Filtragem de Atendimentos</span>
            <span className="text-xl font-black text-neutral-900 mt-1 block">
              {filteredServices.length} de {providerServices.length}
            </span>
            <span className="text-[10.5px] font-medium text-neutral-400 mt-0.5 block">
              Serviços agendados no período ativo
            </span>
          </div>
          <div className="p-2.5 bg-neutral-100 text-neutral-700 rounded-lg">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Left Column = Services List, Right Column = Financial Movements */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Services List Column */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-neutral-150 bg-neutral-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <h5 className="text-xs font-black uppercase text-neutral-700 tracking-wider">Histórico de Atendimentos ({filteredServices.length})</h5>
            </div>
          </div>

          <div className="flex-1 max-h-[350px] overflow-y-auto divide-y divide-neutral-150">
            {filteredServices.length === 0 ? (
              <div className="py-12 px-6 text-center text-neutral-400 text-xs">
                Nenhum serviço agendado para o período ou critérios selecionados.
              </div>
            ) : (
              filteredServices.map((req) => {
                const clientProf = profiles.find(p => p.id === req.client_id);
                const reqValue = req.final_value ?? req.suggested_value ?? 0;
                const formattedDate = new Date(req.scheduled_date).toLocaleDateString('pt-BR');
                
                return (
                  <div key={req.id} className="p-4 hover:bg-neutral-50/40 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <strong className="text-neutral-850 text-sm font-black">{req.title || 'Serviço Prestado'}</strong>
                        <span className="text-[10px] text-neutral-400 font-mono">#{req.id.substring(0, 8)}</span>
                      </div>
                      
                      <div className="text-neutral-500 font-medium space-y-0.5">
                        <p><strong>Cliente:</strong> {clientProf?.full_name || 'Consumidor Doméstico'} ({clientProf?.email || 'e-mail pendente'})</p>
                        <p className="flex items-center gap-1.5 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-neutral-405" />
                          <span>Data Agendada: {formattedDate}</span>
                        </p>
                        {req.description && (
                          <p className="text-[11px] text-neutral-400 bg-neutral-50 p-1.5 rounded border border-neutral-100 italic">
                            "{req.description.length > 70 ? req.description.substring(0, 70) + '...' : req.description}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-neutral-900 text-sm">{formatBRL(reqValue)}</span>
                      <div className="flex gap-1.5 items-center">
                        {req.status_payment === 'paid' ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Pago</span>
                        ) : (
                          <span className="bg-neutral-100 text-neutral-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Não-Pago</span>
                        )}
                        {getStatusBadge(req.status)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Financial logs Movements Column (Movimentação financeira) */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden flex flex-col">
          
          <div className="p-3.5 border-b border-neutral-150 bg-neutral-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
              <h5 className="text-xs font-black uppercase text-neutral-700 tracking-wider">Movimentações Financeiras ({filteredFinancials.length})</h5>
            </div>
            <span className="text-[10px] bg-purple-50 text-purple-700 font-bold border border-purple-200/40 px-2 py-0.5 rounded-md">Transações PIX</span>
          </div>

          <div className="flex-1 max-h-[350px] overflow-y-auto divide-y divide-neutral-150">
            {filteredFinancials.length === 0 ? (
              <div className="py-12 px-6 text-center text-neutral-400 text-xs">
                Nenhuma movimentação financeira via PIX para o filtro de período selecionado.
              </div>
            ) : (
              filteredFinancials.map((log) => {
                const formattedDate = new Date(log.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                
                return (
                  <div key={log.id} className="p-4 hover:bg-neutral-50/40 transition-colors flex items-center justify-between text-xs font-mono">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <strong className="text-neutral-850 font-black">Ref: #{log.id.substring(0, 8)}</strong>
                        {getFinancialTypeBadge(log.type)}
                      </div>
                      
                      <div className="text-neutral-500 font-medium text-[11px] font-sans">
                        <p><strong>Modo:</strong> {log.payment_method}</p>
                        <p className="flex items-center gap-1">
                          <span className="text-neutral-400">Data Transação:</span> {formattedDate}
                        </p>
                      </div>
                    </div>

                    <div className="text-right space-y-1 ml-4 flex-shrink-0">
                      <span className="text-neutral-900 font-black text-xs sm:text-sm block">
                        R$ {log.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className={`inline-block py-0.5 px-1.5 rounded text-[9px] font-black uppercase ${
                        log.status === 'completed' 
                          ? 'bg-emerald-50 text-emerald-800' 
                          : 'bg-amber-50 text-amber-805'
                      }`}>
                        {log.status === 'completed' ? 'Liquidado' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
