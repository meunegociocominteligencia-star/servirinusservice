import React, { useState, useEffect } from 'react';
import { QrCode, CheckCircle, Copy, AlertCircle, Sparkles } from 'lucide-react';
import { dbMemory } from '../supabase-service';
import { SystemSettings } from '../types';

interface PixPaymentModalProps {
  id: string; // reference id (request_id or subscription_id)
  title: string;
  recipientName: string;
  amount: number;
  onPaymentSuccess: () => void;
  onClose: () => void;
  recipientKey?: string; // Optional recipient Pix Key override
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
  recipientKey
}) => {
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Fetch administrator configuration settings for default keys
  const settingsArray = dbMemory.get<SystemSettings[]>('sev_system_settings') || [];
  const systemSettings = settingsArray[0];

  const resolvedPixKey = recipientKey || systemSettings?.pix_recipient_key || 'financeiro@severinu.com';
  const resolvedCity = systemSettings?.pix_recipient_city || 'SAO PAULO';

  // Generate standard BR Code Copy & Paste string
  const pixCopyPasteText = generatePixPayload({
    key: resolvedPixKey,
    name: recipientName,
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
    // Simulate webhook instant delay (1.5s bank communication)
    setTimeout(() => {
      setIsProcessing(false);
      setIsConfirmed(true);
      setTimeout(() => {
        onPaymentSuccess();
      }, 1500);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-neutral-100 flex flex-col animate-fade-in">
        {/* Banner header resembling a banking layout */}
        <div className="bg-emerald-600 text-white p-6 relative">
          <div className="absolute top-4 right-4 text-emerald-100 text-xs font-mono font-bold uppercase py-0.5 px-2 bg-emerald-700/60 rounded">
            Pix Instantâneo
          </div>
          <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider mb-1">
            Pagamento Seguro
          </p>
          <h3 className="text-lg font-bold truncate pr-16">{title}</h3>
        </div>

        <div className="p-6 flex-1 flex flex-col items-center text-center">
          {!isConfirmed ? (
            <>
              {/* Value and Recipient info */}
              <div className="mb-5">
                <span className="text-xs text-neutral-400 block font-medium uppercase">
                  Valor a Pagar
                </span>
                <span className="text-3xl font-black text-neutral-900">
                  R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="text-xs text-neutral-500 mt-1">
                  Favorecido: <strong className="text-neutral-700">{recipientName}</strong>
                </p>
              </div>

              {/* Real QR Code API integration for instant bank scanning compat */}
              <div className="relative p-4 bg-emerald-50/50 rounded-xl mb-4 border border-emerald-100/60 flex items-center justify-center">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <div className="w-40 h-40 flex items-center justify-center bg-white border border-neutral-100 rounded relative p-1">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixCopyPasteText)}`}
                      alt="Pix QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mb-5">
                Abra o aplicativo de seu banco participante do PIX, selecione a opção{' '}
                <strong>Pagar com QR Code / Pix</strong> e aponte a câmera para a imagem acima.
              </p>

              {/* Pix Copia e Cola widget */}
              <div className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-6 flex flex-col items-stretch text-left">
                <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1">
                  Código Copia e Cola PIX (Compatível com todos os bancos)
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pixCopyPasteText}
                    readOnly
                    className="flex-1 bg-transparent border-0 text-xs text-neutral-600 font-mono focus:ring-0 truncate"
                  />
                  <button
                    onClick={handleCopy}
                    id="btn-copy-pix"
                    type="button"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      copied
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200'
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              {/* Simulation Engine Button (AI Studio Interactive Advantage) */}
              <div className="w-full border-t border-neutral-100 pt-5 mt-auto flex flex-col gap-2">
                <button
                  onClick={handleSimulatePayment}
                  id="btn-sim-pay"
                  disabled={isProcessing}
                  type="button"
                  className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:bg-neutral-300"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processando Compensação Bancária...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                      Simular Pagamento PIX (Teste)
                    </>
                  )}
                </button>

                <button
                  onClick={onClose}
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl hover:bg-neutral-100 text-neutral-500 font-medium text-xs transition-all"
                >
                  Cancelar e fechar faturamento
                </button>
              </div>
            </>
          ) : (
            <div className="py-12 flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 animate-bounce">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-neutral-900">Pagamento Confirmado!</h4>
              <p className="text-xs text-neutral-500 mt-2 max-w-xs leading-relaxed">
                Nossos sistemas de webhook bancário detectaram instantaneamente a compensação. A operação foi atualizada e os logs foram autenticados com sucesso.
              </p>
              <div className="w-full mt-8 p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-left font-mono text-[10px] text-neutral-400">
                TRANS_REF: TX-{id.toUpperCase()}<br />
                STATUS: COMPENSADO_ONLINE<br />
                LOGGING_AUTOTRAIL: AT_COMPLETED
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
