import React, { useState, useEffect } from 'react';
import { QrCode, CheckCircle, Copy, AlertCircle, Sparkles } from 'lucide-react';

interface PixPaymentModalProps {
  id: string; // reference id (request_id or subscription_id)
  title: string;
  recipientName: string;
  amount: number;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

export const PixPaymentModal: React.FC<PixPaymentModalProps> = ({
  id,
  title,
  recipientName,
  amount,
  onPaymentSuccess,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Generate a mock Copia e Cola string based on input parameters
  const pixCopyPasteText = `00020126580014BR.GOV.BCB.PIX0136${id}-recipient=${encodeURIComponent(
    recipientName.substring(0, 10)
  )}-amount=${amount.toFixed(2)}`;

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
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-neutral-100 flex flex-col">
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

              {/* Enhanced Simulated QR Code Container */}
              <div className="relative p-4 bg-emerald-50/50 rounded-xl mb-4 border border-emerald-100/60 flex items-center justify-center">
                <div className="bg-white p-2 rounded-lg shadow-xs">
                  {/* Since external resource referrers might block or flinch in iframe previews, 
                      we display an elegant styled QR representation centered inside the client canvas */}
                  <div className="w-40 h-40 flex items-center justify-center bg-neutral-50 border border-neutral-100 rounded relative">
                    <QrCode className="w-32 h-32 text-neutral-800" />
                    <div className="absolute inset-0 flex items-center justify-center bg-white/10">
                      <div className="bg-emerald-600 text-white p-1 rounded shadow-lg text-[10px] font-bold">
                        SEVERINU
                      </div>
                    </div>
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
                  Código Copia e Cola PIX
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
