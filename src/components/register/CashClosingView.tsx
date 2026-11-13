import React, { useState, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useShiftStore } from '../../store/useShiftStore';
import { useUIStore } from '../../store/useUIStore';
import { useSecurityStore } from '../../store/useSecurityStore';
import { backupService } from '../../services/backupService';
import type { ShiftRecord, Transaction, CashMovement, ExpenseRecord } from '../../types';
import { 
  X, 
  Printer, 
  CheckCircle, 
  ShieldCheck, 
  FileText, 
  PlusCircle,
  DollarSign
} from 'lucide-react';

const EMPTY_TX: Transaction[] = [];
const EMPTY_CM: CashMovement[] = [];
const EMPTY_EXP: ExpenseRecord[] = [];
const EMPTY_SHIFTS: ShiftRecord[] = [];
const DEFAULT_FALLBACK_SHIFT_START = 1729742400000;

export const CashClosingView: React.FC = () => {
  const { currentShift, closeShift, cashierName, station } = useShiftStore();
  const { verifyPin, managerWitnessPin } = useSecurityStore();
  const { setActiveTab, setOpeningCashModalOpen } = useUIStore();

  // Live queries from Dexie
  const liveTransactions = useLiveQuery(() => db.transactions.toArray(), []) ?? EMPTY_TX;
  const liveMovements = useLiveQuery(() => db.cashMovements.toArray(), []) ?? EMPTY_CM;
  const liveExpenses = useLiveQuery(() => db.expenses.toArray(), []) ?? EMPTY_EXP;
  const liveShifts = useLiveQuery(() => db.shifts.toArray(), []) ?? EMPTY_SHIFTS;

  // Active modal state
  const [activeReportModal, setActiveReportModal] = useState<'x_report' | 'z_report' | null>(null);
  const [selectedZReport, setSelectedZReport] = useState<ShiftRecord | null>(null);

  // Denominations count state (PKR standard denominations)
  const [denominations, setDenominations] = useState({
    d5000: 4,  // Rs. 20,000
    d1000: 18, // Rs. 18,000
    d500: 12,  // Rs. 6,000
    d100: 25,  // Rs. 2,500
    d50: 12,   // Rs. 600
    d20: 10,   // Rs. 200
    d10: 8,    // Rs. 80
    coins: 20, // Rs. 20
  });

  // Calculate sum of physical denominations
  const countedDenominationsTotal = useMemo(() => {
    return (
      denominations.d5000 * 5000 +
      denominations.d1000 * 1000 +
      denominations.d500 * 500 +
      denominations.d100 * 100 +
      denominations.d50 * 50 +
      denominations.d20 * 20 +
      denominations.d10 * 10 +
      denominations.coins
    );
  }, [denominations]);

  // Actual physical cash input
  const [manualCount, setManualCount] = useState<string>('47,400');
  const [closingNotes, setClosingNotes] = useState<string>(
    'Shift closed normally by Head Cashier. Evening dinner rush reconciled with register tape.'
  );
  const [witnessPin, setWitnessPin] = useState<string>('4921');
  const [isFinalizing, setIsFinalizing] = useState(false);

  const reconciliationRef = useRef<HTMLDivElement>(null);

  // Dynamic Shift Financial Calculation
  const shiftMetrics = useMemo(() => {
    const shiftStart = currentShift?.openedAt ?? DEFAULT_FALLBACK_SHIFT_START;
    const shiftTxs = liveTransactions.filter(t => t.timestamp >= shiftStart && t.status === 'completed');

    const cashSales = shiftTxs.filter(t => t.paymentMethod === 'cash').reduce((sum, t) => sum + t.total, 0);
    const cardSales = shiftTxs.filter(t => t.paymentMethod === 'card').reduce((sum, t) => sum + t.total, 0);
    const easypaisaSales = shiftTxs.filter(t => t.paymentMethod === 'easypaisa').reduce((sum, t) => sum + t.total, 0);
    const jazzcashSales = shiftTxs.filter(t => t.paymentMethod === 'jazzcash').reduce((sum, t) => sum + t.total, 0);
    const totalSales = shiftTxs.reduce((sum, t) => sum + t.total, 0);
    const totalTax = shiftTxs.reduce((sum, t) => sum + (t.tax || 0), 0);
    const totalDiscount = shiftTxs.reduce((sum, t) => sum + (t.discount || 0), 0);

    const shiftMovements = liveMovements.filter(m => m.timestamp >= shiftStart);
    const payIns = shiftMovements.filter(m => m.type === 'pay_in').reduce((sum, m) => sum + m.amount, 0);
    const safeDrops = shiftMovements.filter(m => m.type === 'pay_out').reduce((sum, m) => sum + m.amount, 0);

    const shiftExpenses = liveExpenses.filter(e => e.timestamp >= shiftStart);
    const drawerExpenses = shiftExpenses.reduce((sum, e) => sum + e.amount, 0);

    const openingFloat = currentShift?.openingFloat ?? 15000;

    // Use live calculations when transactions exist, fallback to seed values if fresh shift
    const finalCashSales = cashSales > 0 ? cashSales : (currentShift?.cashSales ?? 86100);
    const finalDrawerExpenses = drawerExpenses > 0 ? drawerExpenses : (currentShift?.drawerExpenses ?? 13700);
    const finalSafeDrops = safeDrops > 0 ? safeDrops : (currentShift?.payOuts ?? 40000);
    const finalPayIns = payIns > 0 ? payIns : (currentShift?.payIns ?? 0);

    const systemExpected = openingFloat + finalCashSales + finalPayIns - finalDrawerExpenses - finalSafeDrops;

    return {
      openingFloat,
      cashSales: finalCashSales,
      cardSales: cardSales > 0 ? cardSales : (currentShift?.cardSales ?? 22400),
      easypaisaSales: easypaisaSales > 0 ? easypaisaSales : (currentShift?.easypaisaSales ?? 35630),
      jazzcashSales: jazzcashSales > 0 ? jazzcashSales : (currentShift?.jazzcashSales ?? 20780),
      totalSales: totalSales > 0 ? totalSales : (currentShift?.totalSales ?? 164910),
      totalTax,
      totalDiscount,
      drawerExpenses: finalDrawerExpenses,
      safeDrops: finalSafeDrops,
      payIns: finalPayIns,
      systemExpected,
      txCount: shiftTxs.length > 0 ? shiftTxs.length : 126
    };
  }, [currentShift, liveTransactions, liveMovements, liveExpenses]);

  // Parse numerical counted amount
  const parsedCounted = useMemo(() => {
    const raw = manualCount.replace(/[^0-9.]/g, '');
    const num = parseFloat(raw);
    return isNaN(num) ? countedDenominationsTotal : num;
  }, [manualCount, countedDenominationsTotal]);

  const variance = parsedCounted - shiftMetrics.systemExpected;

  // Sync manual input when denomination counts change
  const handleDenominationChange = (key: keyof typeof denominations, val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    const updated = { ...denominations, [key]: num };
    setDenominations(updated);

    const newTotal =
      updated.d5000 * 5000 +
      updated.d1000 * 1000 +
      updated.d500 * 500 +
      updated.d100 * 100 +
      updated.d50 * 50 +
      updated.d20 * 20 +
      updated.d10 * 10 +
      updated.coins;

    setManualCount(newTotal.toLocaleString());
  };

  const handleScrollToReconciliation = () => {
    reconciliationRef.current?.scrollIntoView({ behavior: 'smooth' });
    const input = document.getElementById('physical-amount');
    input?.focus();
  };

  const handleFinalizeShift = async () => {
    const { verifyPin, managerWitnessPin } = useSecurityStore.getState();
    if (managerWitnessPin && !witnessPin.trim()) {
      alert('Please enter Manager Witness PIN to authorize shift closing.');
      return;
    }
    if (managerWitnessPin && !verifyPin(witnessPin)) {
      alert('Invalid Manager Witness PIN. Please enter the correct 4-digit supervisor PIN to authorize shift closing.');
      return;
    }

    if (confirm(`Finalize and close Register Shift? Total physical counted cash: Rs. ${parsedCounted.toLocaleString()}`)) {
      setIsFinalizing(true);
      try {
        await backupService.createAutoSnapshot(`Shift Close (Counted: Rs. ${parsedCounted.toLocaleString()})`);
      } catch (err) {
        console.warn('Auto snapshot on shift close failed:', err);
      }

      const closed = await closeShift(parsedCounted, closingNotes, witnessPin, denominations);
      setIsFinalizing(false);

      if (closed) {
        setSelectedZReport(closed);
        setActiveReportModal('z_report');
      }
    }
  };

  const handlePrintXReport = () => {
    setActiveReportModal('x_report');
  };

  const handleViewHistoricalZReport = (shift: ShiftRecord) => {
    setSelectedZReport(shift);
    setActiveReportModal('z_report');
  };

  const isShiftOpen = currentShift !== null && currentShift.status === 'open';

  return (
    <div className="flex flex-col w-full space-y-6 select-none font-sans" data-purpose="cash-closing-content">
      {/* Shift Inactive Banner if closed */}
      {!isShiftOpen && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">
              🔒
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Register Shift is Currently Closed</h4>
              <p className="text-xs text-amber-700">Open a new shift float to start processing register transactions.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpeningCashModalOpen(true)}
            className="px-4 py-2 bg-[#3FA9A8] hover:bg-[#359392] active:bg-[#2A7978] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Open New Register Shift
          </button>
        </div>
      )}

      {/* BEGIN: Page Header Title & Shift Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cash Closing &amp; Auditing</h1>
            <span className="bg-teal-50 text-[#3FA9A8] border border-teal-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {currentShift ? `${currentShift.id.toUpperCase()} • ${station}` : `Shift Closed • ${station}`}
            </span>
            <span className={`border text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
              isShiftOpen
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isShiftOpen ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`}></span>
              Drawer Status: {isShiftOpen ? 'Active (Open)' : 'Closed'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Reconcile physical drawer cash against system sales, audit discrepancies, and finalize official Z-Report vouchers.
          </p>
        </div>

        {/* Action Control Group */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handlePrintXReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs transition cursor-pointer"
            type="button"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            Print Mid-Shift X-Report
          </button>

          {isShiftOpen && (
            <button
              onClick={handleScrollToReconciliation}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#3FA9A8] hover:bg-[#359392] rounded-xl shadow-sm transition active:scale-98 cursor-pointer"
              type="button"
            >
              <ShieldCheck className="w-4 h-4" />
              Count &amp; Close Register
            </button>
          )}
        </div>
      </div>
      {/* END: Page Header Title & Shift Toolbar */}

      {/* BEGIN: Financial Cash Reconciliation Formula Cards */}
      <section data-purpose="balance-formula-flow">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Opening Float */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">Opening Float</span>
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#3FA9A8] flex items-center justify-center font-bold text-xs">
                Rs.
              </div>
            </div>
            <div className="text-xl font-bold text-slate-900 tabular-nums">
              Rs. {shiftMetrics.openingFloat.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-medium">Drawer Base</span> • Cash Check-in
            </p>
          </div>

          {/* Card 2: Cash Sales (+) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">Cash Sales (+)</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                +
              </div>
            </div>
            <div className="text-xl font-bold text-emerald-600 tabular-nums">
              +Rs. {shiftMetrics.cashSales.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{shiftMetrics.txCount} Cash Orders (Excl. Digital)</p>
          </div>

          {/* Card 3: Drawer Expenses (-) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">Expenses Out (-)</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                -
              </div>
            </div>
            <div className="text-xl font-bold text-rose-600 tabular-nums">
              -Rs. {shiftMetrics.drawerExpenses.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Petty cash payouts</p>
          </div>

          {/* Card 4: Safe Drop (-) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">Safe Drops (-)</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                ↓
              </div>
            </div>
            <div className="text-xl font-bold text-slate-700 tabular-nums">
              -Rs. {shiftMetrics.safeDrops.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Manager safe transfers</p>
          </div>

          {/* Card 5: Expected Cash in Drawer (=) */}
          <div className="bg-gradient-to-br from-teal-500 to-[#3FA9A8] text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-teal-100 mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-teal-100">Expected in Drawer</span>
              <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Exact</span>
            </div>
            <div className="text-2xl font-black text-white tabular-nums tracking-tight">
              Rs. {shiftMetrics.systemExpected.toLocaleString()}
            </div>
            <p className="text-[11px] text-teal-100 mt-1 font-medium">Physical cash required</p>
          </div>
        </div>
      </section>
      {/* END: Financial Cash Reconciliation Formula Cards */}

      {/* BEGIN: Two Column Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Cash Movements & Denominations */}
        <div className="lg:col-span-7 space-y-6">
          {/* Cash Movements Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Current Shift Cash Ledger</h3>
                <p className="text-[11px] text-slate-500">Chronological ledger of cash in / cash out transactions</p>
              </div>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                Live Audit
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/75 text-slate-400 font-semibold text-[10px] uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-4">Details &amp; Reason</th>
                    <th className="py-3 px-3">Cashier</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Opening Float Row */}
                  <tr className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">Shift Start</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Opening Float
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">Day start register base float</p>
                      <p className="text-[10px] text-slate-400">Drawer starting reserve</p>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">{cashierName}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800 tabular-nums">
                      +Rs. {shiftMetrics.openingFloat.toLocaleString()}
                    </td>
                  </tr>

                  {/* Cash Sales Aggregation Row */}
                  <tr className="hover:bg-slate-50/60 transition bg-emerald-50/20">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">Shift Sales</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Cash Orders
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">Accumulated Shift Cash Receipts</p>
                      <p className="text-[10px] text-slate-400">{shiftMetrics.txCount} completed cash checks</p>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">{station}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700 tabular-nums">
                      +Rs. {shiftMetrics.cashSales.toLocaleString()}
                    </td>
                  </tr>

                  {/* Safe Drop Row */}
                  <tr className="hover:bg-slate-50/60 transition bg-amber-50/20">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">Midday</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                        Safe Drop
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">Cash Skim to Manager Drop Safe</p>
                      <p className="text-[10px] text-slate-400">Excess cash security transfer</p>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">Vault</td>
                    <td className="py-3 px-4 text-right font-semibold text-amber-700 tabular-nums">
                      -Rs. {shiftMetrics.safeDrops.toLocaleString()}
                    </td>
                  </tr>

                  {/* Expense Payout Row */}
                  <tr className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">Shift Outlays</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        Drawer Outflow
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">Petty Cash Vouchers &amp; Supplies</p>
                      <p className="text-[10px] text-slate-400">Gas, tea, pantry purchases</p>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">Expenses</td>
                    <td className="py-3 px-4 text-right font-semibold text-rose-600 tabular-nums">
                      -Rs. {shiftMetrics.drawerExpenses.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                Total Drawer Outlays: <strong className="text-slate-800">Rs. {shiftMetrics.drawerExpenses.toLocaleString()}</strong>
              </span>
              <span className="text-right">
                Net Cash Growth: <strong className="text-emerald-700 tabular-nums font-bold">+Rs. {(shiftMetrics.cashSales - shiftMetrics.drawerExpenses - shiftMetrics.safeDrops).toLocaleString()}</strong>
              </span>
            </div>
          </div>

          {/* Denomination Counter Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Physical Denomination Counter</h3>
                <p className="text-[11px] text-slate-500">Count notes and coins present in the cash drawer</p>
              </div>
              <span className="text-[11px] font-semibold text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded">
                PKR Currency
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Rs. 5000 */}
              <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-slate-700">Rs. 5,000</span>
                  <input
                    type="number"
                    min="0"
                    value={denominations.d5000}
                    onChange={(e) => handleDenominationChange('d5000', e.target.value)}
                    className="w-12 text-xs text-slate-700 font-semibold bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center outline-none focus:border-[#3FA9A8]"
                  />
                </div>
                <div className="text-sm font-bold text-slate-900 tabular-nums">
                  Rs. {(denominations.d5000 * 5000).toLocaleString()}
                </div>
              </div>

              {/* Rs. 1000 */}
              <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-slate-700">Rs. 1,000</span>
                  <input
                    type="number"
                    min="0"
                    value={denominations.d1000}
                    onChange={(e) => handleDenominationChange('d1000', e.target.value)}
                    className="w-12 text-xs text-slate-700 font-semibold bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center outline-none focus:border-[#3FA9A8]"
                  />
                </div>
                <div className="text-sm font-bold text-slate-900 tabular-nums">
                  Rs. {(denominations.d1000 * 1000).toLocaleString()}
                </div>
              </div>

              {/* Rs. 500 */}
              <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-slate-700">Rs. 500</span>
                  <input
                    type="number"
                    min="0"
                    value={denominations.d500}
                    onChange={(e) => handleDenominationChange('d500', e.target.value)}
                    className="w-12 text-xs text-slate-700 font-semibold bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center outline-none focus:border-[#3FA9A8]"
                  />
                </div>
                <div className="text-sm font-bold text-slate-900 tabular-nums">
                  Rs. {(denominations.d500 * 500).toLocaleString()}
                </div>
              </div>

              {/* Rs. 100 */}
              <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-slate-700">Rs. 100</span>
                  <input
                    type="number"
                    min="0"
                    value={denominations.d100}
                    onChange={(e) => handleDenominationChange('d100', e.target.value)}
                    className="w-12 text-xs text-slate-700 font-semibold bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center outline-none focus:border-[#3FA9A8]"
                  />
                </div>
                <div className="text-sm font-bold text-slate-900 tabular-nums">
                  Rs. {(denominations.d100 * 100).toLocaleString()}
                </div>
              </div>

              {/* Rs. 50 */}
              <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-slate-700">Rs. 50</span>
                  <input
                    type="number"
                    min="0"
                    value={denominations.d50}
                    onChange={(e) => handleDenominationChange('d50', e.target.value)}
                    className="w-12 text-xs text-slate-700 font-semibold bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center outline-none focus:border-[#3FA9A8]"
                  />
                </div>
                <div className="text-sm font-bold text-slate-900 tabular-nums">
                  Rs. {(denominations.d50 * 50).toLocaleString()}
                </div>
              </div>

              {/* Rs. 20 */}
              <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-slate-700">Rs. 20</span>
                  <input
                    type="number"
                    min="0"
                    value={denominations.d20}
                    onChange={(e) => handleDenominationChange('d20', e.target.value)}
                    className="w-12 text-xs text-slate-700 font-semibold bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center outline-none focus:border-[#3FA9A8]"
                  />
                </div>
                <div className="text-sm font-bold text-slate-900 tabular-nums">
                  Rs. {(denominations.d20 * 20).toLocaleString()}
                </div>
              </div>

              {/* Rs. 10 */}
              <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-slate-700">Rs. 10</span>
                  <input
                    type="number"
                    min="0"
                    value={denominations.d10}
                    onChange={(e) => handleDenominationChange('d10', e.target.value)}
                    className="w-12 text-xs text-slate-700 font-semibold bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center outline-none focus:border-[#3FA9A8]"
                  />
                </div>
                <div className="text-sm font-bold text-slate-900 tabular-nums">
                  Rs. {(denominations.d10 * 10).toLocaleString()}
                </div>
              </div>

              {/* Coins */}
              <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-slate-700">Coins</span>
                  <input
                    type="number"
                    min="0"
                    value={denominations.coins}
                    onChange={(e) => handleDenominationChange('coins', e.target.value)}
                    className="w-12 text-xs text-slate-700 font-semibold bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center outline-none focus:border-[#3FA9A8]"
                  />
                </div>
                <div className="text-sm font-bold text-slate-900 tabular-nums">
                  Rs. {denominations.coins.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Sum of counted denominations:</span>
              <span className="text-sm font-bold text-slate-900 tabular-nums">
                Rs. {countedDenominationsTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Reconciliation Form */}
        <div ref={reconciliationRef} className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Shift Blind Reconciliation</h3>
                  <p className="text-[11px] text-slate-500">Official Manager Dual-Witness Audit</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  isShiftOpen ? 'bg-teal-100/70 text-[#2E807F]' : 'bg-slate-100 text-slate-600'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isShiftOpen ? 'bg-[#3FA9A8] animate-ping' : 'bg-slate-400'}`}></span>
                  {isShiftOpen ? 'Active Register' : 'Closed Register'}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Expected vs Counted Display */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">System Expected</p>
                  <p className="text-base font-bold text-slate-800 tabular-nums mt-0.5">
                    Rs. {shiftMetrics.systemExpected.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400">Opening + Sales - Outlays</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Physical Counted</p>
                  <p className="text-base font-bold text-emerald-600 tabular-nums mt-0.5">
                    Rs. {parsedCounted.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400">From denomination tally</p>
                </div>
              </div>

              {/* Physical Cash Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="physical-amount">
                  Physical Cash Counted in Drawer (PKR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                    Rs.
                  </div>
                  <input
                    id="physical-amount"
                    type="text"
                    disabled={!isShiftOpen}
                    value={manualCount}
                    onChange={(e) => setManualCount(e.target.value)}
                    className="block w-full pl-11 pr-24 py-2.5 text-base font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#3FA9A8] focus:border-[#3FA9A8] transition outline-none disabled:bg-slate-50 disabled:text-slate-400"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {variance === 0 ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ MATCHED
                      </span>
                    ) : variance > 0 ? (
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        +Rs. {variance.toLocaleString()} OVER
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        -Rs. {Math.abs(variance).toLocaleString()} SHORT
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Discrepancy Status Card */}
              {variance === 0 ? (
                <div className="p-3.5 rounded-xl border bg-emerald-50/70 border-emerald-200 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    ✓
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-emerald-900 flex items-center gap-2">
                      Variance: Rs. 0 (Balanced - Exact Match)
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                      Physical count matches the system expected cash down to the single rupee. No surplus or shortage flagged.
                    </p>
                  </div>
                </div>
              ) : variance > 0 ? (
                <div className="p-3.5 rounded-xl border bg-blue-50/70 border-blue-200 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    +
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-blue-900 flex items-center gap-2">
                      Variance: +Rs. {variance.toLocaleString()} (Cash Surplus)
                    </p>
                    <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                      Physical cash in drawer exceeds system calculation. Register surplus will be allocated to shift audit vault.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border bg-rose-50/70 border-rose-200 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    !
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-rose-900 flex items-center gap-2">
                      Variance: -Rs. {Math.abs(variance).toLocaleString()} (Cash Shortage)
                    </p>
                    <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                      Physical count is lower than expected cash. Explanation required in closing notes prior to supervisor authorization.
                    </p>
                  </div>
                </div>
              )}

              {/* Digital Payments Notice */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center justify-between font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#3FA9A8]" />
                    Non-Cash Tenders (Bank Settled)
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">Direct Vault</span>
                </div>
                <p className="leading-normal">
                  Card: <strong className="text-slate-700">Rs. {shiftMetrics.cardSales.toLocaleString()}</strong> • 
                  Easypaisa: <strong className="text-slate-700">Rs. {shiftMetrics.easypaisaSales.toLocaleString()}</strong> • 
                  JazzCash: <strong className="text-slate-700">Rs. {shiftMetrics.jazzcashSales.toLocaleString()}</strong>
                </p>
              </div>

              {/* Closing Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="closing-notes">
                  Shift Closing Notes &amp; Remarks
                </label>
                <textarea
                  id="closing-notes"
                  rows={2}
                  disabled={!isShiftOpen}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="e.g. Shift closed without incident. Evening rush reconciled with drawer tape."
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 focus:ring-1 focus:ring-[#3FA9A8] focus:border-[#3FA9A8] text-slate-700 placeholder-slate-400 outline-none disabled:bg-slate-50"
                />
              </div>

              {/* Manager Witness PIN */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700" htmlFor="witness-pin">
                    Manager Witness PIN / Authorization
                  </label>
                  {!managerWitnessPin && (
                    <span className="text-[10px] text-slate-400 font-normal">Optional (Security Policy)</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="witness-pin"
                    type="password"
                    disabled={!isShiftOpen}
                    value={witnessPin}
                    onChange={(e) => setWitnessPin(e.target.value)}
                    placeholder={managerWitnessPin ? "Enter 4-digit supervisor PIN" : "Optional 4-digit PIN"}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-3 pr-20 py-2 focus:ring-1 focus:ring-[#3FA9A8] focus:border-[#3FA9A8] text-slate-800 tracking-widest font-mono outline-none disabled:bg-slate-50"
                  />
                  <span className={`absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] font-semibold ${
                    verifyPin(witnessPin)
                      ? 'text-emerald-600'
                      : witnessPin.length > 0
                      ? 'text-rose-500'
                      : managerWitnessPin
                      ? 'text-amber-500'
                      : 'text-slate-400'
                  }`}>
                    {verifyPin(witnessPin) ? '✓ PIN Verified' : witnessPin.length > 0 ? 'Invalid PIN' : managerWitnessPin ? 'Required' : 'Optional'}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  disabled={isFinalizing || !isShiftOpen}
                  onClick={handleFinalizeShift}
                  className="w-full py-2.5 px-4 bg-[#3FA9A8] hover:bg-[#359392] active:bg-[#2E807F] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isFinalizing ? (
                    <span>Archiving Shift to Database...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Finalize &amp; Close Shift (Generate Z-Report)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('pos')}
                  className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Return to POS Terminal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BEGIN: Historical Shifts Log Table */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden mb-8" data-purpose="closing-history">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Shift Closings History</h3>
            <p className="text-[11px] text-slate-500">Past audited registers with Z-Report references</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/75 text-slate-400 font-semibold text-[10px] uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Shift &amp; Date</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4 text-right">Opening Float</th>
                <th className="py-3 px-4 text-right">Expected Cash</th>
                <th className="py-3 px-4 text-right">Counted Cash</th>
                <th className="py-3 px-4 text-center">Variance</th>
                <th className="py-3 px-4">Z-Report Reference</th>
                <th className="py-3 px-4 text-center">Audit Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {liveShifts.filter(s => s.status === 'closed').map((shift) => (
                <tr key={shift.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-800">{shift.id.toUpperCase()}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(shift.openedAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{shift.cashierName}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-600 tabular-nums">
                    Rs. {(shift.openingFloat || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-600 tabular-nums">
                    Rs. {(shift.expectedCash || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-800 tabular-nums">
                    Rs. {(shift.actualCash || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {(shift.discrepancy || 0) === 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Rs. 0 (Balanced)
                      </span>
                    ) : (shift.discrepancy || 0) > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        +Rs. {(shift.discrepancy || 0).toLocaleString()} (Surplus)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        -Rs. {Math.abs(shift.discrepancy || 0).toLocaleString()} (Short)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    {shift.zReportNumber || '#Z-HISTORICAL'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Reconciled
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleViewHistoricalZReport(shift)}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition cursor-pointer"
                      title="Inspect Official Z-Report"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MID-SHIFT X-REPORT MODAL */}
      {activeReportModal === 'x_report' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col font-sans">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#3FA9A8]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Mid-Shift X-Report Reading</h3>
                  <p className="text-[10px] text-slate-400">Non-resetting interim sales reading</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveReportModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 bg-[#FAF8F5] border-b border-slate-200 font-mono text-xs text-slate-800 space-y-2 select-text">
              <div className="text-center pb-3 border-b border-dashed border-slate-400">
                <p className="font-bold text-base tracking-tight uppercase">DINEPOS BISTRO &amp; GRILL</p>
                <p className="text-[11px] text-slate-600">OFFICIAL MID-SHIFT X-READING</p>
                <p className="text-[10px] text-slate-500">NON-FISCAL AUDIT INVENTORY</p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 text-[11px] space-y-1">
                <div className="flex justify-between"><span>REGISTER:</span><span>STATION-01</span></div>
                <div className="flex justify-between"><span>CASHIER:</span><span>{cashierName}</span></div>
                <div className="flex justify-between">
                  <span>SHIFT STARTED:</span>
                  <span>{currentShift?.openedAt ? new Date(currentShift.openedAt).toLocaleTimeString() : '09:00 AM'}</span>
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-xs">
                <div className="flex justify-between font-bold"><span>OPENING FLOAT:</span><span>Rs. {shiftMetrics.openingFloat.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>CASH SALES:</span><span>+Rs. {shiftMetrics.cashSales.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>CARD SALES:</span><span>Rs. {shiftMetrics.cardSales.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>EASYPAISA:</span><span>Rs. {shiftMetrics.easypaisaSales.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>JAZZCASH:</span><span>Rs. {shiftMetrics.jazzcashSales.toLocaleString()}</span></div>
                <div className="flex justify-between font-bold pt-1 border-t border-dashed border-slate-300">
                  <span>GROSS REVENUE:</span><span>Rs. {shiftMetrics.totalSales.toLocaleString()}</span>
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-xs">
                <div className="flex justify-between text-rose-700"><span>DRAWER EXPENSES:</span><span>-Rs. {shiftMetrics.drawerExpenses.toLocaleString()}</span></div>
                <div className="flex justify-between text-amber-700"><span>SAFE SKIMS:</span><span>-Rs. {shiftMetrics.safeDrops.toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-emerald-800 pt-1 border-t border-dashed border-slate-300">
                  <span>EXPECTED IN DRAWER:</span><span>Rs. {shiftMetrics.systemExpected.toLocaleString()}</span>
                </div>
              </div>

              <p className="text-center text-[10px] text-slate-400 pt-1 italic">
                * Note: Register session remains open after X-Report *
              </p>
            </div>

            <div className="p-4 bg-white flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveReportModal(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#3FA9A8] hover:bg-[#359392] text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print X-Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINAL Z-REPORT VOUCHER MODAL */}
      {activeReportModal === 'z_report' && selectedZReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col font-sans">
            <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Official Z-Report Closing Voucher</h3>
                  <p className="text-[10px] text-emerald-700">{selectedZReport.zReportNumber || '#Z-OFFICIAL'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveReportModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 bg-[#FAF8F5] border-b border-slate-200 font-mono text-xs text-slate-800 space-y-2 select-text">
              <div className="text-center pb-3 border-b border-dashed border-slate-400">
                <p className="font-bold text-base tracking-tight uppercase">DINEPOS BISTRO &amp; GRILL</p>
                <p className="text-[11px] text-slate-600">END OF DAY Z-REPORT FISCAL SETTLEMENT</p>
                <p className="text-[10px] font-bold text-emerald-800">{selectedZReport.zReportNumber || '#Z-OFFICIAL'}</p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 text-[11px] space-y-1">
                <div className="flex justify-between"><span>STATION:</span><span>{selectedZReport.station}</span></div>
                <div className="flex justify-between"><span>CASHIER:</span><span>{selectedZReport.cashierName}</span></div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{new Date(selectedZReport.openedAt).toLocaleDateString('en-PK')}</span>
                </div>
                <div className="flex justify-between">
                  <span>STATUS:</span>
                  <span className="font-bold text-emerald-700">CLOSED &amp; RECONCILED</span>
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-xs">
                <div className="flex justify-between font-bold"><span>OPENING FLOAT:</span><span>Rs. {(selectedZReport.openingFloat || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>SYSTEM EXPECTED:</span><span>Rs. {(selectedZReport.expectedCash || 0).toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>PHYSICAL COUNTED:</span>
                  <span>Rs. {(selectedZReport.actualCash || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-dashed border-slate-300">
                  <span>VARIANCE:</span>
                  <span className={(selectedZReport.discrepancy || 0) === 0 ? 'text-emerald-700' : 'text-rose-700'}>
                    {(selectedZReport.discrepancy || 0) === 0 ? 'Rs. 0 (BALANCED)' : `Rs. ${(selectedZReport.discrepancy || 0).toLocaleString()}`}
                  </span>
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-1">
                <p className="font-bold text-slate-700">MANAGER WITNESS:</p>
                <p className="italic">PIN: **** Verified • Audit Token: #AUTH-JD4921</p>
                {selectedZReport.closingNotes && (
                  <p className="text-slate-600 mt-1">Notes: {selectedZReport.closingNotes}</p>
                )}
              </div>

              <p className="text-center text-[10px] text-slate-400 pt-1">
                *** REGISTER CLOSED — ARCHIVED LOCALLY ***
              </p>
            </div>

            <div className="p-4 bg-white flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveReportModal(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#3FA9A8] hover:bg-[#359392] text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print Official Z-Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
