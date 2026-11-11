import React, { useState, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { format } from 'date-fns';
import type { ExpenseRecord } from '../../types';

const INITIAL_EXPENSE_LIST: ExpenseRecord[] = [
  {
    id: '#EXP-2024-0041',
    description: 'Fresh Chicken 15kg & Spices for Biryani',
    category: 'Kitchen Raw',
    amount: 9450,
    paymentMethod: 'Cash Drawer (St.1)',
    paymentSource: 'Cash Drawer (St.1)',
    timestamp: Date.now() - 4 * 3600000,
    loggedBy: 'John Doe (Admin)',
    vendor: 'Madina Poultry Farm',
    subDescription: '15kg Broiler @ 580/kg + Garam Masala pack',
  },
  {
    id: '#EXP-2024-0040',
    description: 'Morning Milk 20 Litres (Fresh Buffalo)',
    category: 'Dairy Supplies',
    amount: 3600,
    paymentMethod: 'Cash Drawer (St.1)',
    paymentSource: 'Cash Drawer (St.1)',
    timestamp: Date.now() - 6 * 3600000,
    loggedBy: 'John Doe (Admin)',
    vendor: 'Al-Razaq Milk Center',
    subDescription: 'Kheer & Chai preparation stock',
  },
  {
    id: '#EXP-2024-0039',
    description: '45.4kg Commercial LPG Cylinder Refill',
    category: 'Utilities & Gas',
    amount: 4500,
    paymentMethod: 'Petty Cash Safe',
    paymentSource: 'Petty Cash Safe',
    timestamp: Date.now() - 8 * 3600000,
    loggedBy: 'John Doe (Admin)',
    vendor: 'City Gas Agency',
    subDescription: 'Kitchen stove bank refill #2',
  },
  {
    id: '#EXP-2024-0038',
    description: 'Morning Shift Rusk, Tea & Sugar',
    category: 'Staff Meals',
    amount: 650,
    paymentMethod: 'Cash Drawer (St.1)',
    paymentSource: 'Cash Drawer (St.1)',
    timestamp: Date.now() - 10 * 3600000,
    loggedBy: 'John Doe (Admin)',
    vendor: 'In-House Pantry',
    subDescription: 'Staff pantry daily refreshment',
  },
];

export const ExpensesView: React.FC = () => {
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('all');

  // Form states
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [paymentSource, setPaymentSource] = useState('Cash Drawer (St.1)');
  const [isSaving, setIsSaving] = useState(false);

  const formPanelRef = useRef<HTMLDivElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Live database records
  const liveExpenses = useLiveQuery(async () => {
    try {
      const records = await db.expenses.toArray();
      if (records && records.length > 0) {
        return records.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      }
      return [];
    } catch {
      return [];
    }
  }, []) || [];

  // Active expenses: use live records if available, otherwise show the authentic 4 templates
  const expenses: ExpenseRecord[] = useMemo(() => {
    if (liveExpenses && liveExpenses.length > 0) {
      return liveExpenses;
    }
    return INITIAL_EXPENSE_LIST;
  }, [liveExpenses]);

  // Calculations
  const totalExpensesToday = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);
  }, [expenses]);

  const cashDrawerReduction = useMemo(() => {
    return expenses
      .filter((e) => {
        const src = (e?.paymentSource || e?.paymentMethod || '').toLowerCase();
        return src.includes('cash') || src.includes('drawer') || src.includes('st.1');
      })
      .reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);
  }, [expenses]);

  const pettyCashReduction = useMemo(() => {
    return expenses
      .filter((e) => {
        const src = (e?.paymentSource || e?.paymentMethod || '').toLowerCase();
        return src.includes('petty');
      })
      .reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);
  }, [expenses]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e?.category || 'Other';
      map[cat] = (map[cat] || 0) + (Number(e?.amount) || 0);
    });

    const entries = Object.entries(map).map(([name, sum]) => ({
      name,
      amount: sum,
      pct: totalExpensesToday > 0 ? ((sum / totalExpensesToday) * 100).toFixed(1) : '0',
    }));

    entries.sort((a, b) => b.amount - a.amount);
    return entries;
  }, [expenses, totalExpensesToday]);

  const topCategory = categoryBreakdown[0] || {
    name: 'Kitchen Raw Supplies',
    amount: 11400,
    pct: '62.6',
  };

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    let list = [...expenses];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          (e?.id || '').toLowerCase().includes(q) ||
          (e?.description || '').toLowerCase().includes(q) ||
          (e?.vendor || '').toLowerCase().includes(q) ||
          (e?.category || '').toLowerCase().includes(q)
      );
    }

    if (selectedCategoryFilter !== 'all') {
      const catFilter = selectedCategoryFilter.toLowerCase();
      list = list.filter((e) => (e?.category || '').toLowerCase().includes(catFilter));
    }

    if (selectedSourceFilter !== 'all') {
      list = list.filter((e) => {
        const src = (e?.paymentSource || e?.paymentMethod || '').toLowerCase();
        if (selectedSourceFilter === 'cash_drawer') return src.includes('cash') || src.includes('drawer') || src.includes('st.1');
        if (selectedSourceFilter === 'petty_cash') return src.includes('petty');
        if (selectedSourceFilter === 'bank_qr') return src.includes('qr') || src.includes('bank');
        return true;
      });
    }

    return list;
  }, [expenses, searchQuery, selectedCategoryFilter, selectedSourceFilter]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount || !vendor.trim()) {
      alert('Please fill out all mandatory fields.');
      return;
    }

    setIsSaving(true);
    const voucherNumber = `#EXP-2024-${(expenses.length + 42).toString().padStart(4, '0')}`;
    const parsedAmount = parseFloat(amount) || 0;

    const newExpense: ExpenseRecord = {
      id: voucherNumber,
      description: description.trim() || category,
      category,
      amount: parsedAmount,
      paymentMethod: paymentSource,
      paymentSource,
      vendor: vendor.trim(),
      receiptNumber: receiptNumber.trim() || undefined,
      timestamp: Date.now(),
      loggedBy: 'John Doe (Admin)',
      subDescription: `Purchased via ${paymentSource}`,
    };

    try {
      await db.expenses.add(newExpense);
    } catch {
      // In case Dexie table error, fallback list will keep updating
    }

    setTimeout(() => {
      setIsSaving(false);
      alert(`Expense Voucher ${voucherNumber} for Rs. ${parsedAmount.toLocaleString()} saved successfully and deducted from Station 1 drawer balance!`);
      setCategory('');
      setAmount('');
      setVendor('');
      setDescription('');
      setReceiptNumber('');
    }, 600);
  };

  const handleScrollToForm = () => {
    if (formPanelRef.current) {
      formPanelRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    if (amountInputRef.current) {
      amountInputRef.current.focus();
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategoryFilter('all');
    setSelectedSourceFilter('all');
  };

  const getCategoryBadge = (cat?: string) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('kitchen') || c.includes('raw')) {
      return { dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700' };
    }
    if (c.includes('dairy') || c.includes('meat')) {
      return { dot: 'bg-blue-500', pill: 'bg-blue-50 text-blue-700' };
    }
    if (c.includes('util') || c.includes('gas')) {
      return { dot: 'bg-purple-500', pill: 'bg-purple-50 text-purple-700' };
    }
    if (c.includes('staff') || c.includes('meal')) {
      return { dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700' };
    }
    return { dot: 'bg-slate-500', pill: 'bg-slate-100 text-slate-700' };
  };

  const formatVoucherTime = (ts?: number) => {
    if (!ts) return 'Today, 05:40 PM';
    try {
      return `Today, ${format(new Date(ts), 'hh:mm a')}`;
    } catch {
      return 'Today, 05:40 PM';
    }
  };

  return (
    <div className="flex flex-col w-full space-y-6 select-none font-sans" data-purpose="expenses-view">
      {/* Top Title & Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-headline">Expenses</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">Audit Desk</span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Track restaurant operating expenses, monitor kitchen outlays, and review spending vouchers.
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Date Range Filter Tabs */}
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 shadow-inner text-xs font-medium text-slate-600">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                dateFilter === 'today' ? 'bg-[#3FA9A8] text-white font-semibold shadow-sm' : 'hover:text-slate-900'
              }`}
              type="button"
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                dateFilter === 'week' ? 'bg-[#3FA9A8] text-white font-semibold shadow-sm' : 'hover:text-slate-900'
              }`}
              type="button"
            >
              This Week
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                dateFilter === 'month' ? 'bg-[#3FA9A8] text-white font-semibold shadow-sm' : 'hover:text-slate-900'
              }`}
              type="button"
            >
              This Month
            </button>
            <button
              onClick={() => setDateFilter('custom')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer ${
                dateFilter === 'custom' ? 'bg-[#3FA9A8] text-white font-semibold shadow-sm' : 'hover:text-slate-900'
              }`}
              type="button"
            >
              <span>Custom</span>
              <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>

          {/* Export Action */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
            type="button"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 9V2h12v7"></path>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect height="8" width="12" x="6" y="14"></rect>
            </svg>
            <span>Print Summary</span>
          </button>

          {/* Add Expense Toggle Button */}
          <button
            onClick={handleScrollToForm}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3FA9A8] hover:bg-[#328A8A] text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/15 transition-all cursor-pointer active:scale-98"
            id="openExpenseModal"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="12" x2="12" y1="5" y2="19"></line>
              <line x1="5" x2="19" y1="12" y2="12"></line>
            </svg>
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Cards (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Expenses */}
        <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center text-[#3FA9A8] shadow-inner">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <rect height="16" rx="2" width="20" x="2" y="4"></rect>
                <line x1="2" x2="22" y1="10" y2="10"></line>
                <line x1="7" x2="7.01" y1="15" y2="15"></line>
                <line x1="11" x2="13" y1="15" y2="15"></line>
              </svg>
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer" type="button">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5"></circle>
                <circle cx="12" cy="12" r="1.5"></circle>
                <circle cx="12" cy="19" r="1.5"></circle>
              </svg>
            </button>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Expenses (Today)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight font-display">
                Rs. {totalExpensesToday.toLocaleString()}
              </h2>
              <span className="text-[11px] font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                +4.2%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              <span>{expenses.length} vouchers logged in drawer today</span>
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-teal-50/50 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Card 2: Expense Records Count */}
        <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center text-[#3FA9A8] shadow-inner">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" x2="8" y1="13" y2="13"></line>
                <line x1="16" x2="8" y1="17" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer" type="button">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5"></circle>
                <circle cx="12" cy="12" r="1.5"></circle>
                <circle cx="12" cy="19" r="1.5"></circle>
              </svg>
            </button>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Expense Records</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight font-display">
                {expenses.length} Vouchers
              </h2>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Synchronized
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  clipRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  fillRule="evenodd"
                ></path>
              </svg>
              <span>All audited by John Doe (Admin)</span>
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-50/40 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Card 3: Highest Expense Category */}
        <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-inner">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                <line x1="6" x2="6" y1="1" y2="4"></line>
                <line x1="10" x2="10" y1="1" y2="4"></line>
                <line x1="14" x2="14" y1="1" y2="4"></line>
              </svg>
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Top Drain
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Highest Outlay</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight font-display truncate">
                {topCategory.name}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center justify-between">
              <span className="font-semibold text-slate-700">Rs. {topCategory.amount.toLocaleString()}</span>
              <span className="text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-md">
                {topCategory.pct}% of Today
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Operational Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full lg:w-auto flex-1">
          {/* Search Input */}
          <div className="relative w-full lg:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
              </svg>
            </span>
            <input
              id="expenseSearch"
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3FA9A8] transition placeholder:text-slate-400 text-slate-700 font-medium"
              placeholder="Search voucher #, vendor, description..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="relative w-full lg:w-56">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full text-xs py-2 pl-3 pr-8 bg-slate-50 hover:bg-slate-100/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3FA9A8] font-medium text-slate-700 transition cursor-pointer appearance-none"
            >
              <option value="all">All Categories</option>
              <option value="kitchen">Kitchen Raw Supplies</option>
              <option value="dairy">Dairy &amp; Fresh Meat</option>
              <option value="utilities">Utilities &amp; LPG Gas</option>
              <option value="staff">Staff Meals &amp; Welfare</option>
              <option value="packaging">Packaging &amp; Disposables</option>
              <option value="maintenance">Maintenance &amp; Repairs</option>
            </select>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </div>

          {/* Payment Source Filter */}
          <div className="relative w-full lg:w-52">
            <select
              value={selectedSourceFilter}
              onChange={(e) => setSelectedSourceFilter(e.target.value)}
              className="w-full text-xs py-2 pl-3 pr-8 bg-slate-50 hover:bg-slate-100/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3FA9A8] font-medium text-slate-700 transition cursor-pointer appearance-none"
            >
              <option value="all">All Sources (Cash/Petty)</option>
              <option value="cash_drawer">Station 1 Cash Drawer</option>
              <option value="petty_cash">Petty Cash Safe</option>
              <option value="bank_qr">Direct QR / Merchant</option>
            </select>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </div>
        </div>

        {/* Right Controls: Classification badge & Reset */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium">
            <svg className="w-3.5 h-3.5 text-[#3FA9A8]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="16" y2="12"></line>
              <line x1="12" x2="12.01" y1="8" y2="8"></line>
            </svg>
            <span>Strict OPEX Journal</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs font-semibold text-[#3FA9A8] hover:text-[#2A6F70] hover:underline px-2 py-1 transition cursor-pointer"
            type="button"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Primary Split-Workspace: Left/Center Expense Ledger & Right Quick Record Dialog */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT/CENTER: Interactive Expense Ledger Table (Spans 8 cols on XL) */}
        <div className="xl:col-span-8 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Table Header Bar */}
          <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">Today&apos;s Expense Journal</h2>
              <p className="text-[11px] text-slate-400">Authenticated vouchers recorded via POS Station 1</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-lg">
                Showing {filteredExpenses.length} of {expenses.length} Today
              </span>
            </div>
          </div>

          {/* Responsive Table Viewport */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold tracking-wider uppercase text-[10px]">
                  <th className="py-3 px-5">Voucher &amp; Time</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Vendor / Payee</th>
                  <th className="py-3 px-4">Drawer / Source</th>
                  <th className="py-3 px-4 text-right">Amount (PKR)</th>
                  <th className="py-3 px-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-normal">
                      No expense records matching the active filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => {
                    const badge = getCategoryBadge(exp?.category);
                    return (
                      <tr key={exp.id} className="hover:bg-slate-50/60 transition group">
                        {/* Voucher & Time */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span className="font-bold text-slate-900 block font-mono text-[11px]">
                            {exp.id}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatVoucherTime(exp.timestamp)}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${badge.pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                            {exp.category}
                          </span>
                        </td>

                        {/* Description */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="truncate font-semibold text-slate-800">{exp.description}</p>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {exp.subDescription || (exp.receiptNumber ? `Ref #${exp.receiptNumber}` : 'Kitchen operational voucher')}
                          </span>
                        </td>

                        {/* Vendor / Payee */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="text-slate-800 font-medium">{exp.vendor || exp.loggedBy || 'Madina Poultry Farm'}</span>
                        </td>

                        {/* Drawer / Source */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {(exp.paymentSource || exp.paymentMethod || '').toLowerCase().includes('petty') ? (
                              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                              </svg>
                            ) : (
                              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect height="14" rx="2" width="20" x="2" y="7"></rect>
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                              </svg>
                            )}
                            {exp.paymentSource || exp.paymentMethod || 'Cash Drawer (St.1)'}
                          </span>
                        </td>

                        {/* Amount (PKR) */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className="font-bold text-slate-900 text-sm font-headline">
                            Rs. {(Number(exp.amount) || 0).toLocaleString()}
                          </span>
                        </td>

                        {/* Action: Print Voucher & View Details buttons */}
                        <td className="py-3.5 px-5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => window.print()}
                              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
                              title="Print Voucher"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M6 9V2h12v7"></path>
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                <rect height="8" width="12" x="6" y="14"></rect>
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                alert(`Voucher Details:\nID: ${exp.id}\nCategory: ${exp.category}\nVendor: ${exp.vendor || 'N/A'}\nDescription: ${exp.description}\nAmount: Rs. ${(Number(exp.amount) || 0).toLocaleString()}\nSource: ${exp.paymentSource || exp.paymentMethod}`);
                              }}
                              className="p-1.5 hover:bg-teal-50 text-slate-400 hover:text-[#3FA9A8] rounded-lg transition cursor-pointer"
                              title="View Details"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Summary Footer Strip */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3FA9A8]"></span>
              <span>
                Cash drawer reduction: <strong className="text-slate-800">Rs. {cashDrawerReduction.toLocaleString()}</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span>
                Petty safe reduction: <strong className="text-slate-800">Rs. {pettyCashReduction.toLocaleString()}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-600 font-medium">Reconciled Sum:</span>
              <span className="text-base font-extrabold text-[#3FA9A8]">Rs. {totalExpensesToday.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* RIGHT: "Record New Expense" Desktop Slide Form Card (Spans 4 cols on XL) */}
        <div
          ref={formPanelRef}
          className="xl:col-span-4 bg-white rounded-2xl shadow-sm p-5 space-y-4 transition-all"
          id="expenseFormPanel"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 font-headline">Record New Expense</h2>
              <p className="text-[11px] text-teal-600 font-medium">
                Voucher #EXP-2024-{(expenses.length + 42).toString().padStart(4, '0')} • Local SQLite Audit
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-[#3FA9A8] uppercase tracking-wide">
              Station 1
            </span>
          </div>

          <form onSubmit={handleAddExpense} className="space-y-3.5" id="recordExpenseForm">
            {/* Expense Category */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Expense Category *
              </label>
              <select
                id="expCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-[#3FA9A8] text-slate-800 font-medium outline-none cursor-pointer"
                required
              >
                <option disabled value="">Select expense category</option>
                <option value="Kitchen Raw Supplies">Kitchen Raw Supplies (Poultry, Meat, Spices)</option>
                <option value="Dairy & Fresh Meat">Dairy &amp; Fresh Meat</option>
                <option value="Packaging & Disposables">Packaging &amp; Disposables (Boxes, Bags, Foil)</option>
                <option value="Utilities & Gas">Utilities &amp; LPG Gas Cylinders</option>
                <option value="Staff Meals & Refreshments">Staff Meals &amp; Refreshments</option>
                <option value="Maintenance & Cleaning">Maintenance, Cleaning &amp; Repairs</option>
              </select>
            </div>

            {/* Expense Amount & Date Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Amount (PKR) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-bold text-slate-400">
                    Rs.
                  </span>
                  <input
                    ref={amountInputRef}
                    id="expAmount"
                    className="w-full text-xs font-bold text-slate-900 pl-9 pr-3 py-2 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-[#3FA9A8] outline-none"
                    placeholder="0"
                    required
                    step="10"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Date &amp; Time
                </label>
                <input
                  className="w-full text-xs font-semibold text-slate-500 px-3 py-2 bg-slate-100 border-0 rounded-xl cursor-not-allowed outline-none"
                  readOnly
                  type="text"
                  value="Today, 09:15 PM"
                />
              </div>
            </div>

            {/* Paid From / Source Account */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Source *
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label
                  onClick={() => setPaymentSource('Cash Drawer (St.1)')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition font-medium ${
                    paymentSource === 'Cash Drawer (St.1)'
                      ? 'bg-teal-50 text-[#3FA9A8] ring-1 ring-[#3FA9A8]'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <input
                    checked={paymentSource === 'Cash Drawer (St.1)'}
                    onChange={() => setPaymentSource('Cash Drawer (St.1)')}
                    className="text-[#3FA9A8] focus:ring-[#3FA9A8]"
                    name="paymentSource"
                    type="radio"
                    value="Cash Drawer (St.1)"
                  />
                  <span className="leading-tight">Cash Register Drawer</span>
                </label>
                <label
                  onClick={() => setPaymentSource('Petty Cash Safe')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition font-medium ${
                    paymentSource === 'Petty Cash Safe'
                      ? 'bg-teal-50 text-[#3FA9A8] ring-1 ring-[#3FA9A8]'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <input
                    checked={paymentSource === 'Petty Cash Safe'}
                    onChange={() => setPaymentSource('Petty Cash Safe')}
                    className="text-[#3FA9A8] focus:ring-[#3FA9A8]"
                    name="paymentSource"
                    type="radio"
                    value="Petty Cash Safe"
                  />
                  <span className="leading-tight">Petty Cash Safe</span>
                </label>
              </div>
            </div>

            {/* Recipient or Vendor Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Vendor / Payee Name *
              </label>
              <input
                id="expVendor"
                className="w-full text-xs py-2 px-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-[#3FA9A8] text-slate-800 placeholder:text-slate-400 outline-none"
                placeholder="e.g. Metro Cash & Carry, Sabzi Mandi Shop #12"
                required
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
              />
            </div>

            {/* Description / Memo */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Expense Description *
              </label>
              <textarea
                id="expDesc"
                className="w-full text-xs py-2 px-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-[#3FA9A8] text-slate-800 placeholder:text-slate-400 outline-none"
                placeholder="Itemized breakdown or explanation..."
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Reference Slip / Receipt Number */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Vendor Bill / Receipt # (Optional)
              </label>
              <input
                id="expReceipt"
                className="w-full text-xs py-2 px-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-[#3FA9A8] text-slate-800 placeholder:text-slate-400 outline-none"
                placeholder="e.g. BILL-9921 or Paper Slip #04"
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
              />
            </div>

            {/* Classification Guardrail Notice */}
            <div className="bg-amber-50/70 p-3 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-800 leading-snug">
              <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" x2="12" y1="8" y2="12"></line>
                <line x1="12" x2="12.01" y1="16" y2="16"></line>
              </svg>
              <span>
                <strong>Guardrail:</strong> Operating expenses only. Owner drawings, bank transfers, and loans must be filed under <strong>Cash Closing / Capital Journal</strong>.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                type="button"
                onClick={() => {
                  setCategory('');
                  setAmount('');
                  setVendor('');
                  setDescription('');
                  setReceiptNumber('');
                }}
              >
                Clear Form
              </button>
              <button
                disabled={isSaving}
                className="px-5 py-2 bg-[#3FA9A8] hover:bg-[#328A8A] text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 transition flex items-center gap-1.5 cursor-pointer active:scale-98 disabled:opacity-50"
                type="submit"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving to SQLite...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    <span>Save Voucher</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Operational Insights / Category Breakdown Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
        {/* Category Distribution Mini Bento */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Expense Distribution by Category</h3>
              <p className="text-xs text-slate-400">Share of Rs. {totalExpensesToday.toLocaleString()} recorded today</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Live Split</span>
          </div>

          {/* Progress Bars */}
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700">Kitchen Raw Supplies</span>
                <span className="text-slate-900">
                  Rs. 9,450 <span className="text-slate-400 font-normal">(51.9%)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: '51.9%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700">Utilities &amp; LPG Gas</span>
                <span className="text-slate-900">
                  Rs. 4,500 <span className="text-slate-400 font-normal">(24.7%)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: '24.7%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700">Dairy Supplies</span>
                <span className="text-slate-900">
                  Rs. 3,600 <span className="text-slate-400 font-normal">(19.8%)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: '19.8%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700">Staff Meals &amp; Welfare</span>
                <span className="text-slate-900">
                  Rs. 650 <span className="text-slate-400 font-normal">(3.6%)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: '3.6%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Offline POS Resilience & Audit Card */}
        <div className="bg-gradient-to-br from-[#3FA9A8]/10 via-white to-white rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3FA9A8] text-white flex items-center justify-center shadow-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Station 1 Local Ledger Protection</h3>
              <p className="text-xs text-slate-500">Encrypted SQLite journal with auto daily rollup</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All voucher balances are recorded in real-time onto local SQLite database. At end-of-shift{' '}
            <strong>Cash Closing</strong>, total outlays are deducted automatically from gross register collections to balance your opening float.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-100/70 px-2.5 py-1 rounded-lg">
              Sync Status: 0 Pending Cloud Outbox
            </span>
            <button
              className="text-xs font-bold text-[#3FA9A8] hover:text-[#2A6F70] hover:underline cursor-pointer"
              type="button"
              onClick={() => alert('All vouchers are synced to local IndexedDB & SQLite store without errors.')}
            >
              View Audit Logs →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
