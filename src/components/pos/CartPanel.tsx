import React from 'react';
import { useCartStore } from '../../store/useCartStore';
import { useUIStore } from '../../store/useUIStore';

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

  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();

  const handlePromptNote = () => {
    const note = prompt("Enter kitchen instruction or order note:", orderNote || "No onions / Extra napkins");
    if (note !== null && note.trim() !== "") {
      setOrderNote(note.trim());
    } else if (note !== null && note.trim() === "") {
      setOrderNote('');
    }
  };

  return (
    <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[580px]">
      <div>
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800 tracking-tight">Current Sale</h2>
          <button className="text-slate-400 hover:text-slate-600 p-1 rounded">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="4" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="10" cy="16" r="1.5" />
            </svg>
          </button>
        </div>

        {/* Dynamic Cart Items List */}
        <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1 mt-1" id="cartItemsContainer">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <svg className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-xs font-medium">Cart is currently empty</p>
              <p className="text-[11px] text-slate-400">Click items on the right to add</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs gap-2">
                {/* Item Icon & Name */}
                <div className="flex items-center gap-2.5 w-44 shrink-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-base shrink-0 border border-slate-200/70">
                    {item.icon}
                  </div>
                  <div className="truncate">
                    <div className="font-medium text-slate-800 truncate">{item.name}</div>
                    <div className="text-[11px] text-slate-400">${item.price.toFixed(2)}</div>
                  </div>
                </div>

                {/* Compact Counter Pill [- Qty +] */}
                <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-xs">
                  <button 
                    onClick={() => updateQty(item.id, -1)} 
                    className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-100 font-bold"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-slate-800">{item.qty}</span>
                  <button 
                    onClick={() => updateQty(item.id, 1)} 
                    className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-100 font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Item Line Total */}
                <div className="w-14 text-right font-bold text-slate-800">
                  ${(item.price * item.qty).toFixed(2)}
                </div>

                {/* Delete Trash Icon */}
                <button 
                  onClick={() => removeFromCart(item.id)} 
                  className="text-slate-300 hover:text-rose-500 p-1 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Note Button */}
        <div className="pt-3">
          <button 
            className="text-xs font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors" 
            onClick={handlePromptNote}
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <span id="noteTextDisplay">{orderNote ? `Note: ${orderNote}` : '+ Add Note'}</span>
          </button>
        </div>
      </div>

      {/* Cart Bottom Totals & Actions */}
      <div className="pt-4 border-t border-slate-100 mt-4">
        <div className="space-y-1.5 text-xs text-slate-500 mb-4">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-700" id="subtotalDisplay">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (8%)</span>
            <span className="font-semibold text-slate-700" id="taxDisplay">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-baseline pt-2 text-slate-800">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-2xl font-bold tracking-tight text-slate-900" id="totalDisplay">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Cart Buttons */}
        <div className="grid grid-cols-12 gap-3">
          <button 
            className="col-span-4 bg-[#F2F4F7] hover:bg-slate-200 text-slate-700 font-semibold py-3 px-3 rounded-xl text-xs transition-colors" 
            onClick={clearCart}
          >
            Clear Cart
          </button>
          <button 
            className="col-span-8 bg-[#43AAA9] hover:bg-[#389a99] text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-sm shadow-teal-700/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer" 
            id="payButton" 
            onClick={() => {
              if (cart.length === 0) {
                alert("Please add items to cart first!");
                return;
              }
              setPaymentModalOpen(true);
            }}
          >
            <span>Pay</span>
            <span id="payBtnAmount">${total.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
