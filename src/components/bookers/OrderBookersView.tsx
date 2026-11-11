import React, { useState, useMemo, useEffect } from 'react';
import type { OrderBooker, BookingRecord } from '../../types';

export const INITIAL_BOOKERS: OrderBooker[] = [
  {
    id: '#BKR-0101',
    name: 'Tariq Mehmood',
    avatarInitials: 'TM',
    avatarColor: 'bg-emerald-100 text-emerald-700',
    joinedDate: 'Joined 12 Jan 2023',
    phone: '+92 300 4821903',
    hasWhatsApp: true,
    area: 'Gulberg III - Main Mkt',
    areaKey: 'Gulberg',
    todayBookings: 28,
    todayUnits: 320,
    todaySales: 84200,
    status: 'Active',
    address: 'Block 4, Gulberg Commercial Hub, Lahore',
    notes: 'Handles major supermarket accounts in Gulberg; vehicle allocated.',
    totalBookingsSheets: 412,
    totalBookedUnits: 5240,
    totalDeliveredUnits: 4890,
    totalReturnedUnits: 350,
    totalActualSales: 1428500,
    rawGrossBookedValue: 1530000,
  },
  {
    id: '#BKR-0102',
    name: 'Muhammad Imran',
    avatarInitials: 'MI',
    avatarColor: 'bg-blue-100 text-blue-700',
    joinedDate: 'Joined 04 Feb 2023',
    phone: '+92 321 8452109',
    hasWhatsApp: true,
    area: 'DHA Phase 5 & 6',
    areaKey: 'DHA',
    todayBookings: 34,
    todayUnits: 415,
    todaySales: 112500,
    status: 'Active',
    address: 'Sector C, DHA Commercial, Lahore',
    notes: 'Primary route: DHA Phase 5 and Phase 6 commercial marts.',
    totalBookingsSheets: 468,
    totalBookedUnits: 6100,
    totalDeliveredUnits: 5850,
    totalReturnedUnits: 250,
    totalActualSales: 1845000,
    rawGrossBookedValue: 1920000,
  },
  {
    id: '#BKR-0103',
    name: 'Zeeshan Ali',
    avatarInitials: 'ZA',
    avatarColor: 'bg-purple-100 text-purple-700',
    joinedDate: 'Joined 28 Mar 2023',
    phone: '+92 333 4901234',
    hasWhatsApp: true,
    area: 'Cantt Commercial Zone',
    areaKey: 'Cantt',
    todayBookings: 22,
    todayUnits: 270,
    todaySales: 61400,
    status: 'Active',
    address: 'Saddar Bazaar Rd, Cantt, Lahore',
    notes: 'Covers retail general stores and cantonment markets.',
    totalBookingsSheets: 320,
    totalBookedUnits: 3950,
    totalDeliveredUnits: 3720,
    totalReturnedUnits: 230,
    totalActualSales: 980000,
    rawGrossBookedValue: 1040000,
  },
  {
    id: '#BKR-0104',
    name: 'Bilal Ahmed',
    avatarInitials: 'BA',
    avatarColor: 'bg-amber-100 text-amber-700',
    joinedDate: 'Joined 15 Jun 2023',
    phone: '+92 312 6789123',
    hasWhatsApp: true,
    area: 'Model Town Link Rd',
    areaKey: 'Model Town',
    todayBookings: 31,
    todayUnits: 390,
    todaySales: 78900,
    status: 'Active',
    address: 'Link Road Junction, Model Town, Lahore',
    notes: 'Fast delivery route across Link Road wholesale outlets.',
    totalBookingsSheets: 385,
    totalBookedUnits: 4780,
    totalDeliveredUnits: 4500,
    totalReturnedUnits: 280,
    totalActualSales: 1210000,
    rawGrossBookedValue: 1285000,
  },
  {
    id: '#BKR-0105',
    name: 'Kashif Raza',
    avatarInitials: 'KR',
    avatarColor: 'bg-rose-100 text-rose-700',
    joinedDate: 'Joined 01 Aug 2023',
    phone: '+92 304 9876543',
    hasWhatsApp: true,
    area: 'Johar Town & PIA Rd',
    areaKey: 'Johar Town',
    todayBookings: 27,
    todayUnits: 245,
    todaySales: 47650,
    status: 'Active',
    address: 'G1 Market, Johar Town, Lahore',
    notes: 'Johar Town and PIA Road restaurant and snack outlets.',
    totalBookingsSheets: 290,
    totalBookedUnits: 3320,
    totalDeliveredUnits: 3140,
    totalReturnedUnits: 180,
    totalActualSales: 890000,
    rawGrossBookedValue: 940000,
  },
  {
    id: '#BKR-0106',
    name: 'Naveed Sheikh',
    avatarInitials: 'NS',
    avatarColor: 'bg-slate-200 text-slate-700',
    joinedDate: 'Standby (Relief)',
    phone: '+92 301 5554321',
    hasWhatsApp: false,
    area: 'Saddar Wholesale Mkt',
    areaKey: 'Saddar',
    todayBookings: 0,
    todayUnits: 0,
    todaySales: 0,
    status: 'Inactive',
    statusNote: 'Standby duty',
    address: 'Old Anarkali / Saddar Wholesale Hub',
    notes: 'Relief driver & backup booker for peak seasons.',
    totalBookingsSheets: 140,
    totalBookedUnits: 1800,
    totalDeliveredUnits: 1710,
    totalReturnedUnits: 90,
    totalActualSales: 460000,
    rawGrossBookedValue: 485000,
  },
  {
    id: '#BKR-0107',
    name: 'Usman Farooq',
    avatarInitials: 'UF',
    avatarColor: 'bg-slate-200 text-slate-700',
    joinedDate: 'Medical Leave',
    phone: '+92 322 1122334',
    hasWhatsApp: false,
    area: 'Ferozepur Rd Corridor',
    areaKey: 'Ferozepur',
    todayBookings: 0,
    todayUnits: 0,
    todaySales: 0,
    status: 'Inactive',
    statusNote: 'On Leave',
    address: 'Near Chungi Amar Sidhu, Ferozepur Rd',
    notes: 'On medical leave until next week. Route temporarily reassigned.',
    totalBookingsSheets: 195,
    totalBookedUnits: 2450,
    totalDeliveredUnits: 2310,
    totalReturnedUnits: 140,
    totalActualSales: 620000,
    rawGrossBookedValue: 660000,
  },
];

