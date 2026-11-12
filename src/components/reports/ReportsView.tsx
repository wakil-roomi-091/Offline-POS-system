import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import type { Transaction, ExpenseRecord, Product, ShiftRecord } from '../../types';
import {
  FileText,
  Printer,
  Download,
  RotateCcw,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Receipt,
  PieChart,
  CheckCircle2,
  X
} from 'lucide-react';

type ReportTab = 'items' | 'journal' | 'payments' | 'expenses' | 'closings';
type DateFilter = 'today' | 'week' | 'month' | 'custom';

const EMPTY_TRANSACTIONS: Transaction[] = [];
const EMPTY_EXPENSES: ExpenseRecord[] = [];
const EMPTY_PRODUCTS: Product[] = [];
const EMPTY_SHIFTS: ShiftRecord[] = [];

// Format PKR Currency
const formatPKR = (amount: number): string => {
  return `Rs. ${Math.round(amount).toLocaleString('en-PK')}`;
};

export const ReportsView: React.FC = () => {
  // Stable reference timestamp on mount
  const [baseTimestamp] = useState(() => Date.now());

  // Active view filters
  const [activeTab, setActiveTab] = useState<ReportTab>('items');
  const [dateFilter, setDateFilter] = useState<DateFilter>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;

  // Custom date picker states (defaults to last 7 days)
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Live queries from Dexie database
  const liveTransactions = useLiveQuery(() => db.transactions.toArray(), []) ?? EMPTY_TRANSACTIONS;
  const liveExpenses = useLiveQuery(() => db.expenses.toArray(), []) ?? EMPTY_EXPENSES;
  const liveProducts = useLiveQuery(() => db.products.toArray(), []) ?? EMPTY_PRODUCTS;
  const liveShifts = useLiveQuery(() => db.shifts.toArray(), []) ?? EMPTY_SHIFTS;

  // Compute active date boundaries
  const { startTime, endTime, prevStartTime, prevEndTime, dateLabel } = useMemo(() => {
    const oneDayMs = 24 * 60 * 60 * 1000;
    let start = 0;
    let end = baseTimestamp;
    let prevStart = 0;
    let prevEnd = 0;
    let label = '';

    const todayDate = new Date(baseTimestamp);
    todayDate.setHours(0, 0, 0, 0);
    const startOfToday = todayDate.getTime();

    if (dateFilter === 'today') {
      start = startOfToday;
      end = baseTimestamp;
      prevStart = startOfToday - oneDayMs;
      prevEnd = startOfToday - 1;
      label = `Today (${new Date(baseTimestamp).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })})`;
    } else if (dateFilter === 'week') {
      start = baseTimestamp - 7 * oneDayMs;
      end = baseTimestamp;
      prevStart = baseTimestamp - 14 * oneDayMs;
      prevEnd = baseTimestamp - 7 * oneDayMs;
      label = `Last 7 Days (${new Date(start).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })} - ${new Date(end).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })})`;
    } else if (dateFilter === 'month') {
      start = baseTimestamp - 30 * oneDayMs;
      end = baseTimestamp;
      prevStart = baseTimestamp - 60 * oneDayMs;
      prevEnd = baseTimestamp - 30 * oneDayMs;
      label = `Last 30 Days (${new Date(start).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })} - ${new Date(end).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })})`;
    } else {
      // Custom date range
      const s = new Date(`${customStartDate}T00:00:00`);
      const e = new Date(`${customEndDate}T23:59:59.999`);
      start = isNaN(s.getTime()) ? baseTimestamp - 7 * oneDayMs : s.getTime();
      end = isNaN(e.getTime()) ? baseTimestamp : e.getTime();
      const span = Math.max(oneDayMs, end - start);
      prevStart = start - span;
      prevEnd = start;
      label = `Custom (${customStartDate} to ${customEndDate})`;
    }

    return { startTime: start, endTime: end, prevStartTime: prevStart, prevEndTime: prevEnd, dateLabel: label };
  }, [dateFilter, customStartDate, customEndDate, baseTimestamp]);

  // Product cost map for COGS calculation
  const productCostMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of liveProducts) {
      const estimatedCost = p.costPrice ?? Math.round(p.price * 0.45);
      map.set(p.id, estimatedCost);
      map.set(p.name.toLowerCase().trim(), estimatedCost);
    }
    return map;
  }, [liveProducts]);

  // Filtered transactions for current and previous period
  const filteredTransactions = useMemo(() => {
    return liveTransactions.filter((tx) => tx.timestamp >= startTime && tx.timestamp <= endTime);
  }, [liveTransactions, startTime, endTime]);

  const prevTransactions = useMemo(() => {
    return liveTransactions.filter((tx) => tx.timestamp >= prevStartTime && tx.timestamp <= prevEndTime);
  }, [liveTransactions, prevStartTime, prevEndTime]);

  // Filtered expenses for current period
  const filteredExpenses = useMemo(() => {
    return liveExpenses.filter((exp) => exp.timestamp >= startTime && exp.timestamp <= endTime);
  }, [liveExpenses, startTime, endTime]);

  // Completed transactions
  const completedTx = useMemo(() => {
    return filteredTransactions.filter((t) => t.status === 'completed');
  }, [filteredTransactions]);

  const prevCompletedTx = useMemo(() => {
    return prevTransactions.filter((t) => t.status === 'completed');
  }, [prevTransactions]);

  // Key Financial Performance Indicators (KPIs)
  const metrics = useMemo(() => {
    const grossSales = completedTx.reduce((sum, t) => sum + (t.total || 0), 0);
    const ordersCount = completedTx.length;
    const aov = ordersCount > 0 ? Math.round(grossSales / ordersCount) : 0;
    const expensesTotal = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Compute COGS
    let cogs = 0;
    for (const tx of completedTx) {
      if (tx.items && Array.isArray(tx.items)) {
        for (const it of tx.items) {
          const unitCost = productCostMap.get(it.productId) ?? productCostMap.get(it.name.toLowerCase().trim()) ?? Math.round(it.price * 0.45);
          cogs += unitCost * (it.qty || 1);
        }
      }
    }

    const grossProfit = grossSales - cogs;
    const netProfit = grossProfit - expensesTotal;
    const grossMarginPct = grossSales > 0 ? ((grossProfit / grossSales) * 100).toFixed(1) : '0.0';

    // Previous period comparisons
    const prevSales = prevCompletedTx.reduce((sum, t) => sum + (t.total || 0), 0);
    const prevOrders = prevCompletedTx.length;
    const prevAov = prevOrders > 0 ? Math.round(prevSales / prevOrders) : 0;

    const salesDiffPct = prevSales > 0 ? (((grossSales - prevSales) / prevSales) * 100).toFixed(1) : '+0.0';
    const ordersDiffPct = prevOrders > 0 ? (((ordersCount - prevOrders) / prevOrders) * 100).toFixed(1) : '+0.0';
    const aovDiffPct = prevAov > 0 ? (((aov - prevAov) / prevAov) * 100).toFixed(1) : '+0.0';

    return {
      grossSales,
      ordersCount,
      aov,
      expensesTotal,
      cogs,
      grossProfit,
      netProfit,
      grossMarginPct,
      salesDiffPct,
      ordersDiffPct,
      aovDiffPct
    };
  }, [completedTx, prevCompletedTx, filteredExpenses, productCostMap]);

  // Item velocity aggregation (Top selling dishes & Item-wise sales breakdown)
  const itemSalesSummary = useMemo(() => {
    interface ItemAggregate {
      id: string;
      code: string;
      name: string;
      category: string;
      qtySold: number;
      revenue: number;
      avgPrice: number;
      sharePct: number;
    }

    const map = new Map<string, { id: string; code: string; name: string; category: string; qty: number; revenue: number }>();

    for (const tx of completedTx) {
      if (!tx.items) continue;
      for (const it of tx.items) {
        const key = it.name.trim();
        const existing = map.get(key);
        const itemRev = it.price * it.qty;
        if (existing) {
          existing.qty += it.qty;
          existing.revenue += itemRev;
        } else {
          // Lookup category and sku
          const matchedProd = liveProducts.find((p) => p.name.toLowerCase().trim() === key.toLowerCase() || p.id === it.productId);
          map.set(key, {
            id: it.productId || key,
            code: matchedProd?.sku || `#ITM-${Math.abs(key.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0) % 9000 + 1000)}`,
            name: it.name,
            category: matchedProd?.category || 'General Menu',
            qty: it.qty,
            revenue: itemRev
          });
        }
      }
    }

    const items: ItemAggregate[] = [];
    const totalRev = metrics.grossSales || 1;

    map.forEach((val) => {
      items.push({
        id: val.id,
        code: val.code,
        name: val.name,
        category: val.category,
        qtySold: val.qty,
        revenue: val.revenue,
        avgPrice: val.qty > 0 ? Math.round(val.revenue / val.qty) : 0,
        sharePct: Number(((val.revenue / totalRev) * 100).toFixed(1))
      });
    });

    // Sort descending by revenue
    items.sort((a, b) => b.revenue - a.revenue);
    return items;
  }, [completedTx, liveProducts, metrics.grossSales]);

  // Category sales breakdown
  const categorySummary = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of itemSalesSummary) {
      const cat = item.category || 'General';
      map.set(cat, (map.get(cat) || 0) + item.revenue);
    }

    const totalRev = metrics.grossSales || 1;
    const result: { category: string; revenue: number; percentage: number }[] = [];

    map.forEach((revenue, category) => {
      result.push({
        category,
        revenue,
        percentage: Math.min(100, Math.round((revenue / totalRev) * 100))
      });
    });

    result.sort((a, b) => b.revenue - a.revenue);
    return result;
  }, [itemSalesSummary, metrics.grossSales]);

  // Order Channels distribution (Dine-in vs Takeaway)
  const channelSummary = useMemo(() => {
    let dineInOrders = 0;
    let dineInRev = 0;
    let takeawayOrders = 0;
    let takeawayRev = 0;

    for (const tx of completedTx) {
      const note = (tx.notes || '').toLowerCase();
      if (note.includes('dine') || note.includes('table')) {
        dineInOrders += 1;
        dineInRev += tx.total;
      } else {
        takeawayOrders += 1;
        takeawayRev += tx.total;
      }
    }

    const totalRev = metrics.grossSales || 1;
    const totalOrders = completedTx.length || 1;

    return {
      dineInOrders,
      dineInRev,
      dineInPct: Math.round((dineInRev / totalRev) * 100),
      dineInOrderPct: Math.round((dineInOrders / totalOrders) * 100),
      takeawayOrders,
      takeawayRev,
      takeawayPct: Math.round((takeawayRev / totalRev) * 100),
      takeawayOrderPct: Math.round((takeawayOrders / totalOrders) * 100)
    };
  }, [completedTx, metrics.grossSales]);

  // Payment Reconciliation Breakdown
  const paymentBreakdown = useMemo(() => {
    interface PaymentChannel {
      channel: string;
      label: string;
      count: number;
      revenue: number;
      sharePct: number;
      settlement: string;
      color: string;
    }

    const map = new Map<string, { count: number; revenue: number }>();
    const totalRev = metrics.grossSales || 1;

    for (const tx of completedTx) {
      const method = tx.paymentMethod || 'cash';
      const curr = map.get(method) || { count: 0, revenue: 0 };
      curr.count += 1;
      curr.revenue += tx.total;
      map.set(method, curr);
    }

    const standardChannels: { id: string; label: string; settlement: string; color: string }[] = [
      { id: 'cash', label: 'Cash Counter (Stations 1 & 2)', settlement: 'Immediate Drawer', color: 'bg-emerald-50 text-emerald-700' },
      { id: 'jazzcash', label: 'JazzCash Merchant QR', settlement: 'Direct Wallet T+0', color: 'bg-amber-50 text-amber-700' },
      { id: 'easypaisa', label: 'Easypaisa Merchant QR', settlement: 'Direct Wallet T+0', color: 'bg-purple-50 text-purple-700' },
      { id: 'card', label: 'Debit / Credit Card POS', settlement: 'Bank Batch T+1', color: 'bg-blue-50 text-blue-700' },
      { id: 'split', label: 'Split / Mixed Tender', settlement: 'Split Settlement', color: 'bg-slate-100 text-slate-700' },
      { id: 'qr', label: 'Digital QR Pay', settlement: 'Instant Merchant API', color: 'bg-teal-50 text-teal-700' }
    ];

    const results: PaymentChannel[] = [];

    for (const sc of standardChannels) {
      const data = map.get(sc.id) || { count: 0, revenue: 0 };
      results.push({
        channel: sc.id,
        label: sc.label,
        count: data.count,
        revenue: data.revenue,
        sharePct: Number(((data.revenue / totalRev) * 100).toFixed(1)),
        settlement: sc.settlement,
        color: sc.color
      });
    }

    // Sort by revenue descending
    return results.sort((a, b) => b.revenue - a.revenue);
  }, [completedTx, metrics.grossSales]);

  // Filtered Expense Breakdown by Category
  const expenseCategoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const exp of filteredExpenses) {
      const cat = exp.category || 'General Expenses';
      map.set(cat, (map.get(cat) || 0) + exp.amount);
    }

    const totalExp = metrics.expensesTotal || 1;
    const result: { category: string; amount: number; percentage: number }[] = [];

    map.forEach((amount, category) => {
      result.push({
        category,
        amount,
        percentage: Math.min(100, Math.round((amount / totalExp) * 100))
      });
    });

    result.sort((a, b) => b.amount - a.amount);
    return result;
  }, [filteredExpenses, metrics.expensesTotal]);

  // Reset Filters Handler
  const handleResetFilters = () => {
    setDateFilter('week');
    setActiveTab('items');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Dynamic CSV Exporter based on current active tab
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `DinePos_${activeTab}_report_${Date.now()}.csv`;

    if (activeTab === 'items') {
      headers = ['Item Code', 'Item Name', 'Category', 'Units Sold', 'Avg Price (PKR)', 'Gross Revenue (PKR)', 'Sales Share (%)'];
      rows = itemSalesSummary.map((item) => [
        `"${item.code}"`,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.category.replace(/"/g, '""')}"`,
        String(item.qtySold),
        String(item.avgPrice),
        String(item.revenue),
        `${item.sharePct}%`
      ]);
    } else if (activeTab === 'journal') {
      headers = ['Receipt ID', 'Order No', 'Date & Time', 'Cashier', 'Station', 'Payment Method', 'Items Count', 'Subtotal', 'Tax', 'Discount', 'Total', 'Status'];
      rows = filteredTransactions.map((tx) => [
        `"${tx.id}"`,
        String(tx.orderNumber),
        `"${new Date(tx.timestamp).toLocaleString('en-PK')}"`,
        `"${tx.cashierName || 'Cashier'}"`,
        `"${tx.station || 'Station 1'}"`,
        `"${tx.paymentMethod.toUpperCase()}"`,
        String(tx.items?.length || 0),
        String(tx.subtotal || 0),
        String(tx.tax || 0),
        String(tx.discount || 0),
        String(tx.total || 0),
        `"${tx.status.toUpperCase()}"`
      ]);
    } else if (activeTab === 'payments') {
      headers = ['Tender Channel', 'Transactions Count', 'Gross Revenue (PKR)', 'Volume Share (%)', 'Settlement Type'];
      rows = paymentBreakdown.map((p) => [
        `"${p.label}"`,
        String(p.count),
        String(p.revenue),
        `${p.sharePct}%`,
        `"${p.settlement}"`
      ]);
    } else if (activeTab === 'expenses') {
      headers = ['Voucher ID', 'Date & Time', 'Description', 'Category', 'Payment Source', 'Logged By', 'Amount (PKR)'];
      rows = filteredExpenses.map((exp) => [
        `"${exp.id}"`,
        `"${new Date(exp.timestamp).toLocaleString('en-PK')}"`,
        `"${exp.description.replace(/"/g, '""')}"`,
        `"${exp.category}"`,
        `"${exp.paymentMethod || 'Drawer Cash'}"`,
        `"${exp.loggedBy || 'Manager'}"`,
        String(exp.amount)
      ]);
    } else if (activeTab === 'closings') {
      headers = ['Shift ID', 'Z-Report No', 'Opened At', 'Closed At', 'Cashier', 'Station', 'Expected Cash (PKR)', 'Actual Cash (PKR)', 'Discrepancy (PKR)', 'Status'];
      rows = liveShifts.map((s) => [
        `"${s.id}"`,
        `"${s.zReportNumber || 'N/A'}"`,
        `"${new Date(s.openedAt).toLocaleString('en-PK')}"`,
        s.closedAt ? `"${new Date(s.closedAt).toLocaleString('en-PK')}"` : '"Open"',
        `"${s.cashierName}"`,
        `"${s.station}"`,
        String(s.expectedCash || 0),
        String(s.actualCash ?? s.expectedCash ?? 0),
        String(s.discrepancy || 0),
        `"${s.status.toUpperCase()}"`
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered tabular data for active tab based on search query
  const searchedItems = useMemo(() => {
    if (!searchQuery.trim()) return itemSalesSummary;
    const q = searchQuery.toLowerCase();
    return itemSalesSummary.filter(
      (item) => item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    );
  }, [itemSalesSummary, searchQuery]);

  const searchedTransactions = useMemo(() => {
    if (!searchQuery.trim()) return filteredTransactions;
    const q = searchQuery.toLowerCase();
    return filteredTransactions.filter(
      (tx) =>
        String(tx.orderNumber).includes(q) ||
        tx.id.toLowerCase().includes(q) ||
        (tx.cashierName && tx.cashierName.toLowerCase().includes(q)) ||
        tx.paymentMethod.toLowerCase().includes(q)
    );
  }, [filteredTransactions, searchQuery]);

  const searchedExpenses = useMemo(() => {
    if (!searchQuery.trim()) return filteredExpenses;
    const q = searchQuery.toLowerCase();
    return filteredExpenses.filter(
      (exp) =>
        exp.id.toLowerCase().includes(q) ||
        exp.description.toLowerCase().includes(q) ||
        exp.category.toLowerCase().includes(q) ||
        (exp.loggedBy && exp.loggedBy.toLowerCase().includes(q))
    );
  }, [filteredExpenses, searchQuery]);

  const searchedShifts = useMemo(() => {
    if (!searchQuery.trim()) return liveShifts;
    const q = searchQuery.toLowerCase();
    return liveShifts.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        (s.zReportNumber && s.zReportNumber.toLowerCase().includes(q)) ||
        s.cashierName.toLowerCase().includes(q)
    );
  }, [liveShifts, searchQuery]);

  // Pagination calculation
  const totalRecords = useMemo(() => {
    if (activeTab === 'items') return searchedItems.length;
    if (activeTab === 'journal') return searchedTransactions.length;
    if (activeTab === 'payments') return paymentBreakdown.length;
    if (activeTab === 'expenses') return searchedExpenses.length;
    return searchedShifts.length;
  }, [activeTab, searchedItems.length, searchedTransactions.length, paymentBreakdown.length, searchedExpenses.length, searchedShifts.length]);

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return searchedItems.slice(start, start + pageSize);
  }, [searchedItems, currentPage, pageSize]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return searchedTransactions.slice(start, start + pageSize);
  }, [searchedTransactions, currentPage, pageSize]);

  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return searchedExpenses.slice(start, start + pageSize);
  }, [searchedExpenses, currentPage, pageSize]);

  const paginatedShifts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return searchedShifts.slice(start, start + pageSize);
  }, [searchedShifts, currentPage, pageSize]);

  return (
    <div className="flex flex-col w-full space-y-6 select-none font-sans" data-purpose="reports-view">
      {/* BEGIN: Page Header & Filters Bar */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4" data-purpose="page-header">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Reports &amp; Intelligence</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-teal-50 text-[#3FA9A8] border border-teal-200/60 rounded-full">
              Live DEXIE Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time sales velocity, tender reconciliation, fiscal margins, and expense auditing.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Date Filter */}
          <div className="inline-flex p-1 bg-slate-200/70 rounded-xl text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => {
                setDateFilter('today');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                dateFilter === 'today' ? 'bg-[#3FA9A8] text-white font-semibold shadow-xs' : 'hover:text-slate-900'
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
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                dateFilter === 'week' ? 'bg-[#3FA9A8] text-white font-semibold shadow-xs' : 'hover:text-slate-900'
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
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                dateFilter === 'month' ? 'bg-[#3FA9A8] text-white font-semibold shadow-xs' : 'hover:text-slate-900'
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
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                dateFilter === 'custom' ? 'bg-[#3FA9A8] text-white font-semibold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Custom</span>
            </button>
          </div>

          {/* Reset Filter */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
            title="Reset filters to default"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            Reset
          </button>

          {/* Export Report CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#3FA9A8]" />
            Export Tab CSV
          </button>

          {/* Print Summary Primary */}
          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="px-3.5 py-1.5 text-xs font-bold bg-[#3FA9A8] hover:bg-[#349695] text-white rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Fiscal Statement
          </button>
        </div>
      </section>
      {/* END: Page Header & Filters Bar */}

      {/* Active Date Period Pill */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#3FA9A8]" />
          <span className="font-semibold text-slate-800">Reporting Scope:</span>
          <span className="bg-white px-2.5 py-0.5 rounded-md font-mono text-slate-700 border border-slate-200 shadow-2xs">
            {dateLabel}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span>Gross Margin: <strong className="text-emerald-700">{metrics.grossMarginPct}%</strong></span>
          <span>•</span>
          <span>Net Operating: <strong className={metrics.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}>{formatPKR(metrics.netProfit)}</strong></span>
        </div>
      </div>

      {/* BEGIN: Key Performance Indicator (KPI) Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-purpose="metric-cards">
        {/* KPI 1: Total Sales */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between relative hover:border-[#3FA9A8] transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#3FA9A8]">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              Period Gross
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-500 font-medium">Gross Collected Sales</span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {formatPKR(metrics.grossSales)}
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{metrics.salesDiffPct}%</span>
              <span className="text-slate-400 font-normal">vs previous period</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Completed Transactions */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between relative hover:border-[#3FA9A8] transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              Orders Count
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-500 font-medium">Completed Tickets</span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {metrics.ordersCount.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{metrics.ordersDiffPct}%</span>
              <span className="text-slate-400 font-normal">ticket volume change</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Average Bill Value (AOV) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between relative hover:border-[#3FA9A8] transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              Average Order
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-500 font-medium">Average Ticket (AOV)</span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {formatPKR(metrics.aov)}
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-600 font-medium mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{metrics.aovDiffPct}%</span>
              <span className="text-slate-400 font-normal">basket size trend</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Recorded Expenses */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between relative hover:border-[#3FA9A8] transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <PieChart className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              Vouchers Out
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-500 font-medium">Audited Expenses</span>
            <div className="text-2xl font-bold text-rose-600 tracking-tight mt-0.5">
              {formatPKR(metrics.expensesTotal)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>{filteredExpenses.length} vouchers logged in period</span>
            </div>
          </div>
        </div>
      </section>
      {/* END: Key Performance Indicator Cards */}

      {/* BEGIN: Analytics Panels (Row 2: Top Selling, Category Share, Channels & Expenses) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5" data-purpose="charts-row-2">
        {/* Top Velocity Dishes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Top-Selling Dishes</h3>
                <p className="text-xs text-slate-400">High velocity revenue drivers</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('items');
                  setCurrentPage(1);
                }}
                className="text-xs font-semibold text-[#3FA9A8] hover:underline cursor-pointer"
              >
                View Matrix →
              </button>
            </div>
            {/* List items */}
            <div className="divide-y divide-slate-100 mt-2 text-xs">
              {itemSalesSummary.slice(0, 4).map((item, idx) => (
                <div key={item.name} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-5 h-5 rounded-md font-bold text-[10px] flex items-center justify-center ${
                        idx === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {item.qtySold} sold • {item.sharePct}% share
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-800">{formatPKR(item.revenue)}</span>
                </div>
              ))}
              {itemSalesSummary.length === 0 && (
                <div className="py-8 text-center text-slate-400">
                  <ShoppingBag className="w-6 h-6 mx-auto mb-1 opacity-40" />
                  <p>No orders recorded in this period</p>
                </div>
              )}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 text-right">
            <span className="text-[11px] text-slate-400">
              {itemSalesSummary.length} distinct dishes sold in scope
            </span>
          </div>
        </div>

        {/* Sales by Menu Category */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Sales by Category</h3>
                <p className="text-xs text-slate-400">Category volume &amp; contribution</p>
              </div>
              <span className="text-xs text-slate-500 font-semibold">{categorySummary.length} Categories</span>
            </div>
            {/* Category Bars */}
            <div className="space-y-3 mt-3.5 text-xs">
              {categorySummary.slice(0, 5).map((cat, i) => {
                const colors = ['bg-[#3FA9A8]', 'bg-teal-600', 'bg-amber-500', 'bg-emerald-500', 'bg-blue-500'];
                const barColor = colors[i % colors.length];
                return (
                  <div key={cat.category}>
                    <div className="flex justify-between font-medium text-slate-700 mb-1">
                      <span>{cat.category}</span>
                      <span className="font-bold text-slate-800">
                        {cat.percentage}% <span className="text-slate-400 font-normal">({formatPKR(cat.revenue)})</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`${barColor} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(5, cat.percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {categorySummary.length === 0 && (
                <div className="py-8 text-center text-slate-400">
                  <PieChart className="w-6 h-6 mx-auto mb-1 opacity-40" />
                  <p>No category data for active filter</p>
                </div>
              )}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 text-xs text-slate-400">
            Dynamically aggregated from Dexie transactions
          </div>
        </div>

        {/* Order Channels & Expenses Summary */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Dining Channels &amp; Outlays</h3>
                <p className="text-xs text-slate-400">Dine-in vs takeaway ratio</p>
              </div>
              <span className="text-xs text-slate-400 font-medium">{completedTx.length} Orders</span>
            </div>
            {/* Order Channels Section */}
            <div className="mt-3 space-y-2.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Service Channels</span>
              {/* Dine-In */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-700 font-medium">Dine-In ({channelSummary.dineInOrders} orders)</span>
                  <span className="font-bold text-slate-800">
                    {formatPKR(channelSummary.dineInRev)} <span className="text-slate-400 font-normal">({channelSummary.dineInPct}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#3FA9A8] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, channelSummary.dineInPct)}%` }}
                  ></div>
                </div>
              </div>
              {/* Takeaway / Counter */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-700 font-medium">Takeaway / Counter ({channelSummary.takeawayOrders} orders)</span>
                  <span className="font-bold text-slate-800">
                    {formatPKR(channelSummary.takeawayRev)} <span className="text-slate-400 font-normal">({channelSummary.takeawayPct}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, channelSummary.takeawayPct)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            {/* Expense Category Split Section */}
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Top Outlay Categories ({formatPKR(metrics.expensesTotal)})
              </span>
              {expenseCategoryBreakdown.slice(0, 3).map((exp) => (
                <div key={exp.category} className="flex items-center justify-between">
                  <span className="text-slate-600 truncate max-w-[170px]">{exp.category}</span>
                  <span className="font-semibold text-slate-800">
                    {formatPKR(exp.amount)} <span className="text-slate-400 text-[11px] font-normal">({exp.percentage}%)</span>
                  </span>
                </div>
              ))}
              {expenseCategoryBreakdown.length === 0 && (
                <p className="text-slate-400 italic text-[11px]">No expense vouchers logged in period.</p>
              )}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 text-[11px] text-teal-800 bg-teal-50/70 p-2 rounded-lg mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#3FA9A8] flex-shrink-0" />
            <span>Net estimated profit: <strong>{formatPKR(metrics.netProfit)}</strong> (COGS &amp; Outlays deducted).</span>
          </div>
        </div>
      </section>
      {/* END: Analytics Panels Row 2 */}

      {/* BEGIN: Detailed Reports Table Section with Sub-Navigation Tabs */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" data-purpose="detailed-report-table">
        {/* Segmented Tab Navigation */}
        <div className="px-6 pt-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1 overflow-x-auto text-xs font-semibold">
            {/* Tab 1: Items */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('items');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'items'
                  ? 'border-b-2 border-[#3FA9A8] text-[#3FA9A8] font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:border-b-2 hover:border-slate-300'
              }`}
            >
              Item-wise Sales Breakdown ({itemSalesSummary.length})
            </button>
            {/* Tab 2: Journal */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('journal');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'journal'
                  ? 'border-b-2 border-[#3FA9A8] text-[#3FA9A8] font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:border-b-2 hover:border-slate-300'
              }`}
            >
              Daily Sales Journal ({filteredTransactions.length})
            </button>
            {/* Tab 3: Payments */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('payments');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'payments'
                  ? 'border-b-2 border-[#3FA9A8] text-[#3FA9A8] font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:border-b-2 hover:border-slate-300'
              }`}
            >
              Payment Reconciliation
            </button>
            {/* Tab 4: Expenses */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('expenses');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'expenses'
                  ? 'border-b-2 border-[#3FA9A8] text-[#3FA9A8] font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:border-b-2 hover:border-slate-300'
              }`}
            >
              Expense Audit Register ({filteredExpenses.length})
            </button>
            {/* Tab 5: Closings */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('closings');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'closings'
                  ? 'border-b-2 border-[#3FA9A8] text-[#3FA9A8] font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:border-b-2 hover:border-slate-300'
              }`}
            >
              Cash Closing Records ({liveShifts.length})
            </button>
          </div>

          {/* Table Search Filter */}
          <div className="pb-2.5 sm:pb-0 flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search table..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#3FA9A8] focus:border-[#3FA9A8] w-48 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
              {totalRecords} records
            </span>
          </div>
        </div>

        {/* Table Data Content */}
        <div className="overflow-x-auto min-h-[260px]">
          {/* TAB 1: Item-wise Sales Breakdown */}
          {activeTab === 'items' && (
            <table className="w-full text-left text-xs" id="item-sales-table">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6" scope="col">Item Code &amp; Name</th>
                  <th className="py-3 px-6" scope="col">Category</th>
                  <th className="py-3 px-6 text-center" scope="col">Quantity Sold</th>
                  <th className="py-3 px-6 text-right" scope="col">Avg Unit Price</th>
                  <th className="py-3 px-6 text-right" scope="col">Gross Revenue</th>
                  <th className="py-3 px-6 text-right" scope="col">Sales Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedItems.map((item) => (
                  <tr key={item.name} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <span className="text-[11px] text-slate-400 font-mono">{item.code}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[11px] font-medium border border-teal-200/50">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-center font-bold text-slate-800">{item.qtySold}</td>
                    <td className="py-3.5 px-6 text-right text-slate-600">{formatPKR(item.avgPrice)}</td>
                    <td className="py-3.5 px-6 text-right font-bold text-slate-900">{formatPKR(item.revenue)}</td>
                    <td className="py-3.5 px-6 text-right font-semibold text-emerald-600">{item.sharePct}%</td>
                  </tr>
                ))}
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No item sales found matching &quot;{searchQuery}&quot; in active date scope.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* TAB 2: Daily Sales Journal */}
          {activeTab === 'journal' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Receipt / Order</th>
                  <th className="py-3 px-6">Timestamp &amp; Date</th>
                  <th className="py-3 px-6">Cashier &amp; Station</th>
                  <th className="py-3 px-6 text-center">Items Count</th>
                  <th className="py-3 px-6 text-center">Payment Tender</th>
                  <th className="py-3 px-6 text-right">Discount</th>
                  <th className="py-3 px-6 text-right">Tax</th>
                  <th className="py-3 px-6 text-right">Gross Total</th>
                  <th className="py-3 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-6 font-bold text-slate-900 font-mono">
                      #{tx.orderNumber || tx.id}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">
                      {new Date(tx.timestamp).toLocaleString('en-PK', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-semibold text-slate-800">{tx.cashierName || 'Cashier'}</span>
                      <span className="text-[11px] text-slate-400 block">{tx.station || 'Station 1'}</span>
                    </td>
                    <td className="py-3.5 px-6 text-center font-bold text-slate-800">
                      {tx.items?.reduce((acc, it) => acc + (it.qty || 1), 0) || 0}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold uppercase">
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right text-slate-500">
                      {tx.discount ? formatPKR(tx.discount) : '-'}
                    </td>
                    <td className="py-3.5 px-6 text-right text-slate-500">
                      {tx.tax ? formatPKR(tx.tax) : '-'}
                    </td>
                    <td className="py-3.5 px-6 text-right font-bold text-emerald-700">
                      {formatPKR(tx.total)}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          tx.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {paginatedTransactions.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No transactions recorded in active date scope.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* TAB 3: Payment Reconciliation */}
          {activeTab === 'payments' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Tender Channel</th>
                  <th className="py-3 px-6 text-center">Transactions Count</th>
                  <th className="py-3 px-6 text-right">Gross Collections</th>
                  <th className="py-3 px-6 text-right">Volume Share</th>
                  <th className="py-3 px-6 text-center">Settlement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paymentBreakdown.map((channel) => (
                  <tr key={channel.channel} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-6 font-bold text-slate-900">{channel.label}</td>
                    <td className="py-3.5 px-6 text-center font-bold text-slate-800">{channel.count}</td>
                    <td className="py-3.5 px-6 text-right font-bold text-slate-900">
                      {formatPKR(channel.revenue)}
                    </td>
                    <td className="py-3.5 px-6 text-right text-emerald-600 font-bold">
                      {channel.sharePct}%
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${channel.color}`}>
                        {channel.settlement}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 4: Expense Audit Register */}
          {activeTab === 'expenses' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Voucher #</th>
                  <th className="py-3 px-6">Date &amp; Time</th>
                  <th className="py-3 px-6">Expense Description</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Payment Source</th>
                  <th className="py-3 px-6">Logged By / Vendor</th>
                  <th className="py-3 px-6 text-right">Total Outlay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-800">{exp.id}</td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {new Date(exp.timestamp).toLocaleDateString('en-PK', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900">{exp.description}</td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">{exp.paymentMethod || 'Cash Drawer'}</td>
                    <td className="py-3.5 px-6 text-slate-600">{exp.loggedBy || 'In-House'}</td>
                    <td className="py-3.5 px-6 text-right font-bold text-rose-600">{formatPKR(exp.amount)}</td>
                  </tr>
                ))}
                {paginatedExpenses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No expense records found in active date scope.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* TAB 5: Cash Closing Records */}
          {activeTab === 'closings' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Shift &amp; Z-Report #</th>
                  <th className="py-3 px-6">Cashier &amp; Station</th>
                  <th className="py-3 px-6">Opened / Closed</th>
                  <th className="py-3 px-6 text-right">Expected Cash</th>
                  <th className="py-3 px-6 text-right">Counted Cash</th>
                  <th className="py-3 px-6 text-center">Variance</th>
                  <th className="py-3 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedShifts.map((shift) => {
                  const discrepancy = shift.discrepancy || 0;
                  const isBalanced = discrepancy === 0;
                  const isSurplus = discrepancy > 0;
                  return (
                    <tr key={shift.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        <span className="font-mono">{shift.zReportNumber || shift.id}</span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="font-semibold text-slate-800">{shift.cashierName}</span>
                        <span className="text-[11px] text-slate-400 block">{shift.station}</span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        <div>{new Date(shift.openedAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                        {shift.closedAt ? (
                          <div className="text-[11px] text-slate-400">Closed: {new Date(shift.closedAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</div>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold">Active In-Progress</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right text-slate-700">{formatPKR(shift.expectedCash)}</td>
                      <td className="py-3.5 px-6 text-right font-bold text-slate-900">
                        {shift.actualCash !== undefined ? formatPKR(shift.actualCash) : '-'}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isBalanced
                              ? 'bg-emerald-50 text-emerald-700'
                              : isSurplus
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {isBalanced ? 'Balanced (Rs. 0)' : isSurplus ? `+${formatPKR(discrepancy)} Surplus` : `${formatPKR(discrepancy)} Short`}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            shift.status === 'closed' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {shift.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {paginatedShifts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No shift records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Table Footer and Pagination Controls */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Live Local Audit Trail • Verified from offline IndexedDB engine</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <span className="px-2 font-medium text-slate-800">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
      {/* END: Detailed Reports Table Section */}

      {/* Custom Date Range Picker Modal */}
      {showCustomDateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#3FA9A8]" />
                <h3 className="text-sm font-bold text-slate-800">Set Custom Date Range</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomDateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
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

      {/* Official Fiscal Statement Print Preview Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-5 print:shadow-none print:border-none print:max-w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#3FA9A8]" />
                <h2 className="text-base font-bold text-slate-800">Fiscal Audit Summary Statement</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#3FA9A8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-[#349695] cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Statement
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Statement Document */}
            <div className="space-y-4 text-xs font-sans text-slate-800">
              {/* Restaurant Header */}
              <div className="text-center pb-3 border-b border-slate-200">
                <h1 className="text-xl font-black tracking-tight text-slate-900">DINEPOS RESTAURANT &amp; CAFE</h1>
                <p className="text-slate-500 text-[11px] mt-0.5">Commercial Area, Lahore, Pakistan • NTN # 841920-7</p>
                <p className="text-slate-400 text-[10px] mt-0.5">Official Management Financial &amp; Tax Audit Report</p>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-500 font-medium block">Audit Period:</span>
                  <span className="font-bold text-slate-800">{dateLabel}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Generated On:</span>
                  <span className="font-bold text-slate-800">
                    {new Date(baseTimestamp).toLocaleString('en-PK', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
              </div>

              {/* Executive Financial Statement Table */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">Executive Summary</h4>
                <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-slate-50/70 font-semibold">
                      <td className="p-2">Gross Revenue Collected</td>
                      <td className="p-2 text-right text-slate-900 font-bold">{formatPKR(metrics.grossSales)}</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-slate-600">Total Customer Invoices / Tickets</td>
                      <td className="p-2 text-right font-medium">{metrics.ordersCount} orders</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-slate-600">Average Order Value (AOV)</td>
                      <td className="p-2 text-right font-medium">{formatPKR(metrics.aov)}</td>
                    </tr>
                    <tr className="text-rose-700">
                      <td className="p-2">Less: Estimated Cost of Goods Sold (COGS)</td>
                      <td className="p-2 text-right font-medium">({formatPKR(metrics.cogs)})</td>
                    </tr>
                    <tr className="bg-emerald-50/60 font-bold text-emerald-800">
                      <td className="p-2">Gross Operating Profit ({metrics.grossMarginPct}%)</td>
                      <td className="p-2 text-right">{formatPKR(metrics.grossProfit)}</td>
                    </tr>
                    <tr className="text-rose-700">
                      <td className="p-2">Less: Documented Store Expenses</td>
                      <td className="p-2 text-right font-medium">({formatPKR(metrics.expensesTotal)})</td>
                    </tr>
                    <tr className="bg-teal-50 font-black text-sm text-[#3FA9A8] border-t-2 border-teal-200">
                      <td className="p-2">Net Bottom-Line Contribution</td>
                      <td className="p-2 text-right">{formatPKR(metrics.netProfit)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Tender Settlement Breakdown */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">Tender Reconciliation</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {paymentBreakdown.filter(p => p.revenue > 0).map((p) => (
                    <div key={p.channel} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                      <span className="font-medium text-slate-700">{p.label.split('(')[0]}</span>
                      <span className="font-bold text-slate-900">{formatPKR(p.revenue)} ({p.sharePct}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 5 Revenue Dishes */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">Top Revenue Driver Items</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 font-semibold text-slate-500">
                      <tr>
                        <th className="p-1.5 px-3">Item Name</th>
                        <th className="p-1.5 px-3 text-center">Qty</th>
                        <th className="p-1.5 px-3 text-right">Revenue</th>
                        <th className="p-1.5 px-3 text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {itemSalesSummary.slice(0, 5).map((it) => (
                        <tr key={it.name}>
                          <td className="p-1.5 px-3 font-medium text-slate-800">{it.name}</td>
                          <td className="p-1.5 px-3 text-center">{it.qtySold}</td>
                          <td className="p-1.5 px-3 text-right font-bold">{formatPKR(it.revenue)}</td>
                          <td className="p-1.5 px-3 text-right text-emerald-600 font-semibold">{it.sharePct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Sign-Off Section */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-[11px] text-slate-500">
                <div>
                  <div className="border-b border-slate-300 pb-6 mb-1"></div>
                  <span className="font-semibold block text-slate-700">Cashier / Shift Auditor</span>
                  <span className="text-[10px]">Verified against physical register tape</span>
                </div>
                <div>
                  <div className="border-b border-slate-300 pb-6 mb-1"></div>
                  <span className="font-semibold block text-slate-700">Branch General Manager</span>
                  <span className="text-[10px]">Official Stamp &amp; Approval</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 print:hidden">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 text-xs font-bold bg-[#3FA9A8] hover:bg-[#349695] text-white rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
