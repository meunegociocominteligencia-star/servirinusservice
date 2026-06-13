import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, MessageCircle, User, Paperclip, CheckCheck, 
  MapPin, Phone, MessageSquare, AlertCircle, Clock
} from 'lucide-react';
import { Conversation, Message, Profile } from '../types';
import { chatService, dbMemory } from '../supabase-service';

interface ChatComponentProps {
  conversationId: string;
  currentUser: Profile;
  onBack?: () => void;
}

export const ChatComponent: React.FC<ChatComponentProps> = ({
  conversationId,
  currentUser,
  onBack
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [targetUser, setTargetUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages and counterpart profile details
  useEffect(() => {
    let active = true;

    async function loadChatDetails() {
      setIsLoading(true);
      try {
        const msgs = await chatService.getMessagesForConversation(conversationId);
        if (active) {
          setMessages(msgs);
        }

        // Fetch companion detail
        const allConvs = dbMemory.get<Conversation[]>('sev_conversations');
        const matchedConv = allConvs.find(c => c.id === conversationId);
        
        if (matchedConv && active) {
          const companionId = matchedConv.client_id === currentUser.id 
            ? matchedConv.provider_id 
            : matchedConv.client_id;
          
          const allProfiles = dbMemory.get<Profile[]>('sev_profiles');
          const companionProfile = allProfiles.find(p => p.id === companionId);
          if (companionProfile) {
            setTargetUser(companionProfile);
          }
        }
      } catch (err) {
        console.error('Error fetching chat data:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadChatDetails();

    // Setup periodic polling to simulate real-time message exchange in preview mode
    const interval = setInterval(async () => {
      const msgs = await chatService.getMessagesForConversation(conversationId);
      if (active) {
        setMessages(msgs);
      }
    }, 1500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [conversationId, currentUser.id]);

  // Handle autoscrolling
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const typed = inputText;
    setInputText('');

    try {
      const newMsg = await chatService.sendMessage(conversationId, currentUser.id, typed);
      setMessages(prev => [...prev, newMsg]);
    } catch (err) {
      console.error('Falha ao enviar mensagem:', err);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 flex flex-col h-[550px] shadow-sm overflow-hidden">
      {/* Top Header of Chat */}
      <div className="p-4 bg-neutral-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden text-neutral-300 hover:text-white mr-1 active:scale-95"
            >
              &larr; Voltar
            </button>
          )}

          <div className="relative">
            {targetUser?.avatar_url ? (
              <img
                src={targetUser.avatar_url}
                alt={targetUser.full_name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border-2 border-neutral-800"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-white font-bold">
                <User className="w-5 h-5" />
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-neutral-900 rounded-full" />
          </div>

          <div>
            <h4 className="font-bold text-sm leading-tight">
              {targetUser?.full_name || 'Usuário Severinu'}
            </h4>
            <p className="text-[10px] text-emerald-400 font-medium">
              Prestador Ativo • Online
            </p>
          </div>
        </div>

        {targetUser?.role === 'provider' && (
          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${dbMemory.get<any>('sev_providers').find((p: any) => p.id === targetUser.id)?.whatsapp || '5511999999999'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-emerald-600/35 hover:bg-emerald-600 transition-colors text-emerald-300 hover:text-white rounded-lg flex items-center gap-1.5 text-xs font-semibold"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </div>
        )}
      </div>

      {/* Messages Pane */}
      <div className="flex-1 overflow-y-auto p-4 bg-neutral-50/50 space-y-3.5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-400">
            <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin mb-2" />
            <span className="text-xs">Buscando mensagens do canal...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-neutral-400">
            <MessageSquare className="w-10 h-10 text-neutral-300 mb-2.5" />
            <h5 className="font-bold text-neutral-700 text-sm">Sem mensagens ainda</h5>
            <p className="text-[11px] text-neutral-400 mt-1 max-w-xs">
              Mande uma mensagem abaixo para iniciar a conversa! O prestador responderá em poucos instantes de forma automatizada de acordo com suas ferramentas.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-xs relative leading-relaxed ${
                    isMe
                      ? 'bg-neutral-900 text-white rounded-tr-none'
                      : 'bg-white text-neutral-800 border border-neutral-100 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line text-xs font-medium">{msg.text}</p>
                  
                  <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-neutral-400">
                    <span>{formatTime(msg.created_at)}</span>
                    {isMe && (
                      <CheckCheck className={`w-3.5 h-3.5 ${msg.is_read ? 'text-emerald-400' : 'text-neutral-400'}`} />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Panel */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-neutral-100 flex gap-2">
        <button
          type="button"
          onClick={() => alert('Recurso de upload anexará arquivos de fotos/comprovantes de serviço em ambiente de produção.')}
          className="p-2.5 rounded-xl border border-neutral-200 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors"
          title="Anexar arquivo"
        >
          <Paperclip className="w-4.5 h-4.5" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Digite sua mensagem de serviço..."
          className="flex-1 px-4 py-2.5 text-sm border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
        />

        <button
          type="submit"
          id="btn-send-msg"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white transition-all duration-200 disabled:opacity-40 disabled:scale-100 font-bold"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
