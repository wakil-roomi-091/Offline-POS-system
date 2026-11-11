import React, { useState, useMemo, useRef } from 'react';
import { useShiftStore } from '../../store/useShiftStore';
import { useUIStore } from '../../store/useUIStore';
import { backupService } from '../../services/backupService';

export const CashClosingView: React.FC = () => {
  const { closeShift } = useShiftStore();
  const { setActiveTab } = useUIStore();

  // Denominations count state (matching PKR standard denominations)
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

  // Actual physical cash input (defaults to sum of counted denominations: 47,400)
  const [manualCount, setManualCount] = useState<string>('47,400');
  const [closingNotes, setClosingNotes] = useState<string>(
    'Shift closed normally by Head Cashier. Evening dinner rush reconciled with register tape #REC-0842.'
  );
  const [witnessPin, setWitnessPin] = useState<string>('4921');
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  const reconciliationRef = useRef<HTMLDivElement>(null);

  // Financial baseline numbers (matching the exact Rs. 47,400 PKR formula in template)
  const openingFloat = 15000;
  const cashSales = 86100;
  const drawerExpenses = 13700;
  const safeDrops = 40000;
  const systemExpected = openingFloat + cashSales - drawerExpenses - safeDrops; // Rs. 47,400

  // Parse numerical counted amount
  const parsedCounted = useMemo(() => {
    const raw = manualCount.replace(/[^0-9.]/g, '');
    const num = parseFloat(raw);
    return isNaN(num) ? countedDenominationsTotal : num;
  }, [manualCount, countedDenominationsTotal]);

  const variance = parsedCounted - systemExpected;

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
    if (!witnessPin.trim()) {
      alert('Please enter Manager Witness PIN to authorize shift closing.');
      return;
    }

    if (confirm(`Finalize and close Register Shift? Total physical counted cash: Rs. ${parsedCounted.toLocaleString()}`)) {
      setIsFinalizing(true);
      try {
        await backupService.createAutoSnapshot(`Shift Close (Counted: Rs. ${parsedCounted.toLocaleString()})`);
      } catch (err) {
        console.warn('Auto snapshot on shift close failed:', err);
      }
      setTimeout(() => {
        closeShift(parsedCounted);
        setIsFinalizing(false);
        setIsClosed(true);
        alert(`Shift 1 closed successfully!\nZ-Report Voucher #Z-2024-0089 generated and archived with an automated database snapshot.`);
      }, 700);
    }
  };

  const handlePrintXReport = () => {
    window.print();
  };

  const handleAuditDrawer = () => {
    alert(`Drawer Audit Log:\nOpening Float: Rs. ${openingFloat.toLocaleString()}\nCash Inflows: Rs. ${cashSales.toLocaleString()}\nDrawer Outflows: -Rs. ${drawerExpenses.toLocaleString()}\nSafe Drop Skims: -Rs. ${safeDrops.toLocaleString()}\nSystem Expected in Register: Rs. ${systemExpected.toLocaleString()}`);
  };

  return (
    <div className="flex flex-col w-full space-y-6 select-none font-sans" data-purpose="cash-closing-content">
      {/* BEGIN: Page Header Title & Shift Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cash Closing</h1>
            <span className="bg-teal-50 text-[#3FA9A8] border border-teal-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Shift 1 • Register 01
            </span>
            <span className={`border text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
              isClosed
                ? 'bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isClosed ? 'bg-slate-400' : 'bg-amber-500 animate-pulse'}`}></span>
              Drawer Status: {isClosed ? 'Closed' : 'Open'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Reconcile the cash drawer, verify physical currency against register sales, and finalize shift closing balance.
          </p>
        </div>

        {/* Action Control Group */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleAuditDrawer}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs transition cursor-pointer"
            type="button"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            Audit Drawer
          </button>

          <button
            onClick={handlePrintXReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs transition cursor-pointer"
            type="button"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            Print Shift X-Report
          </button>

          <button
            onClick={handleScrollToReconciliation}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#3FA9A8] hover:bg-[#359392] rounded-xl shadow-sm transition active:scale-98 cursor-pointer"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            Count &amp; Close Register
          </button>
        </div>
      </div>
      {/* END: Page Header Title & Shift Toolbar */}

      {/* BEGIN: Financial Cash Reconciliation Formula Cards */}
      <section data-purpose="balance-formula-flow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          {/* Card 1: Opening Float */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">Opening Float</span>
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#3FA9A8] flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
            </div>
            <div className="text-xl font-bold text-slate-900 tabular-nums">
              Rs. {openingFloat.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-medium">Shift Start</span> • 09:00 AM
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
              +Rs. {cashSales.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">126 Cash Orders (Excl. POS cards)</p>
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
              -Rs. {drawerExpenses.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">4 Vouchers paid via drawer</p>
          </div>

          {/* Card 4: Safe Drop (-) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">Safe Drops (-)</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
            </div>
            <div className="text-xl font-bold text-slate-700 tabular-nums">
              -Rs. {safeDrops.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">1 Drop skim @ 04:30 PM</p>
          </div>

          {/* Card 5: Expected Cash in Drawer (=) */}
          <div className="bg-gradient-to-br from-teal-500 to-[#3FA9A8] text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-teal-100 mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-teal-100">Expected in Drawer</span>
              <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Exact</span>
            </div>
            <div className="text-2xl font-black text-white tabular-nums tracking-tight">
              Rs. {systemExpected.toLocaleString()}
            </div>
            <p className="text-[11px] text-teal-100 mt-1 font-medium">Physical cash required</p>
          </div>
        </div>
      </section>
      {/* END: Financial Cash Reconciliation Formula Cards */}

      {/* BEGIN: Two Column Main Layout (Audit Logs & Final Reconciliation Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 Cols): Cash Movement Audit Log & Denomination Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {/* Cash Movement Journal Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            {/* Table Header Bar */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Current Shift Cash Movements</h3>
                <p className="text-[11px] text-slate-500">Chronological ledger of cash in / cash out transactions</p>
              </div>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                6 Events Recorded
              </span>
            </div>

            {/* Table Component */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/75 text-slate-400 font-semibold text-[10px] uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-3">Movement Type</th>
                    <th className="py-3 px-4">Details &amp; Reference</th>
                    <th className="py-3 px-3">Destination / Source</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Row 1: Opening Float */}
                  <tr className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">09:00 AM</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Opening Float
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">Day start register base float</p>
                      <p className="text-[10px] text-slate-400">Shift opening allocation</p>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">Station 1 Drawer</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800 tabular-nums">+Rs. 15,000</td>
                  </tr>

                  {/* Row 2: Expense 1 */}
                  <tr className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">09:30 AM</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        Expense Payout
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">Voucher #EXP-2024-0038</p>
                      <p className="text-[10px] text-slate-400">Staff tea &amp; morning rusk</p>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">Kitchen Pantry</td>
                    <td className="py-3 px-4 text-right font-semibold text-rose-600 tabular-nums">-Rs. 800</td>
                  </tr>

                  {/* Row 3: Expense 2 */}
                  <tr className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">11:20 AM</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        Expense Payout
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">Voucher #EXP-2024-0039</p>
                      <p className="text-[10px] text-slate-400">45.4kg LPG Cylinder refill</p>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">City Gas Agency</td>
                    <td className="py-3 px-4 text-right font-semibold text-rose-600 tabular-nums">-Rs. 8,500</td>
                  </tr>

                  {/* Row 4: Safe Drop Skim */}
                  <tr className="hover:bg-slate-50/60 transition bg-amber-50/20">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">04:30 PM</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                        Safe Drop
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">Mid-day Cash Skim to Drop Safe</p>
                      <p className="text-[10px] text-slate-400">Bag Tag #DS-884 • Verified by JD</p>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">Manager Drop Safe</td>
                    <td className="py-3 px-4 text-right font-semibold text-amber-700 tabular-nums">-Rs. 40,000</td>
                  </tr>

                  {/* Row 5: Expense 3 */}
                  <tr className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">05:40 PM</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        Expense Payout
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">Voucher #EXP-2024-0041</p>
                      <p className="text-[10px] text-slate-400">Fresh chicken 15kg for biryani</p>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">Madina Poultry Farm</td>
                    <td className="py-3 px-4 text-right font-semibold text-rose-600 tabular-nums">-Rs. 4,400</td>
                  </tr>

                  {/* Row 6: Aggregated POS Cash Sales */}
                  <tr className="hover:bg-slate-50/60 transition bg-emerald-50/30">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">All Day</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Cash Orders
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">Accumulated Shift Cash Receipts</p>
                      <p className="text-[10px] text-slate-400">126 guest checks #1001 — #1127</p>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">Terminal Register</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700 tabular-nums">+Rs. 86,100</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer Tally */}
            <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                Total Drawer Outlays: <strong className="text-slate-800">Rs. {drawerExpenses.toLocaleString()}</strong>
              </span>
              <span className="text-right">
                Net Shift Cash Flow: <strong className="text-emerald-700 tabular-nums font-bold">+Rs. 32,400</strong>
              </span>
            </div>
          </div>

          {/* Denomination Breakdown Interactive Mini-Tally Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#3FA9A8] flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Physical Denomination Counter</h3>
                  <p className="text-[11px] text-slate-500">Breakdown of notes &amp; coins counted in drawer</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                PKR Currency
              </span>
            </div>

            {/* Denomination Multipliers Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Rs. 5000 */}
              <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-slate-700">Rs. 5,000</span>
                  <input
                    type="number"
                    min="0"
                    value={denominations.d5000}
                    onChange={(e) => handleDenominationChange('d5000', e.target.value)}
                    className="w-10 text-[10px] text-slate-600 font-semibold bg-white border border-slate-200 rounded px-1 text-center"
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
                    className="w-10 text-[10px] text-slate-600 font-semibold bg-white border border-slate-200 rounded px-1 text-center"
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
                    className="w-10 text-[10px] text-slate-600 font-semibold bg-white border border-slate-200 rounded px-1 text-center"
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
                    className="w-10 text-[10px] text-slate-600 font-semibold bg-white border border-slate-200 rounded px-1 text-center"
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
                    className="w-10 text-[10px] text-slate-600 font-semibold bg-white border border-slate-200 rounded px-1 text-center"
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
                    className="w-10 text-[10px] text-slate-600 font-semibold bg-white border border-slate-200 rounded px-1 text-center"
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
                    className="w-10 text-[10px] text-slate-600 font-semibold bg-white border border-slate-200 rounded px-1 text-center"
                  />
                </div>
                <div className="text-sm font-bold text-slate-900 tabular-nums">
                  Rs. {(denominations.d10 * 10).toLocaleString()}
                </div>
              </div>

              {/* Coins */}
              <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-slate-700">Coins / Small</span>
                  <span className="text-[10px] text-slate-400">Assorted</span>
                </div>
                <div className="text-sm font-bold text-slate-900 tabular-nums">
                  Rs. {denominations.coins.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Denomination Total Strip */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Sum of counted denominations:</span>
              <span className="text-sm font-bold text-slate-900 tabular-nums">
                Rs. {countedDenominationsTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        {/* END: LEFT COLUMN */}

        {/* RIGHT COLUMN (5 Cols): Cash Reconciliation & Closing Action Panel */}
        <div ref={reconciliationRef} className="lg:col-span-5 space-y-5">
          {/* Primary Reconciliation Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Register Shift Closing</h3>
                  <p className="text-[11px] text-slate-500">Voucher #SCLOSE-2024-0089 • Local SQLite Audit</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100/70 text-[#2E807F]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3FA9A8] animate-ping"></span>
                  Active 12h 45m
                </span>
              </div>
            </div>

            {/* Form Body */}
            <div className="p-5 space-y-4">
              {/* Expected Vs Counted Comparison Display */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">System Expected</p>
                  <p className="text-base font-bold text-slate-800 tabular-nums mt-0.5">
                    Rs. {systemExpected.toLocaleString()}
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

              {/* Physical Cash Amount Input Field */}
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
                    value={manualCount}
                    onChange={(e) => setManualCount(e.target.value)}
                    className="block w-full pl-11 pr-24 py-2.5 text-base font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#3FA9A8] focus:border-[#3FA9A8] transition outline-none"
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

              {/* Digital Payments Notice (Offline / Multi-tender separation) */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center justify-between font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[#3FA9A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    Digital Tender Audit Notice
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">Excluded From Drawer</span>
                </div>
                <p className="leading-normal">
                  Easypaisa (<strong className="text-slate-700">Rs. 35,630</strong>) and JazzCash (<strong className="text-slate-700">Rs. 20,780</strong>) settle directly via digital wallet accounts and are audited separately in the Bank Report.
                </p>
              </div>

              {/* Closing Notes / Discrepancy Explanation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="closing-notes">
                  Shift Closing Notes &amp; Remarks
                </label>
                <textarea
                  id="closing-notes"
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="e.g. Shift closed without incident. Evening rush reconciled with drawer tape."
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 focus:ring-1 focus:ring-[#3FA9A8] focus:border-[#3FA9A8] text-slate-700 placeholder-slate-400 outline-none"
                />
              </div>

              {/* Manager Override / Witness PIN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="witness-pin">
                  Manager Witness PIN / Authorization
                </label>
                <div className="relative">
                  <input
                    id="witness-pin"
                    type="password"
                    value={witnessPin}
                    onChange={(e) => setWitnessPin(e.target.value)}
                    placeholder="Enter 4-digit supervisor PIN"
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-3 pr-20 py-2 focus:ring-1 focus:ring-[#3FA9A8] focus:border-[#3FA9A8] text-slate-800 tracking-widest font-mono outline-none"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] font-semibold text-emerald-600">
                    JD Verified
                  </span>
                </div>
              </div>

              {/* Button CTA Group */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  disabled={isFinalizing}
                  onClick={handleFinalizeShift}
                  className="w-full py-2.5 px-4 bg-[#3FA9A8] hover:bg-[#359392] active:bg-[#2E807F] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isFinalizing ? (
                    <span>Archiving Shift to SQLite...</span>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                      </svg>
                      <span>Finalize &amp; Close Shift (Print Z-Report)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('pos')}
                  className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Save Draft Count &amp; Return to POS
                </button>
              </div>

              <p className="text-[10px] text-center text-slate-400">
                🔒 Closing will lock register #01 session and generate official Z-Report voucher #Z-2024-0089.
              </p>
            </div>
          </div>
        </div>
        {/* END: RIGHT COLUMN */}
      </div>
      {/* END: Two Column Main Layout */}

      {/* BEGIN: Previous Cash Closings Log (Historical Shifts Table) */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden mb-8" data-purpose="closing-history">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Shift Closings History</h3>
            <p className="text-[11px] text-slate-500">Past audited registers with Z-Report references</p>
          </div>
          <button
            type="button"
            onClick={() => alert('Opening Historical Shift Logs Archive...')}
            className="text-xs font-semibold text-[#3FA9A8] hover:underline cursor-pointer"
          >
            View All Historical Closings →
          </button>
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
              {/* Past Shift 1 */}
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-3 px-4">
                  <p className="font-bold text-slate-800">Yesterday • Evening Shift</p>
                  <p className="text-[10px] text-slate-400">23 Oct 2024, 11:45 PM</p>
                </td>
                <td className="py-3 px-4 text-slate-700 font-medium">Asim Khan</td>
                <td className="py-3 px-4 text-right font-medium text-slate-600 tabular-nums">Rs. 15,000</td>
                <td className="py-3 px-4 text-right font-medium text-slate-600 tabular-nums">Rs. 92,340</td>
                <td className="py-3 px-4 text-right font-bold text-slate-800 tabular-nums">Rs. 92,340</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Rs. 0 (Balanced)
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-500">#Z-2024-0088</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Reconciled
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition cursor-pointer"
                    title="Print Z-Report"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </button>
                </td>
              </tr>

              {/* Past Shift 2 */}
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-3 px-4">
                  <p className="font-bold text-slate-800">Yesterday • Morning Shift</p>
                  <p className="text-[10px] text-slate-400">23 Oct 2024, 04:30 PM</p>
                </td>
                <td className="py-3 px-4 text-slate-700 font-medium">John Doe</td>
                <td className="py-3 px-4 text-right font-medium text-slate-600 tabular-nums">Rs. 15,000</td>
                <td className="py-3 px-4 text-right font-medium text-slate-600 tabular-nums">Rs. 61,120</td>
                <td className="py-3 px-4 text-right font-bold text-slate-800 tabular-nums">Rs. 61,120</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Rs. 0 (Balanced)
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-500">#Z-2024-0087</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Reconciled
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition cursor-pointer"
                    title="Print Z-Report"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </button>
                </td>
              </tr>

              {/* Past Shift 3 */}
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-3 px-4">
                  <p className="font-bold text-slate-800">22 Oct 2024 • Full Day</p>
                  <p className="text-[10px] text-slate-400">22 Oct 2024, 11:58 PM</p>
                </td>
                <td className="py-3 px-4 text-slate-700 font-medium">Bilal Ahmed</td>
                <td className="py-3 px-4 text-right font-medium text-slate-600 tabular-nums">Rs. 15,000</td>
                <td className="py-3 px-4 text-right font-medium text-slate-600 tabular-nums">Rs. 114,800</td>
                <td className="py-3 px-4 text-right font-bold text-slate-800 tabular-nums">Rs. 114,850</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    +Rs. 50 (Surplus)
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-500">#Z-2024-0086</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Approved
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition cursor-pointer"
                    title="Print Z-Report"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      {/* END: Previous Cash Closings Log */}
    </div>
  );
};
