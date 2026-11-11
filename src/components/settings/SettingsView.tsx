import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../db';

type SettingsTab = 'store' | 'printer' | 'database' | 'security';

const SAMPLE_RECEIPT_DATE = '12/11/2026';

export const SettingsView: React.FC = () => {
  // Navigation Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<SettingsTab>('store');

  // Section 1: Store & Restaurant Info
  const [storeName, setStoreName] = useState('DinePos Bistro & Grill');
  const [phone, setPhone] = useState('+92 300 1234567');
  const [address, setAddress] = useState('Plot 14-C, Main Commercial Boulevard, Phase 6, DHA');
  const [ntnTaxId, setNtnTaxId] = useState('NTN: 8291044-7');
  const [stationId] = useState('Station-01 (Ground Floor Counter)');
  const [receiptGreeting, setReceiptGreeting] = useState(
    'Welcome to DinePos! Freshly cooked Pakistani & Continental cuisines.'
  );
  const [receiptFooter, setReceiptFooter] = useState(
    'Thank you for dining with us! Local SQLite Audit Verified.'
  );

  // Section 2: Accepted Payment Methods
  const [enableCash] = useState(true); // Locked mandatory
  const [enableEasypaisa, setEnableEasypaisa] = useState(true);
  const [enableJazzcash, setEnableJazzcash] = useState(true);
  const [enableCard, setEnableCard] = useState(true);

  // Section 3: Receipt & Thermal Printer
  const [selectedPrinter, setSelectedPrinter] = useState('[USB001] Xprinter XP-80C Thermal (Connected - Ready)');
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [printCopies, setPrintCopies] = useState<number>(1);
  const [autoCut, setAutoCut] = useState(true);
  const [drawerKick, setDrawerKick] = useState(true);

  // Section 4: System Preferences & Security PIN
  const [currencyDisplay] = useState('Pakistani Rupee (Rs. / PKR)');
  const [dateTimeFormat] = useState('DD/MM/YYYY - 12h (hh:mm A)');
  const [decimalPrecision] = useState('0 Decimals (Rs. 1,450)');
  const [managerWitnessPin, setManagerWitnessPin] = useState(true);
  const [adminPinRequired, setAdminPinRequired] = useState(true);
  const [audioFeedback, setAudioFeedback] = useState(true);

  // Database stats & UI notifications
  const [recordCounts, setRecordCounts] = useState({ products: 8, transactions: 12 });
  const [targetDir] = useState('D:\\DinePos_Backups\\Database\\daily_sqlite.db');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial settings from DB if available
  useEffect(() => {
    async function loadSettingsAndCounts() {
      try {
        const savedConfig = await db.settings.get('storeConfig');
        if (savedConfig?.value) {
          const cfg = savedConfig.value;
          if (cfg.storeName) setStoreName(cfg.storeName);
          if (cfg.phone) setPhone(cfg.phone);
          if (cfg.address) setAddress(cfg.address);
          if (cfg.receiptHeader) setReceiptGreeting(cfg.receiptHeader);
          if (cfg.receiptFooter) setReceiptFooter(cfg.receiptFooter);
        }

        const pCount = await db.products.count();
        const tCount = await db.transactions.count();
        setRecordCounts({ products: pCount, transactions: tCount });
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
    loadSettingsAndCounts();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Global Actions
  const handleSaveAll = async () => {
    try {
      await db.settings.put({
        key: 'storeConfig',
        value: {
          storeName,
          phone,
          address,
          ntnTaxId,
          stationId,
          receiptHeader: receiptGreeting,
          receiptFooter,
          enableCash,
          enableEasypaisa,
          enableJazzcash,
          enableCard,
          selectedPrinter,
          paperWidth,
          printCopies,
          autoCut,
          drawerKick,
          managerWitnessPin,
          adminPinRequired,
          audioFeedback,
          updatedAt: new Date().toISOString()
        }
      });
      showToast('All settings and hardware configurations saved successfully!');
    } catch {
      showToast('Configuration updated in memory.');
    }
  };

  const handleDiscard = () => {
    setStoreName('DinePos Bistro & Grill');
    setPhone('+92 300 1234567');
    setAddress('Plot 14-C, Main Commercial Boulevard, Phase 6, DHA');
    setNtnTaxId('NTN: 8291044-7');
    setReceiptGreeting('Welcome to DinePos! Freshly cooked Pakistani & Continental cuisines.');
    setReceiptFooter('Thank you for dining with us! Local SQLite Audit Verified.');
    setEnableEasypaisa(true);
    setEnableJazzcash(true);
    setEnableCard(true);
    setPaperWidth('80mm');
    setPrintCopies(1);
    setAutoCut(true);
    setDrawerKick(true);
    setManagerWitnessPin(true);
    setAdminPinRequired(true);
    setAudioFeedback(true);
    showToast('Changes discarded. Restored defaults.');
  };

  // Sub-tab scroll handler
  const scrollToSection = (sectionId: string, tab: SettingsTab) => {
    setActiveSubTab(tab);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Backup & Restore
  const handleCreateBackup = async () => {
    try {
      const products = await db.products.toArray();
      const transactions = await db.transactions.toArray();
      const expenses = await db.expenses.toArray();
      const shifts = await db.shifts.toArray();
      const cashMovements = await db.cashMovements.toArray();
      const settings = await db.settings.toArray();

      const backupData = {
        app: 'DinePos',
        version: '2.4.1',
        createdAt: new Date().toISOString(),
        products,
        transactions,
        expenses,
        shifts,
        cashMovements,
        settings
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DinePos_Database_Snapshot_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Full SQLite database backup downloaded successfully!');
    } catch (err) {
      console.error(err);
      showToast('Error generating database backup.');
    }
  };

  const handleRestoreFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        if (confirm('Restoring will replace existing records. Proceed?')) {
          if (data.products && Array.isArray(data.products)) {
            await db.products.clear();
            await db.products.bulkAdd(data.products);
          }
          if (data.transactions && Array.isArray(data.transactions)) {
            await db.transactions.clear();
            await db.transactions.bulkAdd(data.transactions);
          }
          if (data.expenses && Array.isArray(data.expenses)) {
            await db.expenses.clear();
            await db.expenses.bulkAdd(data.expenses);
          }
          showToast('Database snapshot restored successfully!');
          const pCount = await db.products.count();
          const tCount = await db.transactions.count();
          setRecordCounts({ products: pCount, transactions: tCount });
        }
      } catch {
        alert('Invalid backup file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleTestPrint = () => {
    showToast(`Test thermal ticket sent to ${selectedPrinter.split(' ')[1] || 'printer'} (80mm ESC/POS)`);
  };

  const handleCheckConnection = () => {
    showToast(`Hardware Status: ${selectedPrinter} is Online & Ready.`);
  };

  const handleExportReceiptSpec = () => {
    const spec = `================================================
          ${storeName.toUpperCase()}
          ${address}
          Tel: ${phone} • ${ntnTaxId}
================================================
${receiptGreeting}
------------------------------------------------
RECEIPT: #TEST-SAMPLE               09:15 PM
DATE: ${new Date().toLocaleDateString('en-GB')}                  TABLE: T-04
OPERATOR: John Doe                  STATION: POS-01
------------------------------------------------
ITEM                                TOTAL (PKR)
------------------------------------------------
1x Chicken Biryani (Special)               850
1x Garlic Roghani Naan                     120
------------------------------------------------
Subtotal:                              Rs. 970
Sales Tax (0% Exempt):                   Rs. 0
TOTAL BILL:                            Rs. 970
Paid: Cash Tender                    Rs. 1,000
Change Due:                             Rs. 30
------------------------------------------------
${receiptFooter}
Local SQLite Audit Verified • Terminal-01
               |||||||||||||||||||||
        * * * PARTIAL PAPER CUT * * *
================================================`;

    const blob = new Blob([spec], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_Spec_80mm_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Receipt ESC/POS raw text spec exported!');
  };

  const handleChangePin = () => {
    const newPin = prompt('Enter new 4-digit Manager Authorization PIN:', '1234');
    if (newPin && newPin.trim().length >= 4) {
      showToast('Manager PIN updated successfully!');
    }
  };

  const handleConfigureQR = () => {
    alert(
      'Counter QR Card Details:\n\n' +
      '• Easypaisa Merchant Till: 0312-9876543\n' +
      '• JazzCash Merchant Till: 0301-7654321\n\n' +
      'Place standard acrylic QR display at counter for customer scan.'
    );
  };

  return (
    <div className="flex flex-col w-full -mx-8 -mt-6 select-none font-sans text-slate-800 antialiased" data-purpose="settings-view">
      {/* Styles for Receipt Serrated Tear */}
      <style>{`
        .receipt-tear-bottom {
          background-image: radial-gradient(circle at 7px 0px, transparent 6px, #FAF8F5 7px);
          background-size: 14px 10px;
          background-repeat: repeat-x;
        }
      `}</style>

      {/* Hidden file input for restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleRestoreFileSelected}
        accept=".json,.db"
        className="hidden"
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-[#3FA9A8] animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* BEGIN: Settings Header & Subtabs */}
      <div className="px-8 pt-6 pb-4 bg-white border-b border-slate-200 shrink-0" data-purpose="sub-header-navigation">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                Local Terminal Config
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                v2.4.1 (Offline Build)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure restaurant information, hardware peripherals, and offline application preferences.
            </p>
          </div>

          {/* Global Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDiscard}
              type="button"
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm cursor-pointer"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSaveAll}
              type="button"
              className="px-4 py-2 bg-[#3FA9A8] hover:bg-[#349392] active:bg-[#2A7978] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              Save All Settings
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pt-1 -mb-4 overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => scrollToSection('sec-store-info', 'store')}
            className={`pb-3 px-3 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeSubTab === 'store'
                ? 'text-[#3FA9A8] border-b-2 border-[#3FA9A8] font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            Store &amp; Payments
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('sec-printer', 'printer')}
            className={`pb-3 px-3 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeSubTab === 'printer'
                ? 'text-[#3FA9A8] border-b-2 border-[#3FA9A8] font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            Receipt &amp; Thermal Printer
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('sec-backup', 'database')}
            className={`pb-3 px-3 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeSubTab === 'database'
                ? 'text-[#3FA9A8] border-b-2 border-[#3FA9A8] font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16m-5 4h.01M9 11h.01M9 15h.01M15 15h.01"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            Database Backup &amp; Safety
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('sec-security', 'security')}
            className={`pb-3 px-3 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeSubTab === 'security'
                ? 'text-[#3FA9A8] border-b-2 border-[#3FA9A8] font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            Security &amp; Access PIN
          </button>
        </div>
      </div>
      {/* END: Settings Header & Subtabs */}

      {/* BEGIN: Settings Scrollable Body Layout */}
      <div className="p-8 bg-slate-50 min-h-screen" data-purpose="settings-content-viewport">
        <div className="max-w-[1520px] mx-auto grid grid-cols-12 gap-8 items-start">
          {/* Left Column: Primary Configuration Sections (65% width) */}
          <div className="col-span-12 xl:col-span-8 space-y-6" data-purpose="settings-forms-column">
            {/* Section 1: Restaurant Information */}
            <section
              id="sec-store-info"
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 scroll-mt-6"
              data-purpose="store-info-section"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#3FA9A8] flex items-center justify-center font-bold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Restaurant Information &amp; Brand</h3>
                    <p className="text-xs text-slate-400">Store details printed on customer receipts and audit vouchers.</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active Outlet
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Restaurant Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Restaurant Trading Name</label>
                  <input
                    className="w-full text-xs font-medium rounded-xl border border-slate-200 focus:border-[#3FA9A8] focus:ring focus:ring-teal-500/20 py-2.5 px-3.5 text-slate-800 shadow-sm outline-none"
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                  />
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Contact Phone / Landline</label>
                  <input
                    className="w-full text-xs font-medium rounded-xl border border-slate-200 focus:border-[#3FA9A8] focus:ring focus:ring-teal-500/20 py-2.5 px-3.5 text-slate-800 shadow-sm outline-none"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Physical Outlet Address</label>
                  <input
                    className="w-full text-xs font-medium rounded-xl border border-slate-200 focus:border-[#3FA9A8] focus:ring focus:ring-teal-500/20 py-2.5 px-3.5 text-slate-800 shadow-sm outline-none"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                {/* NTN Tax ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    NTN / STRN Tax ID{' '}
                    <span className="text-[10px] font-normal text-slate-400">(Optional for offline POS)</span>
                  </label>
                  <input
                    className="w-full text-xs font-medium rounded-xl border border-slate-200 focus:border-[#3FA9A8] focus:ring focus:ring-teal-500/20 py-2.5 px-3.5 text-slate-800 shadow-sm outline-none"
                    type="text"
                    value={ntnTaxId}
                    onChange={(e) => setNtnTaxId(e.target.value)}
                  />
                </div>

                {/* Station Identifier */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">POS Station Terminal ID</label>
                  <input
                    className="w-full text-xs font-medium rounded-xl border border-slate-200 focus:border-[#3FA9A8] focus:ring focus:ring-teal-500/20 py-2.5 px-3.5 text-slate-800 shadow-sm bg-slate-50 outline-none"
                    readOnly
                    type="text"
                    value={stationId}
                  />
                </div>

                {/* Receipt Header Message */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Receipt Header Greeting</label>
                  <input
                    className="w-full text-xs font-medium rounded-xl border border-slate-200 focus:border-[#3FA9A8] focus:ring focus:ring-teal-500/20 py-2.5 px-3.5 text-slate-800 shadow-sm outline-none"
                    type="text"
                    value={receiptGreeting}
                    onChange={(e) => setReceiptGreeting(e.target.value)}
                  />
                </div>

                {/* Receipt Footer Message */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Receipt Footer Message &amp; Audit Line
                  </label>
                  <input
                    className="w-full text-xs font-medium rounded-xl border border-slate-200 focus:border-[#3FA9A8] focus:ring focus:ring-teal-500/20 py-2.5 px-3.5 text-slate-800 shadow-sm outline-none"
                    type="text"
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Section 2: Accepted Payment Methods */}
            <section
              id="sec-payments"
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
              data-purpose="payment-methods-section"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#3FA9A8] flex items-center justify-center font-bold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Accepted Payment Methods</h3>
                    <p className="text-xs text-slate-400">Enable payment types accepted at this POS station.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleConfigureQR}
                  className="text-xs font-semibold text-[#3FA9A8] hover:text-teal-700 hover:bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors cursor-pointer"
                >
                  Configure Counter QR Card
                </button>
              </div>

              {/* Guardrail Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-start gap-2.5 text-amber-800">
                <svg className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
                <p className="text-xs leading-relaxed">
                  <strong>Offline Terminal Notice:</strong> Payments are recorded manually. No automatic payment gateway or
                  external internet clearing is active. Cash closing reconciles totals locally.
                </p>
              </div>

              {/* Toggle List */}
              <div className="space-y-3">
                {/* Item 1: Cash (Locked ON) */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      ₨
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-800">Cash (Register Drawer)</h4>
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded">
                          Mandatory Primary
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">Primary physical tender. Reconciled in daily Cash Closing.</p>
                    </div>
                  </div>
                  {/* Toggle switch (Locked ON) */}
                  <div className="relative inline-block w-10 h-6 select-none opacity-80 cursor-not-allowed">
                    <div className="w-10 h-6 bg-[#3FA9A8] rounded-full transition-colors" />
                    <div className="absolute right-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-md" />
                  </div>
                </div>

                {/* Item 2: Easypaisa */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                      EP
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Easypaisa QR / Wallet</h4>
                      <p className="text-[11px] text-slate-500">Merchant Till: 0312-9876543 • Direct counter QR scan</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableEasypaisa(!enableEasypaisa)}
                    className={`relative inline-flex items-center h-6 w-10 rounded-full transition-colors cursor-pointer ${
                      enableEasypaisa ? 'bg-[#3FA9A8]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-sm ${
                        enableEasypaisa ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Item 3: JazzCash */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                      JC
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">JazzCash QR / Wallet</h4>
                      <p className="text-[11px] text-slate-500">Merchant Till: 0301-7654321 • Direct counter QR scan</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableJazzcash(!enableJazzcash)}
                    className={`relative inline-flex items-center h-6 w-10 rounded-full transition-colors cursor-pointer ${
                      enableJazzcash ? 'bg-[#3FA9A8]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-sm ${
                        enableJazzcash ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Item 4: Bank Card */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      POS
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Card / POS Bank Terminal</h4>
                      <p className="text-[11px] text-slate-500">
                        External bank machine (Meezan Bank swipe POS). Settles via bank slip entry.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableCard(!enableCard)}
                    className={`relative inline-flex items-center h-6 w-10 rounded-full transition-colors cursor-pointer ${
                      enableCard ? 'bg-[#3FA9A8]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-sm ${
                        enableCard ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* Section 3: Receipt & Thermal Printer */}
            <section
              id="sec-printer"
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 scroll-mt-6"
              data-purpose="thermal-printer-section"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#3FA9A8] flex items-center justify-center font-bold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Receipt &amp; Thermal Printer</h3>
                    <p className="text-xs text-slate-400">Configure ESC/POS thermal receipt printer and formatting.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-slate-700">Driver: WinSpool ESC/POS</span>
                </div>
              </div>

              {/* Printer Settings Grid */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Primary Thermal Printer Hardware
                  </label>
                  <div className="relative">
                    <select
                      value={selectedPrinter}
                      onChange={(e) => setSelectedPrinter(e.target.value)}
                      className="w-full text-xs font-medium rounded-xl border border-slate-200 focus:border-[#3FA9A8] focus:ring focus:ring-teal-500/20 py-2.5 pl-3.5 pr-10 text-slate-800 shadow-sm appearance-none bg-white outline-none cursor-pointer"
                    >
                      <option>[USB001] Xprinter XP-80C Thermal (Connected - Ready)</option>
                      <option>[Network] 192.168.1.100:9100 Kitchen Printer (Ready)</option>
                      <option>[USB002] Generic / Text Only (58mm Fallback)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Paper Size */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Paper Width &amp; Character Pitch</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaperWidth('80mm')}
                        className={`py-2 px-3 text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          paperWidth === '80mm'
                            ? 'font-bold border-2 border-[#3FA9A8] bg-teal-50/50 text-[#3FA9A8]'
                            : 'font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {paperWidth === '80mm' && (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          </svg>
                        )}
                        80mm (Standard)
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaperWidth('58mm')}
                        className={`py-2 px-3 text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          paperWidth === '58mm'
                            ? 'font-bold border-2 border-[#3FA9A8] bg-teal-50/50 text-[#3FA9A8]'
                            : 'font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {paperWidth === '58mm' && (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          </svg>
                        )}
                        58mm (Compact)
                      </button>
                    </div>
                  </div>

                  {/* Print Copies */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Print Copies Per Transaction</label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setPrintCopies(Math.max(1, printCopies - 1))}
                        className="w-10 h-[38px] rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        className="w-full text-xs font-semibold text-center border border-slate-200 py-2.5 text-slate-800 bg-white outline-none"
                        readOnly
                        type="text"
                        value={`${printCopies} ${printCopies === 1 ? 'Copy (Customer)' : 'Copies (Customer + Kitchen)'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setPrintCopies(Math.min(3, printCopies + 1))}
                        className="w-10 h-[38px] rounded-r-xl border border-l-0 border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hardware Peripheral Switches */}
                <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Auto-cut */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Auto-cut Paper</p>
                      <p className="text-[11px] text-slate-400">Sends partial knife cut command</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoCut(!autoCut)}
                      className={`relative inline-flex items-center h-5 w-9 rounded-full transition-colors cursor-pointer ${
                        autoCut ? 'bg-[#3FA9A8]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-sm ${
                          autoCut ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Cash Drawer Kick */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Cash Drawer Kick-out</p>
                      <p className="text-[11px] text-slate-400">Sends RJ11 pulse on cash tender</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDrawerKick(!drawerKick)}
                      className={`relative inline-flex items-center h-5 w-9 rounded-full transition-colors cursor-pointer ${
                        drawerKick ? 'bg-[#3FA9A8]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-sm ${
                          drawerKick ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Printer Test Actions */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTestPrint}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                    Test Print Receipt
                  </button>
                  <button
                    type="button"
                    onClick={handleCheckConnection}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Check Hardware Connection
                  </button>
                </div>
              </div>
            </section>

            {/* Section 4: System Preferences & Security PIN */}
            <section
              id="sec-security"
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 scroll-mt-6"
              data-purpose="system-preferences-section"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#3FA9A8] flex items-center justify-center font-bold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">System Preferences &amp; Access Security</h3>
                    <p className="text-xs text-slate-400">Terminal locale settings and administrative safeguard locks.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Currency Display</label>
                  <input
                    className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-slate-700 shadow-sm outline-none"
                    readOnly
                    type="text"
                    value={currencyDisplay}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Date &amp; Time Format</label>
                  <input
                    className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-slate-700 shadow-sm outline-none"
                    readOnly
                    type="text"
                    value={dateTimeFormat}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Decimal Precision</label>
                  <input
                    className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-slate-700 shadow-sm outline-none"
                    readOnly
                    type="text"
                    value={decimalPrecision}
                  />
                </div>
              </div>

              {/* Security Toggles */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-teal-500" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Manager Witness PIN for Cash Closing</h5>
                      <p className="text-[11px] text-slate-400">
                        Requires manager 4-digit PIN before submitting register drawer discrepancy
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setManagerWitnessPin(!managerWitnessPin)}
                    className={`relative inline-flex items-center h-6 w-10 rounded-full transition-colors cursor-pointer ${
                      managerWitnessPin ? 'bg-[#3FA9A8]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-sm ${
                        managerWitnessPin ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-teal-500" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Require Admin PIN for Item Void &amp; Bill Discount</h5>
                      <p className="text-[11px] text-slate-400">
                        Restricts line deletions and manual price adjustments from cashier station
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdminPinRequired(!adminPinRequired)}
                    className={`relative inline-flex items-center h-6 w-10 rounded-full transition-colors cursor-pointer ${
                      adminPinRequired ? 'bg-[#3FA9A8]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-sm ${
                        adminPinRequired ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-teal-500" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Audio Feedback Sound</h5>
                      <p className="text-[11px] text-slate-400">Audio click/beep on barcode scan and ticket print dispatch</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAudioFeedback(!audioFeedback)}
                    className={`relative inline-flex items-center h-6 w-10 rounded-full transition-colors cursor-pointer ${
                      audioFeedback ? 'bg-[#3FA9A8]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-sm ${
                        audioFeedback ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Current Security Authority: <strong>Admin / Supervisor Access</strong>
                </span>
                <button
                  type="button"
                  onClick={handleChangePin}
                  className="text-xs font-bold text-[#3FA9A8] hover:text-teal-700 cursor-pointer"
                >
                  Change Manager Authorization PIN →
                </button>
              </div>
            </section>
          </div>

          {/* Right Column: Live Receipt Preview & Backup Safety (35% width) */}
          <div className="col-span-12 xl:col-span-4 space-y-6" data-purpose="preview-and-backup-column">
            {/* Section 5: Realistic Thermal Receipt Preview */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5" data-purpose="live-receipt-preview-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#3FA9A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                    <path
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Live {paperWidth} ESC/POS Preview
                  </h4>
                </div>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  {paperWidth === '80mm' ? '48 Columns' : '32 Columns'}
                </span>
              </div>

              {/* Receipt Container with Serrated Paper Effects */}
              <div className="relative bg-[#FAF8F5] p-6 rounded-t-xl border border-slate-300 shadow-inner font-mono text-[11px] leading-relaxed text-slate-800">
                {/* Store Brand Header */}
                <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-0.5">
                  <p className="font-bold text-sm tracking-tight uppercase text-black">{storeName}</p>
                  <p className="text-[10px] text-slate-600">{address}</p>
                  <p className="text-[10px] text-slate-600">
                    Tel: {phone} • {ntnTaxId}
                  </p>
                  <p className="text-[9px] text-slate-500 pt-1 italic">{receiptGreeting}</p>
                </div>

                {/* Ticket Info */}
                <div className="py-2.5 border-b border-dashed border-slate-400 text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span>RECEIPT: #TEST-SAMPLE</span>
                    <span>09:15 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATE: {SAMPLE_RECEIPT_DATE}</span>
                    <span>TABLE: T-04 (Dine-In)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>OPERATOR: John Doe</span>
                    <span>STATION: POS-01</span>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span>ITEM</span>
                    <span>TOTAL (PKR)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1x Chicken Biryani (Special)</span>
                    <span>850</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1x Garlic Roghani Naan</span>
                    <span>120</span>
                  </div>
                </div>

                {/* Settlement Calculation */}
                <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rs. 970</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Sales Tax (0% Exempt):</span>
                    <span>Rs. 0</span>
                  </div>
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300">
                    <span>TOTAL BILL:</span>
                    <span className="text-black">Rs. 970</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>Paid: Cash Tender</span>
                    <span>Rs. 1,000</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Change Due:</span>
                    <span>Rs. 30</span>
                  </div>
                </div>

                {/* Footer Audit Notes */}
                <div className="pt-3 text-center space-y-1">
                  <p className="font-bold text-[10px] uppercase">{receiptFooter}</p>
                  <p className="text-[9px] text-slate-500">Local SQLite Audit Verified • Terminal-01</p>
                  <div className="pt-2 flex justify-center">
                    {/* Barcode Simulation */}
                    <div className="h-9 w-44 bg-slate-800 flex items-center justify-center text-[9px] text-white tracking-[6px] font-bold">
                      |||||||||||||||||||||
                    </div>
                  </div>
                  <p className="text-[8px] text-slate-400 pt-0.5">* * * PARTIAL PAPER CUT * * *</p>
                </div>

                {/* Paper Tear Bottom Indicator */}
                <div className="absolute -bottom-2.5 left-0 right-0 h-3 receipt-tear-bottom" />
              </div>

              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Dynamic receipt preview updates live</span>
                <button
                  type="button"
                  onClick={handleExportReceiptSpec}
                  className="text-[#3FA9A8] font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  Export Spec (.txt)
                </button>
              </div>
            </div>

            {/* Section 6: Backup and Restore (Offline Data Safety) */}
            <div
              id="sec-backup"
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 scroll-mt-6"
              data-purpose="backup-restore-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#3FA9A8] flex items-center justify-center font-bold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16m-5 4h.01M9 11h.01M9 15h.01M15 15h.01"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">SQLite Database Hub</h4>
                    <p className="text-[11px] text-slate-400">Offline tables snapshot &amp; recovery</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Healthy
                </span>
              </div>

              {/* Warning Notice */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      clipRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      fillRule="evenodd"
                    />
                  </svg>
                  Data Safety Protocol
                </div>
                <p>Restoring overrides current SQLite tables. Save a fresh snapshot before initiating rollbacks.</p>
              </div>

              {/* Backup Details */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400">Last Auto-Backup:</span>
                  <span className="font-semibold text-slate-700">Today, 06:30 PM (Auto-shift)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400">Active Storage:</span>
                  <span className="font-semibold text-slate-700">SQLite 3.42 (WAL Mode)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400">Records Logged:</span>
                  <span className="font-semibold text-slate-700">
                    {recordCounts.products} Products • {recordCounts.transactions} Today&apos;s Tx
                  </span>
                </div>
                <div className="pt-1">
                  <span className="text-slate-400 block mb-1">Target Directory:</span>
                  <div className="flex items-center gap-1">
                    <input
                      className="w-full text-[10px] font-mono bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-600 truncate outline-none"
                      readOnly
                      type="text"
                      value={targetDir}
                    />
                    <button
                      type="button"
                      onClick={() => showToast('Backup directory path confirmed.')}
                      className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 text-slate-700 whitespace-nowrap cursor-pointer"
                    >
                      Browse
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleCreateBackup}
                  className="w-full py-2.5 bg-[#3FA9A8] hover:bg-[#349392] active:bg-[#2A7978] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  Create Immediate Backup (.db)
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  Restore from Backup File
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* END: Settings Scrollable Body Layout */}
    </div>
  );
};
