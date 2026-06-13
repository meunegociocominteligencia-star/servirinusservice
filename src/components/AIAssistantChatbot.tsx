import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, User, RefreshCw } from 'lucide-react';

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

export function AIAssistantChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou o Severino AI, seu assistente inteligente. Como posso te ajudar hoje a anunciar serviços, enviar orçamentos ou entender as negociações por propostas?'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of discussion
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const suggestions = [
    'Como anunciar um serviço?',
    'Como funcionam as propostas?',
    'Como os prestadores cobram?',
    'Quais os planos de assinatura?'
  ];

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInputVal('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!response.ok) {
        throw new Error('Falha na resposta do assistente virtual.');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Desculpe, tive uma instabilidade na conexão temporária com meus servidores. No Severinu Service, clientes publicam serviços gratuitamente e prestadores concorrem por menor preço envidando orçamentos!'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 hover:scale-105 transition-all text-white p-3.5 rounded-full shadow-2xl group cursor-pointer duration-200"
          title="Falar com Assistente Virtual"
        >
          <MessageSquare className="w-6 h-6 animate-pulse group-hover:scale-110 transition-transform" />
          <span className="text-xs font-black pr-1 tracking-wide uppercase hidden sm:inline">Ajuda Inteligente</span>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
          </span>
        </button>
      )}

      {/* Floating Chat window */}
      {isOpen && (
        <div className="bg-white w-[360px] sm:w-[400px] h-[520px] rounded-2xl border border-neutral-150 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-350">
          
          {/* Header */}
          <div className="bg-neutral-900 text-white p-4 flex items-center justify-between border-b border-neutral-950">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-black text-xs uppercase tracking-wider text-emerald-400">Severino AI</h3>
                <p className="text-[10px] text-neutral-400 font-bold leading-none">Guia do Marketplace de Serviços</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Discussion Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-neutral-50 space-y-3.5">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2 text-xs ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-md bg-neutral-200 text-neutral-700 flex-shrink-0 flex items-center justify-center font-bold">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-3 leading-relaxed shadow-xs ${
                    m.role === 'user'
                      ? 'bg-neutral-900 text-white rounded-tr-xs'
                      : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line text-xs font-medium">{m.content}</p>
                </div>
                {m.role === 'user' && (
                  <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex-shrink-0 flex items-center justify-center font-bold">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 text-xs items-center text-neutral-400 italic">
                <div className="w-6 h-6 rounded-md bg-neutral-100 text-neutral-500 flex-shrink-0 flex items-center justify-center">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                </div>
                <span>Pensando na resposta ideal...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion chips */}
          <div className="px-4 py-2.5 bg-neutral-50 border-t border-neutral-100 flex flex-wrap gap-1.5 scrollbar-none overflow-x-auto max-h-[82px]">
            {suggestions.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(sug)}
                className="text-[10px] font-bold text-neutral-600 hover:text-neutral-950 bg-white hover:bg-white border border-neutral-200 hover:border-neutral-350 px-2.5 py-1 rounded-full transition-colors cursor-pointer text-left"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Input control block */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputVal);
            }}
            className="p-3 bg-white border-t border-neutral-100 flex gap-2"
          >
            <input
              type="text"
              placeholder="Digite sua dúvida sobre o sistema..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 text-xs px-3.5 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-950"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isLoading}
              className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                inputVal.trim() && !isLoading
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                  : 'bg-neutral-100 text-neutral-300'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
