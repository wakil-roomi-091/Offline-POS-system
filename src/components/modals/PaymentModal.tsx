import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCartStore } from '../../store/useCartStore';
import { useUIStore } from '../../store/useUIStore';
import { useShiftStore } from '../../store/useShiftStore';
import { useSecurityStore } from '../../store/useSecurityStore';
import { db } from '../../db';
import type { PaymentMethod, Transaction, CartItem, Customer, CustomerLedgerEntry } from '../../types';
import { BookOpen, AlertTriangle } from 'lucide-react';

const EMPTY_CUSTOMERS: Customer[] = [];

const createTransactionRecord = (params: {
  cart: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  method: PaymentMethod;
  received: number;
  changeDue: number;
  cashierName: string;
  station: string;
  notes?: string;
  customerId?: string;
  customerName?: string;
}): Transaction => ({
  id: `TX-${Date.now().toString().slice(-6)}`,
  orderNumber: Math.floor(1000 + Math.random() * 9000),
  items: [...params.cart],
  subtotal: params.subtotal,
  tax: params.tax,
  discount: 0,
  total: params.total,
  paymentMethod: params.method,
  amountReceived: params.received,
  changeDue: params.changeDue,
  status: 'completed',
  timestamp: Date.now(),
  cashierName: params.cashierName,
  station: params.station,
  notes: params.notes,
  customerId: params.customerId,
  customerName: params.customerName,
});

