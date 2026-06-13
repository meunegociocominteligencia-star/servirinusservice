import React, { useState, useEffect } from 'react';
import { databaseDiagnostic, DiagnosticResult } from '../supabase-service';

export function SupabaseDiagnosticsPanel() {
  const [loading, setLoading] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);

  const runDatabaseCheck = async () => {
    setLoading(true);
    try {
      const res = await databaseDiagnostic.runCheck();
      setDiagnostic(res);
    } catch (err) {
      console.error('Error running diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDatabaseCheck();
    // Run periodically every 30 seconds to keep track of connection status in real-time
    const interval = setInterval(runDatabaseCheck, 30000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = !!(diagnostic?.keysConfigured && diagnostic?.isConnected);
  const configuredTables = diagnostic ? Object.keys(diagnostic.tables) : [];
  const activeTablesCount = diagnostic 
    ? (Object.values(diagnostic.tables) as any[]).filter(t => t.exists).length 
    : 0;
  
  // All tables must be created and keys must be configured for a fully healthy production database
  const isFullyHealthy = isConnected && activeTablesCount === configuredTables.length;

  return (
    <div className="bg-neutral-950 border-b border-neutral-900 text-neutral-400 py-1.5 px-4 flex items-center justify-between text-[11px] font-sans selection:bg-neutral-800 shrink-0" id="supabase-status-indicator">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isFullyHealthy ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-neutral-300 font-medium font-sans">
                BANCO SUPABASE: <span className="text-emerald-400 font-bold uppercase tracking-wider">CONECTADO E ONLINE</span>
              </span>
              <span className="text-neutral-500 hidden sm:inline">• {activeTablesCount}/{configuredTables.length} tabelas no ar</span>
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-neutral-300 font-medium font-sans">
                BANCO SUPABASE: <span className="text-red-400 font-bold uppercase tracking-wider">DESCONECTADO OU INCOMPLETO</span>
              </span>
              {diagnostic?.keysConfigured ? (
                <span className="text-neutral-500 hidden sm:inline">
                  • Somente {activeTablesCount} de {configuredTables.length} tabelas ativas (Pendente executar o script SQL no painel do Supabase)
                </span>
              ) : (
                <span className="text-neutral-500 hidden sm:inline">• Credenciais pendentes de configuração</span>
              )}
            </>
          )}
        </div>

        <button 
          onClick={runDatabaseCheck}
          disabled={loading}
          className="text-neutral-500 hover:text-neutral-300 transition-colors text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 border border-neutral-850 hover:bg-neutral-900 py-0.5 px-2 rounded-md"
        >
          {loading ? 'Verificando...' : 'Re-checar conexão'}
        </button>
      </div>
    </div>
  );
}
