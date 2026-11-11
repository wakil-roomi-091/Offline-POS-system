import React, { useState } from 'react';
import { X, Landmark } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useShiftStore } from '../../store/useShiftStore';

export const OpeningCashModal: React.FC = () => {
  const { openingCashModalOpen, setOpeningCashModalOpen } = useUIStore();
  const { openShift, cashierName, station } = useShiftStore();
  const [openingFloat, setOpeningFloat] = useState('15000');

  if (!openingCashModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const floatNum = parseFloat(openingFloat) || 0;
    await openShift(floatNum);
    setOpeningCashModalOpen(false);
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none"
    >
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#3FA9A8] flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#43AAA9]">
                Shift Float Check-in
              </span>
              <h3 className="text-base font-bold text-slate-800">Opening Cash Dialog</h3>
            </div>
          </div>
          <button 
            onClick={() => setOpeningCashModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="bg-teal-50/60 p-3.5 rounded-2xl border border-teal-100 text-teal-800">
            <div className="font-semibold">{station}</div>
            <div className="text-[11px] text-teal-700/80">Cashier: {cashierName}</div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Counted Drawer Starting Cash (Rs.)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={openingFloat}
              onChange={(e) => setOpeningFloat(e.target.value)}
              className="w-full text-xl font-bold bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-[#43AAA9] focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Physical cash float present in cash drawer before opening registers.
            </p>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setOpeningCashModalOpen(false)}
              className="flex-1 py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-[#43AAA9] hover:bg-[#359392] text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.99]"
            >
              Open Shift
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
