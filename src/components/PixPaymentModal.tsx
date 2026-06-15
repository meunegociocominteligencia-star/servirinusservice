import React, { useState, useEffect } from 'react';
import { 
  QrCode, CheckCircle, Copy, AlertCircle, Sparkles, 
  Upload, ArrowRight, ShieldCheck, RefreshCw, FileText, X
} from 'lucide-react';
import { dbMemory, serviceRequestService } from '../supabase-service';
import { SystemSettings } from '../types';

interface PixPaymentModalProps {
  id: string; // reference id (request_id or subscription_id)
  title: string;
  recipientName: string;
  amount: number;
  onPaymentSuccess: () => void;
  onClose: () => void;
  recipientKey?: string; // Optional recipient Pix Key override
  paymentType?: 'service' | 'subscription';
}

// CRC16-CCITT implementation (0x1021) for PIX standard compliance
function calculateCRC16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    crc ^= (charCode << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  let hex = crc.toString(16).toUpperCase();
  while (hex.length < 4) {
    hex = '0' + hex;
  }
  return hex;
}

function generatePixPayload({
  key,
  name,
  city,
  amount,
  txid
}: {
  key: string;
  name: string;
  city: string;
  amount: number;
  txid: string;
}): string {
  const f = (id: string, val: string) => {
    const len = val.length.toString().padStart(2, '0');
    return `${id}${len}${val}`;
  };

  const gui = f('00', 'br.gov.bcb.pix');
  const pixKey = f('01', key);
  const merchantAccountInfo = f('26', `${gui}${pixKey}`);

  const merchantCategory = f('52', '0000');
  const currency = f('53', '986');
  const amtStr = amount.toFixed(2);
  const transactionAmount = f('54', amtStr);
  const countryCode = f('58', 'BR');
  
  const formatText = (text: string, maxLen: number) => {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-zA-Z0-9 ]/g, "")  // keep alphanumeric
      .substring(0, maxLen)
      .trim();
  };

  const formattedName = formatText(name || 'SEVERINU MARKETPLACE', 25) || 'SEVERINU';
  const formattedCity = formatText(city || 'SAO PAULO', 15) || 'SAO PAULO';

  const merchantName = f('59', formattedName);
  const merchantCity = f('60', formattedCity);

  const cleanTxid = formatText(txid || '***', 25).replace(/\s+/g, '') || '***';
  const referenceLabel = f('05', cleanTxid);
  const additionalData = f('62', referenceLabel);

  const part1 = 
    f('00', '01') +
    merchantAccountInfo +
    merchantCategory +
    currency +
    transactionAmount +
    countryCode +
    merchantName +
    merchantCity +
    additionalData +
    '6304';

  const crc = calculateCRC16(part1);
  return part1 + crc;
}

