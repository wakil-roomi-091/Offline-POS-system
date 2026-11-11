import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useCartStore } from '../../store/useCartStore';
import { useUIStore } from '../../store/useUIStore';
import { useShiftStore } from '../../store/useShiftStore';
import { db } from '../../db';
import type { PaymentMethod, Transaction } from '../../types';

export const PaymentModal: React.FC = () => {
  const { cart, getTotal, getSubtotal, getTax, clearCart, orderNote } = useCartStore();
  const { 
    paymentModalOpen, 
    setPaymentModalOpen, 
    setSaleSuccessModalOpen, 
    setLastCompletedTransaction 
  } = useUIStore();
  const { recordCashSale, cashierName, station } = useShiftStore();

  const total = getTotal();
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [tenderAmount, setTenderAmount] = useState<string>('20.00');

  useEffect(() => {
    if (paymentModalOpen) {
      const initialTender = total <= 20 ? 20 : Math.ceil(total / 10) * 10;
      setTenderAmount(initialTender.toFixed(2));
    }
  }, [paymentModalOpen, total]);

  const cashReceived = parseFloat(tenderAmount) || 0;
  const change = cashReceived - total;

  const handleTenderChange = (val: string) => {
    setTenderAmount(val);
  };

  const setTender = (val: number) => {
    setTenderAmount(val.toFixed(2));
  };

  const setExactTender = () => {
    setTenderAmount(total.toFixed(2));
  };

  const handleConfirmPayment = async () => {
    const received = parseFloat(tenderAmount) || total;
    const changeDueAmount = Math.max(0, received - total);

    const transaction: Transaction = {
      id: `TX-${Date.now().toString().slice(-6)}`,
      orderNumber: Math.floor(1000 + Math.random() * 9000),
      items: [...cart],
      subtotal: getSubtotal(),
      tax: getTax(),
      discount: 0,
      total,
      paymentMethod: method,
      amountReceived: received,
      changeDue: changeDueAmount,
      status: 'completed',
      timestamp: Date.now(),
      cashierName,
      station,
      notes: orderNote,
    };

    // Save to local offline database
    await db.transactions.add(transaction);

    // Record cash drawer movement if cash
    if (method === 'cash') {
      recordCashSale(total);
    }

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#3FA9A8', '#43AAA9', '#359392', '#10B981'],
      });
    } catch {
      // ignore
    }

    setLastCompletedTransaction(transaction);
    setPaymentModalOpen(false);
    setSaleSuccessModalOpen(true);
    clearCart();
  };

  if (!paymentModalOpen) return null;

  return (
    <div 
      aria-labelledby="modalTitle" 
      aria-modal="true" 
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-opacity duration-200 select-none animate-in fade-in" 
      id="paymentModal" 
      role="dialog"
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 transform transition-transform duration-200 scale-100" 
        id="modalContainer"
      >
        {/* Modal Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-[#43AAA9]">Desktop Offline Checkout</span>
            <h3 className="text-lg font-bold text-slate-800" id="modalTitle">Process Transaction</h3>
          </div>
          <button 
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white transition-colors" 
            onClick={() => setPaymentModalOpen(false)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount To Pay Card */}
          <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-teal-800">Total Payable:</span>
            <span className="text-3xl font-extrabold text-[#3FA9A8]" id="modalPayableAmount">${total.toFixed(2)}</span>
          </div>

          {/* Payment Methods */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Select Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                type="button" 
                onClick={() => setMethod('cash')}
                className={`pay-method-btn flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                  method === 'cash' 
                    ? 'active border-2 border-[#43AAA9] bg-teal-50/40 text-xs font-semibold text-teal-900' 
                    : 'border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600'
                }`}
              >
                <svg className={`w-5 h-5 mb-1 ${method === 'cash' ? 'text-[#43AAA9]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                Cash
              </button>

              <button 
                type="button" 
                onClick={() => setMethod('card')}
                className={`pay-method-btn flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                  method === 'card' 
                    ? 'active border-2 border-[#43AAA9] bg-teal-50/40 text-xs font-semibold text-teal-900' 
                    : 'border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600'
                }`}
              >
                <svg className={`w-5 h-5 mb-1 ${method === 'card' ? 'text-[#43AAA9]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                Card Terminal
              </button>

              <button 
                type="button" 
                onClick={() => setMethod('qr')}
                className={`pay-method-btn flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                  method === 'qr' 
                    ? 'active border-2 border-[#43AAA9] bg-teal-50/40 text-xs font-semibold text-teal-900' 
                    : 'border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600'
                }`}
              >
                <svg className={`w-5 h-5 mb-1 ${method === 'qr' ? 'text-[#43AAA9]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                QR / Wallet
              </button>
            </div>
          </div>

          {/* Cash Details & Quick Denominations */}
          {method === 'cash' && (
            <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60" id="cashCalcSection">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-600">Quick Cash Tender:</span>
                <div className="flex gap-1.5" id="quickCashButtons">
                  <button className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-teal-50 hover:border-teal-300" onClick={() => setTender(20)}>$20</button>
                  <button className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-teal-50 hover:border-teal-300" onClick={() => setTender(30)}>$30</button>
                  <button className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-teal-50 hover:border-teal-300" onClick={() => setTender(50)}>$50</button>
                  <button className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-teal-50 hover:border-teal-300" onClick={setExactTender}>Exact</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cash Received ($)</label>
                  <input 
                    className="w-full text-base font-bold bg-white text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#43AAA9] focus:border-[#43AAA9] px-3 py-2" 
                    id="cashReceivedInput" 
                    onChange={(e) => handleTenderChange(e.target.value)} 
                    step="0.01" 
                    type="number" 
                    value={tenderAmount}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Change Due</label>
                  <div 
                    className={
                      change < 0
                        ? "w-full text-base font-extrabold bg-rose-50 text-rose-600 rounded-xl px-3 py-2 border border-rose-200 flex items-center"
                        : "w-full text-base font-extrabold bg-emerald-50 text-emerald-600 rounded-xl px-3 py-2 border border-emerald-200 flex items-center"
                    } 
                    id="changeDueDisplay"
                  >
                    {change < 0 ? `-$${Math.abs(change).toFixed(2)}` : `$${change.toFixed(2)}`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {method === 'card' && (
            <div className="bg-slate-50 p-4 rounded-2xl text-center space-y-1.5 border border-slate-200/60">
              <svg className="w-8 h-8 mx-auto text-[#43AAA9] animate-bounce stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-xs font-bold text-slate-800">Tap, Insert, or Swipe Card on Terminal</p>
              <p className="text-[11px] text-slate-400">Station 1 terminal awaiting contactless / EMV chip...</p>
            </div>
          )}

          {method === 'qr' && (
            <div className="bg-slate-50 p-4 rounded-2xl text-center space-y-2 border border-slate-200/60">
              <div className="w-24 h-24 mx-auto bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center">
                <svg className="w-16 h-16 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <p className="text-xs font-bold text-slate-800">Customer Scan to Pay</p>
              <p className="text-[11px] text-slate-400">Supports Apple Pay, Google Wallet & Local Digital Wallets</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button 
            className="flex-1 py-3 px-4 border border-slate-200 hover:bg-white text-slate-600 text-xs font-semibold rounded-xl transition-colors" 
            onClick={() => setPaymentModalOpen(false)}
          >
            Cancel
          </button>
          <button 
            className="flex-1 py-3 px-4 bg-[#43AAA9] hover:bg-[#389a99] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]" 
            onClick={handleConfirmPayment}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            Confirm &amp; Print Bill
          </button>
        </div>
      </div>
    </div>
  );
};
