import React, { useState, useMemo } from 'react';
import { 
  CheckCircle,
  Eye,
  Printer,
  X,
  Search,
  Filter
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useUIStore } from '../../store/useUIStore';
import { INITIAL_TRANSACTIONS } from '../../db/seedData';
import type { Transaction } from '../../types';

interface ChartPoint {
  label: string;
  time: string;
  sales: number;
  orders: number;
  tag: string;
  x: number;
  y: number;
  pctX: number;
}

const EMPTY_DASH_TRANSACTIONS: Transaction[] = [];
const EMPTY_DASH_EXPENSES: any[] = [];

export const DashboardView: React.FC = () => {
  const { 
    setActiveTab, 
    setSelectedTransaction, 
    setTransactionDetailsModalOpen, 
    setReceiptPreviewModalOpen,
    setCashMovementModalOpen,
    setCashMovementType
  } = useUIStore();

  // Active filters and states
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customRangeLabel, setCustomRangeLabel] = useState('Last 7 Days');
  const [customDropdownOpen, setCustomDropdownOpen] = useState(false);
  const [activeKpiMenu, setActiveKpiMenu] = useState<number | null>(null);

  // Chart hover & interaction state (default to peak index 5 = 9 PM)
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number>(5);
  const [isChartHovered, setIsChartHovered] = useState<boolean>(false);

  // Donut hover & filter state
  const [hoveredPayment, setHoveredPayment] = useState<string | null>(null);
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<string | null>(null);
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string | null>(null);
  const [selectedDishFilter, setSelectedDishFilter] = useState<string | null>(null);

  // Transactions table controls
  const [txSearch, setTxSearch] = useState('');
  const [txPage, setTxPage] = useState(1);
  const pageSize = 5;

  // Live queries from Dexie DB
  const liveTransactions = useLiveQuery(() => db.transactions.toArray(), []) ?? EMPTY_DASH_TRANSACTIONS;
  const liveExpenses = useLiveQuery(() => db.expenses.toArray(), []) ?? EMPTY_DASH_EXPENSES;

  // Multi-timeframe dynamic dataset modeling
  const metricsData = useMemo(() => {
    let baseSales = 148450;
    let baseOrders = 184;
    let baseExpenses = 18200;
    let baseVouchers = 4;
    let salesTrend = 12.5;
    let ordersTrend = 8.2;
    let billTrend = 3.1;
    let periodName = 'yesterday';

    if (dateFilter === 'week') {
      baseSales = 984200;
      baseOrders = 1240;
      baseExpenses = 112500;
      baseVouchers = 26;
      salesTrend = 14.8;
      ordersTrend = 9.4;
      billTrend = 4.2;
      periodName = 'last week';
    } else if (dateFilter === 'month') {
      baseSales = 4215800;
      baseOrders = 5420;
      baseExpenses = 485000;
      baseVouchers = 108;
      salesTrend = 18.2;
      ordersTrend = 11.6;
      billTrend = 5.8;
      periodName = 'last month';
    } else if (dateFilter === 'custom') {
      baseSales = 642800;
      baseOrders = 810;
      baseExpenses = 78400;
      baseVouchers = 18;
      salesTrend = 10.4;
      ordersTrend = 7.1;
      billTrend = 2.9;
      periodName = 'prior period';
    }

    const liveTodaySales = liveTransactions.reduce((sum, tx) => sum + (tx.total || 0), 0);
    const liveTodayOrders = liveTransactions.length;
    const liveTodayExpenses = liveExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const liveTodayVouchers = liveExpenses.length;

    const effectiveSales = Math.max(baseSales, baseSales + (liveTodaySales > 30000 ? liveTodaySales - 30000 : 0));
    const effectiveOrders = Math.max(baseOrders, baseOrders + (liveTodayOrders > 12 ? liveTodayOrders - 12 : 0));
    const effectiveAvgBill = effectiveOrders > 0 ? effectiveSales / effectiveOrders : 0;
    const effectiveExpenses = Math.max(baseExpenses, baseExpenses + (liveTodayExpenses > 18200 ? liveTodayExpenses - 18200 : 0));
    const effectiveVouchers = Math.max(baseVouchers, baseVouchers + (liveTodayVouchers > 4 ? liveTodayVouchers - 4 : 0));

    return {
      sales: effectiveSales,
      orders: effectiveOrders,
      avgBill: effectiveAvgBill,
      expenses: effectiveExpenses,
      vouchers: effectiveVouchers,
      salesTrend,
      ordersTrend,
      billTrend,
      periodName
    };
  }, [dateFilter, liveTransactions, liveExpenses]);

  // Chart Points tailored to active timeframe
  const chartPoints: ChartPoint[] = useMemo(() => {
    if (dateFilter === 'today') {
      return [
        { label: '11 AM', time: '11:00 AM', sales: 8200, orders: 11, tag: 'Morning Opening', x: 0, y: 170, pctX: 0 },
        { label: '1 PM', time: '01:00 PM', sales: 18500, orders: 24, tag: 'Lunch Rush', x: 116, y: 140, pctX: 16.6 },
        { label: '3 PM', time: '03:00 PM', sales: 21300, orders: 28, tag: 'Afternoon Lull', x: 233, y: 125, pctX: 33.3 },
        { label: '5 PM', time: '05:00 PM', sales: 26800, orders: 35, tag: 'Tea & Snacks', x: 350, y: 110, pctX: 50.0 },
        { label: '7 PM', time: '07:00 PM', sales: 32400, orders: 40, tag: 'Dinner Start', x: 466, y: 75, pctX: 66.6 },
        { label: '9 PM (Peak)', time: '08:45 PM', sales: 38400, orders: 46, tag: 'Peak Dinnertime', x: 583, y: 28, pctX: 83.3 },
        { label: '11 PM', time: '11:00 PM', sales: 22850, orders: 27, tag: 'Late Night Wrap', x: 700, y: 70, pctX: 100 },
      ];
    } else if (dateFilter === 'week') {
      return [
        { label: 'Mon', time: 'Monday', sales: 112000, orders: 142, tag: 'Weekday Opener', x: 0, y: 160, pctX: 0 },
        { label: 'Tue', time: 'Tuesday', sales: 124500, orders: 158, tag: 'Steady Midweek', x: 116, y: 145, pctX: 16.6 },
        { label: 'Wed', time: 'Wednesday', sales: 135000, orders: 172, tag: 'Corporate Lunch', x: 233, y: 130, pctX: 33.3 },
        { label: 'Thu', time: 'Thursday', sales: 142000, orders: 180, tag: 'Pre-Weekend', x: 350, y: 115, pctX: 50.0 },
        { label: 'Fri', time: 'Friday', sales: 168000, orders: 210, tag: 'Friday Family Dine', x: 466, y: 65, pctX: 66.6 },
        { label: 'Sat (Peak)', time: 'Saturday', sales: 185000, orders: 232, tag: 'Weekend Super Peak', x: 583, y: 22, pctX: 83.3 },
        { label: 'Sun', time: 'Sunday', sales: 162700, orders: 202, tag: 'Sunday Evening', x: 700, y: 55, pctX: 100 },
      ];
    } else if (dateFilter === 'month') {
      return [
        { label: 'Week 1', time: 'Days 1 - 7', sales: 940000, orders: 1180, tag: 'First Week Surge', x: 0, y: 140, pctX: 0 },
        { label: 'Week 2', time: 'Days 8 - 14', sales: 1020000, orders: 1290, tag: 'Mid-Month Flow', x: 233, y: 110, pctX: 33.3 },
        { label: 'Week 3 (Peak)', time: 'Days 15 - 21', sales: 1180000, orders: 1490, tag: 'Salary Week Peak', x: 466, y: 35, pctX: 66.6 },
        { label: 'Week 4', time: 'Days 22 - 30', sales: 1075800, orders: 1360, tag: 'Month-End Closing', x: 700, y: 80, pctX: 100 },
      ];
    } else {
      return [
        { label: 'Day 1', time: 'Day 1', sales: 88000, orders: 110, tag: 'Period Start', x: 0, y: 150, pctX: 0 },
        { label: 'Day 2', time: 'Day 2', sales: 96000, orders: 122, tag: 'Normal Volume', x: 175, y: 130, pctX: 25 },
        { label: 'Day 3', time: 'Day 3', sales: 115000, orders: 145, tag: 'High Volume', x: 350, y: 90, pctX: 50 },
        { label: 'Day 4 (Peak)', time: 'Day 4', sales: 138000, orders: 175, tag: 'Custom Peak', x: 525, y: 30, pctX: 75 },
        { label: 'Day 5', time: 'Day 5', sales: 105800, orders: 134, tag: 'Period Close', x: 700, y: 100, pctX: 100 },
      ];
    }
  }, [dateFilter]);

  const activePoint = chartPoints[Math.min(hoveredPointIndex, chartPoints.length - 1)] || chartPoints[0];

  // Mouse Move listener across the Sales Overview Chart
  const handleChartMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (mouseX / rect.width) * 100));

    // Find closest point in chartPoints
    let closestIndex = 0;
    let minDistance = Infinity;
    chartPoints.forEach((pt, idx) => {
      const dist = Math.abs(pt.pctX - pct);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });

    setHoveredPointIndex(closestIndex);
    setIsChartHovered(true);
  };

  const handleChartMouseLeave = () => {
    setIsChartHovered(false);
    setHoveredPointIndex(5); // Default back to 9 PM Peak point
  };

  // Payment Breakdown Calculations with professional segment spacing
  const paymentBreakdown = useMemo(() => {
    const total = metricsData.sales;
    const totalOrders = metricsData.orders;
    const slices = [
      { 
        id: 'cash', 
        name: 'Cash', 
        percent: 58, 
        color: '#3FA9A8', 
        lightBg: 'bg-teal-50', 
        textLight: 'text-teal-700', 
        borderLight: 'border-teal-200', 
        dotClass: 'bg-[#3FA9A8]',
        badgeClass: 'bg-teal-50 text-[#3FA9A8] border-teal-200'
      },
      { 
        id: 'easypaisa', 
        name: 'Easypaisa', 
        percent: 24, 
        color: '#10B981', 
        lightBg: 'bg-emerald-50', 
        textLight: 'text-emerald-700', 
        borderLight: 'border-emerald-200', 
        dotClass: 'bg-[#10B981]',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      },
      { 
        id: 'jazzcash', 
        name: 'JazzCash', 
        percent: 14, 
        color: '#F59E0B', 
        lightBg: 'bg-amber-50', 
        textLight: 'text-amber-700', 
        borderLight: 'border-amber-200', 
        dotClass: 'bg-[#F59E0B]',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200'
      },
      { 
        id: 'card', 
        name: 'Card / Bank', 
        percent: 4, 
        color: '#64748B', 
        lightBg: 'bg-slate-100', 
        textLight: 'text-slate-700', 
        borderLight: 'border-slate-300', 
        dotClass: 'bg-[#64748B]',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300'
      },
    ];

    // Elegant separation gap
    const gap = 1.8;
    let currentOffset = 0;
    return slices.map((s) => {
      const amount = Math.round(total * (s.percent / 100));
      const orders = Math.round(totalOrders * (s.percent / 100));
      const dashLength = Math.max(1, s.percent - gap);
      const dasharray = `${dashLength.toFixed(1)} 100`;
      const dashoffset = `-${(currentOffset + gap / 2).toFixed(1)}`;
      currentOffset += s.percent;

      return {
        ...s,
        amount,
        orders,
        dasharray,
        dashoffset,
      };
    });
  }, [metricsData.sales, metricsData.orders]);

  const currentHoveredPayment = paymentBreakdown.find(p => p.id === hoveredPayment);

  // Top-Selling Dishes
  const topSellingDishes = useMemo(() => {
    const multiplier = dateFilter === 'week' ? 6.5 : dateFilter === 'month' ? 28 : dateFilter === 'custom' ? 4.2 : 1;
    return [
      { id: 'biryani', name: 'Chicken Biryani (Special)', orders: Math.round(52 * multiplier), revenue: Math.round(26000 * multiplier) },
      { id: 'karahi', name: 'Chicken Karahi (Half)', orders: Math.round(28 * multiplier), revenue: Math.round(22400 * multiplier) },
      { id: 'seekh', name: 'Mutton Seekh Kebab', orders: Math.round(34 * multiplier), revenue: Math.round(18700 * multiplier) },
      { id: 'naan', name: 'Garlic Roghani Naan', orders: Math.round(86 * multiplier), revenue: Math.round(6880 * multiplier) },
      { id: 'chai', name: 'Karak Chai', orders: Math.round(65 * multiplier), revenue: Math.round(4550 * multiplier) },
    ];
  }, [dateFilter]);

  // Order Channels Breakdown
  const channelData = useMemo(() => {
    const totalOrders = metricsData.orders;
    const totalSales = metricsData.sales;
    const dineInOrders = Math.round(totalOrders * 0.68);
    const takeawayOrders = totalOrders - dineInOrders;
    const dineInSales = Math.round(totalSales * 0.68);
    const takeawaySales = totalSales - dineInSales;

    return {
      dineInOrders,
      dineInSales,
      dineInPct: 68,
      takeawayOrders,
      takeawaySales,
      takeawayPct: 32,
    };
  }, [metricsData.orders, metricsData.sales]);

  // Unified Transactions List for Table
  const displayTransactions = useMemo(() => {
    let list = liveTransactions.length >= 5 ? [...liveTransactions] : [...liveTransactions, ...INITIAL_TRANSACTIONS];

    if (txSearch.trim()) {
      const q = txSearch.toLowerCase();
      list = list.filter(tx => 
        tx.id.toLowerCase().includes(q) ||
        (tx.notes && tx.notes.toLowerCase().includes(q)) ||
        tx.paymentMethod.toLowerCase().includes(q) ||
        tx.cashierName.toLowerCase().includes(q) ||
        tx.items.some(it => it.name.toLowerCase().includes(q))
      );
    }

    if (selectedPaymentFilter) {
      list = list.filter(tx => tx.paymentMethod.toLowerCase() === selectedPaymentFilter.toLowerCase());
    }

    if (selectedChannelFilter) {
      list = list.filter(tx => {
        if (selectedChannelFilter === 'dine_in') return tx.notes?.includes('Table') || tx.notes?.includes('Dine');
        if (selectedChannelFilter === 'takeaway') return tx.notes?.includes('Takeaway') || tx.notes?.includes('Counter');
        return true;
      });
    }

    if (selectedDishFilter) {
      list = list.filter(tx => tx.items.some(it => it.name.toLowerCase().includes(selectedDishFilter.toLowerCase())));
    }

    return list;
  }, [liveTransactions, txSearch, selectedPaymentFilter, selectedChannelFilter, selectedDishFilter]);

  const totalPages = Math.max(1, Math.ceil(displayTransactions.length / pageSize));
  const currentPage = Math.min(txPage, totalPages);
  const paginatedTransactions = displayTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatTime = (ts: number) => {
    try {
      const d = new Date(ts);
      let hours = d.getHours();
      const mins = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours.toString().padStart(2, '0')}:${mins} ${ampm}`;
    } catch {
      return '09:42 PM';
    }
  };

  const handleOpenTransaction = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setTransactionDetailsModalOpen(true);
  };

  const handlePrintSlip = (e: React.MouseEvent, tx: Transaction) => {
    e.stopPropagation();
    setSelectedTransaction(tx);
    setReceiptPreviewModalOpen(true);
  };

  return (
    <div className="space-y-6 select-none font-sans" data-purpose="dashboard-content">
      {/* BEGIN: Subheader & Quick Actions */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4" data-purpose="dashboard-controls">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">Your restaurant performance at a glance</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Date Filter */}
          <div className="inline-flex p-1 bg-slate-200/70 rounded-lg text-xs font-medium text-slate-600 relative">
            <button 
              type="button" 
              onClick={() => { setDateFilter('today'); setCustomDropdownOpen(false); }}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                dateFilter === 'today' ? 'bg-[#3FA9A8] text-white shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button 
              type="button" 
              onClick={() => { setDateFilter('week'); setCustomDropdownOpen(false); }}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                dateFilter === 'week' ? 'bg-[#3FA9A8] text-white shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              This Week
            </button>
            <button 
              type="button" 
              onClick={() => { setDateFilter('month'); setCustomDropdownOpen(false); }}
              className={`px-3 py-1 rounded-md transition-all hidden sm:block cursor-pointer ${
                dateFilter === 'month' ? 'bg-[#3FA9A8] text-white shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button 
              type="button" 
              onClick={() => setCustomDropdownOpen(!customDropdownOpen)}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                dateFilter === 'custom' ? 'bg-[#3FA9A8] text-white shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              <span>{dateFilter === 'custom' ? customRangeLabel : 'Custom'}</span>
              <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>

            {/* Custom Range Popover Dropdown */}
            {customDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-xs">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">Timeframe Presets</div>
                {[
                  { label: 'Yesterday', filter: 'custom' as const },
                  { label: 'Last 7 Days', filter: 'custom' as const },
                  { label: 'Last 30 Days', filter: 'custom' as const },
                  { label: 'This Quarter', filter: 'custom' as const },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setDateFilter('custom');
                      setCustomRangeLabel(item.label);
                      setCustomDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between text-slate-700 cursor-pointer"
                  >
                    <span>{item.label}</span>
                    {customRangeLabel === item.label && dateFilter === 'custom' && (
                      <CheckCircle className="w-3.5 h-3.5 text-[#3FA9A8]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons Group */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setCashMovementType('pay_out');
                setCashMovementModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer" 
              type="button"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <span>Record Expense</span>
            </button>
            <button 
              onClick={() => setActiveTab('cash_closing')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs transition hidden xl:inline-flex cursor-pointer" 
              type="button"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <span>Cash Closing</span>
            </button>
            <button 
              onClick={() => setActiveTab('pos')}
              className="inline-flex items-center space-x-1 px-3.5 py-1.5 bg-[#3FA9A8] hover:bg-[#359392] text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer" 
              type="button"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
              </svg>
              <span>New Sale</span>
            </button>
          </div>
        </div>
      </section>
      {/* END: Subheader & Quick Actions */}

      {/* BEGIN: Metric Cards Row (4 Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-purpose="metric-cards-grid">
        {/* Card 1: Today's Sales */}
        <article className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] relative flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-full bg-[#3FA9A8]/10 text-[#3FA9A8] flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setActiveKpiMenu(activeKpiMenu === 1 ? null : 1)}
                  aria-label="Card Options" 
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer" 
                  type="button"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                {activeKpiMenu === 1 && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-xs">
                    <button 
                      onClick={() => { setActiveTab('reports'); setActiveKpiMenu(null); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 cursor-pointer"
                    >
                      View Sales Report
                    </button>
                    <button 
                      onClick={() => { window.print(); setActiveKpiMenu(null); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 cursor-pointer"
                    >
                      Print Summary
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs font-medium text-slate-500">Today&apos;s Sales</span>
              <p className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">
                Rs. {metricsData.sales.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-semibold text-emerald-600">
            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M5 10l7-7m0 0l7 7m-7-7v18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
            </svg>
            <span>{metricsData.salesTrend}%</span>
            <span className="text-slate-400 font-normal ml-1">from {metricsData.periodName}</span>
          </div>
        </article>

        {/* Card 2: Completed Orders */}
        <article className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] relative flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-full bg-[#3FA9A8]/10 text-[#3FA9A8] flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setActiveKpiMenu(activeKpiMenu === 2 ? null : 2)}
                  aria-label="Card Options" 
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer" 
                  type="button"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                {activeKpiMenu === 2 && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-xs">
                    <button 
                      onClick={() => { setActiveTab('transactions'); setActiveKpiMenu(null); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 cursor-pointer"
                    >
                      View Order Ledger
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs font-medium text-slate-500">Completed Orders</span>
              <p className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">
                {metricsData.orders.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-semibold text-emerald-600">
            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M5 10l7-7m0 0l7 7m-7-7v18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
            </svg>
            <span>{metricsData.ordersTrend}%</span>
            <span className="text-slate-400 font-normal ml-1">from {metricsData.periodName}</span>
          </div>
        </article>

        {/* Card 3: Average Bill Value */}
        <article className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] relative flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-full bg-[#3FA9A8]/10 text-[#3FA9A8] flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setActiveKpiMenu(activeKpiMenu === 3 ? null : 3)}
                  aria-label="Card Options" 
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer" 
                  type="button"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                {activeKpiMenu === 3 && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-xs">
                    <button 
                      onClick={() => { setActiveTab('reports'); setActiveKpiMenu(null); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 cursor-pointer"
                    >
                      Average Ticket Matrix
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs font-medium text-slate-500">Average Bill Value</span>
              <p className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">
                Rs. {metricsData.avgBill.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-semibold text-emerald-600">
            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M5 10l7-7m0 0l7 7m-7-7v18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
            </svg>
            <span>{metricsData.billTrend}%</span>
            <span className="text-slate-400 font-normal ml-1">from {metricsData.periodName}</span>
          </div>
        </article>

        {/* Card 4: Recorded Expenses */}
        <article className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] relative flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-full bg-[#3FA9A8]/10 text-[#3FA9A8] flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setActiveKpiMenu(activeKpiMenu === 4 ? null : 4)}
                  aria-label="Card Options" 
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer" 
                  type="button"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                {activeKpiMenu === 4 && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-xs">
                    <button 
                      onClick={() => { setActiveTab('expenses'); setActiveKpiMenu(null); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 cursor-pointer"
                    >
                      Expense Ledger
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs font-medium text-slate-500">Recorded Expenses</span>
              <p className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">
                Rs. {metricsData.expenses.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-medium text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-slate-300 mr-1.5" />
            <span>{metricsData.vouchers} vouchers logged {dateFilter === 'today' ? 'today' : 'in period'}</span>
          </div>
        </article>
      </section>
      {/* END: Metric Cards Row */}

      {/* BEGIN: Main Analytics Grid (Sales Trajectory & Payment Split) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5" data-purpose="primary-analytics-grid">
        {/* Left Panel: Hourly Sales Overview (Line Area Chart with Full-Spectrum Hover) */}
        <article className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800">Sales Overview</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {dateFilter === 'today' ? 'Hourly sales trajectory vs target (Hover anywhere to inspect)' : 'Period sales performance vs target'}
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-600">
                <span className="w-3 h-3 rounded-sm bg-[#3FA9A8]" />
                <span>Today&apos;s Trend</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-400">
                <span className="w-3 h-0.5 bg-slate-300" />
                <span>Target Baseline</span>
              </div>
            </div>
          </div>

          {/* SVG Visual Line Chart with Smooth Real-time Inspection anywhere you hover */}
          <div 
            className="relative mt-6 h-60 w-full select-none cursor-crosshair group/chart"
            onMouseMove={handleChartMouseMove}
            onMouseLeave={handleChartMouseLeave}
          >
            {/* Smooth Dynamic Crosshair Guide Line */}
            {isChartHovered && (
              <div 
                className="absolute top-0 bottom-5 w-px border-l-2 border-dashed border-[#3FA9A8]/60 pointer-events-none transition-all duration-75"
                style={{ left: `${activePoint.pctX}%` }}
              />
            )}

            {/* Dynamic Tooltip Showing Data at Any Instance */}
            <div 
              className="absolute -translate-x-1/2 -translate-y-full mb-3 z-30 transition-all duration-150 ease-out pointer-events-none"
              style={{
                left: `${activePoint.pctX}%`,
                top: `${(activePoint.y / 200) * 100}%`
              }}
            >
              <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-xl px-3.5 py-2 shadow-2xl text-center border border-slate-700/80 whitespace-nowrap">
                <div className="flex items-center justify-between gap-4 pb-1 border-b border-slate-800 text-[10px]">
                  <span className="text-teal-300 font-bold uppercase tracking-wider">{activePoint.tag}</span>
                  <span className="text-slate-400 font-medium">{activePoint.time}</span>
                </div>
                <div className="pt-1.5 flex items-baseline justify-center gap-1.5">
                  <span className="text-xs text-slate-400 font-medium">Sales:</span>
                  <span className="text-sm font-extrabold text-white tracking-tight">
                    Rs. {activePoint.sales.toLocaleString()}
                  </span>
                </div>
                <div className="text-[10px] text-slate-300 flex items-center justify-center gap-2 mt-0.5">
                  <span>{activePoint.orders} orders completed</span>
                  <span>•</span>
                  <span>Avg: Rs. {Math.round(activePoint.sales / activePoint.orders).toLocaleString()}</span>
                </div>
              </div>
              <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 mx-auto -mt-1 border-r border-b border-slate-700/80" />
            </div>

            {/* SVG Vector Canvas */}
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 200">
              <defs>
                <linearGradient id="tealGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#3FA9A8" stopOpacity="0.32" />
                  <stop offset="90%" stopColor="#3FA9A8" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              {/* Grid Horizontal Lines */}
              <line stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.2" x1="0" x2="700" y1="20" y2="20" />
              <line stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.2" x1="0" x2="700" y1="70" y2="70" />
              <line stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.2" x1="0" x2="700" y1="120" y2="120" />
              <line stroke="#f1f5f9" strokeWidth="1.2" x1="0" x2="700" y1="170" y2="170" />

              {/* Target Baseline Line */}
              <path d="M 0,130 C 150,120 300,105 450,90 C 550,80 620,70 700,65" fill="none" stroke="#cbd5e1" strokeDasharray="5 5" strokeWidth="1.5" />

              {/* Fill Area Gradient */}
              <path d="M 0,170 Q 60,165 116,140 T 233,125 T 350,110 T 466,75 T 583,28 T 700,70 L 700,170 L 0,170 Z" fill="url(#tealGrad)" />

              {/* Solid Trajectory Line */}
              <path d="M 0,170 Q 60,165 116,140 T 233,125 T 350,110 T 466,75 T 583,28 T 700,70" fill="none" stroke="#3FA9A8" strokeLinecap="round" strokeWidth="3" />

              {/* Active Pulse Outer Halo */}
              <circle 
                cx={activePoint.x} 
                cy={activePoint.y} 
                r="12" 
                fill="#3FA9A8" 
                fillOpacity="0.22" 
                className="animate-pulse pointer-events-none transition-all duration-100"
              />

              {/* Active Point Solid Target Marker */}
              <circle 
                cx={activePoint.x} 
                cy={activePoint.y} 
                r="6" 
                fill="#FFFFFF" 
                stroke="#3FA9A8" 
                strokeWidth="3.5" 
                className="pointer-events-none shadow-md transition-all duration-100"
              />

              {/* Inactive Point Sub-Nodes for visual continuity */}
              {chartPoints.map((pt, idx) => (
                <circle
                  key={pt.label}
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill={hoveredPointIndex === idx ? "#3FA9A8" : "#FFFFFF"}
                  stroke="#3FA9A8"
                  strokeWidth="2"
                  className="pointer-events-none transition-all duration-150"
                />
              ))}
            </svg>
          </div>

          {/* Chart X-Axis Labels with synchronized highlight */}
          <div className="flex justify-between text-[11px] font-medium text-slate-400 pt-2 border-t border-slate-100">
            {chartPoints.map((pt, idx) => (
              <span
                key={pt.label}
                onClick={() => setHoveredPointIndex(idx)}
                className={`cursor-pointer transition-colors ${
                  hoveredPointIndex === idx ? 'text-[#3FA9A8] font-bold scale-105' : 'hover:text-slate-700'
                }`}
              >
                {pt.label}
              </span>
            ))}
          </div>
        </article>

        {/* Right Panel: Professional Payment Methods Donut / Pie Chart */}
        <article className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800">Payment Methods</h3>
              <p className="text-xs text-slate-500 mt-0.5">Reconciled collection breakdown (Hover slices to inspect)</p>
            </div>
            <div className="flex items-center gap-1.5">
              {selectedPaymentFilter && (
                <button
                  type="button"
                  onClick={() => setSelectedPaymentFilter(null)}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  <X className="w-2.5 h-2.5 mr-1" />
                  Reset Filter
                </button>
              )}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Verified
              </span>
            </div>
          </div>

          {/* Donut Graphic & Legend with Interactive Slice Hover */}
          <div className="my-auto py-3 flex flex-col sm:flex-row items-center justify-center gap-6">
            {/* SVG Donut Chart with Center Display and Glow Effects */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 36 36">
                <defs>
                  <filter id="donutGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.28" />
                  </filter>
                </defs>

                {/* Subtle Background Track */}
                <circle 
                  cx="18" 
                  cy="18" 
                  fill="none" 
                  r="15.915" 
                  stroke="#F1F5F9" 
                  strokeWidth="3.6" 
                />

                {/* Slices with smooth hover elevation, dimming, and exact data sync */}
                {paymentBreakdown.map((pm) => {
                  const isHovered = hoveredPayment === pm.id;
                  const isSelected = selectedPaymentFilter === pm.id;
                  const isHighlighted = isHovered || isSelected;
                  const hasActiveFocus = hoveredPayment !== null || selectedPaymentFilter !== null;

                  return (
                    <g 
                      key={pm.id}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPayment(pm.id)}
                      onMouseLeave={() => setHoveredPayment(null)}
                      onClick={() => setSelectedPaymentFilter(selectedPaymentFilter === pm.id ? null : pm.id)}
                    >
                      {/* Invisible wider hit ring for effortless, seamless mouse capture */}
                      <circle 
                        cx="18" 
                        cy="18" 
                        fill="none" 
                        r="15.915" 
                        stroke="transparent" 
                        strokeWidth="10"
                        strokeDasharray={pm.dasharray}
                        strokeDashoffset={pm.dashoffset}
                      />
                      {/* Visible Pie Slice */}
                      <circle 
                        cx="18" 
                        cy="18" 
                        fill="none" 
                        r="15.915" 
                        stroke={pm.color} 
                        strokeLinecap="round" 
                        strokeWidth={isHighlighted ? 5.2 : 3.8} 
                        strokeDasharray={pm.dasharray}
                        strokeDashoffset={pm.dashoffset}
                        filter={isHighlighted ? "url(#donutGlow)" : "none"}
                        style={{
                          opacity: hasActiveFocus && !isHighlighted ? 0.32 : 1,
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Dynamic Center Content Card responding to hover at any slice */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2 select-none">
                {currentHoveredPayment ? (
                  <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-150">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${currentHoveredPayment.badgeClass} border shadow-2xs`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${currentHoveredPayment.dotClass}`} />
                      {currentHoveredPayment.name}
                    </span>
                    <span className="text-base font-extrabold text-slate-900 tracking-tight mt-0.5">
                      Rs. {currentHoveredPayment.amount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {currentHoveredPayment.percent}% ({currentHoveredPayment.orders} orders)
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                      Reconciled
                    </span>
                    <span className="text-base font-extrabold text-slate-800 tracking-tight">
                      Rs. {(metricsData.sales / 1000).toFixed(1)}k
                    </span>
                    <span className="text-[9px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                      <CheckCircle className="w-2.5 h-2.5" /> 100% Closed
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Synchronized Legend Breakdown */}
            <div className="w-full sm:w-auto space-y-2 text-xs">
              {paymentBreakdown.map((pm) => {
                const isSelected = selectedPaymentFilter === pm.id;
                const isHovered = hoveredPayment === pm.id;
                const hasFocus = hoveredPayment !== null || selectedPaymentFilter !== null;
                const isDimmed = hasFocus && !isHovered && !isSelected;

                return (
                  <div 
                    key={pm.id}
                    onMouseEnter={() => setHoveredPayment(pm.id)}
                    onMouseLeave={() => setHoveredPayment(null)}
                    onClick={() => setSelectedPaymentFilter(isSelected ? null : pm.id)}
                    className={`flex items-center justify-between gap-4 px-3 py-1.5 rounded-xl cursor-pointer transition-all duration-200 border ${
                      isSelected 
                        ? `${pm.lightBg} border-[#3FA9A8] shadow-xs ring-1 ring-[#3FA9A8]` 
                        : isHovered 
                        ? `${pm.lightBg} border-slate-300 shadow-2xs scale-[1.02]` 
                        : isDimmed
                        ? 'opacity-40 border-transparent hover:opacity-100 hover:bg-slate-50'
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full transition-transform ${pm.dotClass} ${isHovered || isSelected ? 'scale-125' : ''}`} />
                      <span className={`font-semibold transition-colors ${isSelected ? 'text-[#3FA9A8]' : isHovered ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                        {pm.name}
                      </span>
                    </div>
                    <div className="text-right flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">Rs. {pm.amount.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400 font-medium">({pm.percent}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Manual register drawer reconciled</span>
            <span 
              onClick={() => {
                setSelectedTransaction(displayTransactions[0] || null);
                setReceiptPreviewModalOpen(true);
              }}
              className="text-[#3FA9A8] font-medium hover:underline cursor-pointer"
            >
              Print Slip
            </span>
          </div>
        </article>
      </section>
      {/* END: Main Analytics Grid */}

      {/* BEGIN: Secondary Insights Row (Top Sellers & Order Types) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5" data-purpose="secondary-insights">
        {/* Left Sub-Panel: Top-Selling Items List */}
        <article className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Top-Selling Dishes</h3>
              <p className="text-xs text-slate-500 mt-0.5">High velocity revenue contributors</p>
            </div>
            <div className="flex items-center gap-2">
              {selectedDishFilter && (
                <button
                  type="button"
                  onClick={() => setSelectedDishFilter(null)}
                  className="text-xs text-rose-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" /> Clear filter
                </button>
              )}
              <button 
                onClick={() => setActiveTab('products')}
                className="text-xs font-semibold text-[#3FA9A8] hover:underline cursor-pointer"
              >
                View Menu Matrix →
              </button>
            </div>
          </div>
          <div className="space-y-3.5">
            {topSellingDishes.map((dish, idx) => {
              const isSelected = selectedDishFilter === dish.name;
              return (
                <div 
                  key={dish.id}
                  onClick={() => setSelectedDishFilter(isSelected ? null : dish.name)}
                  className={`flex items-center justify-between text-xs p-1 rounded-lg cursor-pointer transition ${
                    isSelected ? 'bg-teal-50 ring-1 ring-[#3FA9A8]' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3 w-1/2">
                    <span className={`w-6 h-6 rounded-md font-bold flex items-center justify-center shrink-0 ${
                      idx === 0 ? 'bg-teal-50 text-[#3FA9A8]' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className={`font-semibold truncate ${isSelected ? 'text-[#3FA9A8]' : 'text-slate-800'}`}>
                      {dish.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-6 text-right">
                    <span className="text-slate-500 font-medium">{dish.orders} orders</span>
                    <span className="font-bold text-slate-900 w-20">Rs. {dish.revenue.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        {/* Right Sub-Panel: Order Type Breakdown & Utilization */}
        <article className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Order Channels</h3>
                <p className="text-xs text-slate-500 mt-0.5">Dine-in vs takeaway volume</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedChannelFilter && (
                  <button
                    type="button"
                    onClick={() => setSelectedChannelFilter(null)}
                    className="text-xs text-rose-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
                <span className="text-xs text-slate-400 font-medium">{metricsData.orders} Total</span>
              </div>
            </div>
            {/* Comparative Visual Bars */}
            <div className="space-y-4">
              {/* Dine In */}
              <div 
                onClick={() => setSelectedChannelFilter(selectedChannelFilter === 'dine_in' ? null : 'dine_in')}
                className={`p-1.5 rounded-xl cursor-pointer transition ${
                  selectedChannelFilter === 'dine_in' ? 'bg-teal-50 ring-1 ring-[#3FA9A8]' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#3FA9A8]" />
                    Dine-In ({channelData.dineInOrders} orders)
                  </span>
                  <span className="font-bold text-slate-800">
                    Rs. {channelData.dineInSales.toLocaleString()}{' '}
                    <span className="text-slate-400 font-normal">({channelData.dineInPct}%)</span>
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-[#3FA9A8] transition-all duration-500" style={{ width: `${channelData.dineInPct}%` }} />
                </div>
              </div>
              {/* Takeaway */}
              <div 
                onClick={() => setSelectedChannelFilter(selectedChannelFilter === 'takeaway' ? null : 'takeaway')}
                className={`p-1.5 rounded-xl cursor-pointer transition ${
                  selectedChannelFilter === 'takeaway' ? 'bg-amber-50 ring-1 ring-amber-400' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Takeaway / Counter ({channelData.takeawayOrders} orders)
                  </span>
                  <span className="font-bold text-slate-800">
                    Rs. {channelData.takeawaySales.toLocaleString()}{' '}
                    <span className="text-slate-400 font-normal">({channelData.takeawayPct}%)</span>
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${channelData.takeawayPct}%` }} />
                </div>
              </div>
            </div>
          </div>
          {/* Quick Seating Footnote */}
          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-[#3FA9A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <span>Current Table Turn Rate: <strong className="text-slate-700">38 min avg</strong></span>
            </div>
            <span className="text-emerald-600 font-medium">Optimal flow</span>
          </div>
        </article>
      </section>
      {/* END: Secondary Insights Row */}

      {/* BEGIN: Recent Transactions Table */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden" data-purpose="recent-transactions-card">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-800">Recent Transactions</h3>
            <p className="text-xs text-slate-500 mt-0.5">Live register feed from Station 1 &amp; Station 2</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tx, cashier..."
                value={txSearch}
                onChange={(e) => { setTxSearch(e.target.value); setTxPage(1); }}
                className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] w-40"
              />
              {txSearch && (
                <button 
                  type="button" 
                  onClick={() => setTxSearch('')} 
                  className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button 
              onClick={() => setActiveTab('transactions')}
              className="text-xs font-semibold text-[#3FA9A8] hover:text-[#359392] inline-flex items-center space-x-1 cursor-pointer"
            >
              <span>View All Transactions</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter Indicator Banner */}
        {(selectedPaymentFilter || selectedChannelFilter || selectedDishFilter) && (
          <div className="px-5 py-2 bg-teal-50/70 border-b border-teal-100 flex items-center justify-between text-xs text-teal-800">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#3FA9A8]" />
              <span>
                Filtered by:{' '}
                {selectedPaymentFilter && <strong>Payment ({selectedPaymentFilter}) </strong>}
                {selectedChannelFilter && <strong>Channel ({selectedChannelFilter}) </strong>}
                {selectedDishFilter && <strong>Dish ({selectedDishFilter}) </strong>}
                — showing {displayTransactions.length} results
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedPaymentFilter(null);
                setSelectedChannelFilter(null);
                setSelectedDishFilter(null);
              }}
              className="text-xs font-semibold underline hover:text-teal-950 cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                <th className="py-3 px-5">Receipt #</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Order Type</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Items Count</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  const itemsCount = tx.items ? tx.items.reduce((s, i) => s + (i.qty || 1), 0) : 1;
                  const isDineIn = tx.notes?.includes('Table') || tx.notes?.includes('Dine');
                  const paymentDot = 
                    tx.paymentMethod === 'cash' ? 'bg-[#3FA9A8]' :
                    tx.paymentMethod === 'easypaisa' ? 'bg-[#10B981]' :
                    tx.paymentMethod === 'jazzcash' ? 'bg-[#F59E0B]' :
                    'bg-[#64748B]';

                  return (
                    <tr 
                      key={tx.id}
                      onClick={() => handleOpenTransaction(tx)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-5 font-semibold text-slate-900 group-hover:text-[#3FA9A8] transition-colors flex items-center gap-1.5">
                        <span>{tx.id}</span>
                        <Eye className="w-3 h-3 text-slate-300 group-hover:text-[#3FA9A8] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatTime(tx.timestamp)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-medium ${
                          isDineIn ? 'bg-teal-50 text-[#3FA9A8]' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {tx.notes || (isDineIn ? 'Dine-In' : 'Takeaway')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center space-x-1.5 font-medium capitalize">
                          <span className={`w-2 h-2 rounded-full ${paymentDot}`} />
                          <span>{tx.paymentMethod}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        Rs. {tx.total.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            title="Print Thermal Slip"
                            onClick={(e) => handlePrintSlip(e, tx)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Paid
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {paginatedTransactions.length} of {displayTransactions.length} transactions {dateFilter === 'today' ? 'today' : 'in period'}</span>
          <div className="flex items-center space-x-2">
            <button 
              type="button"
              onClick={() => setTxPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="font-semibold text-slate-700 px-1">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              type="button"
              onClick={() => setTxPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </section>
      {/* END: Recent Transactions Table */}
    </div>
  );
};
