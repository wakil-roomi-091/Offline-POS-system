import React from 'react';
import { AlertOctagon, ShieldAlert, X } from 'lucide-react';
import type { Product } from '../../types';

interface OutOfStockModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSupervisorOverride?: () => void;
  requestedQty?: number;
}

export const OutOfStockModal: React.FC<OutOfStockModalProps> = ({
  product,
  isOpen,
  onClose,
  onSupervisorOverride,
  requestedQty = 1,
}) => {
  if (!isOpen || !product) return null;

  const currentStock = product.stock ?? 0;
  const isCompletelyZero = currentStock <= 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      data-purpose="out-of-stock-modal"
    >
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-rose-100 overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Alert Graphic */}
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner">
              <AlertOctagon className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase bg-white/25 px-2 py-0.5 rounded-full inline-block mb-1">
                Inventory Lock
              </span>
              <h3 className="text-xl font-bold leading-tight">
                {isCompletelyZero ? 'Item Out of Stock' : 'Stock Exceeded'}
              </h3>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-slate-700 text-sm">
          <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-xs shrink-0 border border-slate-100">
              {product.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-slate-900 truncate text-base">{product.name}</h4>
              <p className="text-xs text-slate-500">
                SKU: <span className="font-mono font-medium">{product.sku || 'N/A'}</span> • {product.category}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200/80">
              <span className="text-[11px] font-semibold text-rose-600 block">Available in Stock</span>
              <span className="text-lg font-bold text-rose-800">{currentStock} units</span>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-600 block">Requested Quantity</span>
              <span className="text-lg font-bold text-slate-800">{requestedQty} units</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed bg-amber-50/70 p-3 rounded-xl border border-amber-200/60 text-amber-900">
            Adding this item without restocking will lead to negative inventory. To maintain strict audit books, please restock from the supplier or request supervisor authorization to override.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          {onSupervisorOverride && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSupervisorOverride();
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Supervisor Override</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

