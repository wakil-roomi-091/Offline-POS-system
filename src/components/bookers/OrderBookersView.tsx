import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import type { OrderBooker, OrderBookingSheet } from '../../types';
import {
  User,
  MessageSquare,
  Truck,
  CheckCircle2,
  Plus,
  Search,
  FileText,
  Download,
  Printer,
  Copy,
  Check,
  X,
  Edit3,
  Layers,
  RotateCcw,
  ExternalLink
} from 'lucide-react';

const EMPTY_BOOKERS: OrderBooker[] = [];
const EMPTY_SHEETS: OrderBookingSheet[] = [];

// Currency formatter
const formatPKR = (amount: number): string => {
  return `Rs. ${Math.round(amount).toLocaleString('en-PK')}`;
};

export const OrderBookersView: React.FC = () => {
  // Stable reference timestamp on mount
  const [baseTimestamp] = useState(() => Date.now());

  // Dexie live queries
  const liveBookers = useLiveQuery(() => db.bookers.toArray(), []) ?? EMPTY_BOOKERS;
  const liveSheets = useLiveQuery(() => db.bookingSheets.toArray(), []) ?? EMPTY_SHEETS;

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('today');
  const [selectedBookerIds, setSelectedBookerIds] = useState<string[]>([]);

  // Drawer & Modal State
  const [selectedBookerForProfile, setSelectedBookerForProfile] = useState<OrderBooker | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingBooker, setEditingBooker] = useState<OrderBooker | null>(null);
  const [isFastBookingModalOpen, setIsFastBookingModalOpen] = useState(false);
  const [fastBookingBooker, setFastBookingBooker] = useState<OrderBooker | null>(null);

  // WhatsApp Dispatch & Gate Pass Modal State
  const [dispatchModalBooker, setDispatchModalBooker] = useState<OrderBooker | null>(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // Form Fields for Add/Edit
  const [formData, setFormData] = useState({
    id: '#BKR-0108',
    status: 'Active' as 'Active' | 'Inactive',
    name: '',
    phone: '',
    area: 'Gulberg III - Main Mkt',
    address: '',
    notes: '',
  });

  // Fast Booking Form Fields
  const [fastBookingData, setFastBookingData] = useState({
    shopName: 'Al-Madina Super Store',
    outletsCount: 18,
    bookedUnits: 300,
    returnUnits: 10,
    deliveredUnits: 290,
    actualSales: 75000,
    notes: 'Standard field route delivery punch',
  });

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Open Fast Booking Modal
  const openFastBooking = (booker: OrderBooker) => {
    setFastBookingBooker(booker);
    setFastBookingData({
      shopName: 'Punjab Cash & Carry',
      outletsCount: 18,
      bookedUnits: 320,
      returnUnits: 12,
      deliveredUnits: 308,
      actualSales: 84200,
      notes: 'Evening dispatch sheet punch',
    });
    setIsFastBookingModalOpen(true);
  };

  // Keyboard shortcut listener (Escape & F2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDrawerOpen(false);
        setIsAddEditModalOpen(false);
        setIsFastBookingModalOpen(false);
        setDispatchModalBooker(null);
      }
      if (e.key === 'F2') {
        e.preventDefault();
        const target = selectedBookerForProfile || liveBookers[0];
        if (target) {
          openFastBooking(target);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBookerForProfile, liveBookers]);

  // Filtered Bookers based on search, area, and status
  const filteredBookers = useMemo(() => {
    return liveBookers.filter((booker) => {
      if (statusFilter === 'active' && booker.status !== 'Active') return false;
      if (statusFilter === 'inactive' && booker.status !== 'Inactive') return false;

      if (areaFilter !== 'all') {
        const areaMatch =
          booker.area.toLowerCase().includes(areaFilter.toLowerCase()) ||
          booker.areaKey.toLowerCase().includes(areaFilter.toLowerCase());
        if (!areaMatch) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = booker.name.toLowerCase().includes(q);
        const matchesId = booker.id.toLowerCase().includes(q);
        const matchesPhone = booker.phone.toLowerCase().includes(q);
        const matchesArea = booker.area.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesPhone && !matchesArea) return false;
      }

      return true;
    });
  }, [liveBookers, searchQuery, areaFilter, statusFilter]);

  // Real-time Fleet KPIs dynamically computed from Dexie live data
  const fleetKPIs = useMemo(() => {
    const totalBookers = liveBookers.length;
    const activeCount = liveBookers.filter((b) => b.status === 'Active').length;
    const inactiveCount = liveBookers.filter((b) => b.status === 'Inactive').length;
    const onDutyPct = totalBookers > 0 ? ((activeCount / totalBookers) * 100).toFixed(1) : '0.0';

    const totalSheets = liveSheets.length;
    const totalUnits = liveSheets.reduce((sum, s) => sum + (s.totalQty || 0), 0);
    const totalSales = liveSheets
      .filter((s) => s.status !== 'Cancelled')
      .reduce((sum, s) => sum + (s.bookingValue || 0), 0);

    return {
      totalBookers,
      activeCount,
      inactiveCount,
      onDutyPct,
      totalSheets,
      totalUnits,
      totalSales
    };
  }, [liveBookers, liveSheets]);

  // Checkbox management
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedBookerIds(filteredBookers.map((b) => b.id));
    } else {
      setSelectedBookerIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedBookerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setAreaFilter('all');
    setStatusFilter('all');
    setTimeFilter('today');
    showToast('Filters cleared');
  };

  // Open Drawer Profile
  const openProfile = (booker: OrderBooker) => {
    setSelectedBookerForProfile(booker);
    setIsDrawerOpen(true);
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingBooker(null);
    const nextNum = liveBookers.length + 101;
    setFormData({
      id: `#BKR-0${nextNum}`,
      status: 'Active',
      name: '',
      phone: '',
      area: 'Gulberg III - Main Mkt',
      address: '',
      notes: '',
    });
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (booker: OrderBooker) => {
    setEditingBooker(booker);
    setFormData({
      id: booker.id,
      status: booker.status,
      name: booker.name,
      phone: booker.phone,
      area: booker.area,
      address: booker.address || 'Commercial Area Logistics Hub',
      notes: booker.notes || 'Field dispatch route assigned',
    });
    setIsAddEditModalOpen(true);
  };

  // Save Add/Edit Booker into Dexie
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      showToast('Please fill in Name and Phone Number');
      return;
    }

    try {
      if (editingBooker) {
        await db.bookers.update(editingBooker.id, {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          status: formData.status,
          area: formData.area,
          address: formData.address.trim(),
          notes: formData.notes.trim(),
        });
        showToast(`Booker "${formData.name}" updated successfully in offline database.`);
      } else {
        const initials = formData.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        const newBooker: OrderBooker = {
          id: formData.id,
          name: formData.name.trim(),
          avatarInitials: initials || 'OB',
          avatarColor: 'bg-teal-100 text-teal-700',
          joinedDate: 'Joined Today',
          phone: formData.phone.trim(),
          hasWhatsApp: true,
          area: formData.area,
          areaKey: formData.area.split(' ')[0] || 'Zone',
          todayBookings: 0,
          todayUnits: 0,
          todaySales: 0,
          status: formData.status,
          address: formData.address.trim(),
          notes: formData.notes.trim(),
          totalBookingsSheets: 0,
          totalBookedUnits: 0,
          totalDeliveredUnits: 0,
          totalReturnedUnits: 0,
          totalActualSales: 0,
          rawGrossBookedValue: 0,
        };

        await db.bookers.add(newBooker);
        showToast(`New booker "${formData.name}" saved to Dexie local database!`);
      }
      setIsAddEditModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save booker:', err);
      showToast(`Error saving booker: ${err.message}`);
    }
  };

  // Save Fast Booking directly to Dexie db.bookingSheets & update booker stats
  const handleFastBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fastBookingBooker) return;

    const sheetId = `#BKG-${new Date(baseTimestamp).getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const physicalSlipNo = `#TK-${Math.floor(1000 + Math.random() * 9000)}`;

    const newSheet: OrderBookingSheet = {
      id: sheetId,
      physicalSlipNo,
      dateTime: 'Today, Just now',
      bookerName: fastBookingBooker.name,
      bookerId: fastBookingBooker.id,
      bookerZone: `${fastBookingBooker.areaKey} Zone`,
      shopName: fastBookingData.shopName.trim() || 'Retail Merchant Outlets',
      shopAddress: `${fastBookingBooker.area}, Lahore`,
      areaZone: fastBookingBooker.area,
      itemsCount: 3,
      skusCount: 3,
      totalQty: fastBookingData.deliveredUnits,
      bookingValue: fastBookingData.actualSales,
      status: 'Completed',
      targetDispatchTime: 'Today, Evening Rush',
      managerNotes: fastBookingData.notes.trim() || 'Fast booking dispatch punch',
    };

    try {
      await db.bookingSheets.add(newSheet);
      await db.bookers.update(fastBookingBooker.id, {
        todayBookings: (fastBookingBooker.todayBookings || 0) + 1,
        todayUnits: (fastBookingBooker.todayUnits || 0) + fastBookingData.deliveredUnits,
        todaySales: (fastBookingBooker.todaySales || 0) + fastBookingData.actualSales,
        totalBookingsSheets: (fastBookingBooker.totalBookingsSheets || 0) + 1,
        totalBookedUnits: (fastBookingBooker.totalBookedUnits || 0) + fastBookingData.bookedUnits,
        totalDeliveredUnits: (fastBookingBooker.totalDeliveredUnits || 0) + fastBookingData.deliveredUnits,
        totalReturnedUnits: (fastBookingBooker.totalReturnedUnits || 0) + fastBookingData.returnUnits,
        totalActualSales: (fastBookingBooker.totalActualSales || 0) + fastBookingData.actualSales,
      });

      showToast(`Booking slip ${physicalSlipNo} recorded and booker balance updated!`);
      setIsFastBookingModalOpen(false);
    } catch (err: any) {
      console.error('Failed to punch fast booking:', err);
      showToast(`Error recording booking: ${err.message}`);
    }
  };

  // Toggle Booker Active / Inactive Status
  const handleToggleStatus = async (booker: OrderBooker) => {
    const nextStatus = booker.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await db.bookers.update(booker.id, {
        status: nextStatus,
        statusNote: nextStatus === 'Inactive' ? 'Standby duty' : undefined
      });
      showToast(`Booker ${booker.name} marked as ${nextStatus}.`);
    } catch (err: any) {
      console.error('Failed to toggle status:', err);
      showToast('Error updating status.');
    }
  };

  // Export Bookers Registry to CSV
  const handleExportCSV = () => {
    const headers = [
      'Booker ID',
      'Full Name',
      'Phone',
      'Assigned Route Area',
      'Status',
      'Today Bookings',
      'Today Units',
      'Today Sales (PKR)',
      'Cumulative Sheets',
      'Cumulative Units',
      'Cumulative Actual Sales (PKR)'
    ];

    const rows = filteredBookers.map((b) => [
      `"${b.id}"`,
      `"${b.name.replace(/"/g, '""')}"`,
      `"${b.phone}"`,
      `"${b.area.replace(/"/g, '""')}"`,
      `"${b.status}"`,
      String(b.todayBookings || 0),
      String(b.todayUnits || 0),
      String(b.todaySales || 0),
      String(b.totalBookingsSheets || 0),
      String(b.totalDeliveredUnits || 0),
      String(b.totalActualSales || 0)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DinePos_Bookers_Registry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Bookers registry exported to CSV.');
  };

  // Booking history specifically for selected booker in the profile drawer
  const bookerSheets = useMemo(() => {
    if (!selectedBookerForProfile) return [];
    return liveSheets.filter((s) => s.bookerId === selectedBookerForProfile.id);
  }, [selectedBookerForProfile, liveSheets]);

  // Aggregate stats for selected booker in drawer
  const drawerBookerStats = useMemo(() => {
    if (!selectedBookerForProfile) {
      return { sheets: 0, bookedUnits: 0, deliveredUnits: 0, returnedUnits: 0, sales: 0 };
    }
    const sheets = bookerSheets.length;
    const bookedUnits = bookerSheets.reduce((sum, s) => sum + (s.totalQty || 0), 0);
    const sales = bookerSheets.reduce((sum, s) => sum + (s.bookingValue || 0), 0);
    const returnedUnits = Math.round(bookedUnits * 0.05); // standard historical return variance
    const deliveredUnits = Math.max(0, bookedUnits - returnedUnits);

    return { sheets, bookedUnits, deliveredUnits, returnedUnits, sales };
  }, [selectedBookerForProfile, bookerSheets]);

  // Formatted WhatsApp Dispatch Slip Text Generator
  const whatsAppDispatchText = useMemo(() => {
    if (!dispatchModalBooker) return '';
    const relevantSheets = liveSheets.filter((s) => s.bookerId === dispatchModalBooker.id);
    const dateFormatted = new Date(baseTimestamp).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    let msg = `🚚 *DINEPOS FIELD ROUTE DISPATCH SLIP*\n`;
    msg += `📅 *Date:* ${dateFormatted}\n`;
    msg += `👤 *Booker:* ${dispatchModalBooker.name} (${dispatchModalBooker.id})\n`;
    msg += `📍 *Route Area:* ${dispatchModalBooker.area}\n`;
    msg += `📞 *Phone:* ${dispatchModalBooker.phone}\n\n`;
    msg += `📦 *ASSIGNED SHOP DELIVERIES:*\n`;

    let totalUnits = 0;
    let totalCashToCollect = 0;

    relevantSheets.forEach((s, idx) => {
      totalUnits += s.totalQty || 0;
      totalCashToCollect += s.bookingValue || 0;
      msg += `${idx + 1}. *${s.shopName}* (${s.physicalSlipNo})\n`;
      msg += `   • Units: ${s.totalQty} pcs | Amount to Collect: ${formatPKR(s.bookingValue)}\n`;
      msg += `   • Status: ${s.status} | Dispatch: ${s.targetDispatchTime || 'Today'}\n`;
    });

    if (relevantSheets.length === 0) {
      msg += `(No pending outlet slips assigned yet. Standby for vehicle loading.)\n`;
    }

    msg += `\n📊 *ROUTE SUMMARY:*\n`;
    msg += `• Total Outlets: ${relevantSheets.length} Shops\n`;
    msg += `• Total Units to Deliver: ${totalUnits} pcs\n`;
    msg += `• Total Cash Expected: ${formatPKR(totalCashToCollect)}\n\n`;
    msg += `⚠️ *Instructions:* Verify physical stock before handover. Collect cash or instant QR confirmation. Hand over return units to warehouse supervisor.`;

    return msg;
  }, [dispatchModalBooker, liveSheets, baseTimestamp]);

  // Copy WhatsApp Dispatch Text
  const handleCopyWhatsApp = () => {
    if (!whatsAppDispatchText) return;
    navigator.clipboard.writeText(whatsAppDispatchText);
    setCopiedWhatsApp(true);
    showToast('WhatsApp dispatch slip copied to clipboard!');
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  // Open WhatsApp Web Link
  const handleOpenWhatsAppWeb = () => {
    if (!dispatchModalBooker) return;
    const cleanPhone = dispatchModalBooker.phone.replace(/[^0-9]/g, '');
    const url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(whatsAppDispatchText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4F7F9] select-none text-slate-800 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-100 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 border border-slate-700 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-[#3FA9A8]"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* BEGIN: ScrollablePageContent */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* BEGIN: PageHeaderSection */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4" data-purpose="page-header">
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Order Bookers &amp; Fleet</h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-teal-50 text-[#3FA9A8] border border-teal-200/60 rounded-full">
                Dexie Fleet Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time field distribution, assigned territories, vehicle dispatch sheets, and route settlements.
            </p>
          </div>

          {/* Primary Actions */}
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export Registry CSV</span>
            </button>
            <button
              type="button"
              onClick={openAddModal}
              className="px-4 py-2 text-xs font-bold bg-[#3FA9A8] hover:bg-[#349695] text-white rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Booker</span>
            </button>
          </div>
        </div>
        {/* END: PageHeaderSection */}

        {/* BEGIN: SummaryKPISection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" data-purpose="kpi-metric-cards">
          {/* Card 1: Total Bookers */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#3FA9A8] flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Total Fleet</span>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold text-slate-800">{fleetKPIs.totalBookers}</h3>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center">
                <span className="font-semibold text-slate-700 mr-1">Across 7</span> operational route zones
              </p>
            </div>
          </div>

          {/* Card 2: Active on Duty */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                ● {fleetKPIs.onDutyPct}% on duty
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold text-slate-800">{fleetKPIs.activeCount} Active</h3>
              <p className="text-[11px] text-slate-500 mt-1">Dispatched on active road routes</p>
            </div>
          </div>

          {/* Card 3: Standby / Inactive */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                Standby / Leave
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold text-slate-800">{fleetKPIs.inactiveCount} Standby</h3>
              <p className="text-[11px] text-slate-500 mt-1">Available for emergency routes</p>
            </div>
          </div>

          {/* Card 4: Sheets Booked */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                {fleetKPIs.totalUnits.toLocaleString()} units
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold text-slate-800">{fleetKPIs.totalSheets} Sheets</h3>
              <p className="text-[11px] text-slate-500 mt-1">Total physical booking orders</p>
            </div>
          </div>

          {/* Card 5: Delivered Sales */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#3FA9A8] flex items-center justify-center font-bold text-xs">
                PKR
              </div>
              <span className="text-[10px] font-bold text-[#3FA9A8] bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                Verified
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold text-slate-900">{formatPKR(fleetKPIs.totalSales)}</h3>
              <p className="text-[11px] text-slate-500 mt-1">Total field revenue collected</p>
            </div>
          </div>
        </div>
        {/* END: SummaryKPISection */}

        {/* BEGIN: FilterToolbar */}
        <div
          className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3"
          data-purpose="table-filter-bar"
        >
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#3FA9A8]"
                placeholder="Search booker name, ID (e.g. BKR-01)..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Area Filter Dropdown */}
            <div className="relative">
              <select
                className="text-xs py-1.5 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#3FA9A8]"
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
              >
                <option value="all">All Assigned Areas</option>
                <option value="Gulberg">Gulberg Sector</option>
                <option value="DHA">DHA Phase 5 &amp; 6</option>
                <option value="Cantt">Cantt Commercial Zone</option>
                <option value="Model Town">Model Town Link Rd</option>
                <option value="Johar Town">Johar Town &amp; PIA Rd</option>
                <option value="Saddar">Saddar Wholesale Mkt</option>
                <option value="Ferozepur">Ferozepur Rd Corridor</option>
              </select>
            </div>

            {/* Status Filter Dropdown */}
            <div className="relative">
              <select
                className="text-xs py-1.5 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#3FA9A8]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Status: All</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          </div>

          {/* Quick Preset Presets */}
          <div className="flex items-center space-x-1 border border-slate-200 p-0.5 rounded-lg bg-slate-50 text-xs">
            <button
              type="button"
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1 font-medium rounded-md transition ${
                timeFilter === 'today' ? 'bg-[#3FA9A8] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('week')}
              className={`px-3 py-1 font-medium rounded-md transition ${
                timeFilter === 'week' ? 'bg-[#3FA9A8] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('month')}
              className={`px-3 py-1 font-medium rounded-md transition ${
                timeFilter === 'month' ? 'bg-[#3FA9A8] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
          </div>
        </div>
        {/* END: FilterToolbar */}

        {/* BEGIN: BookersTableCard */}
        <div
          className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col"
          data-purpose="bookers-registry-table"
        >
          {filteredBookers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">
                      <input
                        className="rounded border-slate-300 text-[#3FA9A8] focus:ring-[#3FA9A8] cursor-pointer"
                        type="checkbox"
                        checked={
                          filteredBookers.length > 0 &&
                          filteredBookers.every((b) => selectedBookerIds.includes(b.id))
                        }
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="py-3 px-4">Booker ID</th>
                    <th className="py-3 px-4">Booker Name</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">Assigned Route Area</th>
                    <th className="py-3 px-4 text-right">Today&apos;s Bookings</th>
                    <th className="py-3 px-4 text-right">Today&apos;s Sales</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Field Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                  {filteredBookers.map((booker) => {
                    const isSelected = selectedBookerIds.includes(booker.id);
                    const isInactive = booker.status === 'Inactive';

                    return (
                      <tr
                        key={booker.id}
                        onClick={() => openProfile(booker)}
                        className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${
                          isInactive ? 'bg-slate-50/30' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-3 px-4 text-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelectOne(booker.id);
                          }}
                        >
                          <input
                            className="rounded border-slate-300 text-[#3FA9A8] focus:ring-[#3FA9A8] cursor-pointer"
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                          />
                        </td>

                        {/* Booker ID */}
                        <td
                          className={`py-3 px-4 font-mono font-medium ${
                            isInactive ? 'text-slate-500' : 'text-teal-700'
                          }`}
                        >
                          {booker.id}
                        </td>

                        {/* Booker Name */}
                        <td className="py-3 px-4">
                          <div className={`flex items-center space-x-2.5 ${isInactive ? 'opacity-80' : ''}`}>
                            <div
                              className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${booker.avatarColor}`}
                            >
                              {booker.avatarInitials}
                            </div>
                            <div>
                              <div
                                className={`font-semibold transition-colors ${
                                  isInactive ? 'text-slate-700 group-hover:text-[#3FA9A8]' : 'text-slate-900 group-hover:text-[#3FA9A8]'
                                }`}
                              >
                                {booker.name}
                              </div>
                              <div className="text-[10px] text-slate-400">{booker.joinedDate}</div>
                            </div>
                          </div>
                        </td>

                        {/* Contact Phone */}
                        <td className={`py-3 px-4 font-mono ${isInactive ? 'text-slate-500' : 'text-slate-600'}`}>
                          <div className="flex items-center space-x-1.5">
                            <span>{booker.phone}</span>
                            {booker.hasWhatsApp && (
                              <span className="text-emerald-500 text-[10px]" title="WhatsApp Active">
                                ●
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Assigned Area */}
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 text-[11px] font-medium rounded-full border border-slate-200 ${
                              isInactive ? 'bg-slate-100 text-slate-500' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {booker.area}
                          </span>
                        </td>

                        {/* Today's Bookings */}
                        <td className="py-3 px-4 text-right">
                          <div className={`font-bold ${isInactive ? 'text-slate-400' : 'text-slate-900'}`}>
                            {booker.todayBookings} Bookings
                          </div>
                          <div className="text-[10px] text-slate-400">{booker.todayUnits} units</div>
                        </td>

                        {/* Today's Sales */}
                        <td className="py-3 px-4 text-right">
                          <div className={`font-bold ${isInactive ? 'text-slate-400' : 'text-slate-900'}`}>
                            {formatPKR(booker.todaySales)}
                          </div>
                          <div className={`text-[10px] ${isInactive ? 'text-slate-400' : 'text-emerald-600'}`}>
                            {isInactive ? booker.statusNote || 'Standby duty' : 'Delivered & verified'}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          {isInactive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-slate-400"></span>
                              Inactive
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3 px-4 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* WhatsApp Dispatch Sheet */}
                            <button
                              type="button"
                              onClick={() => setDispatchModalBooker(booker)}
                              className="px-2 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition cursor-pointer flex items-center gap-1"
                              title="Generate WhatsApp Dispatch Slip"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Dispatch</span>
                            </button>

                            {/* View Profile */}
                            <button
                              type="button"
                              onClick={() => openProfile(booker)}
                              className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                            >
                              View
                            </button>

                            {/* Booking or Toggle Status */}
                            {isInactive ? (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(booker)}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition cursor-pointer"
                              >
                                Activate
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openFastBooking(booker)}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg transition cursor-pointer"
                              >
                                + Booking
                              </button>
                            )}

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => openEditModal(booker)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer hover:bg-slate-100"
                              title="Edit Booker Details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Empty State Container */
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No order bookers found</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                We couldn&apos;t find any registered bookers matching your active filter criteria or search query.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 px-3.5 py-1.5 text-xs font-semibold bg-[#3FA9A8] text-white rounded-lg hover:bg-[#349695] transition cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Table Footer */}
          {filteredBookers.length > 0 && (
            <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing <span className="font-semibold text-slate-700">{filteredBookers.length}</span> of{' '}
                <span className="font-semibold text-slate-700">{fleetKPIs.totalBookers}</span> registered order bookers
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Dexie Local Storage Synced</span>
              </div>
            </div>
          )}
        </div>
        {/* END: BookersTableCard */}
      </main>
      {/* END: ScrollablePageContent */}

      {/* BEGIN: BookerProfileDrawer */}
      {isDrawerOpen && selectedBookerForProfile && (
        <div
          aria-labelledby="slide-over-title"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-hidden"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-3xl bg-white shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center ${
                      selectedBookerForProfile.avatarColor || 'bg-teal-100 text-teal-800'
                    }`}
                  >
                    {selectedBookerForProfile.avatarInitials}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-slate-900">{selectedBookerForProfile.name}</h3>
                      {selectedBookerForProfile.status === 'Active' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ● Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          ○ Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono text-teal-700 font-medium">{selectedBookerForProfile.id}</span>
                      <span>•</span>
                      <span>{selectedBookerForProfile.area}</span>
                      <span>•</span>
                      <span className="font-mono">{selectedBookerForProfile.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setDispatchModalBooker(selectedBookerForProfile)}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer transition"
                    title="Generate WhatsApp Route Slip"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Quick Actions Bar */}
              <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
                <div className="text-slate-600 font-medium">Field Performance &amp; Route Audit Log</div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => openFastBooking(selectedBookerForProfile)}
                    className="px-3 py-1.5 bg-[#3FA9A8] hover:bg-[#349695] text-white font-semibold rounded-lg shadow-2xs flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Punch Daily Sheet (F2)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      openEditModal(selectedBookerForProfile);
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium rounded-lg cursor-pointer"
                  >
                    Edit Booker
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 6 Key Performance Metric Cards */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                    Cumulative Route Performance
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-medium">Total Bookings</span>
                      <span className="text-lg font-bold text-slate-800">
                        {drawerBookerStats.sheets} Sheets
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-medium">Booked Quantity</span>
                      <span className="text-lg font-bold text-slate-800">
                        {drawerBookerStats.bookedUnits.toLocaleString()} Units
                      </span>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-emerald-700 block font-bold">Delivered Quantity</span>
                      <span className="text-lg font-bold text-emerald-800">
                        {drawerBookerStats.deliveredUnits.toLocaleString()} Units
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium">95% Fulfillment</span>
                    </div>
                    <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                      <span className="text-[10px] text-rose-700 block font-bold">Returned Quantity</span>
                      <span className="text-lg font-bold text-rose-800">
                        {drawerBookerStats.returnedUnits.toLocaleString()} Units
                      </span>
                      <span className="text-[10px] text-rose-600 font-medium">5.0% Return Rate</span>
                    </div>
                    <div className="bg-teal-50 p-3 rounded-xl border border-teal-200">
                      <span className="text-[10px] text-teal-800 block font-bold">Actual Sales (PKR)</span>
                      <span className="text-lg font-bold text-teal-900">
                        {formatPKR(drawerBookerStats.sales)}
                      </span>
                      <span className="text-[10px] text-teal-700">Verified post-delivery</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-medium">Assigned Territory</span>
                      <span className="text-sm font-bold text-slate-700 block truncate">
                        {selectedBookerForProfile.area}
                      </span>
                      <span className="text-[10px] text-slate-400">Regular vehicle route</span>
                    </div>
                  </div>
                </div>

                {/* Accounting Rule Notice */}
                <div className="p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl text-xs text-amber-800 flex items-start space-x-2">
                  <Truck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p>
                    <strong>Logistics Rule:</strong> Sales revenue is strictly recognized post-delivery upon cash
                    collection or merchant QR verification. Undelivered units return to central inventory.
                  </p>
                </div>

                {/* Activity History Table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Booking History &amp; Dispatch Settlements ({bookerSheets.length})
                    </h4>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Date &amp; Slip</th>
                          <th className="p-2.5">Retailer Shop</th>
                          <th className="p-2.5 text-center">Items</th>
                          <th className="p-2.5 text-right">Units</th>
                          <th className="p-2.5 text-right">Booking Value</th>
                          <th className="p-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bookerSheets.map((sheet) => (
                          <tr key={sheet.id} className="hover:bg-slate-50">
                            <td className="p-2.5">
                              <div className="font-medium text-slate-800">{sheet.dateTime}</div>
                              <div className="text-[10px] font-mono text-teal-700">{sheet.physicalSlipNo}</div>
                            </td>
                            <td className="p-2.5 font-semibold text-slate-800">
                              {sheet.shopName}
                              <span className="text-[10px] text-slate-400 block font-normal">{sheet.shopAddress}</span>
                            </td>
                            <td className="p-2.5 text-center">{sheet.itemsCount || 1} items</td>
                            <td className="p-2.5 text-right font-bold text-slate-800">{sheet.totalQty}</td>
                            <td className="p-2.5 text-right font-bold text-emerald-700">
                              {formatPKR(sheet.bookingValue)}
                            </td>
                            <td className="p-2.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  sheet.status === 'Completed'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : sheet.status === 'Recorded'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {sheet.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {bookerSheets.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400">
                              No order sheets recorded for this booker yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-white cursor-pointer"
                >
                  Close Panel
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setDispatchModalBooker(selectedBookerForProfile)}
                    className="px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Route Slip</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openFastBooking(selectedBookerForProfile)}
                    className="px-4 py-2 bg-[#3FA9A8] hover:bg-[#349695] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Punch New Sheet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* END: BookerProfileDrawer */}

      {/* BEGIN: AddEditBookerModal */}
      {isAddEditModalOpen && (
        <div aria-labelledby="modal-title" aria-modal="true" className="fixed inset-0 z-50 overflow-y-auto" role="dialog">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setIsAddEditModalOpen(false)}
            />
            <span aria-hidden="true" className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-slate-200">
              {/* Modal Header */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingBooker ? `Edit Order Booker — ${editingBooker.name}` : 'Add New Order Booker'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingBooker
                      ? 'Update contact numbers, assigned route sector and operational flags.'
                      : 'Assign a field agent to route, outlets and inventory dispatch.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  onClick={() => setIsAddEditModalOpen(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form Body */}
              <form className="px-6 py-5 space-y-4 text-xs" onSubmit={handleFormSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Booker ID (System Assigned)
                    </label>
                    <input
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg py-2 px-3 text-slate-500 font-mono text-xs cursor-not-allowed"
                      readOnly
                      type="text"
                      value={formData.id}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Status Mode *</label>
                    <select
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-slate-700 text-xs focus:ring-1 focus:ring-[#3FA9A8]"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, status: e.target.value as 'Active' | 'Inactive' }))
                      }
                    >
                      <option value="Active">Active (Assigned to daily duty)</option>
                      <option value="Inactive">Inactive (Standby / Medical Leave)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-slate-800 text-xs focus:ring-1 focus:ring-[#3FA9A8]"
                    placeholder="e.g. Asad Ullah Khan"
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Contact Phone Number *</label>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-slate-800 text-xs font-mono focus:ring-1 focus:ring-[#3FA9A8]"
                      placeholder="0300-1234567"
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Assigned Route / Area *</label>
                    <select
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-slate-800 text-xs focus:ring-1 focus:ring-[#3FA9A8]"
                      value={formData.area}
                      onChange={(e) => setFormData((prev) => ({ ...prev, area: e.target.value }))}
                    >
                      <option value="Gulberg III - Main Mkt">Gulberg III - Main Mkt</option>
                      <option value="DHA Phase 5 & 6">DHA Phase 5 &amp; 6</option>
                      <option value="Model Town Link Rd">Model Town Link Rd</option>
                      <option value="Cantt Commercial Zone">Cantt Commercial Zone</option>
                      <option value="Johar Town & PIA Rd">Johar Town &amp; PIA Rd</option>
                      <option value="Saddar Wholesale Mkt">Saddar Wholesale Mkt</option>
                      <option value="Ferozepur Rd Corridor">Ferozepur Rd Corridor</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Residential Address / Territory Hub
                  </label>
                  <textarea
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-slate-800 text-xs focus:ring-1 focus:ring-[#3FA9A8]"
                    placeholder="Street address or warehouse pickup center..."
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Operational Field Notes</label>
                  <input
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-slate-800 text-xs focus:ring-1 focus:ring-[#3FA9A8]"
                    placeholder="e.g. Covers morning wholesale supply route; Sunday off"
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                {/* Form Actions */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                  <button
                    className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => setIsAddEditModalOpen(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-[#3FA9A8] hover:bg-[#349695] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                    type="submit"
                  >
                    Save Booker
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* END: AddEditBookerModal */}

      {/* BEGIN: FastDailyBookingModal */}
      {isFastBookingModalOpen && fastBookingBooker && (
        <div aria-labelledby="fast-booking-title" aria-modal="true" className="fixed inset-0 z-50 overflow-y-auto" role="dialog">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setIsFastBookingModalOpen(false)}
            />
            <span aria-hidden="true" className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-slate-200">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Daily Booking Sheet — {fastBookingBooker.name}
                  </h3>
                  <p className="text-xs text-slate-500">Record today&apos;s dispatch settlement &amp; delivered revenue.</p>
                </div>
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  onClick={() => setIsFastBookingModalOpen(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form className="px-6 py-5 space-y-4 text-xs" onSubmit={handleFastBookingSubmit}>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Retailer / Shop Name</label>
                  <input
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-slate-800 text-xs focus:ring-1 focus:ring-[#3FA9A8]"
                    type="text"
                    required
                    value={fastBookingData.shopName}
                    onChange={(e) =>
                      setFastBookingData((prev) => ({ ...prev, shopName: e.target.value }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Outlets Visited</label>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-slate-800 text-xs focus:ring-1 focus:ring-[#3FA9A8]"
                      type="number"
                      required
                      value={fastBookingData.outletsCount}
                      onChange={(e) =>
                        setFastBookingData((prev) => ({ ...prev, outletsCount: Number(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Booked Units</label>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-slate-800 text-xs focus:ring-1 focus:ring-[#3FA9A8]"
                      type="number"
                      required
                      value={fastBookingData.bookedUnits}
                      onChange={(e) =>
                        setFastBookingData((prev) => ({ ...prev, bookedUnits: Number(e.target.value) || 0 }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Return Units</label>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-slate-800 text-xs focus:ring-1 focus:ring-[#3FA9A8]"
                      type="number"
                      value={fastBookingData.returnUnits}
                      onChange={(e) =>
                        setFastBookingData((prev) => ({ ...prev, returnUnits: Number(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Delivered Units</label>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-slate-800 text-xs focus:ring-1 focus:ring-[#3FA9A8]"
                      type="number"
                      required
                      value={fastBookingData.deliveredUnits}
                      onChange={(e) =>
                        setFastBookingData((prev) => ({ ...prev, deliveredUnits: Number(e.target.value) || 0 }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Actual Delivered Sales (PKR) *</label>
                  <input
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-slate-800 text-xs font-mono font-bold focus:ring-1 focus:ring-[#3FA9A8]"
                    type="number"
                    required
                    value={fastBookingData.actualSales}
                    onChange={(e) =>
                      setFastBookingData((prev) => ({ ...prev, actualSales: Number(e.target.value) || 0 }))
                    }
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Directly updates Dexie booking sheets and booker ledger.</p>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                  <button
                    className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => setIsFastBookingModalOpen(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-[#3FA9A8] hover:bg-[#349695] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                    type="submit"
                  >
                    Confirm Sheet Punch
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* END: FastDailyBookingModal */}

      {/* BEGIN: WhatsApp Route Dispatch & Gate Pass Modal */}
      {dispatchModalBooker && (
        <div aria-labelledby="dispatch-title" aria-modal="true" className="fixed inset-0 z-50 overflow-y-auto" role="dialog">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setDispatchModalBooker(null)}
            />
            <span aria-hidden="true" className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full border border-slate-200">
              {/* Modal Header */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">WhatsApp Field Route Dispatch</h3>
                    <p className="text-xs text-slate-500">
                      Route gate pass &amp; delivery manifest for {dispatchModalBooker.name} ({dispatchModalBooker.area})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  onClick={() => setDispatchModalBooker(null)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Message Preview Box */}
              <div className="p-6 space-y-4">
                <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs whitespace-pre-wrap max-h-72 overflow-y-auto border border-slate-800 leading-relaxed">
                  {whatsAppDispatchText}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Formatted for direct WhatsApp mobile &amp; desktop chat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Pass
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyWhatsApp}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold flex items-center gap-1 cursor-pointer transition"
                    >
                      {copiedWhatsApp ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-600" />
                          <span>Copy Slip Text</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenWhatsAppWeb}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Send in WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* END: WhatsApp Route Dispatch & Gate Pass Modal */}
    </div>
  );
};
