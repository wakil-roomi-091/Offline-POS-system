import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  MapPin, 
  User, 
  CheckCircle2, 
  Clock, 
  Truck, 
  AlertCircle, 
  X, 
  Eye, 
  Printer, 
  Trash2, 
  Copy, 
  Check,
  Store,
  Layers
} from 'lucide-react';
import { db, INITIAL_PRODUCTS } from '../../db';
import type { OrderBookingSheet, BookingSheetItem, OrderBooker } from '../../types';

const EMPTY_BOOKING_SHEETS: OrderBookingSheet[] = [];
const EMPTY_BOOKERS: OrderBooker[] = [];

export const OrderBookingView: React.FC = () => {
  // Live records from Dexie DB
  const liveSheets = useLiveQuery(() => db.bookingSheets.toArray(), []) ?? EMPTY_BOOKING_SHEETS;
  const liveBookers = useLiveQuery(() => db.bookers.toArray(), []) ?? EMPTY_BOOKERS;

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedBooker, setSelectedBooker] = useState<string>('all');

  // Modal states
  const [viewSheet, setViewSheet] = useState<OrderBookingSheet | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [copiedSlipId, setCopiedSlipId] = useState<string | null>(null);

  // New Sheet Form state
  const [newSlipNo, setNewSlipNo] = useState(() => `#TK-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newBookerId, setNewBookerId] = useState('');
  const [newShopName, setNewShopName] = useState('');
  const [newShopAddress, setNewShopAddress] = useState('');
  const [newAreaZone, setNewAreaZone] = useState('Gulberg III (Main Mkt)');
  const [newTargetDispatch, setNewTargetDispatch] = useState('Tomorrow, 10:00 AM');
  const [newManagerNotes, setNewManagerNotes] = useState('');
  const [newStatus, setNewStatus] = useState<OrderBookingSheet['status']>('Recorded');
  
  // Item line builder for new sheet
  const [lineItems, setLineItems] = useState<BookingSheetItem[]>([
    {
      id: 'line-1',
      name: 'Chicken Biryani (Special)',
      variation: 'Single / Half',
      unitPrice: 450,
      qty: 10,
      total: 4500,
    }
  ]);

  const [selectedProductIdx, setSelectedProductIdx] = useState(0);
  const [selectedVariationIdx, setSelectedVariationIdx] = useState(0);
  const [lineQty, setLineQty] = useState(5);

  // Distinct Zones
  const allZones = useMemo(() => {
    const zones = new Set<string>();
    liveSheets.forEach(s => {
      if (s.bookerZone) zones.add(s.bookerZone);
    });
    return Array.from(zones);
  }, [liveSheets]);

  // Filtered Sheets
  const filteredSheets = useMemo(() => {
    return liveSheets.filter(sheet => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        sheet.id.toLowerCase().includes(q) ||
        sheet.physicalSlipNo.toLowerCase().includes(q) ||
        sheet.shopName.toLowerCase().includes(q) ||
        sheet.bookerName.toLowerCase().includes(q) ||
        sheet.areaZone.toLowerCase().includes(q);

      const matchesStatus = selectedStatus === 'all' || sheet.status === selectedStatus;
      const matchesZone = selectedZone === 'all' || sheet.bookerZone === selectedZone;
      const matchesBooker = selectedBooker === 'all' || sheet.bookerId === selectedBooker;

      return matchesSearch && matchesStatus && matchesZone && matchesBooker;
    });
  }, [liveSheets, searchQuery, selectedStatus, selectedZone, selectedBooker]);

  // Metric Computations
  const totalBookedValue = useMemo(() => {
    return liveSheets.reduce((sum, s) => sum + (s.bookingValue || 0), 0);
  }, [liveSheets]);

  const totalUnitsBooked = useMemo(() => {
    return liveSheets.reduce((sum, s) => sum + (s.totalQty || 0), 0);
  }, [liveSheets]);

  const completedCount = useMemo(() => {
    return liveSheets.filter(s => s.status === 'Completed').length;
  }, [liveSheets]);

  const pendingCount = useMemo(() => {
    return liveSheets.filter(s => s.status === 'Recorded' || s.status === 'Partially Delivered').length;
  }, [liveSheets]);

  // Status badge styling helper
  const getStatusBadge = (status: OrderBookingSheet['status']) => {
    switch (status) {
      case 'Recorded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3 h-3 text-sky-500" />
            Recorded
          </span>
        );
      case 'Partially Delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Truck className="w-3 h-3 text-amber-500" />
            Partially Delivered
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Completed
          </span>
        );
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <AlertCircle className="w-3 h-3 text-slate-400" />
            Draft
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <X className="w-3 h-3 text-rose-500" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  // Copy slip number
  const handleCopySlip = (slip: string) => {
    navigator.clipboard?.writeText(slip);
    setCopiedSlipId(slip);
    setTimeout(() => setCopiedSlipId(null), 2000);
  };

  // Change status of a sheet
  const handleUpdateStatus = async (id: string, status: OrderBookingSheet['status']) => {
    try {
      await db.bookingSheets.update(id, { status });
      if (viewSheet && viewSheet.id === id) {
        setViewSheet(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      console.error('Failed to update booking sheet status', err);
    }
  };

  // Delete sheet
  const handleDeleteSheet = async (id: string) => {
    if (confirm('Are you sure you want to delete this booking sheet?')) {
      try {
        await db.bookingSheets.delete(id);
        if (viewSheet?.id === id) setViewSheet(null);
      } catch (err) {
        console.error('Failed to delete booking sheet', err);
      }
    }
  };

  // Add line item to form
  const handleAddLineItem = () => {
    const product = INITIAL_PRODUCTS[selectedProductIdx];
    if (!product) return;

    let variationName = 'Standard';
    let unitPrice = product.price;

    if (product.variations && product.variations[selectedVariationIdx]) {
      variationName = product.variations[selectedVariationIdx].name;
      unitPrice = product.variations[selectedVariationIdx].price;
    }

    const newItem: BookingSheetItem = {
      id: `line-${Date.now()}`,
      name: product.name,
      variation: variationName,
      unitPrice,
      qty: lineQty,
      total: unitPrice * lineQty,
    };

    setLineItems(prev => [...prev, newItem]);
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems(prev => prev.filter(i => i.id !== id));
  };

  // Save new booking sheet
  const handleSaveNewSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim()) {
      alert('Please enter a shop / outlet name');
      return;
    }
    if (lineItems.length === 0) {
      alert('Please add at least one item to the booking sheet');
      return;
    }

    const booker = liveBookers.find(b => b.id === newBookerId) || liveBookers[0];
    const totalQty = lineItems.reduce((sum, item) => sum + item.qty, 0);
    const bookingValue = lineItems.reduce((sum, item) => sum + item.total, 0);

    const sheetId = `#BKG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRecord: OrderBookingSheet = {
      id: sheetId,
      physicalSlipNo: newSlipNo || `#TK-${Math.floor(1000 + Math.random() * 9000)}`,
      dateTime: 'Just now',
      bookerName: booker ? booker.name : 'Unknown Booker',
      bookerId: booker ? booker.id : '#BKR-0000',
      bookerZone: booker ? `${booker.areaKey} Zone` : 'Central Zone',
      shopName: newShopName.trim(),
      shopAddress: newShopAddress.trim() || 'Commercial Market, Lahore',
      areaZone: newAreaZone,
      itemsCount: lineItems.length,
      skusCount: lineItems.length,
      totalQty,
      bookingValue,
      status: newStatus,
      targetDispatchTime: newTargetDispatch,
      managerNotes: newManagerNotes.trim(),
      items: lineItems,
    };

    try {
      await db.bookingSheets.add(newRecord);
      if (booker) {
        await db.bookers.update(booker.id, {
          todayBookings: (booker.todayBookings || 0) + 1,
          todayUnits: (booker.todayUnits || 0) + totalQty,
          todaySales: (booker.todaySales || 0) + bookingValue,
          totalBookingsSheets: (booker.totalBookingsSheets || 0) + 1,
          totalBookedUnits: (booker.totalBookedUnits || 0) + totalQty,
          totalDeliveredUnits: (booker.totalDeliveredUnits || 0) + totalQty,
          totalActualSales: (booker.totalActualSales || 0) + bookingValue,
        });
      }
      setIsNewModalOpen(false);
      // Reset form
      setNewShopName('');
      setNewShopAddress('');
      setNewManagerNotes('');
      setNewSlipNo(`#TK-${Math.floor(1000 + Math.random() * 9000)}`);
      setLineItems([
        {
          id: 'line-1',
          name: 'Chicken Biryani (Special)',
          variation: 'Single / Half',
          unitPrice: 450,
          qty: 10,
          total: 4500,
        }
      ]);
    } catch (err) {
      console.error('Failed to create booking sheet', err);
      alert('Error saving booking sheet. Please try again.');
    }
  };

  return (
    <div className="flex flex-col gap-6 select-none font-sans" data-purpose="order-booking-sheets-view">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Order Booking Sheets</h1>
            <span className="bg-teal-50 text-[#3FA9A8] border border-teal-200 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3FA9A8] animate-pulse"></span>
              {liveSheets.length} Active Sheets • Central Dispatch
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Wholesale order booking slips recorded by field order bookers across city market zones.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#3FA9A8] hover:bg-[#349695] text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-[0.99] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Record Booking Sheet
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Booked Value</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#3FA9A8] flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            Rs {totalBookedValue.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Recorded from all city zones</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Booked Units</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {totalUnitsBooked.toLocaleString()} Units
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Cumulative dish / packet count</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Completed & Dispatched</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {completedCount} Sheets
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Full cash & delivery settled</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Dispatch</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {pendingCount} Sheets
          </div>
          <span className="text-[11px] text-amber-600 font-medium">Awaiting kitchen packing / van loading</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search slip #, sheet ID, outlet, booker..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] focus:border-[#3FA9A8] placeholder:text-slate-400 text-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Recorded">Recorded</option>
            <option value="Partially Delivered">Partially Delivered</option>
            <option value="Completed">Completed</option>
            <option value="Draft">Draft</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Zone Filter */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] cursor-pointer"
          >
            <option value="all">All Zones</option>
            {allZones.map(zone => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>

          {/* Booker Filter */}
          <select
            value={selectedBooker}
            onChange={(e) => setSelectedBooker(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] cursor-pointer"
          >
            <option value="all">All Bookers</option>
            {liveBookers.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{filteredSheets.length}</span> of {liveSheets.length} sheets
        </div>
      </div>

      {/* Main Booking Sheets Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {filteredSheets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Slip / Sheet ID</th>
                  <th className="py-3 px-4">Outlet / Shop Name</th>
                  <th className="py-3 px-4">Order Booker</th>
                  <th className="py-3 px-4 text-center">Items / Units</th>
                  <th className="py-3 px-4 text-right">Booking Value</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSheets.map((sheet) => (
                  <tr 
                    key={sheet.id}
                    className="hover:bg-teal-50/30 transition-colors group cursor-pointer"
                    onClick={() => setViewSheet(sheet)}
                  >
                    {/* Sheet ID & Physical Slip # */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 font-mono">
                          <span>{sheet.physicalSlipNo}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopySlip(sheet.physicalSlipNo);
                            }}
                            className="text-slate-400 hover:text-slate-700 transition"
                            title="Copy physical slip number"
                          >
                            {copiedSlipId === sheet.physicalSlipNo ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">{sheet.id}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{sheet.dateTime}</span>
                      </div>
                    </td>

                    {/* Outlet / Shop */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5 max-w-[200px]">
                        <span className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {sheet.shopName}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate">{sheet.shopAddress}</span>
                        <span className="text-[10px] text-slate-400 inline-flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-slate-400" />
                          {sheet.areaZone}
                        </span>
                      </div>
                    </td>

                    {/* Booker */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {sheet.bookerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{sheet.bookerName}</span>
                          <span className="text-[10px] text-slate-400">{sheet.bookerZone}</span>
                        </div>
                      </div>
                    </td>

                    {/* Items / Units */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-bold text-slate-800 text-xs">{sheet.totalQty} Units</span>
                        <span className="text-[10px] text-slate-400">{sheet.itemsCount} SKUs</span>
                      </div>
                    </td>

                    {/* Booking Value */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-slate-900 text-sm">
                          Rs {sheet.bookingValue.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400">Gross Value</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(sheet.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setViewSheet(sheet)}
                          className="p-1.5 text-slate-500 hover:text-[#3FA9A8] hover:bg-teal-50 rounded-lg transition"
                          title="View sheet details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = sheet.status === 'Recorded' 
                              ? 'Partially Delivered' 
                              : sheet.status === 'Partially Delivered' 
                              ? 'Completed' 
                              : 'Recorded';
                            handleUpdateStatus(sheet.id, next);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Cycle delivery status"
                        >
                          <Truck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSheet(sheet.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete sheet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No booking sheets found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              No orders matched your active filters or search criteria. Try adjusting your query or create a new booking sheet.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
                setSelectedZone('all');
                setSelectedBooker('all');
              }}
              className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* MODAL 1: Detail Sheet Inspection Drawer / Modal */}
      {viewSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-teal-50 text-[#3FA9A8] flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 font-mono">
                      Slip {viewSheet.physicalSlipNo}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">({viewSheet.id})</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Recorded: {viewSheet.dateTime}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(viewSheet.status)}
                <button
                  onClick={() => setViewSheet(null)}
                  className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Info Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Shop / Customer details */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Retailer / Outlet Info
                  </span>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-[#3FA9A8]" />
                    {viewSheet.shopName}
                  </div>
                  <div className="text-xs text-slate-600 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span>{viewSheet.shopAddress}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Zone: <span className="font-semibold text-slate-700">{viewSheet.areaZone}</span>
                  </div>
                </div>

                {/* Booker details */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Order Booker & Dispatch
                  </span>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#3FA9A8]" />
                    {viewSheet.bookerName}
                  </div>
                  <div className="text-xs text-slate-600">
                    Route Zone: <span className="font-semibold text-slate-700">{viewSheet.bookerZone}</span>
                  </div>
                  {viewSheet.targetDispatchTime && (
                    <div className="text-xs text-amber-700 flex items-center gap-1 mt-1 font-medium">
                      <Truck className="w-3 h-3 text-amber-600" />
                      Dispatch: {viewSheet.targetDispatchTime}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Booked Line Items ({viewSheet.items?.length || viewSheet.itemsCount || 0})
                  </h4>
                  <span className="text-xs font-bold text-[#3FA9A8]">
                    Total Units: {viewSheet.totalQty}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Item Description</th>
                        <th className="py-2.5 px-3">Variation</th>
                        <th className="py-2.5 px-3 text-right">Price</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewSheet.items && viewSheet.items.length > 0 ? (
                        viewSheet.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">{item.name}</td>
                            <td className="py-2.5 px-3 text-slate-500">{item.variation}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700">Rs {item.unitPrice}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-900">{item.qty}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                              Rs {item.total.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-400">
                            Summary order items ({viewSheet.itemsCount} SKUs, {viewSheet.totalQty} Units)
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50/80 border-t border-slate-200 font-bold text-xs">
                        <td colSpan={3} className="py-2.5 px-3 text-slate-800">
                          Total Booking Gross Value
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-900 font-bold">
                          {viewSheet.totalQty}
                        </td>
                        <td className="py-2.5 px-3 text-right text-base text-[#3FA9A8] font-bold font-mono">
                          Rs {viewSheet.bookingValue.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Manager Notes */}
              {viewSheet.managerNotes && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <span className="font-bold block mb-0.5">Manager / Route Notes:</span>
                  <p>{viewSheet.managerNotes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Status:</span>
                <select
                  value={viewSheet.status}
                  onChange={(e) => handleUpdateStatus(viewSheet.id, e.target.value as OrderBookingSheet['status'])}
                  className="text-xs bg-white border border-slate-200 text-slate-800 py-1 px-2.5 rounded-lg font-medium focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] cursor-pointer"
                >
                  <option value="Recorded">Recorded</option>
                  <option value="Partially Delivered">Partially Delivered</option>
                  <option value="Completed">Completed</option>
                  <option value="Draft">Draft</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  Print Thermal Slip
                </button>
                <button
                  type="button"
                  onClick={() => setViewSheet(null)}
                  className="px-4 py-1.5 bg-[#3FA9A8] hover:bg-[#349695] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Record New Booking Sheet Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-teal-50 text-[#3FA9A8] flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Record New Order Booking Sheet</h3>
                  <p className="text-xs text-slate-500">Log wholesale orders brought in by field order bookers</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveNewSheet} className="p-6 overflow-y-auto space-y-5">
              {/* Row 1: Slip # and Booker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Physical Slip / Book # *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSlipNo}
                    onChange={(e) => setNewSlipNo(e.target.value)}
                    placeholder="e.g. #TK-8842"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] text-slate-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Order Booker *
                  </label>
                  <select
                    value={newBookerId}
                    onChange={(e) => {
                      setNewBookerId(e.target.value);
                      const b = liveBookers.find(booker => booker.id === e.target.value);
                      if (b) setNewAreaZone(`${b.areaKey} Zone`);
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] text-slate-900 cursor-pointer"
                  >
                    {liveBookers.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.areaKey})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Outlet / Shop Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Retailer / Shop Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                    placeholder="e.g. Gourmet Mart & Bakery"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Market Area / Zone *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAreaZone}
                    onChange={(e) => setNewAreaZone(e.target.value)}
                    placeholder="e.g. Gulberg III (Main Mkt)"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Shop Address / Location
                </label>
                <input
                  type="text"
                  value={newShopAddress}
                  onChange={(e) => setNewShopAddress(e.target.value)}
                  placeholder="e.g. Shop #45, Main Market, Lahore"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] text-slate-900"
                />
              </div>

              {/* Row 3: Add Items to Sheet */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Add Dishes / Items to Sheet
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <select
                      value={selectedProductIdx}
                      onChange={(e) => {
                        setSelectedProductIdx(Number(e.target.value));
                        setSelectedVariationIdx(0);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#3FA9A8]"
                    >
                      {INITIAL_PRODUCTS.map((prod, idx) => (
                        <option key={prod.id} value={idx}>
                          {prod.icon} {prod.name} (Rs {prod.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    {INITIAL_PRODUCTS[selectedProductIdx]?.variations && (
                      <select
                        value={selectedVariationIdx}
                        onChange={(e) => setSelectedVariationIdx(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#3FA9A8]"
                      >
                        {INITIAL_PRODUCTS[selectedProductIdx].variations!.map((v, i) => (
                          <option key={i} value={i}>
                            {v.name} - Rs {v.price}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      value={lineQty}
                      onChange={(e) => setLineQty(Math.max(1, Number(e.target.value)))}
                      className="w-16 px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-center font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#3FA9A8]"
                    />
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Added Items List */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                        <th className="py-2 px-3">Item</th>
                        <th className="py-2 px-3">Variation</th>
                        <th className="py-2 px-3 text-right">Price</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Total</th>
                        <th className="py-2 px-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lineItems.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2 px-3 font-semibold text-slate-800">{item.name}</td>
                          <td className="py-2 px-3 text-slate-500">{item.variation}</td>
                          <td className="py-2 px-3 text-right text-slate-600 font-mono">Rs {item.unitPrice}</td>
                          <td className="py-2 px-3 text-center font-bold text-slate-900">{item.qty}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                            Rs {item.total.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(item.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-teal-50/50 border-t border-teal-100 font-bold text-xs">
                        <td colSpan={3} className="py-2 px-3 text-slate-700">Subtotal</td>
                        <td className="py-2 px-3 text-center text-slate-900">
                          {lineItems.reduce((sum, i) => sum + i.qty, 0)} Units
                        </td>
                        <td className="py-2 px-3 text-right text-sm text-[#3FA9A8] font-mono">
                          Rs {lineItems.reduce((sum, i) => sum + i.total, 0).toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Row 4: Dispatch Target & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Dispatch Time
                  </label>
                  <input
                    type="text"
                    value={newTargetDispatch}
                    onChange={(e) => setNewTargetDispatch(e.target.value)}
                    placeholder="e.g. Tomorrow, 09:00 AM"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Initial Sheet Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as OrderBookingSheet['status'])}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] text-slate-900 cursor-pointer"
                  >
                    <option value="Recorded">Recorded (Active in Queue)</option>
                    <option value="Draft">Draft (Pending Booker Review)</option>
                    <option value="Partially Delivered">Partially Delivered</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Manager / Route Dispatch Notes
                </label>
                <textarea
                  rows={2}
                  value={newManagerNotes}
                  onChange={(e) => setNewManagerNotes(e.target.value)}
                  placeholder="Special instructions, delivery route or customer payment instructions..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] text-slate-900"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#3FA9A8] hover:bg-[#349695] text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-[0.99] cursor-pointer"
                >
                  Save & Queue Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
