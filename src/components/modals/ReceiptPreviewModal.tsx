import React from 'react';
import { X, Printer } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { format } from 'date-fns';

export const ReceiptPreviewModal: React.FC = () => {
  const { 
    receiptPreviewModalOpen, 
    setReceiptPreviewModalOpen, 
    lastCompletedTransaction,
    selectedTransaction 
  } = useUIStore();

  const transaction = selectedTransaction || lastCompletedTransaction;

  if (!receiptPreviewModalOpen || !transaction) return null;

  const handlePrintReceipt = () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.printReceipt();
    } else {
      window.print();
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-opacity animate-in fade-in select-none"
    >
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">80mm Thermal Receipt Preview</span>
          <button 
            onClick={() => setReceiptPreviewModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Body (Visual 80mm Paper Simulation) */}
        <div className="p-6 bg-[#FEFEFE] font-mono text-slate-800 text-[11px] leading-relaxed max-h-[460px] overflow-y-auto">
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h2 className="text-base font-bold tracking-tight text-slate-900">DINEPOS SUITE</h2>
            <p className="text-[10px] text-slate-500">124 MARKET STREET, SUITE 400</p>
            <p className="text-[10px] text-slate-500">TEL: +1 (555) 234-5678</p>
          </div>

          <div className="py-2.5 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
            <div className="flex justify-between">
              <span>ORDER: #{transaction.orderNumber}</span>
              <span>TX: {transaction.id}</span>
            </div>
            <div className="flex justify-between">
              <span>DATE: {format(transaction.timestamp, 'dd/MM/yyyy HH:mm')}</span>
              <span>STA: {transaction.station}</span>
            </div>
            <div className="flex justify-between">
              <span>SERVER: {transaction.cashierName}</span>
              <span className="uppercase">{transaction.status}</span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1.5">
            <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-slate-200">
              <span className="w-1/2">ITEM</span>
              <span className="w-1/4 text-center">QTY</span>
              <span className="w-1/4 text-right">AMT</span>
            </div>
            {transaction.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-[10px]">
                <span className="w-1/2 truncate font-medium">{item.name}</span>
                <span className="w-1/4 text-center">{item.qty}x</span>
                <span className="w-1/4 text-right font-semibold">
                  ${(item.price * item.qty).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>SUBTOTAL:</span>
              <span>${transaction.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>TAX (8%):</span>
              <span>${transaction.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>TOTAL:</span>
              <span>${transaction.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Tender & Change */}
          <div className="py-2.5 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
            <div className="flex justify-between">
              <span className="uppercase">PAID BY {transaction.paymentMethod}:</span>
              <span>${(transaction.amountReceived || transaction.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>CHANGE DUE:</span>
              <span>${(transaction.changeDue || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Footer & Barcode Simulation */}
          <div className="pt-4 text-center space-y-2">
            <p className="text-[10px] text-slate-500 font-sans">
              Thank you for dining with DinePos!
            </p>
            {/* Barcode bars */}
            <div className="flex items-center justify-center gap-0.5 h-8 pt-1">
              {[3,1,2,4,1,3,2,1,4,2,3,1,2,3,4,1,2,1,3,2,4,1,2,3,1,4,2,1,3].map((w, i) => (
                <div 
                  key={i} 
                  className="bg-slate-800 h-full" 
                  style={{ width: `${w}px` }} 
                />
              ))}
            </div>
            <p className="text-[9px] text-slate-400 font-mono tracking-widest">
              *{transaction.id}*
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
          <button
            onClick={() => setReceiptPreviewModalOpen(false)}
            className="flex-1 py-2.5 border border-slate-200 hover:bg-white text-slate-600 text-xs font-semibold rounded-xl"
          >
            Close
          </button>
          <button
            onClick={handlePrintReceipt}
            className="flex-1 py-2.5 bg-[#43AAA9] hover:bg-[#359392] text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Thermal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