const PaymentModalContent: React.FC = () => {
  const { cart, getTotal, getSubtotal, getTax, clearCart, orderNote } = useCartStore();
  const { 
    setPaymentModalOpen, 
    setSaleSuccessModalOpen, 
    setLastCompletedTransaction 
  } = useUIStore();
  const { recordCashSale, recordNonCashSale, cashierName, station } = useShiftStore();
  const { requestPinAuthorization } = useSecurityStore();

  const total = getTotal();
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  const liveCustomers = useLiveQuery(() => db.customers.toArray(), []) ?? EMPTY_CUSTOMERS;
  const chosenCustomer = liveCustomers.find((c) => c.id === selectedCustomerId);

  const [tenderAmount, setTenderAmount] = useState<string>(() => {
    const initialTender = total <= 500 ? (Math.ceil(total / 100) * 100 || 500) : (Math.ceil(total / 500) * 500);
    return initialTender.toString();
  });

  const cashReceived = parseFloat(tenderAmount) || 0;
  const change = cashReceived - total;

  const handleTenderChange = (val: string) => {
    setTenderAmount(val);
  };

  const setTender = (val: number) => {
    setTenderAmount(val.toString());
  };

  const setExactTender = () => {
    setTenderAmount(Math.round(total).toString());
  };

  const executeCheckout = async (targetCustomer?: Customer) => {
    const received = method === 'cash' ? (parseFloat(tenderAmount) || total) : total;
    const changeDueAmount = method === 'cash' ? Math.max(0, received - total) : 0;

    const transaction = createTransactionRecord({
      cart,
      subtotal: getSubtotal(),
      tax: getTax(),
      total,
      method,
      received,
      changeDue: changeDueAmount,
      cashierName,
      station,
      notes: orderNote,
      customerId: targetCustomer?.id,
      customerName: targetCustomer?.name,
    });

    // Save transaction, deduct stock, and update customer ledger if on credit
    await db.transaction(
      'rw',
      [db.transactions, db.products, db.customers, db.customerLedgers],
      async () => {
        // 1. Save transaction
        await db.transactions.add(transaction);

        // 2. Atomically deduct item quantities from stock
        for (const item of cart) {
          if (item.productId) {
            const product = await db.products.get(item.productId);
            if (product) {
              const currentStock = product.stock ?? 0;
              const newStock = Math.max(0, currentStock - item.qty);
              const isAvailable = newStock > 0;
              await db.products.update(item.productId, {
                stock: newStock,
                isAvailable,
              });
            }
          }
        }

        // 3. If credit sale, update Customer Balance and Ledger
        if (method === 'credit' && targetCustomer) {
          const newBalance = (targetCustomer.currentBalance || 0) + total;
          const ledgerEntry: CustomerLedgerEntry = {
            id: `LED-${Date.now().toString().slice(-6)}`,
            customerId: targetCustomer.id,
            timestamp: Date.now(),
            type: 'sale_credit',
            referenceId: transaction.id,
            description: `POS Credit Purchase (Order #${transaction.orderNumber})`,
            debit: total,
            credit: 0,
            runningBalance: newBalance,
            collectedBy: cashierName || 'Cashier',
          };

          await db.customerLedgers.add(ledgerEntry);
          await db.customers.update(targetCustomer.id, {
            currentBalance: newBalance,
            totalPurchases: (targetCustomer.totalPurchases || 0) + total,
          });
        }
      }
    );

    // Record shift register movement
    if (method === 'cash') {
      await recordCashSale(total);
    } else {
      await recordNonCashSale(method, total);
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

  const handleConfirmPayment = async () => {
    if (method === 'credit') {
      if (!selectedCustomerId) {
        alert('Please select a customer account for Khata / Credit checkout.');
        return;
      }
      const customer = liveCustomers.find((c) => c.id === selectedCustomerId);
      if (!customer) {
        alert('Selected customer could not be found.');
        return;
      }

      const willExceed = (customer.currentBalance || 0) + total > customer.creditLimit;
      const isBlocked = customer.status === 'blocked';

      if (isBlocked || willExceed) {
        const reason = isBlocked
          ? `Authorize credit sale for BLOCKED account (${customer.name})`
          : `Authorize credit sale exceeding limit by Rs. ${Math.round(
              customer.currentBalance + total - customer.creditLimit
            ).toLocaleString()}`;

        requestPinAuthorization(reason, () => {
          executeCheckout(customer);
        });
        return;
      }

      await executeCheckout(customer);
      return;
    }

    await executeCheckout();
  };

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
            <span className="text-xs uppercase font-bold tracking-wider text-[#3FA9A8]">Desktop Offline Checkout</span>
            <h3 className="text-lg font-bold text-slate-800" id="modalTitle">Process Transaction</h3>
          </div>
          <button 
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer" 
            onClick={() => setPaymentModalOpen(false)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Amount To Pay Card */}
          <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-teal-800">Total Payable:</span>
            <span className="text-3xl font-extrabold text-[#3FA9A8] font-mono" id="modalPayableAmount">
              Rs. {Math.round(total).toLocaleString()}
            </span>
          </div>

          {/* Payment Methods Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Select Payment Method</label>
            <div className="grid grid-cols-4 gap-2">
              <button 
                type="button" 
                onClick={() => setMethod('cash')}
                className={`pay-method-btn flex flex-col items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer ${
                  method === 'cash' 
                    ? 'active border-2 border-[#43AAA9] bg-teal-50/40 text-xs font-semibold text-teal-900' 
                    : 'border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600'
                }`}
              >
                <svg className={`w-5 h-5 mb-1 ${method === 'cash' ? 'text-[#43AAA9]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <span className="text-[11px]">Cash</span>
              </button>

              <button 
                type="button" 
                onClick={() => setMethod('card')}
                className={`pay-method-btn flex flex-col items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer ${
                  method === 'card' 
                    ? 'active border-2 border-[#43AAA9] bg-teal-50/40 text-xs font-semibold text-teal-900' 
                    : 'border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600'
                }`}
              >
                <svg className={`w-5 h-5 mb-1 ${method === 'card' ? 'text-[#43AAA9]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <span className="text-[11px]">Card</span>
              </button>

              <button 
                type="button" 
                onClick={() => setMethod('qr')}
                className={`pay-method-btn flex flex-col items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer ${
                  method === 'qr' 
                    ? 'active border-2 border-[#43AAA9] bg-teal-50/40 text-xs font-semibold text-teal-900' 
                    : 'border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600'
                }`}
              >
                <svg className={`w-5 h-5 mb-1 ${method === 'qr' ? 'text-[#43AAA9]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <span className="text-[11px]">QR / Wallet</span>
              </button>

              <button 
                type="button" 
                onClick={() => setMethod('credit')}
                className={`pay-method-btn flex flex-col items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer ${
                  method === 'credit' 
                    ? 'active border-2 border-[#43AAA9] bg-teal-50/40 text-xs font-semibold text-teal-900' 
                    : 'border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600'
                }`}
              >
                <BookOpen className={`w-5 h-5 mb-1 ${method === 'credit' ? 'text-[#43AAA9]' : 'text-slate-400'}`} />
                <span className="text-[11px]">Khata / Credit</span>
              </button>
            </div>
          </div>

          {/* Cash Details & Quick Denominations */}
          {method === 'cash' && (
            <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60" id="cashCalcSection">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-600">Quick Cash Tender:</span>
                <div className="flex flex-wrap gap-1.5" id="quickCashButtons">
                  <button type="button" className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-teal-50 hover:border-teal-300 cursor-pointer" onClick={() => setTender(500)}>Rs 500</button>
                  <button type="button" className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-teal-50 hover:border-teal-300 cursor-pointer" onClick={() => setTender(1000)}>Rs 1000</button>
                  <button type="button" className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-teal-50 hover:border-teal-300 cursor-pointer" onClick={() => setTender(5000)}>Rs 5000</button>
                  <button type="button" className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-teal-50 hover:border-teal-300 cursor-pointer" onClick={setExactTender}>Exact</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1" htmlFor="cashReceivedInput">Cash Received (Rs.)</label>
                  <input 
                    className="w-full text-base font-bold bg-white text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#43AAA9] focus:border-[#43AAA9] px-3 py-2 font-mono" 
                    id="cashReceivedInput" 
                    onChange={(e) => handleTenderChange(e.target.value)} 
                    step="1" 
                    type="number" 
                    value={tenderAmount}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Change Due</label>
                  <div 
                    className={
                      change < 0
                        ? "w-full text-base font-extrabold bg-rose-50 text-rose-600 rounded-xl px-3 py-2 border border-rose-200 flex items-center font-mono"
                        : "w-full text-base font-extrabold bg-emerald-50 text-emerald-600 rounded-xl px-3 py-2 border border-emerald-200 flex items-center font-mono"
                    } 
                    id="changeDueDisplay"
                  >
                    {change < 0 ? `-Rs. ${Math.abs(Math.round(change)).toLocaleString()}` : `Rs. ${Math.round(change).toLocaleString()}`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Khata / Credit Selection Section */}
          {method === 'credit' && (
            <div className="bg-slate-50/90 p-4 rounded-2xl space-y-3 border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700" htmlFor="customer-credit-select">Select Customer Account (Khata)</label>
                <span className="text-[11px] text-[#3FA9A8] font-semibold">{liveCustomers.length} registered accounts</span>
              </div>
              <select
                id="customer-credit-select"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:border-[#3FA9A8]"
              >
                <option value="">-- Choose Customer / Shop --</option>
                {liveCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) — Khata: Rs. {c.currentBalance.toLocaleString()}
                  </option>
                ))}
              </select>

              {chosenCustomer && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Credit Limit Ceiling:</span>
                    <span className="font-mono font-bold text-slate-800">Rs. {chosenCustomer.creditLimit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Current Outstanding Khata:</span>
                    <span className="font-mono font-bold text-amber-700">Rs. {chosenCustomer.currentBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-900 border-t border-slate-100 pt-1.5 font-bold">
                    <span>New Balance After Sale:</span>
                    <span className={`font-mono ${
                      chosenCustomer.currentBalance + total > chosenCustomer.creditLimit ? 'text-rose-600' : 'text-slate-900'
                    }`}>
                      Rs. {(chosenCustomer.currentBalance + total).toLocaleString()}
                    </span>
                  </div>

                  {chosenCustomer.currentBalance + total > chosenCustomer.creditLimit && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>Warning: Exceeds limit by Rs. {Math.round(chosenCustomer.currentBalance + total - chosenCustomer.creditLimit).toLocaleString()}. Supervisor PIN required.</span>
                    </div>
                  )}

                  {chosenCustomer.status === 'blocked' && (
                    <div className="p-2 bg-rose-100 border border-rose-300 rounded-lg text-rose-800 text-[11px] font-bold">
                      ⚠️ Customer account is BLOCKED from credit purchases. Supervisor PIN required to override.
                    </div>
                  )}
                </div>
              )}
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
              <p className="text-[11px] text-slate-400">Supports EasyPaisa, JazzCash, Apple Pay & Google Wallet</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button 
            type="button"
            className="flex-1 py-3 px-4 border border-slate-200 hover:bg-white text-slate-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer" 
            onClick={() => setPaymentModalOpen(false)}
          >
            Cancel
          </button>
          <button 
            type="button"
            className="flex-1 py-3 px-4 bg-[#3FA9A8] hover:bg-[#349695] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]" 
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

export const PaymentModal: React.FC = () => {
  const { paymentModalOpen } = useUIStore();
  if (!paymentModalOpen) return null;
  return <PaymentModalContent />;
};
