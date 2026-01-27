'use client';

import { useState } from 'react';
import { CreditCard, Lock, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { paymentApi } from '@/lib/api-client';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payment: any) => void;
  reservationId: string;
  amount: number;
  serviceName: string;
  token: string;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  reservationId,
  amount,
  serviceName,
  token,
}: PaymentModalProps) {
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [error, setError] = useState('');
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep('processing');

    try {
      // Step 1: Create payment intent
      const intentResponse = await paymentApi.createIntent(
        { reservationId, amount },
        token
      );

      setPaymentId(intentResponse.paymentId);

      // Step 2: Confirm mock payment
      const confirmResponse = await paymentApi.mockConfirm(
        {
          paymentId: intentResponse.paymentId,
          cardNumber: cardNumber.replace(/\s/g, ''),
          cardExpiry,
          cardCvc,
          cardName,
        },
        token
      );

      setStep('success');
      
      // Wait a moment before calling success callback
      setTimeout(() => {
        onSuccess(confirmResponse.payment);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error procesando el pago');
      setStep('error');
    }
  };

  const resetForm = () => {
    setStep('form');
    setError('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    setCardName('');
    setPaymentId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-emerald-500 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            disabled={step === 'processing'}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-3">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Pagar Servicio</h2>
              <p className="text-cyan-100 text-sm">{serviceName}</p>
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold">${amount.toFixed(2)} MXN</div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Demo Banner */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">Modo Demo</p>
                  <p className="text-amber-700 dark:text-amber-300">
                    Usa cualquier número de tarjeta válido (ej: 4242 4242 4242 4242)
                  </p>
                </div>
              </div>

              {/* Card Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre en la tarjeta
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Juan Pérez"
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              {/* Card Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Número de tarjeta
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    required
                    className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
                  />
                  <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
              </div>

              {/* Expiry and CVC */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Fecha de expiración
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    maxLength={5}
                    required
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    CVC
                  </label>
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    maxLength={4}
                    required
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold py-4 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5" />
                Pagar ${amount.toFixed(2)} MXN
              </button>

              <p className="text-xs text-center text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />
                Pago seguro con encriptación SSL
              </p>
            </form>
          )}

          {step === 'processing' && (
            <div className="py-12 text-center">
              <Loader2 className="w-16 h-16 text-cyan-500 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Procesando pago...
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Por favor espera mientras procesamos tu pago
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                ¡Pago exitoso!
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Tu pago ha sido procesado correctamente
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                (Modo demo - no se realizó ningún cargo real)
              </p>
            </div>
          )}

          {step === 'error' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Error en el pago
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {error}
              </p>
              <button
                onClick={resetForm}
                className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