const INITIAL_HISTORY: Record<string, BookingRecord[]> = {
  '#BKR-0101': [
    {
      id: '#BKG-2024-1082',
      bookerId: '#BKR-0101',
      dateStr: 'Today, 24 Oct',
      outletsCount: 18,
      bookedUnits: 320,
      returnUnits: 12,
      deliveredUnits: 308,
      actualSales: 84200,
      status: 'Reconciled',
    },
    {
      id: '#BKG-2024-1065',
      bookerId: '#BKR-0101',
      dateStr: '23 Oct 2024',
      outletsCount: 22,
      bookedUnits: 380,
      returnUnits: 25,
      deliveredUnits: 355,
      actualSales: 97600,
      status: 'Reconciled',
    },
    {
      id: '#BKG-2024-1049',
      bookerId: '#BKR-0101',
      dateStr: '22 Oct 2024',
      outletsCount: 16,
      bookedUnits: 290,
      returnUnits: 18,
      deliveredUnits: 272,
      actualSales: 72450,
      status: 'Reconciled',
    },
  ],
};

export const OrderBookersView: React.FC = () => {
  // Main State
  const [bookers, setBookers] = useState<OrderBooker[]>(INITIAL_BOOKERS);
  const [bookingHistory, setBookingHistory] = useState<Record<string, BookingRecord[]>>(INITIAL_HISTORY);
  const [searchQuery, setSearchQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('today');
  const [selectedBookerIds, setSelectedBookerIds] = useState<string[]>([]);
  const [activeDemoMode, setActiveDemoMode] = useState<string>('all');

  // Drawer & Modal State
  const [selectedBookerForProfile, setSelectedBookerForProfile] = useState<OrderBooker | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingBooker, setEditingBooker] = useState<OrderBooker | null>(null);
  const [isFastBookingModalOpen, setIsFastBookingModalOpen] = useState(false);
  const [fastBookingBooker, setFastBookingBooker] = useState<OrderBooker | null>(null);

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
    outletsCount: 18,
    bookedUnits: 300,
    returnUnits: 10,
    deliveredUnits: 290,
    actualSales: 75000,
    notes: '',
  });

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Keyboard listener for Escape & F2
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDrawerOpen(false);
        setIsAddEditModalOpen(false);
        setIsFastBookingModalOpen(false);
      }
      if (e.key === 'F2') {
        e.preventDefault();
        const target = selectedBookerForProfile || bookers[0];
        if (target) {
          openFastBooking(target);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBookerForProfile, bookers]);

  // Filtered Bookers
  const filteredBookers = useMemo(() => {
    if (activeDemoMode === 'empty') return [];

    return bookers.filter((booker) => {
      // Status filter
      if (statusFilter === 'active' && booker.status !== 'Active') return false;
      if (statusFilter === 'inactive' && booker.status !== 'Inactive') return false;

      // Area filter
      if (areaFilter !== 'all') {
        const areaMatch =
          booker.area.toLowerCase().includes(areaFilter.toLowerCase()) ||
          booker.areaKey.toLowerCase().includes(areaFilter.toLowerCase());
        if (!areaMatch) return false;
      }

      // Search query
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
  }, [bookers, searchQuery, areaFilter, statusFilter, activeDemoMode]);

  // Aggregate KPI Calculations
  const totalBookersCount = 18; // Fixed registry capacity in template
  const activeBookersCount = bookers.filter((b) => b.status === 'Active').length;
  const inactiveBookersCount = bookers.filter((b) => b.status === 'Inactive').length;
  const totalSheetsBooked = 142; // Matching template
  const totalBookedUnits = 1840; // Matching template
  const totalDeliveredSales = 384650; // Rs. 384,650 from template

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
    setActiveDemoMode('all');
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
    const nextIdNum = bookers.length + 101;
    setFormData({
      id: `#BKR-0${nextIdNum}`,
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
      address: booker.address || 'Block 4, Industrial Area Hub',
      notes: booker.notes || 'Morning delivery vehicle allocated',
    });
    setIsAddEditModalOpen(true);
  };

  // Handle Add/Edit Save
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      showToast('Please fill in Name and Phone Number');
      return;
    }

    if (editingBooker) {
      // Update existing
      setBookers((prev) =>
        prev.map((b) => {
          if (b.id === editingBooker.id) {
            return {
              ...b,
              name: formData.name,
              phone: formData.phone,
              status: formData.status,
              area: formData.area,
              address: formData.address,
              notes: formData.notes,
            };
          }
          return b;
        })
      );
      if (selectedBookerForProfile?.id === editingBooker.id) {
        setSelectedBookerForProfile((prev) =>
          prev
            ? {
                ...prev,
                name: formData.name,
                phone: formData.phone,
                status: formData.status,
                area: formData.area,
                address: formData.address,
                notes: formData.notes,
              }
            : null
        );
      }
      showToast(`Order Booker "${formData.name}" updated successfully!`);
    } else {
      // Create new
      const initials = formData.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      const newBooker: OrderBooker = {
        id: formData.id,
        name: formData.name,
        avatarInitials: initials || 'OB',
        avatarColor: 'bg-teal-100 text-teal-700',
        joinedDate: 'Joined Today',
        phone: formData.phone,
        hasWhatsApp: true,
        area: formData.area,
        areaKey: formData.area.split(' ')[0] || 'Zone',
        todayBookings: 0,
        todayUnits: 0,
        todaySales: 0,
        status: formData.status,
        address: formData.address,
        notes: formData.notes,
        totalBookingsSheets: 0,
        totalBookedUnits: 0,
        totalDeliveredUnits: 0,
        totalReturnedUnits: 0,
        totalActualSales: 0,
        rawGrossBookedValue: 0,
      };

      setBookers((prev) => [newBooker, ...prev]);
      showToast(`Order Booker "${formData.name}" successfully saved into SQLite local storage!`);
    }

    setIsAddEditModalOpen(false);
  };

  // Open Fast Booking Modal
  const openFastBooking = (booker: OrderBooker) => {
    setFastBookingBooker(booker);
    setFastBookingData({
      outletsCount: 18,
      bookedUnits: 320,
      returnUnits: 12,
      deliveredUnits: 308,
      actualSales: 84200,
      notes: 'Evening dispatch sheet punch',
    });
    setIsFastBookingModalOpen(true);
  };

  // Handle Fast Booking Save
  const handleFastBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fastBookingBooker) return;

    const newRecord: BookingRecord = {
      id: `#BKG-2024-${Math.floor(1000 + Math.random() * 9000)}`,
      bookerId: fastBookingBooker.id,
      dateStr: 'Today, Just now',
      outletsCount: fastBookingData.outletsCount,
      bookedUnits: fastBookingData.bookedUnits,
      returnUnits: fastBookingData.returnUnits,
      deliveredUnits: fastBookingData.deliveredUnits,
      actualSales: fastBookingData.actualSales,
      status: 'Reconciled',
    };

    setBookingHistory((prev) => ({
      ...prev,
      [fastBookingBooker.id]: [newRecord, ...(prev[fastBookingBooker.id] || [])],
    }));

    // Update booker today counters
    setBookers((prev) =>
      prev.map((b) => {
        if (b.id === fastBookingBooker.id) {
          return {
            ...b,
            todayBookings: b.todayBookings + 1,
            todayUnits: b.todayUnits + fastBookingData.deliveredUnits,
            todaySales: b.todaySales + fastBookingData.actualSales,
            totalBookingsSheets: (b.totalBookingsSheets || 0) + 1,
            totalBookedUnits: (b.totalBookedUnits || 0) + fastBookingData.bookedUnits,
            totalDeliveredUnits: (b.totalDeliveredUnits || 0) + fastBookingData.deliveredUnits,
            totalReturnedUnits: (b.totalReturnedUnits || 0) + fastBookingData.returnUnits,
            totalActualSales: (b.totalActualSales || 0) + fastBookingData.actualSales,
          };
        }
        return b;
      })
    );

    showToast(`Rapid booking sheet punch recorded for ${fastBookingBooker.name}!`);
    setIsFastBookingModalOpen(false);
  };

  // Reactivate Inactive Booker
  const handleReactivate = (booker: OrderBooker) => {
    setBookers((prev) =>
      prev.map((b) => (b.id === booker.id ? { ...b, status: 'Active' as const } : b))
    );
    showToast(`Order booker ${booker.name} has been reassigned to active routes.`);
  };

  // Switcher Controller
  const handleDemoSwitch = (mode: string) => {
    setActiveDemoMode(mode);
    setIsDrawerOpen(false);
    setIsAddEditModalOpen(false);
    setIsFastBookingModalOpen(false);

    if (mode === 'all') {
      handleResetFilters();
    } else if (mode === 'profile') {
      const tariq = bookers.find((b) => b.id === '#BKR-0101') || bookers[0];
      if (tariq) openProfile(tariq);
    } else if (mode === 'add') {
      openAddModal();
    } else if (mode === 'edit') {
      const tariq = bookers.find((b) => b.id === '#BKR-0101') || bookers[0];
      if (tariq) openEditModal(tariq);
    } else if (mode === 'inactive') {
      setStatusFilter('inactive');
      setAreaFilter('all');
      setSearchQuery('');
    } else if (mode === 'empty') {
      // handled by filteredBookers returning []
    }
  };

  // History list for selected booker in drawer
  const activeHistoryList = selectedBookerForProfile
    ? bookingHistory[selectedBookerForProfile.id] || INITIAL_HISTORY['#BKR-0101'] || []
    : [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4F7F9] select-none text-slate-800 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 border border-slate-700 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-[#3FA9A8]"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* BEGIN: InteractiveModeSwitcher */}
      <div
        className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex items-center justify-between border-b border-slate-800 z-30 shrink-0"
        data-purpose="demo-mode-switcher"
      >
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-medium text-slate-200">Interactive Demo Switcher:</span>
        </div>
        <div className="flex items-center space-x-1 overflow-x-auto">
          <button
            onClick={() => handleDemoSwitch('all')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeDemoMode === 'all'
                ? 'bg-[#2B9695] text-white font-medium'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            1. All Bookers Table
          </button>
          <button
            onClick={() => handleDemoSwitch('profile')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeDemoMode === 'profile'
                ? 'bg-[#2B9695] text-white font-medium'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            2. Booker Profile (Tariq M.)
          </button>
          <button
            onClick={() => handleDemoSwitch('add')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeDemoMode === 'add'
                ? 'bg-[#2B9695] text-white font-medium'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            3. Add New Booker Form
          </button>
          <button
            onClick={() => handleDemoSwitch('edit')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeDemoMode === 'edit'
                ? 'bg-[#2B9695] text-white font-medium'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            4. Edit Booker
          </button>
          <button
            onClick={() => handleDemoSwitch('inactive')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeDemoMode === 'inactive'
                ? 'bg-[#2B9695] text-white font-medium'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            5. Inactive Filter
          </button>
          <button
            onClick={() => handleDemoSwitch('empty')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeDemoMode === 'empty'
                ? 'bg-[#2B9695] text-white font-medium'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            6. Empty State
          </button>
        </div>
        <div className="text-[11px] text-slate-400 hidden lg:block">DinePos Desktop Suite v4.2.1</div>
      </div>
      {/* END: InteractiveModeSwitcher */}

      {/* BEGIN: ScrollablePageContent */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* BEGIN: PageHeaderSection */}
        <div
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          data-purpose="page-header"
        >
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Order Bookers</h2>
              <span className="px-2 py-0.5 text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 rounded-md">
                Field Operations
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage your order bookers, assigned areas, daily bookings, and sales performance.
            </p>
          </div>
          {/* Primary Actions */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => {
                showToast('Exporting Booker Registry to CSV...');
              }}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <span>Export Registry</span>
            </button>
            <button
              onClick={openAddModal}
              className="px-4 py-2 text-xs font-semibold bg-[#2B9695] hover:bg-[#237877] text-white rounded-lg shadow-sm flex items-center space-x-2 transition cursor-pointer"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
              </svg>
              <span>+ Add New Booker</span>
            </button>
          </div>
        </div>
        {/* END: PageHeaderSection */}

        {/* BEGIN: SummaryKPISection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" data-purpose="kpi-metric-cards">
          {/* Card 1: Total Bookers */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Total Bookers</span>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold text-slate-800">{totalBookersCount}</h3>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center">
                <span className="font-medium text-slate-700 mr-1">Across 5</span> operational zones
              </p>
            </div>
          </div>

          {/* Card 2: Active */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                ● 77.8% on duty
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold text-slate-800">
                {activeBookersCount > 0 ? `${activeBookersCount} Active` : '14 Active'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Active in field routes today</p>
            </div>
          </div>

          {/* Card 3: Inactive */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                Standby / Leave
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold text-slate-800">
                {inactiveBookersCount > 0 ? `${inactiveBookersCount} Inactive` : '4 Inactive'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Available for route assignment</p>
            </div>
          </div>

          {/* Card 4: Sheets Booked */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center">
                <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 10l7-7m0 0l7 7m-7-7v18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                +12%
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold text-slate-800">{totalSheetsBooked} Sheets</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                <span className="font-semibold text-slate-700">{totalBookedUnits.toLocaleString()} units</span> booked
                today
              </p>
            </div>
          </div>

          {/* Card 5: Delivered Sales */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <span className="text-sm font-bold">Rs</span>
              </div>
              <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                PKR Delivered
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold text-slate-900">Rs. {totalDeliveredSales.toLocaleString()}</h3>
              <p className="text-[11px] text-slate-500 mt-1">Delivered &amp; Reconciled today</p>
            </div>
          </div>
        </div>
        {/* END: SummaryKPISection */}

        {/* BEGIN: FilterToolbar */}
        <div
          className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3"
          data-purpose="table-filter-bar"
        >
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <input
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3FA9A8]"
                placeholder="Search booker name, ID (e.g. BKR-01)..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Area Filter Dropdown */}
            <div className="relative">
              <select
                className="text-xs py-1.5 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3FA9A8]"
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
                className="text-xs py-1.5 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3FA9A8]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Status: All</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            <button
              onClick={handleResetFilters}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded hover:bg-slate-100 transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>

          {/* Date / Time quick presets (Today, This Week, This Month) */}
          <div className="flex items-center space-x-1 border border-slate-200 p-0.5 rounded-lg bg-slate-50 text-xs">
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1 font-medium rounded-md shadow-xs transition ${
                timeFilter === 'today'
                  ? 'bg-[#2B9695] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-3 py-1 font-medium rounded-md transition ${
                timeFilter === 'week'
                  ? 'bg-[#2B9695] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-3 py-1 font-medium rounded-md transition ${
                timeFilter === 'month'
                  ? 'bg-[#2B9695] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
          </div>
        </div>
        {/* END: FilterToolbar */}

        {/* BEGIN: BookersTableCard */}
        <div
          className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col"
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
                    <th className="py-3 px-4">Assigned Area</th>
                    <th className="py-3 px-4 text-right">Today's Bookings</th>
                    <th className="py-3 px-4 text-right">Today's Sales (PKR)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
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
                          <div
                            className={`flex items-center space-x-2.5 ${
                              isInactive ? 'opacity-80' : ''
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${booker.avatarColor}`}
                            >
                              {booker.avatarInitials}
                            </div>
                            <div>
                              <div
                                className={`font-semibold transition-colors ${
                                  isInactive
                                    ? 'text-slate-700 group-hover:text-[#2B9695]'
                                    : 'text-slate-900 group-hover:text-[#2B9695]'
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
                              <span className="text-emerald-500 text-[10px]" title="WhatsApp verified">
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
                            Rs. {booker.todaySales.toLocaleString()}
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
                            <button
                              onClick={() => openProfile(booker)}
                              className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition cursor-pointer"
                            >
                              View
                            </button>
                            {isInactive ? (
                              <button
                                onClick={() => handleReactivate(booker)}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded transition cursor-pointer"
                              >
                                Activate
                              </button>
                            ) : (
                              <button
                                onClick={() => openFastBooking(booker)}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded transition cursor-pointer"
                              >
                                + Booking
                              </button>
                            )}
                            <button
                              onClick={() => openEditModal(booker)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                              title="Edit Booker"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                />
                              </svg>
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-slate-800">No order bookers found</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                We couldn't find any registered bookers matching your active filter criteria or search query.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-4 px-3.5 py-1.5 text-xs font-semibold bg-[#2B9695] text-white rounded-lg hover:bg-[#237877] transition cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Table Footer Pagination Controls */}
          {filteredBookers.length > 0 && (
            <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing <span className="font-semibold text-slate-700">1</span> to{' '}
                <span className="font-semibold text-slate-700">{filteredBookers.length}</span> of{' '}
                <span className="font-semibold text-slate-700">{totalBookersCount}</span> registered order bookers
              </div>
              <div className="flex items-center space-x-1">
                <button className="px-2.5 py-1 border border-slate-200 rounded text-slate-400 cursor-not-allowed bg-white">
                  Previous
                </button>
                <button className="px-2.5 py-1 bg-[#2B9695] text-white font-medium rounded shadow-xs">1</button>
                <button className="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-100 bg-white">
                  2
                </button>
                <button className="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-100 bg-white">
                  3
                </button>
                <button className="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-100 bg-white">
                  Next
                </button>
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
                    onClick={() => {
                      showToast(`Printing reconciliation dispatch sheet for ${selectedBookerForProfile.name}`);
                    }}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                    title="Print Sheet"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Drawer Quick Actions Bar */}
              <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
                <div className="text-slate-600 font-medium">Field Performance &amp; Route Audit Log</div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openFastBooking(selectedBookerForProfile)}
                    className="px-3 py-1.5 bg-[#2B9695] hover:bg-[#237877] text-white font-semibold rounded-md shadow-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <span>+ Add Daily Booking (F2)</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      openEditModal(selectedBookerForProfile);
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium rounded-md cursor-pointer"
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
                    Cumulative Performance Record
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-medium">Total Bookings</span>
                      <span className="text-lg font-bold text-slate-800">
                        {selectedBookerForProfile.totalBookingsSheets || 412} Sheets
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-medium">Booked Quantity</span>
                      <span className="text-lg font-bold text-slate-800">
                        {(selectedBookerForProfile.totalBookedUnits || 5240).toLocaleString()} Units
                      </span>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-emerald-700 block font-bold">Delivered Quantity</span>
                      <span className="text-lg font-bold text-emerald-800">
                        {(selectedBookerForProfile.totalDeliveredUnits || 4890).toLocaleString()} Units
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium">93.3% Fulfillment</span>
                    </div>
                    <div className="bg-rose-50 p-3 rounded-lg border border-rose-200">
                      <span className="text-[10px] text-rose-700 block font-bold">Returned Quantity</span>
                      <span className="text-lg font-bold text-rose-800">
                        {(selectedBookerForProfile.totalReturnedUnits || 350).toLocaleString()} Units
                      </span>
                      <span className="text-[10px] text-rose-600 font-medium">6.7% Return Rate</span>
                    </div>
                    <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                      <span className="text-[10px] text-teal-800 block font-bold">Actual Sales (PKR)</span>
                      <span className="text-lg font-bold text-teal-900">
                        Rs. {(selectedBookerForProfile.totalActualSales || 1428500).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-teal-700">Strictly verified post-delivery</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-medium">Raw Gross Booked Value</span>
                      <span className="text-lg font-bold text-slate-700">
                        Rs. {(selectedBookerForProfile.rawGrossBookedValue || 1530000).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400">Pre-reconciliation tally</span>
                    </div>
                  </div>
                </div>

                {/* Business Rule Alert / Banner */}
                <div className="p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-md text-xs text-amber-800 flex items-start space-x-2">
                  <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <p>
                    <strong>Accounting Rule:</strong> Sales figures are strictly calculated upon verified delivered
                    quantities from the evening reconciliation sheet. Booked quantities do not auto-accrue revenue.
                  </p>
                </div>

                {/* Activity History Table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Booking History &amp; Dispatch Settlements
                    </h4>
                    <div className="flex items-center space-x-1 text-xs">
                      <span className="text-slate-400">Range:</span>
                      <span className="font-semibold text-slate-700">This Month</span>
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Date &amp; Ref</th>
                          <th className="p-2.5 text-center">Outlets</th>
                          <th className="p-2.5 text-right">Booked</th>
                          <th className="p-2.5 text-right">Returns</th>
                          <th className="p-2.5 text-right">Delivered</th>
                          <th className="p-2.5 text-right">Actual Sales</th>
                          <th className="p-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeHistoryList.map((hist) => (
                          <tr key={hist.id}>
                            <td className="p-2.5">
                              <div className="font-medium text-slate-800">{hist.dateStr}</div>
                              <div className="text-[10px] font-mono text-teal-700">{hist.id}</div>
                            </td>
                            <td className="p-2.5 text-center font-medium">{hist.outletsCount} Shops</td>
                            <td className="p-2.5 text-right font-medium">{hist.bookedUnits}</td>
                            <td className="p-2.5 text-right text-rose-600 font-medium">{hist.returnUnits}</td>
                            <td className="p-2.5 text-right font-bold text-emerald-700">{hist.deliveredUnits}</td>
                            <td className="p-2.5 text-right font-bold text-slate-900">
                              Rs. {hist.actualSales.toLocaleString()}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                {hist.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white cursor-pointer"
                >
                  Close Panel
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => showToast(`Generating export PDF report for ${selectedBookerForProfile.name}...`)}
                    className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Export History PDF
                  </button>
                  <button
                    onClick={() => openFastBooking(selectedBookerForProfile)}
                    className="px-4 py-2 bg-[#2B9695] hover:bg-[#237877] text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
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
        <div
          aria-labelledby="modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto"
          role="dialog"
        >
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setIsAddEditModalOpen(false)}
            />
            <span aria-hidden="true" className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-slate-200">
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
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  onClick={() => setIsAddEditModalOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
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
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => setIsAddEditModalOpen(false)}
                    type="button"
                  >
                    Cancel (Esc)
                  </button>
                  <button
                    className="px-4 py-2 bg-[#2B9695] hover:bg-[#237877] text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
                    type="submit"
                  >
                    Save Booker (Ctrl+S)
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
        <div
          aria-labelledby="fast-booking-title"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto"
          role="dialog"
        >
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setIsFastBookingModalOpen(false)}
            />
            <span aria-hidden="true" className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-slate-200">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Daily Booking Sheet — {fastBookingBooker.name}
                  </h3>
                  <p className="text-xs text-slate-500">Record today's dispatch settlement &amp; delivered revenue.</p>
                </div>
                <button
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  onClick={() => setIsFastBookingModalOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </button>
              </div>

              <form className="px-6 py-5 space-y-4 text-xs" onSubmit={handleFastBookingSubmit}>
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
                  <p className="text-[10px] text-slate-400 mt-1">Reconciled upon physical inventory count.</p>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                  <button
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => setIsFastBookingModalOpen(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-[#2B9695] hover:bg-[#237877] text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
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
    </div>
  );
};

