import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCartStore } from '../../store/useCartStore';
import { useUIStore } from '../../store/useUIStore';
import { db } from '../../db';
import { ShoppingBag, Trash2, Plus, Minus, FileText } from 'lucide-react';

export const CartPanel: React.FC = () => {
  const { 
    cart, 
    updateQty, 
    removeFromCart, 
    clearCart, 
    getSubtotal, 
    getTax, 
    getTotal, 
    orderNote, 
    setOrderNote 
  } = useCartStore();
  const { setPaymentModalOpen } = useUIStore();

  const products = useLiveQuery(() => db.products.toArray(), []) || [];

  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();

  const handlePromptNote = () => {
    const note = prompt("Enter kitchen instruction or order note:", orderNote || "Dine-In / Table 1");
    if (note !== null) {
      setOrderNote(note.trim());
    }
  };

  const handleIncrement = (productId: string, itemId: string) => {
    const product = products.find(p => p.id === productId);
    const maxStock = product ? (product.stock ?? 9999) : 9999;
    updateQty(itemId, 1, maxStock);
  };

  return (
    <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[580px] select-none">
      <div>
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">Current Sale</h2>
            <span className="text-[11px] text-slate-400">
              {cart.reduce((sum, i) => sum + i.qty, 0)} items selected
            </span>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition cursor-pointer"
            >
              Clear Order
            </button>
          )}
        </div>

        {/* Dynamic Cart Items List */}
        <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto pr-1 mt-1" id="cartItemsContainer">
          {cart.length === 0 ? (
            <div className="py-14 text-center text-slate-400 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-2">
                <ShoppingBag className="w-6 h-6 stroke-1" />
              </div>
              <p className="text-xs font-medium text-slate-600">Cart is currently empty</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click dishes or items on the left to add</p>
            </div>
          ) : (
            cart.map((item) => {
              const product = products.find(p => p.id === item.productId);
              const maxStock = product?.stock ?? 9999;

              return (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs gap-2">
                  {/* Item Icon & Name */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-base shrink-0 border border-slate-200/70">
                      {item.icon}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-slate-800 truncate">{item.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span>Rs. {item.price.toLocaleString()}</span>
                        {item.variation && (
                          <span className="text-[#3FA9A8] font-medium">({item.variation})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Compact Counter Pill [- Qty +] */}
                  <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                    <button 
                      type="button"
                      onClick={() => updateQty(item.id, -1)} 
                      className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-100 font-bold transition cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-800">{item.qty}</span>
                    <button 
                      type="button"
                      onClick={() => handleIncrement(item.productId, item.id)} 
                      className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-100 font-bold transition cursor-pointer"
                      title={`Max available stock: ${maxStock}`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Item Line Total */}
                  <div className="w-20 text-right font-bold text-slate-900 font-mono">
                    Rs. {(item.price * item.qty).toLocaleString()}
                  </div>

                  {/* Delete Trash Icon */}
                  <button 
                    type="button"
                    onClick={() => removeFromCart(item.id)} 
                    className="text-slate-300 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Add Note Button */}
        <div className="pt-3">
          <button 
            type="button"
            className="text-xs font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer" 
            onClick={handlePromptNote}
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>{orderNote ? `Note: ${orderNote}` : '+ Add Kitchen Note / Table'}</span>
          </button>
        </div>
      </div>

      {/* Cart Bottom Totals & Actions */}
      <div className="pt-4 border-t border-slate-100 mt-4">
        <div className="space-y-1.5 text-xs text-slate-500 mb-4">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-800 font-mono">Rs. {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (8%)</span>
            <span className="font-semibold text-slate-800 font-mono">Rs. {Math.round(tax).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-baseline pt-2 text-slate-800">
            <span className="text-sm font-semibold">Total Due</span>
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              Rs. {Math.round(total).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Cart Buttons */}
        <div className="grid grid-cols-12 gap-3">
          <button 
            type="button"
            className="col-span-4 bg-[#F2F4F7] hover:bg-slate-200 text-slate-700 font-semibold py-3 px-3 rounded-xl text-xs transition-colors cursor-pointer" 
            onClick={clearCart}
          >
            Clear
          </button>
          <button 
            type="button"
            className="col-span-8 bg-[#3FA9A8] hover:bg-[#349695] text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-xs active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={cart.length === 0}
            onClick={() => {
              if (cart.length === 0) {
                alert("Please add items to current sale first!");
                return;
              }
              setPaymentModalOpen(true);
            }}
          >
            <span>Proceed to Payment</span>
            <span className="font-mono">Rs. {Math.round(total).toLocaleString()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
