import React, { useState, useMemo } from 'react';
import { 
  CheckCircle,
  Eye,
  Printer,
  X,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  DollarSign,
  Receipt,
  ShoppingBag,
  PieChart
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useUIStore } from '../../store/useUIStore';
import type { Transaction, ExpenseRecord } from '../../types';

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
const EMPTY_DASH_EXPENSES: ExpenseRecord[] = [];

// Format PKR Currency
const formatPKR = (amount: number): string => {
  return `Rs. ${Math.round(amount).toLocaleString('en-PK')}`;
};

export const DashboardView: React.FC = () => {
  const { 
    setActiveTab, 
    setSelectedTransaction, 
    setTransactionDetailsModalOpen, 
    setReceiptPreviewModalOpen,
    setCashMovementModalOpen,
    setCashMovementType
  } = useUIStore();

  // Stable reference timestamp on mount
  const [baseTimestamp] = useState(() => Date.now());

  // Active filters and states
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customRangeDays, setCustomRangeDays] = useState<number>(7);
  const [customRangeLabel, setCustomRangeLabel] = useState('Last 7 Days');
  const [customDropdownOpen, setCustomDropdownOpen] = useState(false);
  const [activeKpiMenu, setActiveKpiMenu] = useState<number | null>(null);

  // Chart hover & interaction state
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number>(4);
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

  // Compute active date boundaries
  const { startTime, endTime, prevStartTime, prevEndTime, periodLabel, periodName } = useMemo(() => {
    const oneDayMs = 24 * 60 * 60 * 1000;
    let start = 0;
    let end = baseTimestamp;
    let prevStart = 0;
    let prevEnd = 0;
    let pName = 'yesterday';
    let pLabel = '';

    const todayDate = new Date(baseTimestamp);
    todayDate.setHours(0, 0, 0, 0);
    const startOfToday = todayDate.getTime();

    if (dateFilter === 'today') {
      start = startOfToday;
      end = baseTimestamp;
      prevStart = startOfToday - oneDayMs;
      prevEnd = startOfToday - 1;
      pName = 'yesterday';
      pLabel = `Today (${new Date(baseTimestamp).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })})`;
    } else if (dateFilter === 'week') {
      start = baseTimestamp - 7 * oneDayMs;
      end = baseTimestamp;
      prevStart = baseTimestamp - 14 * oneDayMs;
      prevEnd = baseTimestamp - 7 * oneDayMs;
      pName = 'last week';
      pLabel = 'Last 7 Days';
    } else if (dateFilter === 'month') {
      start = baseTimestamp - 30 * oneDayMs;
      end = baseTimestamp;
      prevStart = baseTimestamp - 60 * oneDayMs;
      prevEnd = baseTimestamp - 30 * oneDayMs;
      pName = 'last month';
      pLabel = 'Last 30 Days';
    } else {
      const span = customRangeDays * oneDayMs;
      start = baseTimestamp - span;
      end = baseTimestamp;
      prevStart = baseTimestamp - 2 * span;
      prevEnd = baseTimestamp - span;
      pName = 'prior period';
      pLabel = customRangeLabel;
    }

    return {
      startTime: start,
      endTime: end,
      prevStartTime: prevStart,
      prevEndTime: prevEnd,
      periodLabel: pLabel,
      periodName: pName
    };
  }, [dateFilter, customRangeDays, customRangeLabel, baseTimestamp]);

  // Filtered transactions for current and previous period
  const filteredTransactions = useMemo(() => {
    return liveTransactions.filter((tx) => tx.timestamp >= startTime && tx.timestamp <= endTime);
  }, [liveTransactions, startTime, endTime]);

  const prevFilteredTransactions = useMemo(() => {
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
    return prevFilteredTransactions.filter((t) => t.status === 'completed');
  }, [prevFilteredTransactions]);

  // Authentic Key Performance Indicators (KPIs)
  const metricsData = useMemo(() => {
    const sales = completedTx.reduce((sum, tx) => sum + (tx.total || 0), 0);
    const orders = completedTx.length;
    const avgBill = orders > 0 ? Math.round(sales / orders) : 0;
    const expenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const vouchers = filteredExpenses.length;

    // Previous period comparative trends
    const prevSales = prevCompletedTx.reduce((sum, tx) => sum + (tx.total || 0), 0);
    const prevOrders = prevCompletedTx.length;
    const prevAvgBill = prevOrders > 0 ? Math.round(prevSales / prevOrders) : 0;

    const salesTrend = prevSales > 0 ? Number((((sales - prevSales) / prevSales) * 100).toFixed(1)) : 0;
    const ordersTrend = prevOrders > 0 ? Number((((orders - prevOrders) / prevOrders) * 100).toFixed(1)) : 0;
    const billTrend = prevAvgBill > 0 ? Number((((avgBill - prevAvgBill) / prevAvgBill) * 100).toFixed(1)) : 0;

    return {
      sales,
      orders,
      avgBill,
      expenses,
      vouchers,
      salesTrend,
      ordersTrend,
      billTrend,
      periodName
    };
  }, [completedTx, prevCompletedTx, filteredExpenses, periodName]);

  // Dynamic Chart Points Engine based on actual completed transactions
  const { chartPoints, pathD, areaD } = useMemo(() => {
    interface BucketDef {
      label: string;
      time: string;
      tag: string;
      filterFn: (tx: Transaction) => boolean;
    }

    let buckets: BucketDef[] = [];
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (dateFilter === 'today') {
      // 7 2-hour intervals covering the restaurant operating schedule
      const slots = [
        { label: '10 AM', time: '10:00 AM - 12:00 PM', tag: 'Morning Prep', minH: 9, maxH: 11 },
        { label: '12 PM', time: '12:00 PM - 02:00 PM', tag: 'Lunch Rush', minH: 11, maxH: 13 },
        { label: '2 PM', time: '02:00 PM - 04:00 PM', tag: 'Afternoon Flow', minH: 13, maxH: 15 },
        { label: '4 PM', time: '04:00 PM - 06:00 PM', tag: 'Tea & Snacks', minH: 15, maxH: 17 },
        { label: '6 PM', time: '06:00 PM - 08:00 PM', tag: 'Evening Rush', minH: 17, maxH: 19 },
        { label: '8 PM', time: '08:00 PM - 10:00 PM', tag: 'Peak Dinner', minH: 19, maxH: 21 },
        { label: '10 PM', time: '10:00 PM - Midnight', tag: 'Late Closing', minH: 21, maxH: 24 },
      ];

      buckets = slots.map((s) => ({
        label: s.label,
        time: s.time,
        tag: s.tag,
        filterFn: (tx) => {
          const h = new Date(tx.timestamp).getHours();
          return h >= s.minH && h < s.maxH;
        }
      }));
    } else if (dateFilter === 'week') {
      // 7 consecutive days for the weekly trajectory
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      buckets = [6, 5, 4, 3, 2, 1, 0].map((daysAgo) => {
        const d = new Date(baseTimestamp - daysAgo * oneDayMs);
        const dayName = days[(d.getDay() + 6) % 7];
        const dateStr = d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short' });
        const startDay = new Date(d).setHours(0, 0, 0, 0);
        const endDay = startDay + oneDayMs - 1;

        return {
          label: daysAgo === 0 ? 'Today' : dayName,
          time: dateStr,
          tag: daysAgo === 0 ? 'Current Day' : `${dayName} Session`,
          filterFn: (tx) => tx.timestamp >= startDay && tx.timestamp <= endDay
        };
      });
    } else if (dateFilter === 'month') {
      // 4 distinct weekly slices for monthly view
      buckets = [
        { label: 'Week 1', time: 'Days 1 - 7', tag: 'Opening Week', daysStart: 28, daysEnd: 21 },
        { label: 'Week 2', time: 'Days 8 - 14', tag: 'Mid-Month 1', daysStart: 21, daysEnd: 14 },
        { label: 'Week 3', time: 'Days 15 - 21', tag: 'Mid-Month 2', daysStart: 14, daysEnd: 7 },
        { label: 'Week 4', time: 'Days 22 - 30', tag: 'Month-End', daysStart: 7, daysEnd: 0 },
      ].map((b) => ({
        label: b.label,
        time: b.time,
        tag: b.tag,
        filterFn: (tx) => {
          const startSlice = baseTimestamp - b.daysStart * oneDayMs;
          const endSlice = baseTimestamp - b.daysEnd * oneDayMs;
          return tx.timestamp >= startSlice && tx.timestamp <= endSlice;
        }
      }));
    } else {
      // Custom 5 slice partition
      const totalSpan = endTime - startTime;
      const sliceCount = 5;
      const sliceSpan = totalSpan / sliceCount;

      buckets = Array.from({ length: sliceCount }).map((_, i) => {
        const sStart = startTime + i * sliceSpan;
        const sEnd = startTime + (i + 1) * sliceSpan;
        const dLabel = new Date(sStart).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' });

        return {
          label: dLabel,
          time: `${new Date(sStart).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}`,
          tag: `Period Segment ${i + 1}`,
          filterFn: (tx) => tx.timestamp >= sStart && tx.timestamp <= sEnd
        };
      });
    }

    // Tally metrics per bucket
    const bucketValues = buckets.map((b) => {
      const bucketTx = completedTx.filter(b.filterFn);
      const sales = bucketTx.reduce((sum, tx) => sum + (tx.total || 0), 0);
      const orders = bucketTx.length;
      return {
        ...b,
        sales,
        orders
      };
    });

    const maxSales = Math.max(...bucketValues.map((b) => b.sales), 1000);
    const count = bucketValues.length;

    // Generate chart points with responsive coordinates
    const points: ChartPoint[] = bucketValues.map((b, idx) => {
      const pctX = count > 1 ? (idx / (count - 1)) * 100 : 50;
      const x = Math.round((pctX / 100) * 700);
      // Map sales to Y between 30 (peak) and 165 (zero)
      const ratio = b.sales / maxSales;
      const y = Math.round(165 - ratio * 135);

      return {
        label: b.label,
        time: b.time,
        sales: b.sales,
        orders: b.orders,
        tag: ratio >= 0.8 && b.sales > 0 ? `${b.tag} (Peak)` : b.tag,
        x,
        y,
        pctX: Number(pctX.toFixed(1))
      };
    });

    // Generate smooth cubic bezier SVG curve
    const generatedPath = points.reduce((acc, pt, i, arr) => {
      if (i === 0) return `M ${pt.x},${pt.y}`;
      const prev = arr[i - 1];
      const cpX1 = prev.x + (pt.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (pt.x - prev.x) / 2;
      const cpY2 = pt.y;
      return `${acc} C ${cpX1},${cpY1} ${cpX2},${cpY2} ${pt.x},${pt.y}`;
    }, '');

    const firstX = points[0]?.x ?? 0;
    const lastX = points[points.length - 1]?.x ?? 700;
    const generatedArea = `${generatedPath} L ${lastX},170 L ${firstX},170 Z`;

    return {
      chartPoints: points,
      pathD: generatedPath,
      areaD: generatedArea,
      maxBucketSales: maxSales
    };
  }, [completedTx, dateFilter, baseTimestamp, startTime, endTime]);

  const activePoint = chartPoints[Math.min(hoveredPointIndex, chartPoints.length - 1)] || chartPoints[0];

  // Mouse Move listener across the Sales Overview Chart
  const handleChartMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (mouseX / rect.width) * 100));

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
  };

  // Real Payment Breakdown Donut Chart dynamically calculated from completed transactions
  const paymentBreakdown = useMemo(() => {
    const total = metricsData.sales || 1;

    let cashAmount = 0;
    let cashOrders = 0;
    let easypaisaAmount = 0;
    let easypaisaOrders = 0;
    let jazzcashAmount = 0;
    let jazzcashOrders = 0;
    let cardAmount = 0;
    let cardOrders = 0;

    for (const tx of completedTx) {
      const m = (tx.paymentMethod || 'cash').toLowerCase();
      if (m === 'cash') {
        cashAmount += tx.total || 0;
        cashOrders += 1;
      } else if (m === 'easypaisa') {
        easypaisaAmount += tx.total || 0;
        easypaisaOrders += 1;
      } else if (m === 'jazzcash') {
        jazzcashAmount += tx.total || 0;
        jazzcashOrders += 1;
      } else {
        cardAmount += tx.total || 0;
        cardOrders += 1;
      }
    }

    const rawSlices = [
      {
        id: 'cash',
        name: 'Cash Counter',
        amount: cashAmount,
        orders: cashOrders,
        percent: Math.round((cashAmount / total) * 100),
        color: '#3FA9A8',
        lightBg: 'bg-teal-50',
        textLight: 'text-teal-700',
        dotClass: 'bg-[#3FA9A8]',
        badgeClass: 'bg-teal-50 text-[#3FA9A8] border-teal-200'
      },
      {
        id: 'easypaisa',
        name: 'Easypaisa QR',
        amount: easypaisaAmount,
        orders: easypaisaOrders,
        percent: Math.round((easypaisaAmount / total) * 100),
        color: '#10B981',
        lightBg: 'bg-emerald-50',
        textLight: 'text-emerald-700',
        dotClass: 'bg-[#10B981]',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      },
      {
        id: 'jazzcash',
        name: 'JazzCash QR',
        amount: jazzcashAmount,
        orders: jazzcashOrders,
        percent: Math.round((jazzcashAmount / total) * 100),
        color: '#F59E0B',
        lightBg: 'bg-amber-50',
        textLight: 'text-amber-700',
        dotClass: 'bg-[#F59E0B]',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200'
      },
      {
        id: 'card',
        name: 'Card / Digital POS',
        amount: cardAmount,
        orders: cardOrders,
        percent: Math.round((cardAmount / total) * 100),
        color: '#64748B',
        lightBg: 'bg-slate-100',
        textLight: 'text-slate-700',
        dotClass: 'bg-[#64748B]',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300'
      }
    ];

    // Ensure slices add up cleanly and calculate SVG dash arrays
    const gap = 1.8;
    let currentOffset = 0;

    return rawSlices.map((s) => {
      const slicePct = Math.max(0, s.percent);
      const dashLength = Math.max(0.5, slicePct > gap ? slicePct - gap : slicePct);
      const dasharray = `${dashLength.toFixed(1)} 100`;
      const dashoffset = `-${(currentOffset + gap / 2).toFixed(1)}`;
      currentOffset += slicePct;

      return {
        ...s,
        dasharray,
        dashoffset
      };
    });
  }, [completedTx, metricsData.sales]);

  const currentHoveredPayment = paymentBreakdown.find((p) => p.id === hoveredPayment);

  // Real Top-Selling Dishes Matrix aggregated directly from completed transactions
  const topSellingDishes = useMemo(() => {
    interface DishTally {
      id: string;
      name: string;
      orders: number;
      revenue: number;
    }

    const map = new Map<string, DishTally>();

    for (const tx of completedTx) {
      if (!tx.items) continue;
      for (const it of tx.items) {
        const key = it.name.trim();
        const existing = map.get(key);
        const itemRev = it.price * it.qty;

        if (existing) {
          existing.orders += it.qty;
          existing.revenue += itemRev;
        } else {
          map.set(key, {
            id: it.productId || key,
            name: it.name,
            orders: it.qty,
            revenue: itemRev
          });
        }
      }
    }

    const list = Array.from(map.values());
    list.sort((a, b) => b.revenue - a.revenue);
    return list.slice(0, 5);
  }, [completedTx]);

  // Real Order Channels Breakdown
  const channelData = useMemo(() => {
    let dineInOrders = 0;
    let dineInSales = 0;
    let takeawayOrders = 0;
    let takeawaySales = 0;

    for (const tx of completedTx) {
      const note = (tx.notes || '').toLowerCase();
      if (note.includes('table') || note.includes('dine')) {
        dineInOrders += 1;
        dineInSales += tx.total || 0;
      } else {
        takeawayOrders += 1;
        takeawaySales += tx.total || 0;
      }
    }

    const totalSales = metricsData.sales || 1;

    return {
      dineInOrders,
      dineInSales,
      dineInPct: Math.round((dineInSales / totalSales) * 100),
      takeawayOrders,
      takeawaySales,
      takeawayPct: Math.round((takeawaySales / totalSales) * 100),
    };
  }, [completedTx, metricsData.sales]);

  // Unified Transactions List for Table
  const displayTransactions = useMemo(() => {
    let list = [...filteredTransactions];

    if (txSearch.trim()) {
      const q = txSearch.toLowerCase().trim();
      list = list.filter((tx) =>
        String(tx.orderNumber).includes(q) ||
        tx.id.toLowerCase().includes(q) ||
        (tx.notes && tx.notes.toLowerCase().includes(q)) ||
        tx.paymentMethod.toLowerCase().includes(q) ||
        (tx.cashierName && tx.cashierName.toLowerCase().includes(q)) ||
        tx.items?.some((it) => it.name.toLowerCase().includes(q))
      );
    }

    if (selectedPaymentFilter) {
      list = list.filter((tx) => tx.paymentMethod.toLowerCase() === selectedPaymentFilter.toLowerCase());
    }

    if (selectedChannelFilter) {
      list = list.filter((tx) => {
        const note = (tx.notes || '').toLowerCase();
        if (selectedChannelFilter === 'dine_in') return note.includes('table') || note.includes('dine');
        if (selectedChannelFilter === 'takeaway') return !note.includes('table') && !note.includes('dine');
        return true;
      });
    }

    if (selectedDishFilter) {
      list = list.filter((tx) => tx.items?.some((it) => it.name.toLowerCase().includes(selectedDishFilter.toLowerCase())));
    }

    // Sort newest first
    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return list;
  }, [filteredTransactions, txSearch, selectedPaymentFilter, selectedChannelFilter, selectedDishFilter]);

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
      return '12:00 PM';
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
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dashboard &amp; Operations</h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-teal-50 text-[#3FA9A8] border border-teal-200/60 rounded-full">
              Live Dexie Stream
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Real-time revenue trajectory, order flow, and register metrics</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Date Filter */}
          <div className="inline-flex p-1 bg-slate-200/70 rounded-xl text-xs font-medium text-slate-600 relative">
            <button 
              type="button" 
              onClick={() => { setDateFilter('today'); setCustomDropdownOpen(false); setTxPage(1); }}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                dateFilter === 'today' ? 'bg-[#3FA9A8] text-white shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button 
              type="button" 
              onClick={() => { setDateFilter('week'); setCustomDropdownOpen(false); setTxPage(1); }}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                dateFilter === 'week' ? 'bg-[#3FA9A8] text-white shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              This Week
            </button>
            <button 
              type="button" 
              onClick={() => { setDateFilter('month'); setCustomDropdownOpen(false); setTxPage(1); }}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                dateFilter === 'month' ? 'bg-[#3FA9A8] text-white shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button 
              type="button" 
              onClick={() => setCustomDropdownOpen(!customDropdownOpen)}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                dateFilter === 'custom' ? 'bg-[#3FA9A8] text-white shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              <span>{dateFilter === 'custom' ? customRangeLabel : 'Custom'}</span>
              <Calendar className="w-3 h-3 ml-0.5" />
            </button>

            {/* Custom Range Popover Dropdown */}
            {customDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-xs">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">Timeframe Presets</div>
                {[
                  { label: 'Yesterday', days: 1 },
                  { label: 'Last 7 Days', days: 7 },
                  { label: 'Last 14 Days', days: 14 },
                  { label: 'Last 30 Days', days: 30 },
                  { label: 'Last 90 Days', days: 90 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setDateFilter('custom');
                      setCustomRangeDays(item.days);
                      setCustomRangeLabel(item.label);
                      setCustomDropdownOpen(false);
                      setTxPage(1);
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
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer" 
              type="button"
            >
              <DollarSign className="w-3.5 h-3.5 text-slate-500" />
              <span>Record Expense</span>
            </button>
            <button 
              onClick={() => setActiveTab('cash_closing')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer" 
              type="button"
            >
              <Receipt className="w-3.5 h-3.5 text-slate-500" />
              <span>Cash Closing</span>
            </button>
            <button 
              onClick={() => setActiveTab('pos')}
              className="inline-flex items-center space-x-1 px-3.5 py-1.5 bg-[#3FA9A8] hover:bg-[#349695] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer" 
              type="button"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>New POS Sale</span>
            </button>
          </div>
        </div>
      </section>
      {/* END: Subheader & Quick Actions */}

      {/* Scope Pill */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#3FA9A8]" />
          <span className="font-semibold text-slate-800">Operational Window:</span>
          <span className="bg-white px-2.5 py-0.5 rounded-md font-mono text-slate-700 border border-slate-200 shadow-2xs">
            {periodLabel}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span>Active Feed: <strong className="text-slate-800">{completedTx.length} tickets</strong></span>
          <span>•</span>
          <span>Gross Volume: <strong className="text-emerald-700">{formatPKR(metricsData.sales)}</strong></span>
        </div>
      </div>

      {/* BEGIN: Metric Cards Row (4 Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-purpose="metric-cards-grid">
        {/* Card 1: Gross Sales */}
        <article className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative flex flex-col justify-between hover:border-[#3FA9A8] transition-colors">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#3FA9A8] flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
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
                      View Reports Desk
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs font-medium text-slate-500">Gross Sales</span>
              <p className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                {formatPKR(metricsData.sales)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-semibold text-emerald-600">
            {metricsData.salesTrend >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 text-rose-500" />
            )}
            <span className={metricsData.salesTrend >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
              {metricsData.salesTrend}%
            </span>
            <span className="text-slate-400 font-normal ml-1">vs {metricsData.periodName}</span>
          </div>
        </article>

        {/* Card 2: Completed Orders */}
        <article className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative flex flex-col justify-between hover:border-[#3FA9A8] transition-colors">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
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
              <p className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                {metricsData.orders.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-semibold text-blue-600">
            {metricsData.ordersTrend >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 text-rose-500" />
            )}
            <span className={metricsData.ordersTrend >= 0 ? 'text-blue-600' : 'text-rose-500'}>
              {metricsData.ordersTrend}%
            </span>
            <span className="text-slate-400 font-normal ml-1">vs {metricsData.periodName}</span>
          </div>
        </article>

        {/* Card 3: Average Bill Value */}
        <article className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative flex flex-col justify-between hover:border-[#3FA9A8] transition-colors">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
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
                      View Velocity Matrix
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs font-medium text-slate-500">Average Bill (AOV)</span>
              <p className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                {formatPKR(metricsData.avgBill)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-semibold text-amber-600">
            {metricsData.billTrend >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 text-rose-500" />
            )}
            <span className={metricsData.billTrend >= 0 ? 'text-amber-600' : 'text-rose-500'}>
              {metricsData.billTrend}%
            </span>
            <span className="text-slate-400 font-normal ml-1">vs {metricsData.periodName}</span>
          </div>
        </article>

        {/* Card 4: Recorded Expenses */}
        <article className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative flex flex-col justify-between hover:border-[#3FA9A8] transition-colors">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <PieChart className="w-5 h-5" />
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
                      Expense Audit Ledger
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs font-medium text-slate-500">Recorded Expenses</span>
              <p className="text-2xl font-bold text-rose-600 tracking-tight mt-0.5">
                {formatPKR(metricsData.expenses)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-medium text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-400 mr-1.5" />
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
              <h3 className="text-base font-bold text-slate-800">Sales Trajectory</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Live chronological revenue curve across {periodLabel} (Hover anywhere to inspect)
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-700 font-semibold">
                <span className="w-3 h-3 rounded-sm bg-[#3FA9A8]" />
                <span>Actual Flow</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-400">
                <span className="w-3 h-0.5 bg-slate-300" />
                <span>Baseline Target</span>
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
                    {formatPKR(activePoint.sales)}
                  </span>
                </div>
                <div className="text-[10px] text-slate-300 flex items-center justify-center gap-2 mt-0.5">
                  <span>{activePoint.orders} tickets</span>
                  <span>•</span>
                  <span>Avg: {formatPKR(activePoint.orders > 0 ? activePoint.sales / activePoint.orders : 0)}</span>
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

              {/* Fill Area Gradient (Dynamically generated from actual points) */}
              <path d={areaD} fill="url(#tealGrad)" />

              {/* Solid Trajectory Line (Dynamically generated from actual points) */}
              <path d={pathD} fill="none" stroke="#3FA9A8" strokeLinecap="round" strokeWidth="3" />

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

              {/* Inactive Point Sub-Nodes */}
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
              <h3 className="text-base font-bold text-slate-800">Payment Breakdown</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tender share across {periodLabel}</p>
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
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
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

              {/* Dynamic Center Content Card */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2 select-none">
                {currentHoveredPayment ? (
                  <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-150">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${currentHoveredPayment.badgeClass} border shadow-2xs`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${currentHoveredPayment.dotClass}`} />
                      {currentHoveredPayment.name}
                    </span>
                    <span className="text-base font-extrabold text-slate-900 tracking-tight mt-0.5">
                      {formatPKR(currentHoveredPayment.amount)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {currentHoveredPayment.percent}% ({currentHoveredPayment.orders} tickets)
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                      Gross Collected
                    </span>
                    <span className="text-base font-extrabold text-slate-800 tracking-tight">
                      {formatPKR(metricsData.sales)}
                    </span>
                    <span className="text-[9px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                      <CheckCircle className="w-2.5 h-2.5" /> 100% Reconciled
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
                      <span className="font-bold text-slate-800">{formatPKR(pm.amount)}</span>
                      <span className="text-[10px] text-slate-400 font-medium">({pm.percent}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Click any payment tender to filter order ledger</span>
            <button
              type="button" 
              onClick={() => setActiveTab('reports')}
              className="text-[#3FA9A8] font-semibold hover:underline cursor-pointer"
            >
              Full Reconciliation →
            </button>
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
              <p className="text-xs text-slate-500 mt-0.5">High velocity revenue contributors in {periodLabel}</p>
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
          <div className="space-y-3">
            {topSellingDishes.map((dish, idx) => {
              const isSelected = selectedDishFilter === dish.name;
              return (
                <div 
                  key={dish.name}
                  onClick={() => setSelectedDishFilter(isSelected ? null : dish.name)}
                  className={`flex items-center justify-between text-xs p-2 rounded-xl cursor-pointer transition ${
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
                    <span className="text-slate-500 font-medium">{dish.orders} sold</span>
                    <span className="font-bold text-slate-900 w-24">{formatPKR(dish.revenue)}</span>
                  </div>
                </div>
              );
            })}
            {topSellingDishes.length === 0 && (
              <div className="py-8 text-center text-slate-400">
                <ShoppingBag className="w-6 h-6 mx-auto mb-1 opacity-40" />
                <p>No item sales recorded for the selected window.</p>
              </div>
            )}
          </div>
        </article>

        {/* Right Sub-Panel: Order Type Breakdown & Utilization */}
        <article className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Dining Channels</h3>
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
                className={`p-2 rounded-xl cursor-pointer transition ${
                  selectedChannelFilter === 'dine_in' ? 'bg-teal-50 ring-1 ring-[#3FA9A8]' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#3FA9A8]" />
                    Dine-In ({channelData.dineInOrders} tickets)
                  </span>
                  <span className="font-bold text-slate-800">
                    {formatPKR(channelData.dineInSales)}{' '}
                    <span className="text-slate-400 font-normal">({channelData.dineInPct}%)</span>
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-[#3FA9A8] transition-all duration-500" style={{ width: `${Math.max(4, channelData.dineInPct)}%` }} />
                </div>
              </div>
              {/* Takeaway */}
              <div 
                onClick={() => setSelectedChannelFilter(selectedChannelFilter === 'takeaway' ? null : 'takeaway')}
                className={`p-2 rounded-xl cursor-pointer transition ${
                  selectedChannelFilter === 'takeaway' ? 'bg-amber-50 ring-1 ring-amber-400' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Takeaway / Counter ({channelData.takeawayOrders} tickets)
                  </span>
                  <span className="font-bold text-slate-800">
                    {formatPKR(channelData.takeawaySales)}{' '}
                    <span className="text-slate-400 font-normal">({channelData.takeawayPct}%)</span>
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${Math.max(4, channelData.takeawayPct)}%` }} />
                </div>
              </div>
            </div>
          </div>
          {/* Channel Insight Card */}
          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-[#3FA9A8]" />
              <span>Real-time channel reconciliation from Dexie register logs</span>
            </div>
            <span className="text-emerald-600 font-bold">100% Synced</span>
          </div>
        </article>
      </section>
      {/* END: Secondary Insights Row */}

      {/* BEGIN: Recent Transactions Table */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden" data-purpose="recent-transactions-card">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-800">Live Register Feed</h3>
            <p className="text-xs text-slate-500 mt-0.5">Transactions logged in {periodLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search ticket #, cashier..."
                value={txSearch}
                onChange={(e) => { setTxSearch(e.target.value); setTxPage(1); }}
                className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#3FA9A8] w-48"
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
              className="text-xs font-semibold text-[#3FA9A8] hover:text-[#349695] inline-flex items-center space-x-1 cursor-pointer"
            >
              <span>View Full Ledger →</span>
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
                <th className="py-3 px-5">Receipt / Order #</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Service Type</th>
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
                      <td className="py-3.5 px-5 font-semibold text-slate-900 group-hover:text-[#3FA9A8] transition-colors flex items-center gap-1.5 font-mono">
                        <span>#{tx.orderNumber || tx.id}</span>
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
                        {formatPKR(tx.total)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            title="Print Thermal Slip"
                            onClick={(e) => handlePrintSlip(e, tx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            tx.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {tx.status === 'completed' ? 'Paid' : tx.status}
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
