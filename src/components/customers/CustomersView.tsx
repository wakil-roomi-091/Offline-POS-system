import React, { useState, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  MapPin, 
  CreditCard, 
  ArrowDownLeft, 
  FileText, 
  Printer, 
  Download, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  Edit2, 
  Trash2 
} from 'lucide-react';
import { db } from '../../db';
import { useShiftStore } from '../../store/useShiftStore';
import { useSecurityStore } from '../../store/useSecurityStore';
import type { Customer, CustomerLedgerEntry } from '../../types';

const EMPTY_CUSTOMERS: Customer[] = [];
const EMPTY_LEDGERS: CustomerLedgerEntry[] = [];

export const CustomersView: React.FC = () => {
  // Live queries from Dexie
  const liveCustomers = useLiveQuery(() => db.customers.toArray(), []) ?? EMPTY_CUSTOMERS;
  const liveLedgers = useLiveQuery(() => db.customerLedgers.toArray(), []) ?? EMPTY_LEDGERS;

  const { cashierName, currentShift, recordMovement } = useShiftStore();
  const { requestPinAuthorization } = useSecurityStore();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'with_balance' | 'zero_balance' | 'blocked'>('all');
  const [areaFilter, setAreaFilter] = useState('all');

  // Drawer & Modal States
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState<Customer | null>(null);
  const [isLedgerDrawerOpen, setIsLedgerDrawerOpen] = useState(false);
  
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'JazzCash' | 'Easypaisa' | 'Cheque'>('Cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [depositInDrawer, setDepositInDrawer] = useState(true);

  // Add / Edit Customer Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    area: 'Gulberg III, Lahore',
    creditLimit: '50000',
    openingBalance: '0',
    notes: '',
  });

  // WhatsApp reminder modal
  const [whatsAppModalCustomer, setWhatsAppModalCustomer] = useState<Customer | null>(null);
  const [copiedWhatsAppText, setCopiedWhatsAppText] = useState(false);

  // Printable Statement Ref
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Unique Areas for filter
  const allAreas = useMemo(() => {
    const set = new Set<string>();
    liveCustomers.forEach((c) => {
      if (c.area) set.add(c.area);
    });
    return Array.from(set);
  }, [liveCustomers]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return liveCustomers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
        c.phone.includes(q) ||
        (c.area && c.area.toLowerCase().includes(q)) ||
        c.id.toLowerCase().includes(q);

      const matchesArea = areaFilter === 'all' || c.area === areaFilter;

      let matchesStatus = true;
      if (statusFilter === 'with_balance') {
        matchesStatus = c.currentBalance > 0;
      } else if (statusFilter === 'zero_balance') {
        matchesStatus = c.currentBalance <= 0;
      } else if (statusFilter === 'blocked') {
        matchesStatus = c.status === 'blocked' || c.currentBalance > c.creditLimit;
      }

      return matchesSearch && matchesArea && matchesStatus;
    });
  }, [liveCustomers, searchQuery, areaFilter, statusFilter]);

  // KPI Calculations
  const stats = useMemo(() => {
    let totalReceivables = 0;
    let accountsWithBalance = 0;
    let blockedCount = 0;

    liveCustomers.forEach((c) => {
      if (c.currentBalance > 0) {
        totalReceivables += c.currentBalance;
        accountsWithBalance += 1;
      }
      if (c.status === 'blocked' || c.currentBalance > c.creditLimit) {
        blockedCount += 1;
      }
    });

    // Payments recovered (Credits in ledgers)
    const totalRecovered = liveLedgers
      .filter((l) => l.type === 'payment_received')
      .reduce((sum, l) => sum + (l.credit || 0), 0);

    return {
      totalReceivables,
      accountsWithBalance,
      blockedCount,
      totalCustomers: liveCustomers.length,
      totalRecovered,
    };
  }, [liveCustomers, liveLedgers]);

  // Selected customer ledgers
  const currentCustomerLedgers = useMemo(() => {
    if (!selectedCustomerForLedger) return [];
    return liveLedgers
      .filter((l) => l.customerId === selectedCustomerForLedger.id)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [liveLedgers, selectedCustomerForLedger]);

  // Open Add Customer Modal
  const handleOpenAddCustomer = () => {
    setEditingCustomer(null);
    setCustomerFormData({
      name: '',
      contactPerson: '',
      phone: '+92 ',
      email: '',
      address: '',
      area: allAreas[0] || 'Gulberg III, Lahore',
      creditLimit: '50000',
      openingBalance: '0',
      notes: '',
    });
    setIsCustomerModalOpen(true);
  };

  // Open Edit Customer Modal
  const handleOpenEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerFormData({
      name: customer.name,
      contactPerson: customer.contactPerson || '',
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      area: customer.area || 'Gulberg III, Lahore',
      creditLimit: customer.creditLimit.toString(),
      openingBalance: '0',
      notes: customer.notes || '',
    });
    setIsCustomerModalOpen(true);
  };

  // Save Customer (Add or Edit)
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerFormData.name.trim()) {
      alert('Please enter customer/shop name');
      return;
    }
    if (!customerFormData.phone.trim()) {
      alert('Please enter a contact phone number');
      return;
    }

    const creditLimitNum = parseFloat(customerFormData.creditLimit) || 0;
    const openingBalNum = parseFloat(customerFormData.openingBalance) || 0;

    if (editingCustomer) {
      // Update
      await db.customers.update(editingCustomer.id, {
        name: customerFormData.name.trim(),
        contactPerson: customerFormData.contactPerson.trim() || undefined,
        phone: customerFormData.phone.trim(),
        email: customerFormData.email.trim() || undefined,
        address: customerFormData.address.trim() || undefined,
        area: customerFormData.area.trim() || undefined,
        creditLimit: creditLimitNum,
        notes: customerFormData.notes.trim() || undefined,
      });
      showToast(`Updated customer: ${customerFormData.name}`);
    } else {
      // Add New
      const customerId = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
      const newCust: Customer = {
        id: customerId,
        name: customerFormData.name.trim(),
        contactPerson: customerFormData.contactPerson.trim() || undefined,
        phone: customerFormData.phone.trim(),
        email: customerFormData.email.trim() || undefined,
        address: customerFormData.address.trim() || undefined,
        area: customerFormData.area.trim() || undefined,
        creditLimit: creditLimitNum,
        currentBalance: openingBalNum,
        status: 'active',
        createdAt: Date.now(),
        totalPurchases: openingBalNum,
        totalPaid: 0,
        notes: customerFormData.notes.trim() || undefined,
      };

      await db.transaction('rw', [db.customers, db.customerLedgers], async () => {
        await db.customers.add(newCust);
        if (openingBalNum > 0) {
          const initialLedger: CustomerLedgerEntry = {
            id: `LED-${Date.now().toString().slice(-6)}`,
            customerId,
            timestamp: Date.now(),
            type: 'opening_balance',
            description: 'Opening Khata Balance Carried Forward',
            debit: openingBalNum,
            credit: 0,
            runningBalance: openingBalNum,
            collectedBy: cashierName || 'Admin',
          };
          await db.customerLedgers.add(initialLedger);
        }
      });
      showToast(`Added customer: ${newCust.name}`);
    }

    setIsCustomerModalOpen(false);
  };

  // Open Receive Payment Modal
  const handleOpenReceivePayment = (customer: Customer) => {
    setPaymentCustomer(customer);
    setPaymentAmount(customer.currentBalance > 0 ? customer.currentBalance.toString() : '');
    setPaymentMethod('Cash');
    setPaymentReference('');
    setPaymentNotes('Counter payment receipt');
    setDepositInDrawer(true);
    setIsPaymentModalOpen(true);
  };

  // Confirm Payment Receipt
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomer) return;
    const amountNum = parseFloat(paymentAmount) || 0;
    if (amountNum <= 0) {
      alert('Please enter a valid payment amount greater than zero.');
      return;
    }

    const previousBal = paymentCustomer.currentBalance || 0;
    const newBal = Math.max(0, previousBal - amountNum);
    const slipId = `RCPT-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await db.transaction(
        'rw',
        [db.customers, db.customerLedgers, db.cashMovements, db.shifts],
        async () => {
          // 1. Update Customer Record
          await db.customers.update(paymentCustomer.id, {
            currentBalance: newBal,
            totalPaid: (paymentCustomer.totalPaid || 0) + amountNum,
          });

          // 2. Add Customer Ledger Entry
          const newLedger: CustomerLedgerEntry = {
            id: `LED-${Date.now().toString().slice(-6)}`,
            customerId: paymentCustomer.id,
            timestamp: Date.now(),
            type: 'payment_received',
            referenceId: slipId,
            description: `Payment Received via ${paymentMethod} (${paymentReference || 'Counter Settlement'})`,
            debit: 0,
            credit: amountNum,
            runningBalance: newBal,
            paymentMethod,
            collectedBy: cashierName || 'Cashier',
            notes: paymentNotes,
          };
          await db.customerLedgers.add(newLedger);

          // 3. If Cash & Drawer deposit selected, record shift Pay-In
          if (paymentMethod === 'Cash' && depositInDrawer && currentShift && currentShift.status === 'open') {
            await recordMovement('pay_in', amountNum);
            await db.cashMovements.add({
              id: `CM-${Date.now()}`,
              shiftId: currentShift.id,
              type: 'pay_in',
              amount: amountNum,
              reason: `Khata Payment: ${paymentCustomer.name} (${slipId})`,
              timestamp: Date.now(),
              cashierName: cashierName || 'Cashier',
            });
          }
        }
      );

      showToast(`Successfully received Rs. ${amountNum.toLocaleString()} from ${paymentCustomer.name}`);
      setIsPaymentModalOpen(false);

      // If drawer was viewing this customer, refresh reference
      if (selectedCustomerForLedger?.id === paymentCustomer.id) {
        setSelectedCustomerForLedger({
          ...paymentCustomer,
          currentBalance: newBal,
          totalPaid: (paymentCustomer.totalPaid || 0) + amountNum,
        });
      }
    } catch (err) {
      console.error('Failed to record customer payment:', err);
      alert('Error recording payment. Please check database connectivity.');
    }
  };

  // Toggle Customer Active / Blocked Status
  const handleToggleCustomerStatus = async (customer: Customer) => {
    const nextStatus = customer.status === 'active' ? 'blocked' : 'active';
    const reason = nextStatus === 'blocked' ? 'Block customer account from taking further credit' : 'Unblock customer account';
    
    requestPinAuthorization(reason, async () => {
      await db.customers.update(customer.id, { status: nextStatus });
      showToast(`Customer status updated to ${nextStatus.toUpperCase()}`);
    });
  };

  // Delete Customer
  const handleDeleteCustomer = (customer: Customer) => {
    if (customer.currentBalance > 0) {
      alert(`Cannot delete customer with active outstanding balance of Rs. ${customer.currentBalance.toLocaleString()}. Settle ledger first.`);
      return;
    }
    requestPinAuthorization('Delete customer record and historical ledger', async () => {
      await db.transaction('rw', [db.customers, db.customerLedgers], async () => {
        await db.customers.delete(customer.id);
        const relatedLedgers = await db.customerLedgers.where('customerId').equals(customer.id).toArray();
        for (const l of relatedLedgers) {
          await db.customerLedgers.delete(l.id);
        }
      });
      showToast(`Deleted customer ${customer.name}`);
      if (selectedCustomerForLedger?.id === customer.id) {
        setIsLedgerDrawerOpen(false);
      }
    });
  };

  // Export Customer List & Balances to CSV
  const handleExportCSV = () => {
    const headers = ['Customer ID', 'Name', 'Contact Person', 'Phone', 'Area', 'Credit Limit (PKR)', 'Current Balance (PKR)', 'Status', 'Total Purchases', 'Total Paid'];
    const rows = liveCustomers.map((c) => [
      c.id,
      `"${c.name}"`,
      `"${c.contactPerson || ''}"`,
      `"${c.phone}"`,
      `"${c.area || ''}"`,
      c.creditLimit,
      c.currentBalance,
      c.status,
      c.totalPurchases || 0,
      c.totalPaid || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DinePos_Khata_Receivables_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate WhatsApp Reminder Text
  const getWhatsAppMessage = (customer: Customer) => {
    return (
      `*Payment Reminder - DinePos Khata*\n\n` +
      `Respected *${customer.contactPerson || customer.name}*,\n` +
      `We hope this message finds you well.\n\n` +
      `This is a gentle reminder regarding your outstanding Khata balance with our store.\n` +
      `*Current Outstanding Balance:* Rs. ${customer.currentBalance.toLocaleString()} PKR\n` +
      `*Account ID:* ${customer.id}\n\n` +
      `Kindly arrange settlement at your earliest convenience via Cash, Bank Transfer, or Online JazzCash/Easypaisa.\n\n` +
      `Thank you for your valued patronage!\n` +
      `_DinePos Store Management_`
    );
  };

  // Handle WhatsApp Link Click
  const handleOpenWhatsApp = (customer: Customer) => {
    setWhatsAppModalCustomer(customer);
    setCopiedWhatsAppText(false);
  };

  const handleCopyWhatsAppText = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedWhatsAppText(true);
    setTimeout(() => setCopiedWhatsAppText(false), 2500);
  };

  // Print Customer Statement
  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="flex flex-col w-full space-y-6 select-none font-sans" data-purpose="customers-view-content">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-8 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* BEGIN: Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#3FA9A8]" />
            <span>Customers &amp; Khata Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer credit lines, receivable accounts (Udhaar), running ledger records &amp; WhatsApp reminders.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-xs transition cursor-pointer"
            title="Download CSV spreadsheet of all customer receivables"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Khata CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddCustomer}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#3FA9A8] hover:bg-[#349695] active:bg-[#2A7978] rounded-xl shadow-sm hover:shadow transition-all cursor-pointer active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
        </div>
      </div>
      {/* END: Header */}

      {/* BEGIN: KPI Stat Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-purpose="metrics-summary">
        {/* Card 1: Total Receivables */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Receivables (Udhaar)</p>
            <p className="text-xl font-bold text-slate-900 mt-1">Rs. {stats.totalReceivables.toLocaleString()}</p>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-1">
              <span>Across {stats.accountsWithBalance} pending credit accounts</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-[#3FA9A8] flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Recovered Payments */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Recovered to Date</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">Rs. {stats.totalRecovered.toLocaleString()}</p>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium mt-1">
              <span>Counter settlements &amp; bank transfers</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Active Customer Accounts */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Customer Profiles</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{stats.totalCustomers} Accounts</p>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-1">
              <span>{stats.accountsWithBalance} active debit • {stats.totalCustomers - stats.accountsWithBalance} clear</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-[#3FA9A8] flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Over-Limit / Blocked Alerts */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Over-Limit / Blocked</p>
            <p className={`text-xl font-bold mt-1 ${stats.blockedCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {stats.blockedCount} Accounts
            </p>
            <div className={`flex items-center gap-1 text-[11px] font-medium mt-1 ${stats.blockedCount > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
              <span>{stats.blockedCount > 0 ? 'Requires supervisor clearance' : 'All accounts within credit limit'}</span>
            </div>
          </div>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${
            stats.blockedCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-[#3FA9A8]'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </section>
      {/* END: KPI Stat Cards */}

      {/* BEGIN: Search & Filter Toolbar */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone, area..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] focus:border-[#3FA9A8]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills & Selectors */}
        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({liveCustomers.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('with_balance')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'with_balance' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              With Balance ({stats.accountsWithBalance})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('zero_balance')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'zero_balance' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Cleared ({liveCustomers.length - stats.accountsWithBalance})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('blocked')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'blocked' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Over-Limit ({stats.blockedCount})
            </button>
          </div>

          {/* Area Filter Dropdown */}
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl px-3 py-2 outline-none focus:border-[#3FA9A8] shrink-0"
          >
            <option value="all">All Locations</option>
            {allAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>
      </section>
      {/* END: Toolbar */}

      {/* BEGIN: Customer Table Grid */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Customer / Outlet</th>
                <th className="py-3.5 px-4">Contact &amp; Location</th>
                <th className="py-3.5 px-4">Credit Limit</th>
                <th className="py-3.5 px-4 text-right">Khata Balance</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No customers found</p>
                    <p className="text-[11px] mt-0.5">Try adjusting your search query or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const isOverLimit = cust.currentBalance > cust.creditLimit;
                  const percentUsed = cust.creditLimit > 0 ? Math.min(100, Math.round((cust.currentBalance / cust.creditLimit) * 100)) : 0;

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#3FA9A8] flex items-center justify-center font-bold text-sm shrink-0 border border-teal-100">
                            {cust.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                              {cust.name}
                              <span className="font-mono text-[10px] text-slate-400 font-normal">
                                {cust.id}
                              </span>
                            </div>
                            {cust.contactPerson && (
                              <p className="text-[11px] text-slate-500">Attn: {cust.contactPerson}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact & Location */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <a
                            href={`tel:${cust.phone.replace(/\s+/g, '')}`}
                            className="font-mono text-slate-700 hover:text-[#3FA9A8] flex items-center gap-1.5 transition"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {cust.phone}
                          </a>
                          {cust.area && (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[160px]">{cust.area}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Credit Limit & Progress */}
                      <td className="py-3.5 px-4">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold">
                            <span className="text-slate-600">Rs. {cust.creditLimit.toLocaleString()}</span>
                            <span className={percentUsed >= 90 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                              {percentUsed}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isOverLimit
                                  ? 'bg-rose-500'
                                  : percentUsed > 75
                                  ? 'bg-amber-500'
                                  : 'bg-[#3FA9A8]'
                              }`}
                              style={{ width: `${percentUsed}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Current Balance */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-bold text-sm">
                          {cust.currentBalance === 0 ? (
                            <span className="text-emerald-600">Rs. 0</span>
                          ) : isOverLimit ? (
                            <span className="text-rose-600 font-extrabold">
                              Rs. {cust.currentBalance.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-amber-700">
                              Rs. {cust.currentBalance.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {cust.currentBalance > 0 ? 'Receivable' : 'Settled'}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            cust.status === 'blocked' || isOverLimit
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cust.status === 'blocked' || isOverLimit ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                          />
                          {cust.status === 'blocked' ? 'Blocked' : isOverLimit ? 'Over Limit' : 'Active'}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Receive Payment Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenReceivePayment(cust)}
                            className="px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition cursor-pointer"
                            title="Record Cash/Bank Payment Received"
                          >
                            Receive
                          </button>

                          {/* View Ledger Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomerForLedger(cust);
                              setIsLedgerDrawerOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                            title="View Full Financial Ledger"
                          >
                            Ledger
                          </button>

                          {/* WhatsApp Reminder */}
                          {cust.currentBalance > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenWhatsApp(cust)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              title="Send WhatsApp Payment Reminder"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit Customer */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditCustomer(cust)}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Edit Customer Info"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(cust)}
                            className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Customer Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      </section>
      {/* END: Customer Table Grid */}

      {/* BEGIN: Customer Ledger Drawer Modal */}
      {isLedgerDrawerOpen && selectedCustomerForLedger && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-fade-in"
        >
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200">
            {/* Drawer Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#3FA9A8] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {selectedCustomerForLedger.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    {selectedCustomerForLedger.name}
                    <span className="text-xs font-mono font-normal text-slate-400">
                      {selectedCustomerForLedger.id}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedCustomerForLedger.phone} • {selectedCustomerForLedger.area || 'Lahore'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintStatement}
                  className="p-2 text-slate-600 hover:bg-slate-200/70 rounded-xl transition cursor-pointer"
                  title="Print Ledger Statement"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsLedgerDrawerOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Customer Financial Overview Ribbon */}
            <div className="grid grid-cols-3 gap-3 p-5 bg-teal-50/40 border-b border-teal-100">
              <div className="bg-white p-3 rounded-xl border border-teal-100/80 shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Credit Limit</p>
                <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                  Rs. {selectedCustomerForLedger.creditLimit.toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-teal-100/80 shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Billed</p>
                <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                  Rs. {(selectedCustomerForLedger.totalPurchases || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-teal-100/80 shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outstanding Balance</p>
                <p className={`text-base font-extrabold font-mono mt-0.5 ${
                  selectedCustomerForLedger.currentBalance > 0 ? 'text-amber-700' : 'text-emerald-600'
                }`}>
                  Rs. {selectedCustomerForLedger.currentBalance.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Quick Actions inside Drawer */}
            <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Financial Ledger Entries ({currentCustomerLedgers.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenReceivePayment(selectedCustomerForLedger)}
                  className="px-3 py-1.5 bg-[#3FA9A8] hover:bg-[#359392] text-white text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  Receive Payment
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleCustomerStatus(selectedCustomerForLedger)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer border ${
                    selectedCustomerForLedger.status === 'blocked'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {selectedCustomerForLedger.status === 'blocked' ? 'Unblock Credit' : 'Block Credit'}
                </button>
              </div>
            </div>

            {/* Printable Area & Ledger Table */}
            <div ref={printAreaRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {currentCustomerLedgers.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">No ledger transactions yet</p>
                  <p className="text-xs">Ledger records will appear when sales or payments occur.</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3.5">Date &amp; Details</th>
                        <th className="py-3 px-3 text-right">Debit (+)</th>
                        <th className="py-3 px-3 text-right">Credit (-)</th>
                        <th className="py-3 px-3.5 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {currentCustomerLedgers.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3.5 font-sans">
                            <div className="font-semibold text-slate-800 text-xs">
                              {l.description}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{new Date(l.timestamp).toLocaleDateString()} {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {l.referenceId && (
                                <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px]">
                                  {l.referenceId}
                                </span>
                              )}
                              {l.collectedBy && <span>• by {l.collectedBy}</span>}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right text-rose-600 font-bold">
                            {l.debit > 0 ? `+Rs. ${l.debit.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-3 px-3 text-right text-emerald-600 font-bold">
                            {l.credit > 0 ? `-Rs. ${l.credit.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-3 px-3.5 text-right font-bold text-slate-900">
                            Rs. {l.runningBalance.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* END: Customer Ledger Drawer */}

      {/* BEGIN: Receive Payment Modal */}
      {isPaymentModalOpen && paymentCustomer && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Khata Payment</h3>
                <p className="text-xs text-slate-500">Collect receivable and clear customer debt.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4 pt-4 text-xs">
              {/* Customer Current Balance Card */}
              <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-600">Customer:</span>
                  <div className="font-bold text-slate-900 text-sm">{paymentCustomer.name}</div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-500">Current Balance:</span>
                  <div className="text-base font-extrabold text-amber-700 font-mono">
                    Rs. {paymentCustomer.currentBalance.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="payment-amount">
                  Payment Amount to Receive (PKR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">
                    Rs.
                  </span>
                  <input
                    id="payment-amount"
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-base font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#3FA9A8] focus:border-[#3FA9A8] font-mono outline-none"
                    placeholder="e.g. 5000"
                  />
                </div>

                {/* Preset Chips */}
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(paymentCustomer.currentBalance.toString())}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer"
                  >
                    Full Balance
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount('5000')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer"
                  >
                    Rs. 5,000
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount('10000')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer"
                  >
                    Rs. 10,000
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Tender Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Cash', 'Bank Transfer', 'JazzCash', 'Easypaisa', 'Cheque'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold transition cursor-pointer text-center ${
                        paymentMethod === m
                          ? 'border-[#3FA9A8] bg-teal-50 text-[#2E807F]'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference ID / Slip */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="payment-ref">
                  Reference # / Cheque No / Slip No
                </label>
                <input
                  id="payment-ref"
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. HBL-98124 or Counter Slip #12"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#3FA9A8] text-slate-800 outline-none"
                />
              </div>

              {/* Shift Register Integration Checkbox */}
              {paymentMethod === 'Cash' && currentShift && currentShift.status === 'open' && (
                <label className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={depositInDrawer}
                    onChange={(e) => setDepositInDrawer(e.target.checked)}
                    className="rounded text-[#3FA9A8] focus:ring-[#3FA9A8]"
                  />
                  <div className="text-[11px]">
                    <span className="font-bold text-emerald-900">Deposit into active shift register</span>
                    <p className="text-emerald-700">Records a Pay-In so drawer physical cash reconciles at shift closing.</p>
                  </div>
                </label>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#3FA9A8] hover:bg-[#359392] text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* END: Receive Payment Modal */}

      {/* BEGIN: Add / Edit Customer Modal */}
      {isCustomerModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'Add New Khata Customer'}
                </h3>
                <p className="text-xs text-slate-500">Register customer profile and establish credit ceiling.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3.5 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Store / Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerFormData.name}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, name: e.target.value })}
                    placeholder="e.g. Al-Madina Super Store"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#3FA9A8] text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={customerFormData.contactPerson}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, contactPerson: e.target.value })}
                    placeholder="e.g. Haji Abdul Ghaffar"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#3FA9A8] text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerFormData.phone}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
                    placeholder="+92 300 1234567"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#3FA9A8] text-slate-800 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Area / Location
                  </label>
                  <input
                    type="text"
                    value={customerFormData.area}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, area: e.target.value })}
                    placeholder="e.g. Gulberg III, Lahore"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#3FA9A8] text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Credit Limit (PKR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={customerFormData.creditLimit}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, creditLimit: e.target.value })}
                    placeholder="50000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#3FA9A8] text-slate-800 font-mono outline-none"
                  />
                </div>

                {!editingCustomer && (
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Initial Opening Balance (Previous Khata Debt)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={customerFormData.openingBalance}
                      onChange={(e) => setCustomerFormData({ ...customerFormData, openingBalance: e.target.value })}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#3FA9A8] text-slate-800 font-mono outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Leave 0 if starting with a clean balance.</p>
                  </div>
                )}

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Address
                  </label>
                  <input
                    type="text"
                    value={customerFormData.address}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, address: e.target.value })}
                    placeholder="e.g. Shop #12, Commercial Market, Lahore"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#3FA9A8] text-slate-800 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notes &amp; Terms
                  </label>
                  <textarea
                    rows={2}
                    value={customerFormData.notes}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, notes: e.target.value })}
                    placeholder="e.g. Monthly settlement cycle on 1st of every month."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#3FA9A8] text-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#3FA9A8] hover:bg-[#359392] text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  {editingCustomer ? 'Update Profile' : 'Save Customer Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* END: Add/Edit Customer Modal */}

      {/* BEGIN: WhatsApp Reminder Modal */}
      {whatsAppModalCustomer && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">WhatsApp Khata Reminder</h3>
                  <p className="text-[11px] text-slate-500">{whatsAppModalCustomer.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWhatsAppModalCustomer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-slate-700 font-mono text-[11px] whitespace-pre-wrap leading-relaxed select-text">
                {getWhatsAppMessage(whatsAppModalCustomer)}
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => handleCopyWhatsAppText(getWhatsAppMessage(whatsAppModalCustomer))}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className={`w-4 h-4 ${copiedWhatsAppText ? 'text-emerald-500' : 'text-slate-400'}`} />
                  {copiedWhatsAppText ? 'Copied to Clipboard!' : 'Copy Message'}
                </button>

                <a
                  href={`https://wa.me/${whatsAppModalCustomer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(getWhatsAppMessage(whatsAppModalCustomer))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer text-center"
                >
                  <MessageSquare className="w-4 h-4" />
                  Open WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* END: WhatsApp Reminder Modal */}
    </div>
  );
};