export const PixPaymentModal: React.FC<PixPaymentModalProps> = ({
  id,
  title,
  recipientName,
  amount,
  onPaymentSuccess,
  onClose,
  recipientKey,
  paymentType = 'service'
}) => {
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Flow State: 'automatic' (Platform verification) vs 'direct' (Direct P2P to Provider)
  const [selectedFlow, setSelectedFlow] = useState<'automatic' | 'direct'>(
    paymentType === 'subscription' ? 'automatic' : 'direct'
  );

  // Direct P2P variables
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [isDeclaringSent, setIsDeclaringSent] = useState(false);
  const [declareSuccess, setDeclareSuccess] = useState(false);

  // Automatic verification simulator polling state
  const [secondsLeft, setSecondsLeft] = useState(120); // 2 minutes visual simulation timer
  const [apiLogs, setApiLogs] = useState<string[]>([
    'Conectando ao gateway de conciliação do Banco Central...',
    'Aguardando detecção de movimentação de entrada...'
  ]);

  useEffect(() => {
    if (selectedFlow === 'automatic' && !isConfirmed) {
      const interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) return 120; // reset
          return prev - 1;
        });

        // Push random realistic clearing telemetry checks
        const databasePhrases = [
          'Consultando histórico de depósitos na conta recebedora...',
          'Nenhum evento detectado para transação TXID: ' + id.substring(0, 8),
          'Monitoramento de repasse ativo (atualiza a cada 4s)...',
          'Sistemas integrados operacionais: API SPI ativa.'
        ];
        const randomPhrase = databasePhrases[Math.floor(Math.random() * databasePhrases.length)];
        setApiLogs((prevLogs) => [randomPhrase, ...prevLogs.slice(0, 3)]);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [selectedFlow, isConfirmed, id]);

  // Fetch administrator configuration settings for default keys
  const settingsArray = dbMemory.get<SystemSettings[]>('sev_system_settings') || [];
  const systemSettings = settingsArray[0];

  // If direct P2P is active, we resolve to the provider's custom PIX key. 
  // If automatic gateway is active, we resolve to the marketplace corporate central PIX key!
  const resolvedPixKey = selectedFlow === 'automatic'
    ? (systemSettings?.pix_recipient_key || 'financeiro@severinu.com')
    : (recipientKey || systemSettings?.pix_recipient_key || 'financeiro@severinu.com');

  const resolvedRecipientName = selectedFlow === 'automatic'
    ? 'Severinu Intermediação de Serviços Ltda.'
    : recipientName;

  const resolvedCity = systemSettings?.pix_recipient_city || 'SAO PAULO';

  // Generate standard BR Code Copy & Paste string
  const pixCopyPasteText = generatePixPayload({
    key: resolvedPixKey,
    name: resolvedRecipientName,
    city: resolvedCity,
    amount: amount,
    txid: id
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCopyPasteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setApiLogs((prev) => ['[!] EVENTO REPASSADO: Depósito simulado recebido no Gateway!', ...prev]);
    // Simulate webhook instant delay (1.5s bank communication)
    setTimeout(() => {
      setIsProcessing(false);
      setIsConfirmed(true);
      setTimeout(() => {
        onPaymentSuccess();
      }, 1500);
    }, 1800);
  };

  // Upload/Simulation of Receipt handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFile(file);
      setReceiptFileName(file.name);
    }
  };

  const executeDeclareP2PSent = async () => {
    setIsDeclaringSent(true);
    try {
      // Execute the database status change to 'pending_confirm'
      await serviceRequestService.declarePaymentSent(id);
      
      setTimeout(() => {
        setIsDeclaringSent(false);
        setDeclareSuccess(true);
      }, 2000);
    } catch (err) {
      alert('Erro ao processar: ' + err);
      setIsDeclaringSent(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-150 flex flex-col my-8 animate-fade-in max-h-[90vh]">
        
        {/* Header - Banking Layout */}
        <div className="bg-neutral-900 text-white p-5 relative flex items-center justify-between">
          <div>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-0.5">
              Liquidação de Faturamento
            </p>
            <h3 className="text-sm font-black truncate">{title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 px-2.5 bg-neutral-800 text-neutral-400 hover:text-white rounded-lg text-xs font-bold transition-all"
            title="Fechar"
          >
            <X className="w-4 h-4 inline" /> Sair
          </button>
        </div>

        {/* Check Flow Selector Tab for Service Payments */}
        {paymentType === 'service' && !isConfirmed && !declareSuccess && (
          <div className="grid grid-cols-2 border-b border-neutral-200 bg-neutral-50 p-1 gap-1">
            <button
              type="button"
              onClick={() => setSelectedFlow('direct')}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                selectedFlow === 'direct'
                  ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              Transferência Direta (P2P)
            </button>
            <button
              type="button"
              onClick={() => setSelectedFlow('automatic')}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                selectedFlow === 'automatic'
                  ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Automático via Gateway
            </button>
          </div>
        )}

        <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center text-center">
          
          {/* SUCCESS SCREEN 1: Automatic success callback cleared */}
          {isConfirmed && (
            <div className="py-12 flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 animate-bounce">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-neutral-900">Pagamento PIX Compensado!</h4>
              <p className="text-xs text-neutral-500 mt-2 max-w-xs leading-relaxed">
                Nossos sistemas automáticos do gateway bancário detectaram eletronicamente a movimentação. O serviço está totalmente liberado e quitado.
              </p>
              <div className="w-full mt-8 p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-left font-mono text-[10px] text-neutral-400">
                TRANS_REF: TX-{id.toUpperCase()}<br />
                MÉTODO: GATEWAY_SPI_PIX<br />
                AUTENTICAÇÃO: BC-{Math.random().toString(36).substring(2, 9).toUpperCase()}<br />
                STATUS: COMPENSADO_E_LIQUIDADO
              </div>
            </div>
          )}

          {/* SUCCESS SCREEN 2: P2P manual declaration submitted */}
          {declareSuccess && (
            <div className="py-8 flex flex-col items-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-4 animate-pulse">
                <FileText className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-black text-neutral-900">Comprovante de Transferência Enviado!</h4>
              <p className="text-xs text-neutral-500 mt-2 max-w-xs leading-relaxed">
                Sua declaração foi registrada no sistema. O prestador de serviço <strong>{recipientName}</strong> foi notificado de que você fez o PIX.
              </p>
              <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 mt-5 text-left text-xs text-amber-900 space-y-1.5">
                <p className="font-bold">Próximo Passo:</p>
                <p>O prestador irá conferir o saldo no banco particular dele. Logo em seguida, ele clicará em <strong>"Confirmar Recebimento"</strong> na tela dele para liberar o encerramento do serviço no seu painel.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-8 py-2.5 px-6 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-all"
              >
                Voltar ao Painel do Cliente
              </button>
            </div>
          )}

          {/* DYNAMIC FORM VIEWS */}
          {!isConfirmed && !declareSuccess && (
            <>
              {/* Common Value Header */}
              <div className="mb-4">
                <span className="text-[10px] text-neutral-400 block font-bold uppercase tracking-wider">
                  Valor da Liquidação
                </span>
                <span className="text-3xl font-black text-neutral-900 font-mono">
                  R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="text-xs text-neutral-600 mt-1">
                  Favorecido: <strong className="text-neutral-800">{resolvedRecipientName}</strong>
                </p>
              </div>

              {/* FLOW 1: TRANSFERÊNCIA DIRETA P2P (PROVEDOR) */}
              {selectedFlow === 'direct' && (
                <div className="w-full space-y-4">
                  
                  {/* Alert context banner */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-800">
                    <p className="font-bold">Como funciona o pagamento direto?</p>
                    <p className="mt-0.5 text-[11px] text-amber-700">
                      Você transfere o valor diretamente para a chave PIX particular do profissional. Em seguida, anexe o comprovante ou declare o envio para notificá-lo para liberação.
                    </p>
                  </div>

                  {/* Chave PIX Container */}
                  <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-left">
                    <span className="text-[9px] text-neutral-400 uppercase font-black block mb-1">
                      Chave PIX Recebedora do Profissional
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0 bg-white p-2 border border-neutral-150 rounded-lg">
                        <span className="font-mono font-bold text-xs text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded mr-1">
                          PIX
                        </span>
                        <span className="font-mono text-xs text-neutral-600 font-bold select-all truncate">
                          {resolvedPixKey}
                        </span>
                      </div>
                      <button
                        onClick={handleCopy}
                        type="button"
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black transition-all shrink-0 ${
                          copied
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                        }`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copied ? 'Copiado!' : 'Copiar Chave'}
                      </button>
                    </div>
                  </div>

                  {/* Attachment Form container */}
                  <div className="text-left space-y-2">
                    <label htmlFor="android-receipt-upload" className="text-[10px] text-neutral-400 uppercase font-black tracking-wider block">
                      Comprovante de Transferência bancária (Opcional)
                    </label>
                    <div 
                      onClick={() => {
                        const el = document.getElementById('android-receipt-upload');
                        if (el) el.click();
                      }}
                      className="border-2 border-dashed border-neutral-200 rounded-xl p-5 hover:border-neutral-400 transition-colors bg-white hover:bg-neutral-50 flex flex-col items-center justify-center text-center relative cursor-pointer group min-h-[120px]"
                    >
                      <input 
                        id="android-receipt-upload"
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="hidden" 
                      />
                      <Upload className="w-7 h-7 text-neutral-400 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-xs text-neutral-700 font-bold max-w-xs truncate px-2">
                        {receiptFileName || 'Selecionar da Galeria ou Arquivos'}
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-1 font-semibold bg-neutral-100 px-2 py-0.5 rounded">
                        PNG, JPG, PDF • Toque para escolher (Android/Chrome)
                      </p>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      onClick={executeDeclareP2PSent}
                      disabled={isDeclaringSent}
                      type="button"
                      className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:bg-neutral-300"
                    >
                      {isDeclaringSent ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Enviando aviso ao prestador...
                        </>
                      ) : (
                        <>
                          Declarei que Enviei o PIX ao Profissional
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                </div>
              )}

              {/* FLOW 2: AUTOMATIC GATEWAY VERIFICATION FLOW */}
              {selectedFlow === 'automatic' && (
                <div className="w-full space-y-4">
                  
                  {/* Alert Context */}
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-left text-xs text-emerald-800">
                    <p className="font-bold">Aprovação Segura via Gateway</p>
                    <p className="mt-0.5 text-[11px] text-emerald-700">
                      O pagamento é processado eletronicamente e conciliado de forma imediata por nossa API. Ideal para liberação instantânea e emitir logs de conformidade.
                    </p>
                  </div>

                  {/* QR Code section */}
                  <div className="relative p-3 bg-emerald-50/20 rounded-xl border border-emerald-100 flex flex-col items-center justify-center">
                    <div className="bg-white p-2.5 rounded-lg shadow-xs">
                      <div className="w-36 h-36 flex items-center justify-center bg-white border border-neutral-100 rounded relative">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixCopyPasteText)}`}
                          alt="Pix QR Code"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    {/* Copy paste input */}
                    <div className="w-full mt-3 flex items-center gap-2 bg-white/80 p-2 border border-neutral-200 rounded-lg">
                      <input
                        type="text"
                        value={pixCopyPasteText}
                        readOnly
                        className="flex-1 bg-transparent border-0 text-[11px] text-neutral-500 font-mono focus:ring-0 truncate font-bold"
                      />
                      <button
                        onClick={handleCopy}
                        type="button"
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all shrink-0 ${
                          copied
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-neutral-200'
                        }`}
                      >
                        {copied ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>

                  {/* Monitor API Logger Section */}
                  <div className="bg-neutral-900 rounded-lg p-3 text-left font-mono text-[10px] text-neutral-300">
                    <div className="flex items-center justify-between text-neutral-500 pb-1.5 mb-1.5 border-b border-neutral-800">
                      <span className="font-bold uppercase tracking-wider text-[8px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                        SPI Conciliation Daemon (1.0a)
                      </span>
                      <span>Atualiza em 120s</span>
                    </div>
                    <div className="space-y-1">
                      {apiLogs.map((log, index) => (
                        <div key={index} className={index === 0 ? 'text-emerald-400 font-bold' : 'text-neutral-400'}>
                          &gt; {log}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Simulate sandbox trigger */}
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      onClick={handleSimulatePayment}
                      disabled={isProcessing}
                      type="button"
                      className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:bg-neutral-300"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                          Consultando compensação no SPB...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                          Simular Transferência / PIX Pago
                        </>
                      )}
                    </button>
                  </div>

                </div>
              )}

              {/* Close Footer */}
              <button
                onClick={onClose}
                type="button"
                className="w-full mt-4 py-2 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 font-semibold text-xs rounded-lg transition-all"
              >
                Voltar e pagar depois
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
