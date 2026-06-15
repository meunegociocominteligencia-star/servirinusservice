import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, User, RefreshCw, HelpCircle, BookOpen } from 'lucide-react';

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

export function AIAssistantChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou o **Severino AI**, o assistente digital exclusivo do **Severinu Service**.\n\nComo posso te ajudar hoje? Escolha um dos botões rápidos e dinâmicos abaixo para conferir os nossos tutoriais passo a passo ou digite sua dúvida!'
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
    '🔍 Como funciona o sistema?',
    '👤 Tutorial do Cliente',
    '💼 Tutorial do Prestador',
    '🤝 Como funcionam propostas?',
    '💸 Pagamento por PIX'
  ];

  const getLocalResponse = (query: string): string | null => {
    const q = query.toLowerCase();
    
    if (q.includes('como funciona') || q.includes('como funciona o sistema') || q.includes('como funciona?')) {
      return `⚙ **Como funciona o Severinu Service?**\n\nO **Severinu Service** é um marketplace moderno que conecta clientes com profissionais em poucos passos de forma 100% segura!\n\n**O fluxo é muito simples:**\n\n1️⃣ **O Cliente anuncia o que precisa:** Cria um anúncio descrevendo sua necessidade (ex: "consertar tomada de cozinha") e escolhe a categoria correta.\n2️⃣ **Os Prestadores são notificados:** Todos os prestadores aprovados daquela categoria recebem o aviso em seus painéis na aba de **Oportunidades de Trabalho**.\n3️⃣ **Envio de Propostas:** Os prestadores interessados enviam orçamentos com valor em R$ e prazos aproximados.\n4️⃣ **Análise e Contratação:** O cliente compara as propostas (podendo ordenar por menor preço ou maior nota), escolhe a melhor e clica em **Contratar**.\n5️⃣ **Execução e Chat:** Um chat focado e privado se abre para que combinem os últimos ajustes. Depois do serviço pronto, o cliente realiza o pagamento por **PIX** no próprio painel!`;
    }
    
    if (q.includes('cliente') || q.includes('tutorial do cliente') || q.includes('tutorial para clientes')) {
      return `👤 **Tutorial Passo a Passo para Clientes:**\n\n**Como publicar um serviço e contratar profissionais:**\n\n1️⃣ **Entre na sua conta:** No cabeçalho superior do site, clique no botão **"Entrar"** e faça o login.\n2️⃣ **Crie sua solicitação:** Role a página inicial, clique em um card de categoria desejada ou use a barra de busca. Digite os detalhes reais do serviço que você precisa.\n3️⃣ **Monitore o seu anúncio:** Acesse o seu Painel clicando no seu nome de usuário. Logo abaixo da aba de serviços, você verá o seu chamado ativo.\n4️⃣ **Compare os orçamentos recebidos:** Quando os prestadores enviarem propostas, elas aparecerão sob seu serviço. Veja as notas das avaliações e os valores de cada um.\n5️⃣ **Contrate com 1 Clique:** Pressione o botão **"Aceitar e Contratar"** na proposta vencedora. O chat privado se abrirá instantaneamente na tela!\n6️⃣ **Finalização e PIX:** Após o serviço ser executado, pague de forma segura escaneando o QR Code do PIX em seu painel e avalie o prestador com estrelas.`;
    }
    
    if (q.includes('prestador') || q.includes('tutorial do prestador') || q.includes('tutorial para prestadores')) {
      return `💼 **Tutorial Passo a Passo para Prestadores de Serviço:**\n\n**Como encontrar clientes, enviar propostas e gerenciar ganhos:**\n\n1️⃣ **Cadastre-se grátis:** No topo da página, clique em **"Quero Ser Prestador"** e preencha todos os seus dados reais e a categoria principal de atuação.\n2️⃣ **Aguarde a aprovação:** Por motivos de segurança dos clientes, o administrador do sistema irá revisar e aprovar seu cadastro. Você pode acompanhar seu status no painel.\n3️⃣ **Explore vagas abertas:** Acesse seu Painel de Prestador e vá até a seção **"Oportunidades de Trabalho"**. Lá aparecerão todos os anúncios criados pelos clientes na sua categoria.\n4️⃣ **Envie uma Proposta competitiva:** Insira o valor em R$ pelo qual você fará o serviço e uma descrição curta e persuasiva apresentando seu trabalho.\n5️⃣ **Seja Contratado:** Caso o cliente aceite sua proposta, o status mudará para ativa e o chat de negociação direta se abrirá automaticamente!\n6️⃣ **Conclua e receba:** Finalize o serviço, sinalize a conclusão no painel e o cliente poderá pagar via PIX para sua conta de forma integrada.`;
    }

    if (q.includes('proposta') || q.includes('propostas') || q.includes('como funcionam propostas')) {
      return `🤝 **Como funcionam as propostas de orçamento no Severinu?**\n\nNo sistema do Severinu, a concorrência é livre e saudável para encontrar o preço ideal:\n\n- O cliente **não estipula um preço máximo**. Ele apenas posta a descrição e as fotos do problema.\n- Os prestadores certificados analisam as fotos e o texto explicativo, calculando os insumos para propor um preço justo.\n- O cliente analisa várias propostas lado a lado e pode ordenar por **Menor Preço** ou **Melhor Avaliação**.\n- Isso promove as melhores negociações do mercado para ambas as partes!`;
    }

    if (q.includes('pix') || q.includes('pagamento') || q.includes('cobrar') || q.includes('plano')) {
      return `💸 **Tudo sobre Pagamentos via PIX e Planos Premium:**\n\n- **Pagamento Integrado:** Quando um serviço é marcado como concluído, nossa plataforma já fornece o código Copia e Cola do PIX e um QR Code para o cliente pagar de forma imediata.\n- **Segurança de Ponta:** O recebimento é rastreado facilitando que o prestador comprove que a transação foi concluída com sucesso.\n- **Destaque Premium:** Os prestadores podem assinar os planos **Bronze, Prata ou Ouro** para obterem um selo oficial de verificação verificado e aparecerem no topo das listagens de busca. A assinatura de planos também é efetuada rapidamente via PIX!`;
    }

    return null;
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInputVal('');
    setIsLoading(true);

    // Look for instant local tutorial response match
    const localAnswer = getLocalResponse(text);
    if (localAnswer) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: localAnswer }]);
        setIsLoading(false);
      }, 600);
      return;
    }

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!response.ok) {
        throw new Error('Falha no assistente virtual.');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Olá! No momento estamos com oscilação na conexão com nossos servidores inteligentes de IA do Gemini. \n\nNo entanto, você pode utilizar os **tutoriais instalados em meu painel**! Basta clicar em qualquer um dos botões rápidos acima (Ex: **"Tutorial do Cliente"** ou **"Tutorial do Prestador"**) e irei te guiar de forma imediata!'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 text-xs font-medium text-neutral-800 leading-relaxed">
        {lines.map((line, lIdx) => {
          // Parse bold markers (**text**) and highlight them elegantly matching the emerald branding
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const parsedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-extrabold text-emerald-600">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });

          // Check if line starts with an emoji, digit, or bullet
          const isBullet = line.trim().match(/^([0-9]️⃣|1️⃣|2️⃣|3️⃣|4️⃣|5️⃣|6️⃣|•|-|\*)\s/);

          return (
            <p key={lIdx} className={`${isBullet ? 'pl-1.5' : ''}`}>
              {parsedLine}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`fixed z-50 font-sans ${isOpen ? 'bottom-3 right-3 left-3 sm:bottom-6 sm:right-6 sm:left-auto' : 'bottom-6 right-6'}`}>
      {/* Floating circle trigger icon */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all text-white p-3.5 rounded-full shadow-2xl group cursor-pointer duration-200"
          title="Falar com Assistente Virtual"
        >
          <MessageSquare className="w-6 h-6 animate-pulse group-hover:scale-110 transition-transform" />
          <span className="text-xs font-black pr-1 tracking-wide uppercase hidden sm:inline">Suporte Severino AI</span>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
        </button>
      )}

      {/* Floating Chat window adjusted so it works beautifully on mobile webviews */}
      {isOpen && (
        <div className="bg-white w-full sm:w-[410px] h-[544px] max-h-[85vh] rounded-2xl border border-neutral-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-250">
          
          {/* Header section with Emerald accent and metadata */}
          <div className="bg-neutral-900 text-white p-4 flex items-center justify-between border-b border-neutral-950">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-xs uppercase tracking-wider text-emerald-400">Severino AI</h3>
                  <span className="bg-neutral-800 text-neutral-400 text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded-md uppercase">VIRTUAL</span>
                </div>
                <p className="text-[10px] text-neutral-400 font-bold leading-tight">Guia Exclusivo do Marketplace de Serviços</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Informational Box inside the Chatbot explaining the system */}
          <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
            <span className="text-[9px] text-emerald-800 font-black uppercase tracking-wide">
              Clique nos botões rápidos abaixo para carregar os tutoriais passo a passo!
            </span>
          </div>

          {/* Discussion Messages Panel */}
          <div className="flex-1 overflow-y-auto p-4 bg-neutral-50 space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6.5 h-6.5 rounded-lg bg-neutral-200 text-neutral-800 flex-shrink-0 flex items-center justify-center font-bold">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed shadow-xs ${
                    m.role === 'user'
                      ? 'bg-neutral-900 text-white rounded-tr-xs'
                      : 'bg-white border border-neutral-150 text-neutral-800 rounded-tl-xs'
                  }`}
                >
                  {renderMessageContent(m.content)}
                </div>
                {m.role === 'user' && (
                  <div className="w-6.5 h-6.5 rounded-lg bg-emerald-150 text-emerald-800 flex-shrink-0 flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 text-xs items-center text-neutral-400 italic font-medium pl-1">
                <div className="w-6.5 h-6.5 rounded-lg bg-neutral-150 text-neutral-500 flex-shrink-0 flex items-center justify-center">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                </div>
                <span>Digitando tutorial detalhado...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* New Optimized Quick Suggestion chips */}
          <div className="px-3 py-2 bg-neutral-100 border-t border-neutral-200 flex flex-wrap gap-1.5 overflow-x-auto max-h-[92px] items-center">
            {suggestions.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(sug.substring(2))} // Stripe the emoji before matching
                className="text-[10px] font-black text-neutral-700 bg-white hover:text-black border border-neutral-250 hover:border-neutral-400 px-3 py-1 rounded-full transition-all cursor-pointer active:scale-95 flex items-center gap-1 shadow-2xs"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Form input control bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputVal);
            }}
            className="p-3 bg-white border-t border-neutral-200 flex gap-2"
          >
            <input
              type="text"
              placeholder="Pergunte como funciona ou digite uma dúvida..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 text-xs px-3.5 py-2.5 bg-neutral-50 hover:bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-neutral-800 placeholder-neutral-400"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isLoading}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                inputVal.trim() && !isLoading
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95 shadow-xs'
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
