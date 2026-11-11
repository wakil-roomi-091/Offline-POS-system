import { X, Printer } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { format } from 'date-fns';

export const TransactionDetailsModal: React.FC = () => {
  const { 
    transactionDetailsModalOpen, 
    setTransactionDetailsModalOpen, 
    selectedTransaction, 
    setReceiptPreviewModalOpen 
  } = useUIStore();

  if (!transactionDetailsModalOpen || !selectedTransaction) return null;

  const handlePrint = () => {
    setReceiptPreviewModalOpen(true);
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#43AAA9]">
              Audit Ledger Detail
            </span>
            <h3 className="text-base font-bold text-slate-800">
              Transaction {selectedTransaction.id}
            </h3>
          </div>
          <button 
            onClick={() => setTransactionDetailsModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[460px] overflow-y-auto text-xs">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <span className="text-slate-400 font-medium">Order Number:</span>
              <div className="font-bold text-slate-800 text-sm">#{selectedTransaction.orderNumber}</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Timestamp:</span>
              <div className="font-bold text-slate-800">
                {format(selectedTransaction.timestamp, 'dd MMM yyyy, HH:mm:ss')}
              </div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Station & Server:</span>
              <div className="font-bold text-slate-800">
                {selectedTransaction.station} ({selectedTransaction.cashierName})
              </div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Payment Status:</span>
              <div>
                <span className="capitalize font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                  {selectedTransaction.status} via {selectedTransaction.paymentMethod}
                </span>
              </div>
            </div>
          </div>

          {/* Itemized breakdown */}
          <div>
            <h4 className="font-bold text-slate-800 mb-2">Ordered Items</h4>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
              {selectedTransaction.items.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <div className="font-bold text-slate-800">{item.name}</div>
                      <div className="text-[11px] text-slate-400">
                        Rs. {item.price.toLocaleString()} × {item.qty}
                        {item.variation && <span className="ml-1 text-teal-600">({item.variation})</span>}
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-slate-800">
                    Rs. {(item.price * item.qty).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="p-4 bg-slate-50 rounded-2xl space-y-1.5 border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-bold text-slate-700">Rs. {selectedTransaction.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tax</span>
              <span className="font-bold text-slate-700">Rs. {selectedTransaction.tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200/60 pt-2">
              <span>Total Amount</span>
              <span className="text-[#3FA9A8]">Rs. {selectedTransaction.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
          <button
            onClick={() => setTransactionDetailsModalOpen(false)}
            className="flex-1 py-2.5 border border-slate-200 hover:bg-white text-slate-600 text-xs font-semibold rounded-xl"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-[#43AAA9] hover:bg-[#359392] text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Reprint Bill</span>
          </button>
        </div>
      </div>
    </div>
  );
};
