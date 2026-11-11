import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useShiftStore } from '../../store/useShiftStore';
import { db } from '../../db';

export const CashMovementModal: React.FC = () => {
  const { cashMovementModalOpen, setCashMovementModalOpen, cashMovementType, setCashMovementType } = useUIStore();
  const { recordMovement, currentCashDrawer, cashierName, currentShift } = useShiftStore();

  const [amount, setAmount] = useState('50.00');
  const [reason, setReason] = useState('Midday cash drop to back office safe');

  if (!cashMovementModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseFloat(amount) || 0;
    if (amtNum <= 0) return;

    await recordMovement(cashMovementType, amtNum);

    // Save movement to local database
    await db.cashMovements.add({
      id: `CM-${Date.now()}`,
      shiftId: currentShift ? currentShift.id : 'shift-101',
      type: cashMovementType,
      amount: amtNum,
      reason: reason.trim(),
      timestamp: Date.now(),
      cashierName,
    });

    setCashMovementModalOpen(false);
  };

  const isPayIn = cashMovementType === 'pay_in';

  return (
    <div 
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none"
    >
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isPayIn ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {isPayIn ? <ArrowUpRight className="w-5 h-5 stroke-[2.5]" /> : <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#43AAA9]">
                Cash Drawer Movement
              </span>
              <h3 className="text-base font-bold text-slate-800">
                {isPayIn ? 'Record Pay In (Deposit)' : 'Record Pay Out (Cash Drop)'}
              </h3>
            </div>
          </div>
          <button 
            onClick={() => setCashMovementModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setCashMovementType('pay_in')}
              className={`py-2 rounded-xl font-bold transition-all ${
                isPayIn ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              + Pay In (Add Cash)
            </button>
            <button
              type="button"
              onClick={() => setCashMovementType('pay_out')}
              className={`py-2 rounded-xl font-bold transition-all ${
                !isPayIn ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              - Pay Out (Remove Cash)
            </button>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center">
            <span className="text-slate-500">Current Drawer Total:</span>
            <span className="font-bold text-slate-800 text-sm">Rs. {currentCashDrawer.toLocaleString()}</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Movement Amount (Rs.)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-xl font-bold bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-[#43AAA9] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Reason / Description
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Grocery purchase, float top-up, safe drop"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-[#43AAA9] focus:outline-none"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setCashMovementModalOpen(false)}
              className="flex-1 py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 py-3 px-4 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.99] ${
                isPayIn ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isPayIn ? 'Confirm Pay In' : 'Confirm Pay Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
