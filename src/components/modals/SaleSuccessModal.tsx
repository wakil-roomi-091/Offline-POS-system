import { CheckCircle2, Printer, PlusCircle } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

export const SaleSuccessModal: React.FC = () => {
  const { 
    saleSuccessModalOpen, 
    setSaleSuccessModalOpen, 
    lastCompletedTransaction, 
    setReceiptPreviewModalOpen 
  } = useUIStore();

  if (!saleSuccessModalOpen || !lastCompletedTransaction) return null;

  const handlePrint = () => {
    setReceiptPreviewModalOpen(true);
  };

  const handleNewOrder = () => {
    setSaleSuccessModalOpen(false);
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-opacity animate-in fade-in select-none"
    >
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 transform transition-transform scale-100">
        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
            <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
          </div>

          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              Payment Verified
            </span>
            <h3 className="text-xl font-bold text-slate-800 mt-2">
              Order #{lastCompletedTransaction.orderNumber} Completed!
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Transaction ID: <span className="font-mono text-slate-600">{lastCompletedTransaction.id}</span>
            </p>
          </div>

          {/* Breakdown summary card */}
          <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2 border border-slate-100 text-left">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Amount</span>
              <span className="font-bold text-slate-800 text-sm font-mono">
                Rs. {Math.round(lastCompletedTransaction.total).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Payment Tender</span>
              <span className="font-bold uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                {lastCompletedTransaction.paymentMethod === 'credit' ? 'Khata (Credit)' : lastCompletedTransaction.paymentMethod}
              </span>
            </div>
            {lastCompletedTransaction.customerName && (
              <div className="flex justify-between">
                <span className="text-slate-400">Account / Customer</span>
                <span className="font-bold text-slate-800">
                  {lastCompletedTransaction.customerName}
                </span>
              </div>
            )}
            {lastCompletedTransaction.changeDue !== undefined && lastCompletedTransaction.changeDue > 0 && (
              <div className="flex justify-between border-t border-slate-200/60 pt-2 font-bold text-emerald-600 font-mono">
                <span>Change Returned</span>
                <span>Rs. {Math.round(lastCompletedTransaction.changeDue).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>View Receipt</span>
          </button>

          <button
            onClick={handleNewOrder}
            className="flex-1 py-3 px-4 bg-[#43AAA9] hover:bg-[#359392] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Order</span>
          </button>
        </div>
      </div>
    </div>
  );
};
