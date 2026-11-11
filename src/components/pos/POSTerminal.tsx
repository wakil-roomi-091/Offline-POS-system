import React from 'react';
import { CreditCard, RotateCcw, Landmark, ArrowLeftRight } from 'lucide-react';
import { MetricCards } from './MetricCards';
import { CartPanel } from './CartPanel';
import { ProductCatalog } from './ProductCatalog';
import { useCartStore } from '../../store/useCartStore';
import { useShiftStore } from '../../store/useShiftStore';
import { useUIStore } from '../../store/useUIStore';

export const POSTerminal: React.FC = () => {
  const { cart, getTotal, clearCart } = useCartStore();
  const { currentShift, station } = useShiftStore();
  const { 
    setPaymentModalOpen, 
    setOpeningCashModalOpen, 
    setCashMovementModalOpen, 
    setCashMovementType 
  } = useUIStore();

  const total = getTotal();
  const totalItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (confirm('Are you sure you want to clear the current order?')) {
      clearCart();
    }
  };

  return (
    <div className="flex flex-col gap-6 select-none font-sans" data-purpose="pos-terminal-container">
      {/* Page Header (Consistent with all app views) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" data-purpose="pos-terminal-header">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Point of Sale (POS)</h1>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {currentShift?.status === 'open' ? 'Shift Active' : 'Shift Closed'} • {station}
            </span>
            {totalItemCount > 0 && (
              <span className="bg-teal-50 text-[#3FA9A8] border border-teal-200 text-xs font-semibold px-2.5 py-0.5 rounded-full hidden md:inline-flex items-center gap-1">
                {totalItemCount} {totalItemCount === 1 ? 'Item' : 'Items'} in Sale
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Fast counter checkout, dish customization, order management, and instant receipt generation.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOpeningCashModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs transition active:scale-[0.99] cursor-pointer"
            title="Update Opening Cash Float"
          >
            <Landmark className="w-3.5 h-3.5 text-slate-500" />
            <span>Cash Float</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCashMovementType('pay_in');
              setCashMovementModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs transition active:scale-[0.99] cursor-pointer"
            title="Record Cash In or Out Movement"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Petty Cash</span>
          </button>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={handleClearCart}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 shadow-2xs transition active:scale-[0.99] cursor-pointer"
              title="Clear current cart items"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              <span>Reset Cart</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setPaymentModalOpen(true)}
            disabled={cart.length === 0}
            className="inline-flex items-center gap-2 bg-[#3FA9A8] hover:bg-[#349695] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all cursor-pointer active:scale-98"
          >
            <CreditCard className="w-4 h-4" />
            <span>Pay (${total.toFixed(2)})</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards (4 Stats Cards) */}
      <MetricCards />

      {/* Workspace Grid (2 Columns: Current Sale / Product Catalog) */}
      <section 
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" 
        data-purpose="pos-workspace"
      >
        <CartPanel />
        <ProductCatalog />
      </section>
    </div>
  );
};
