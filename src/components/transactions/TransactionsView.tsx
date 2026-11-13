import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useUIStore } from '../../store/useUIStore';
import { useSecurityStore } from '../../store/useSecurityStore';
import { format } from 'date-fns';
import { INITIAL_TRANSACTIONS } from '../../db/seedData';
import type { Transaction } from '../../types';
import { Calendar, X, TrendingUp, TrendingDown, RefreshCw, FileText } from 'lucide-react';

const EMPTY_TRANSACTIONS: Transaction[] = [];

// Format timestamp helper outside component to keep purity
function formatTxTime(timestamp: number, baseTimestamp: number): string {
  try {
    const d = new Date(timestamp);
    const now = new Date(baseTimestamp);
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(baseTimestamp - 24 * 60 * 60 * 1000);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    if (isToday) return `Today, ${format(d, 'hh:mm a')}`;
    if (isYesterday) return `Yesterday, ${format(d, 'hh:mm a')}`;
    return format(d, 'dd MMM yyyy, hh:mm a');
  } catch {
    return 'Recent';
  }
}

// Payment dot indicator color
function getPaymentBadge(method: string) {
  const m = method.toLowerCase();
  if (m === 'easypaisa') {
    return { dot: 'bg-emerald-500', label: 'Easypaisa' };
  }
  if (m === 'jazzcash') {
    return { dot: 'bg-amber-500', label: 'JazzCash' };
  }
  if (m === 'card') {
    return { dot: 'bg-indigo-500', label: 'Card (Meezan)' };
  }
  if (m === 'credit') {
    return { dot: 'bg-purple-500', label: 'Khata (Credit)' };
  }
  return { dot: 'bg-[#3FA9A8]', label: 'Cash' };
}

export const TransactionsView: React.FC = () => {
  const { setSelectedTransaction, setReceiptPreviewModalOpen } = useUIStore();
  const { requestPinAuthorization } = useSecurityStore();

  // Stable reference timestamp on mount for render purity
  const [baseTimestamp] = useState(() => Date.now());

  // Search and categorization filters
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'dine_in' | 'takeaway'>('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Unified Date Filter states
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);

  // Pagination & selection
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const pageSize = 7;

  // Live transactions query from Dexie DB
  const rawTransactions = useLiveQuery(() => db.transactions.reverse().sortBy('timestamp'), []) ?? EMPTY_TRANSACTIONS;

  // Authentic fallback if store just launched and has not populated seed yet
  const transactions: Transaction[] = useMemo(() => {
    if (rawTransactions && rawTransactions.length > 0) return rawTransactions;
    return INITIAL_TRANSACTIONS;
  }, [rawTransactions]);

  // Compute active date boundaries
  const { startTime, endTime, prevStartTime, prevEndTime, dateLabel, comparisonLabel } = useMemo(() => {
    const oneDayMs = 24 * 60 * 60 * 1000;
    const todayDate = new Date(baseTimestamp);
    todayDate.setHours(0, 0, 0, 0);
    const startOfToday = todayDate.getTime();
    const endOfToday = startOfToday + oneDayMs - 1;

    let start = 0;
    let end = baseTimestamp;
    let prevStart = 0;
    let prevEnd = 0;
    let label = '';
    let compLabel = '';

    if (dateFilter === 'today') {
      start = startOfToday;
      end = endOfToday;
      prevStart = startOfToday - oneDayMs;
      prevEnd = startOfToday - 1;
      label = `Today (${format(new Date(baseTimestamp), 'dd MMM yyyy')})`;
      compLabel = 'vs. yesterday';
    } else if (dateFilter === 'week') {
      start = baseTimestamp - 7 * oneDayMs;
      end = baseTimestamp;
      prevStart = baseTimestamp - 14 * oneDayMs;
      prevEnd = baseTimestamp - 7 * oneDayMs;
      label = `Last 7 Days (${format(start, 'dd MMM')} - ${format(end, 'dd MMM yyyy')})`;
      compLabel = 'vs. prior 7d';
    } else if (dateFilter === 'month') {
      start = baseTimestamp - 30 * oneDayMs;
      end = baseTimestamp;
      prevStart = baseTimestamp - 60 * oneDayMs;
      prevEnd = baseTimestamp - 30 * oneDayMs;
      label = `Last 30 Days (${format(start, 'dd MMM')} - ${format(end, 'dd MMM yyyy')})`;
      compLabel = 'vs. prior 30d';
    } else {
      const s = new Date(`${customStartDate}T00:00:00`);
      const e = new Date(`${customEndDate}T23:59:59.999`);
      start = isNaN(s.getTime()) ? baseTimestamp - 7 * oneDayMs : s.getTime();
      end = isNaN(e.getTime()) ? baseTimestamp : e.getTime();
      const span = Math.max(oneDayMs, end - start);
      prevStart = start - span;
      prevEnd = start;
      label = `Custom (${customStartDate} to ${customEndDate})`;
      compLabel = 'vs. prior period';
    }

    return {
      startTime: start,
      endTime: end,
      prevStartTime: prevStart,
      prevEndTime: prevEnd,
      dateLabel: label,
      comparisonLabel: compLabel
    };
  }, [dateFilter, customStartDate, customEndDate, baseTimestamp]);

  // Date-window scoped transactions
  const dateRangeTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.timestamp >= startTime && tx.timestamp <= endTime);
  }, [transactions, startTime, endTime]);

  const prevRangeTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.timestamp >= prevStartTime && tx.timestamp <= prevEndTime);
  }, [transactions, prevStartTime, prevEndTime]);

  // Key metrics calculation for current date range
  const totalSales = useMemo(() => {
    return dateRangeTransactions.reduce((sum, tx) => (tx.status === 'completed' ? sum + tx.total : sum), 0);
  }, [dateRangeTransactions]);

  const prevTotalSales = useMemo(() => {
    return prevRangeTransactions.reduce((sum, tx) => (tx.status === 'completed' ? sum + tx.total : sum), 0);
  }, [prevRangeTransactions]);

  const salesTrend = useMemo(() => {
    if (prevTotalSales === 0) return { pct: totalSales > 0 ? 100 : 0, isUp: totalSales >= 0 };
    const diff = totalSales - prevTotalSales;
    const pct = Math.round((diff / prevTotalSales) * 100);
    return { pct: Math.abs(pct), isUp: diff >= 0 };
  }, [totalSales, prevTotalSales]);

  const completedCount = useMemo(() => {
    return dateRangeTransactions.filter((tx) => tx.status === 'completed').length;
  }, [dateRangeTransactions]);

  const prevCompletedCount = useMemo(() => {
    return prevRangeTransactions.filter((tx) => tx.status === 'completed').length;
  }, [prevRangeTransactions]);

  const ordersTrend = useMemo(() => {
    if (prevCompletedCount === 0) return { pct: completedCount > 0 ? 100 : 0, isUp: completedCount >= 0 };
    const diff = completedCount - prevCompletedCount;
    const pct = Math.round((diff / prevCompletedCount) * 100);
    return { pct: Math.abs(pct), isUp: diff >= 0 };
  }, [completedCount, prevCompletedCount]);

  const cashSales = useMemo(() => {
    return dateRangeTransactions
      .filter((tx) => tx.status === 'completed' && tx.paymentMethod.toLowerCase() === 'cash')
      .reduce((sum, tx) => sum + tx.total, 0);
  }, [dateRangeTransactions]);

  const digitalSales = useMemo(() => {
    return dateRangeTransactions
      .filter((tx) => tx.status === 'completed' && tx.paymentMethod.toLowerCase() !== 'cash')
      .reduce((sum, tx) => sum + tx.total, 0);
  }, [dateRangeTransactions]);

  const cashPct = totalSales > 0 ? Math.round((cashSales / totalSales) * 100) : 0;
  const digitalPct = totalSales > 0 ? Math.round((digitalSales / totalSales) * 100) : 0;

  // Filtered transactions (Date Range + Search + Dropdown Filters)
  const filteredTransactions = useMemo(() => {
    let result = [...dateRangeTransactions];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (tx) =>
          tx.id.toLowerCase().includes(q) ||
          tx.orderNumber.toString().includes(q) ||
          tx.cashierName.toLowerCase().includes(q) ||
          (tx.notes && tx.notes.toLowerCase().includes(q)) ||
          tx.items.some((it) => it.name.toLowerCase().includes(q))
      );
    }

    // Order channel filter
    if (channelFilter === 'dine_in') {
      result = result.filter((tx) => tx.notes && (tx.notes.includes('Dine') || tx.notes.includes('Table') || tx.notes.includes('T-')));
    } else if (channelFilter === 'takeaway') {
      result = result.filter((tx) => tx.notes && (tx.notes.includes('Takeaway') || tx.notes.includes('Counter')));
    }

    // Payment method filter
    if (methodFilter !== 'all') {
      result = result.filter((tx) => tx.paymentMethod.toLowerCase() === methodFilter.toLowerCase());
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((tx) => tx.status.toLowerCase() === statusFilter.toLowerCase());
    }

    return result;
  }, [dateRangeTransactions, searchQuery, channelFilter, methodFilter, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + pageSize);

  // Active selected transaction for detail panel
  const activeTx: Transaction | undefined = useMemo(() => {
    if (selectedTxId) {
      const found = transactions.find((t) => t.id === selectedTxId);
      if (found) return found;
    }
    return paginatedTransactions[0] || transactions[0];
  }, [selectedTxId, transactions, paginatedTransactions]);

  const handleSelectRow = (tx: Transaction) => {
    setSelectedTxId(tx.id);
  };

  const handleReprintReceipt = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setReceiptPreviewModalOpen(true);
  };

  const handleRefundOrVoid = (tx: Transaction) => {
    const nextStatus = tx.status === 'refunded' ? 'completed' : 'refunded';
    const isRefunding = nextStatus === 'refunded';
    const reason = isRefunding
      ? `Authorize Refunding Receipt ${tx.id} & Restoring Stock`
      : `Authorize Restoring Receipt ${tx.id} to Completed`;

    requestPinAuthorization(reason, async () => {
      try {
        await db.transaction('rw', [db.transactions, db.products], async () => {
          // 1. Update transaction status
          await db.transactions.update(tx.id, { status: nextStatus });

          // 2. Adjust inventory stock atomically
          for (const item of tx.items) {
            if (item.productId) {
              const product = await db.products.get(item.productId);
              if (product) {
                const currentStock = product.stock ?? 0;
                const newStock = isRefunding
                  ? currentStock + item.qty
                  : Math.max(0, currentStock - item.qty);
                const isAvailable = newStock > 0;
                await db.products.update(item.productId, {
                  stock: newStock,
                  isAvailable,
                });
              }
            }
          }
        });
      } catch (err) {
        console.error('Error updating status and inventory:', err);
        alert('Failed to update transaction status. Please try again.');
      }
    });
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Receipt_ID,Order_Number,Timestamp,Channel,Cashier,Payment_Method,Subtotal,Tax,Total,Status\n' +
      filteredTransactions
        .map(
          (t) =>
            `${t.id},${t.orderNumber},"${new Date(t.timestamp).toISOString()}","${t.notes || 'Dine-In'}","${t.cashierName}",${t.paymentMethod},${t.subtotal},${t.tax},${t.total},${t.status}`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DinePos_Transactions_${dateFilter}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrintRegisterLog = () => {
    window.print();
  };

  const resetFilters = () => {
    setSearchQuery('');
    setChannelFilter('all');
    setMethodFilter('all');
    setStatusFilter('all');
    setDateFilter('today');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 select-none font-sans" data-purpose="transactions-view">
      {/* BEGIN: Page Header & Quick Controls */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4" data-purpose="page-header">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Transactions &amp; Settlements</h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-teal-50 text-[#3FA9A8] border border-teal-200/60 rounded-full">
              Live Dexie Audit
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Review completed sales, audit settlement logs, and manage customer receipts for{' '}
            <strong className="text-slate-700">{dateLabel}</strong>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Date Filter Pills */}
          <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => {
                setDateFilter('today');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                dateFilter === 'today' ? 'bg-[#3FA9A8] text-white shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                setDateFilter('week');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                dateFilter === 'week' ? 'bg-[#3FA9A8] text-white shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => {
                setDateFilter('month');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                dateFilter === 'month' ? 'bg-[#3FA9A8] text-white shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => {
                setDateFilter('custom');
                setShowCustomDateModal(true);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                dateFilter === 'custom' ? 'bg-[#3FA9A8] text-white shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Custom</span>
            </button>
          </div>

          {/* Register & Export Actions */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" x2="12" y1="15" y2="3"></line>
            </svg>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrintRegisterLog}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect height="8" width="12" x="6" y="14"></rect>
            </svg>
            <span>Print Register Log</span>
          </button>
        </div>
      </section>
      {/* END: Page Header & Quick Controls */}

      {/* BEGIN: Key Transaction Metrics Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" data-purpose="metrics-summary-row">
        {/* Metric 1: Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#3FA9A8]">
              <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" x2="12" y1="1" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {dateFilter.toUpperCase()}
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-400">Total Sales</span>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">
              Rs. {totalSales.toLocaleString()}
            </h3>
            <p className={`text-[11px] font-semibold flex items-center gap-1 mt-2 ${salesTrend.isUp ? 'text-emerald-600' : 'text-rose-500'}`}>
              {salesTrend.isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{salesTrend.pct}%</span> <span className="text-slate-400 font-normal">{comparisonLabel}</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Completed Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#3FA9A8]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect height="4" rx="1" ry="1" width="8" x="8" y="2"></rect>
                <polyline points="9 14 11 16 15 12"></polyline>
              </svg>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
              VOLUME
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-400">Completed Transactions</span>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">{completedCount} Orders</h3>
            <p className={`text-[11px] font-semibold flex items-center gap-1 mt-2 ${ordersTrend.isUp ? 'text-emerald-600' : 'text-rose-500'}`}>
              {ordersTrend.isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{ordersTrend.pct}%</span> <span className="text-slate-400 font-normal">{comparisonLabel}</span>
            </p>
          </div>
        </div>

        {/* Metric 3: Cash Received */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#3FA9A8]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <rect height="12" rx="2" width="20" x="2" y="6"></rect>
                <circle cx="12" cy="12" r="2.5"></circle>
                <path d="M6 12h.01M18 12h.01"></path>
              </svg>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {cashPct}% SHARE
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-400">Cash Received</span>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">
              Rs. {cashSales.toLocaleString()}
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-[#3FA9A8]"></span>
              <span>Physical drawer tender in period</span>
            </p>
          </div>
        </div>

        {/* Metric 4: Digital Payments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#3FA9A8]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <rect height="14" rx="2" width="20" x="2" y="5"></rect>
                <line x1="2" x2="22" y1="10" y2="10"></line>
              </svg>
            </div>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {digitalPct}% SHARE
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-400">Digital Payments</span>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">
              Rs. {digitalSales.toLocaleString()}
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Easypaisa, JazzCash, Card</span>
            </p>
          </div>
        </div>
      </section>
      {/* END: Key Transaction Metrics Row */}

      {/* BEGIN: Filter Toolbar */}
      <section className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3" data-purpose="filtering-bar">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[300px]">
          {/* Filter Search Box */}
          <div className="relative min-w-[260px] flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
              </svg>
            </span>
            <input
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] focus:border-[#3FA9A8]"
              placeholder="Search receipt #, customer, order ID, cashier..."
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Order Channel Dropdown */}
          <select
            className="text-xs py-2 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:bg-white focus:ring-1 focus:ring-[#3FA9A8] focus:border-[#3FA9A8] cursor-pointer"
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value as 'all' | 'dine_in' | 'takeaway');
              setCurrentPage(1);
            }}
          >
            <option value="all">All Channels (Dine-in &amp; Takeaway)</option>
            <option value="dine_in">Dine-In Only</option>
            <option value="takeaway">Takeaway Only</option>
          </select>

          {/* Payment Method Dropdown */}
          <select
            className="text-xs py-2 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:bg-white focus:ring-1 focus:ring-[#3FA9A8] focus:border-[#3FA9A8] cursor-pointer"
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="credit">Khata (Credit)</option>
            <option value="easypaisa">Easypaisa</option>
            <option value="jazzcash">JazzCash</option>
            <option value="card">Bank Card</option>
          </select>

          {/* Status Dropdown */}
          <select
            className="text-xs py-2 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:bg-white focus:ring-1 focus:ring-[#3FA9A8] focus:border-[#3FA9A8] cursor-pointer"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="refunded">Refunded</option>
            <option value="voided">Voided</option>
          </select>
        </div>

        {/* Filter Reset Action */}
        <button
          type="button"
          onClick={resetFilters}
          className="text-xs font-semibold text-slate-500 hover:text-[#3FA9A8] px-2 py-1.5 transition cursor-pointer flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </section>
      {/* END: Filter Toolbar */}

      {/* BEGIN: Detail Split View Layout */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-6" data-purpose="transactions-split-view">
        {/* Left Table Section (7 of 12 columns) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FileText className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-slate-600">No transactions match the selected filters.</p>
                        <p className="text-[11px] text-slate-400">Try adjusting the date range, search query, or status.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((tx) => {
                    const isSelected = activeTx?.id === tx.id;
                    const isRefunded = tx.status === 'refunded';
                    const isDineIn = tx.notes?.includes('Dine') || tx.notes?.includes('Table') || tx.notes?.includes('T-');
                    const paymentInfo = getPaymentBadge(tx.paymentMethod);

                    return (
                      <tr
                        key={tx.id}
                        onClick={() => handleSelectRow(tx)}
                        className={`transition cursor-pointer ${
                          isSelected
                            ? 'bg-teal-50/60 font-medium border-l-4 border-[#3FA9A8]'
                            : isRefunded
                            ? 'bg-slate-50/40 hover:bg-slate-50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Receipt # */}
                        <td className={`py-3.5 px-4 ${isSelected ? 'font-bold text-[#3FA9A8]' : isRefunded ? 'font-semibold text-slate-500' : 'font-semibold text-slate-800'}`}>
                          {tx.id}
                          <span className="block text-[10px] font-normal text-slate-400">
                            {tx.customerName ? `Khata: ${tx.customerName}` : (tx.station || 'Terminal 01')}
                          </span>
                        </td>

                        {/* Time */}
                        <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                          {formatTxTime(tx.timestamp, baseTimestamp)}
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {isDineIn ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100/70 text-teal-800">
                              {tx.notes || 'Dine-In (T-04)'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                              Takeaway
                            </span>
                          )}
                        </td>

                        {/* Payment */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className={`flex items-center gap-1.5 font-medium ${isRefunded ? 'text-slate-500' : 'text-slate-700'}`}>
                            <span className={`w-2 h-2 rounded-full ${paymentInfo.dot}`}></span>
                            <span>{isRefunded ? `${paymentInfo.label} (Reversed)` : paymentInfo.label}</span>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className={`py-3.5 px-4 text-right whitespace-nowrap ${isRefunded ? 'font-medium text-slate-400 line-through' : 'font-bold text-slate-900'}`}>
                          Rs. {tx.total.toLocaleString()}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {tx.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100/60 text-emerald-800 border border-emerald-200/50">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                              <span>Completed</span>
                            </span>
                          ) : tx.status === 'refunded' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              Refunded
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700">
                              Voided
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReprintReceipt(tx);
                            }}
                            className={`p-1 rounded transition cursor-pointer ${
                              isSelected
                                ? 'hover:bg-teal-100/70 text-[#3FA9A8]'
                                : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                            }`}
                            title="Reprint receipt"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <polyline points="6 9 6 2 18 2 18 9"></polyline>
                              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                              <rect height="8" width="12" x="6" y="14"></rect>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Desktop Table Pagination */}
          <div className="p-3.5 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-700">{filteredTransactions.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, filteredTransactions.length)}</span> of{' '}
              <span className="font-bold text-slate-700">{filteredTransactions.length}</span> transactions
            </div>
            <div className="flex items-center gap-1 font-medium">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg transition cursor-pointer flex items-center justify-center ${
                    validCurrentPage === pageNum
                      ? 'bg-[#3FA9A8] text-white font-bold'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              {totalPages > 5 && (
                <>
                  <span className="px-1 text-slate-400">...</span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Transaction Detail Drawer Panel (5 of 12 columns) */}
        {activeTx ? (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-md p-6 space-y-5" data-purpose="transaction-detail-panel">
            {/* Detail Panel Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Transaction Details</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Verified</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Audit log and receipt breakdown for settlement</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                title="Deselect"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="18" x2="6" y1="6" y2="18"></line>
                  <line x1="6" x2="18" y1="6" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Transaction Metadata Card */}
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60 grid grid-cols-2 gap-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Receipt Number</span>
                <span className="font-bold text-slate-800 tracking-tight">{activeTx.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">POS Terminal</span>
                <span className="font-semibold text-slate-700">{activeTx.station || 'Terminal 01 (Admin)'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Date &amp; Timestamp</span>
                <span className="font-semibold text-slate-700">{formatTxTime(activeTx.timestamp, baseTimestamp)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Order Type / Table</span>
                <span className="font-semibold text-[#3FA9A8]">
                  {activeTx.notes ? activeTx.notes.replace('(', '• ').replace(')', '') : 'Dine-In • Table #04'}
                </span>
              </div>
            </div>

            {/* Itemized Breakdown */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100">
                <span>Item &amp; Portion</span>
                <span>Total</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs py-1 max-h-48 overflow-y-auto">
                {activeTx.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {item.qty} x Rs. {item.price.toLocaleString()} {item.notes ? `(${item.notes})` : ''}
                      </p>
                    </div>
                    <span className="font-bold text-slate-800">Rs. {(item.qty * item.price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing Calculations */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-700">Rs. {activeTx.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Discount</span>
                <span className="font-semibold text-slate-700">
                  Rs. {activeTx.discount || 0} ({activeTx.discount ? 'Applied' : '0%'})
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Sales Tax (GST Included)</span>
                <span className="font-semibold text-slate-700">Rs. {activeTx.tax || 0}</span>
              </div>
              <div className="border-b-[1.5px] border-dashed border-slate-200 my-2"></div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-sm font-bold text-slate-800">Final Net Total</span>
                <span className="text-xl font-bold text-[#3FA9A8] tracking-tight">
                  Rs. {activeTx.total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Settlement Details */}
            <div className="bg-teal-50/50 rounded-xl p-3 border border-teal-100 text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payment Mode</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5 capitalize">
                  <span className={`w-2 h-2 rounded-full ${getPaymentBadge(activeTx.paymentMethod).dot}`}></span>
                  <span>{getPaymentBadge(activeTx.paymentMethod).label}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reference / Auth ID</span>
                <span className="font-mono text-slate-700 font-medium">
                  {activeTx.referenceId || `TXN-${activeTx.id.replace('#', '')}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Change Returned</span>
                <span className="font-semibold text-slate-700">
                  Rs. {(activeTx.changeDue || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleReprintReceipt(activeTx)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#3FA9A8] hover:bg-[#349291] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer active:scale-98"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect height="8" width="12" x="6" y="14"></rect>
                </svg>
                <span>Reprint Customer Receipt</span>
              </button>
              <p className="text-[10px] text-center text-slate-400">
                Reprinting is logged in the SQLite audit file and doesn&apos;t duplicate revenue.
              </p>
              <button
                type="button"
                onClick={() => handleRefundOrVoid(activeTx)}
                className="w-full py-2 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" x2="9" y1="9" y2="15"></line>
                  <line x1="9" x2="15" y1="9" y2="15"></line>
                </svg>
                <span>{activeTx.status === 'refunded' ? 'Restore Transaction' : 'Issue Refund / Void Ticket'}</span>
              </button>
            </div>

            {/* Thermal Printer Status Card */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Printer Ready: <strong>Citizen CT-S310II (USB)</strong></span>
              </div>
              <button
                type="button"
                onClick={() => alert('Printer Test Feed: OK (Feed paper 20mm, Cutter active)')}
                className="text-[#3FA9A8] font-semibold cursor-pointer hover:underline"
              >
                Test Feed
              </button>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-md p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
            <FileText className="w-8 h-8 text-slate-300" />
            <p className="font-semibold text-slate-600">Select a transaction from the list</p>
            <p className="text-[11px] text-slate-400">View its audit details, itemized breakdown, and reprint receipts.</p>
          </div>
        )}
        {/* END: Right Side Detail Panel */}
      </section>
      {/* END: Detail Split View Layout */}

      {/* BEGIN: Custom Date Range Modal */}
      {showCustomDateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#3FA9A8]" />
                <h3 className="font-bold text-slate-800 text-sm">Select Custom Range</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomDateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCustomDateModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setDateFilter('custom');
                  setShowCustomDateModal(false);
                  setCurrentPage(1);
                }}
                className="px-4 py-1.5 text-xs font-bold bg-[#3FA9A8] hover:bg-[#349695] text-white rounded-xl shadow-xs cursor-pointer"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
      {/* END: Custom Date Range Modal */}
    </div>
  );
};
