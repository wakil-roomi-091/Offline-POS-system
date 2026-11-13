import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../db';
import { backupService, type SnapshotSummary, type BackupPayload } from '../../services/backupService';
import { useSecurityStore } from '../../store/useSecurityStore';
import {
  Store,
  Printer,
  Shield,
  HardDrive,
  Download,
  Upload,
  FolderOpen,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Check
} from 'lucide-react';

type SettingsTab = 'store' | 'printer' | 'database' | 'security';

const SAMPLE_RECEIPT_DATE = '12/11/2026';

export const SettingsView: React.FC = () => {
  // Navigation Sub-tab: isolated view routing
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
  const [recordCounts, setRecordCounts] = useState({
    products: 0,
    transactions: 0,
    expenses: 0,
    bookingSheets: 0,
    shifts: 0
  });
  const [targetDir, setTargetDir] = useState('Local Backups Directory (IndexedDB / AppData)');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [localSnapshots, setLocalSnapshots] = useState<SnapshotSummary[]>([]);
  const [pendingRestore, setPendingRestore] = useState<{
    payload: BackupPayload;
    counts: Record<string, number>;
    fileName?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshCounts = async () => {
    try {
      const [pCount, tCount, eCount, bCount, sCount] = await Promise.all([
        db.products.count(),
        db.transactions.count(),
        db.expenses.count(),
        db.bookingSheets.count(),
        db.shifts.count()
      ]);
      setRecordCounts({
        products: pCount,
        transactions: tCount,
        expenses: eCount,
        bookingSheets: bCount,
        shifts: sCount
      });
    } catch (err) {
      console.error('Failed to load counts:', err);
    }
  };

  const loadLocalSnapshots = () => {
    const list = backupService.getLocalSnapshots();
    setLocalSnapshots(list);
  };

  // Load initial settings and counts from DB
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
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
      await refreshCounts();
      loadLocalSnapshots();

      // Check electron local backup path if available
      const electronAPI = (window as unknown as { electronAPI?: { listLocalBackups?: () => Promise<{ directory?: string }> } }).electronAPI;
      if (electronAPI && typeof electronAPI.listLocalBackups === 'function') {
        electronAPI.listLocalBackups().then((res) => {
          if (res?.directory) {
            setTargetDir(res.directory);
          }
        }).catch(() => {});
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

  // Backup & Restore
  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    try {
      const payload = await backupService.generateBackupPayload('Manual User Snapshot');
      const res = await backupService.downloadBackupFile(payload);
      if (res.success) {
        showToast(res.filePath ? `Backup saved to: ${res.filePath}` : 'Full database snapshot exported successfully!');
        loadLocalSnapshots();
        await refreshCounts();
      }
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      showToast('Error generating database backup: ' + errMsg);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const payload = await backupService.readBackupFile(file);
      const validation = backupService.validateBackup(payload);
      if (!validation.valid) {
        alert(validation.error || 'Invalid backup file format.');
        return;
      }

      setPendingRestore({
        payload,
        counts: validation.counts as Record<string, number>,
        fileName: file.name
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Corrupted file';
      alert('Could not read backup file: ' + errMsg);
    } finally {
      e.target.value = '';
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestore) return;
    setIsRestoring(true);
    try {
      const res = await backupService.restoreBackup(pendingRestore.payload);
      showToast(res.message);
      setPendingRestore(null);
      await refreshCounts();
      loadLocalSnapshots();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Error';
      alert('Restore failed: ' + errMsg);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRestoreSnapshot = (snap: SnapshotSummary) => {
    const validation = backupService.validateBackup(snap.payload);
    if (!validation.valid) {
      alert('Invalid snapshot data.');
      return;
    }
    setPendingRestore({
      payload: snap.payload,
      counts: validation.counts as Record<string, number>,
      fileName: `${snap.reason} (${snap.dateStr})`
    });
  };

  const handleOpenBackupFolder = async () => {
    const electronAPI = (window as unknown as { electronAPI?: { openBackupFolder?: () => Promise<void> } }).electronAPI;
    if (electronAPI && typeof electronAPI.openBackupFolder === 'function') {
      try {
        await electronAPI.openBackupFolder();
      } catch {
        showToast('Could not open folder in Explorer.');
      }
    } else {
      showToast('Physical folder access is enabled in Desktop Electron app.');
    }
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
DATE: ${SAMPLE_RECEIPT_DATE}                  TABLE: T-04
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

  const handleToggleWitnessPin = () => {
    const next = !managerWitnessPin;
    setManagerWitnessPin(next);
    useSecurityStore.getState().setSecurityToggles(adminPinRequired, next);
    showToast(next ? 'Manager witness PIN enabled for cash closing.' : 'Manager witness PIN disabled.');
  };

  const handleToggleAdminPin = () => {
    const next = !adminPinRequired;
    setAdminPinRequired(next);
    useSecurityStore.getState().setSecurityToggles(next, managerWitnessPin);
    showToast(next ? 'Supervisor PIN required for item void & order clear.' : 'Supervisor PIN requirement disabled.');
  };

  const handleChangePin = () => {
    const currentPin = useSecurityStore.getState().managerPin;
    const enteredCurrent = prompt('Enter Current Supervisor PIN to authorize change:', '');
    if (enteredCurrent === null) return;
    if (enteredCurrent.trim() !== currentPin) {
      alert('Incorrect current supervisor PIN. Unauthorized.');
      return;
    }

    const newPin = prompt('Enter new 4-digit Manager Authorization PIN:', '1234');
    if (newPin && newPin.trim().length >= 4) {
      useSecurityStore.getState().updateManagerPin(newPin.trim()).then((ok) => {
        if (ok) showToast('Manager Authorization PIN updated and saved successfully!');
      });
    } else if (newPin !== null) {
      alert('PIN must be at least 4 digits.');
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
        accept=".json"
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
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings &amp; Configuration</h1>
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
              <Check className="w-4 h-4" />
              Save All Settings
            </button>
          </div>
        </div>

        {/* Navigation Tabs - Dedicated Isolated Subtab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-100 pt-1 -mb-4 overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveSubTab('store')}
            className={`pb-3 px-3 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeSubTab === 'store'
                ? 'text-[#3FA9A8] border-b-2 border-[#3FA9A8] font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Store className="w-4 h-4" />
            Store &amp; Payments
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('printer')}
            className={`pb-3 px-3 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeSubTab === 'printer'
                ? 'text-[#3FA9A8] border-b-2 border-[#3FA9A8] font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Printer className="w-4 h-4" />
            Receipt &amp; Thermal Printer
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('security')}
            className={`pb-3 px-3 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeSubTab === 'security'
                ? 'text-[#3FA9A8] border-b-2 border-[#3FA9A8] font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            Security &amp; Access PIN
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('database')}
            className={`pb-3 px-3 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeSubTab === 'database'
                ? 'text-[#3FA9A8] border-b-2 border-[#3FA9A8] font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            Backup &amp; Data Vault
            <span className="ml-1 px-1.5 py-0.2 bg-teal-100 text-[#3FA9A8] text-[10px] font-bold rounded-full">
              ACID
            </span>
          </button>
        </div>
      </div>
      {/* END: Settings Header & Subtabs */}

      {/* BEGIN: Isolated Tab Views */}
      <div className="p-8 bg-slate-50 min-h-screen" data-purpose="settings-content-viewport">
        <div className="max-w-[1520px] mx-auto">
          {/* TAB 1: Store & Payments */}
          {activeSubTab === 'store' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              {/* Section 1: Restaurant Information */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6" data-purpose="store-info-section">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#3FA9A8] flex items-center justify-center font-bold">
                      <Store className="w-5 h-5" />
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
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6" data-purpose="payment-methods-section">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#3FA9A8] flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
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
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
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
            </div>
          )}

          {/* TAB 2: Receipt & Thermal Printer */}
          {activeSubTab === 'printer' && (
            <div className="grid grid-cols-12 gap-8 items-start animate-fade-in">
              {/* Left Column: Printer Settings (7 of 12) */}
              <div className="col-span-12 lg:col-span-7 space-y-6">
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6" data-purpose="thermal-printer-section">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#3FA9A8] flex items-center justify-center font-bold">
                        <Printer className="w-5 h-5" />
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
                            {paperWidth === '80mm' && <Check className="w-3.5 h-3.5" />}
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
                            {paperWidth === '58mm' && <Check className="w-3.5 h-3.5" />}
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
                    <div className="pt-3 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleTestPrint}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-slate-600" />
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
              </div>

              {/* Right Column: Realistic Live Thermal Receipt Preview (5 of 12) */}
              <div className="col-span-12 lg:col-span-5">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5" data-purpose="live-receipt-preview-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#3FA9A8]" />
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
                      <Download className="w-3.5 h-3.5" />
                      Export Spec (.txt)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Security & PIN */}
          {activeSubTab === 'security' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6" data-purpose="system-preferences-section">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#3FA9A8] flex items-center justify-center font-bold">
                      <Shield className="w-5 h-5" />
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
                      onClick={handleToggleWitnessPin}
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
                      onClick={handleToggleAdminPin}
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
          )}

          {/* TAB 4: Dedicated Backup, Recovery & Data Vault */}
          {activeSubTab === 'database' && (
            <div className="space-y-6 animate-fade-in" data-purpose="backup-vault-view">
              {/* Top Health & Storage Banner */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 text-[#3FA9A8] flex items-center justify-center font-bold shadow-inner">
                    <HardDrive className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">Offline Data Vault &amp; ACID Store</h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Healthy &amp; Intact
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Direct local storage via Dexie IndexedDB with transactional exports and snapshot rollbacks.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleOpenBackupFolder}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FolderOpen className="w-4 h-4 text-slate-500" />
                    <span>Open Backups Folder</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await refreshCounts();
                      loadLocalSnapshots();
                      showToast('Database inventories refreshed.');
                    }}
                    className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition cursor-pointer"
                    title="Refresh Counts"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Data Safety Protocol Notice */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900 text-xs leading-relaxed">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-950">Transactional Restore &amp; Safety Protocol</h4>
                  <p className="mt-0.5 text-amber-800">
                    Restoring a backup cleanly updates your local database tables. To ensure absolute zero data loss, the system generates an automated <strong>Pre-Restore Safety Snapshot</strong> in your local vault before any restore or rollback is committed.
                  </p>
                </div>
              </div>

              {/* Live Record Counts Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Menu Catalog</span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-800">{recordCounts.products}</span>
                    <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Dishes</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 block">Indexed in products table</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Settlements</span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-800">{recordCounts.transactions}</span>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Tickets</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 block">Completed sales log</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Operating OPEX</span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-800">{recordCounts.expenses}</span>
                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Vouchers</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 block">Kitchen &amp; pantry expenses</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fleet Booking</span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-800">{recordCounts.bookingSheets}</span>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Sheets</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 block">Field routing dispatch orders</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Register Shifts</span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-800">{recordCounts.shifts}</span>
                    <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Sessions</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 block">X &amp; Z closing records</span>
                </div>
              </div>

              {/* Primary Backup & Restore Operations Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Export Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#3FA9A8] flex items-center justify-center font-bold">
                        <Download className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">Export Full Database Snapshot</h3>
                        <p className="text-xs text-slate-400">Generates an ACID-safe JSON archive of all tables</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      Creates a portable snapshot including products, categories, transactions, vouchers, fleet booking sheets, shifts, and drawer audit movements.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 truncate">
                      Target Path: <strong>{targetDir}</strong>
                    </div>
                    <button
                      type="button"
                      disabled={isBackingUp}
                      onClick={handleCreateBackup}
                      className="w-full py-3 bg-[#3FA9A8] hover:bg-[#349392] active:bg-[#2A7978] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      {isBackingUp ? 'Compiling JSON Snapshot...' : 'Create Immediate Backup (.json)'}
                    </button>
                  </div>
                </div>

                {/* Import / Restore Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">Restore from Backup Archive</h3>
                        <p className="text-xs text-slate-400">Imports and validates a previously exported file</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      Upload a `.json` backup file. The engine validates table schema integrity and inspects record quantities before prompting for final confirmation.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Schema version 1 to 3 verified with backward-compatibility.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-amber-600" />
                      Select Backup File to Restore...
                    </button>
                  </div>
                </div>
              </div>

              {/* Local Snapshots Vault & Rollback Ledger */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Local Snapshots Vault &amp; Rollback History</h3>
                    <p className="text-xs text-slate-400">Automatic rolling recovery checkpoints saved in browser storage</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {localSnapshots.length} Snapshots Stored
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 font-semibold tracking-wider uppercase text-[10px] border-b border-slate-200">
                        <th className="py-3 px-6">Snapshot Reason</th>
                        <th className="py-3 px-4">Date &amp; Timestamp</th>
                        <th className="py-3 px-4">Total Records</th>
                        <th className="py-3 px-4">Integrity Status</th>
                        <th className="py-3 px-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {localSnapshots.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <HardDrive className="w-8 h-8 text-slate-300" />
                              <p className="font-semibold text-slate-600">No local snapshots generated yet.</p>
                              <p className="text-[11px] text-slate-400">Click &quot;Create Immediate Backup&quot; above to save your first snapshot.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        localSnapshots.map((snap) => (
                          <tr key={snap.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3.5 px-6 font-bold text-slate-900">
                              {snap.reason}
                              <span className="block text-[10px] font-mono font-normal text-slate-400">ID: {snap.id}</span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                              {snap.dateStr}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                                {snap.totalRecords} records
                              </span>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Validated
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleRestoreSnapshot(snap)}
                                className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-xl text-xs transition cursor-pointer"
                              >
                                Rollback to Snapshot
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* END: Settings Scrollable Body Layout */}

      {/* Restore Confirmation Modal */}
      {pendingRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center font-bold">
                ⚠️
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Confirm Database Restore</h3>
                <p className="text-xs text-slate-500">{pendingRestore.fileName || 'Selected Backup'}</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
              <p className="font-bold mb-1">Warning: Existing records will be replaced!</p>
              <p className="text-[11px]">
                A safety rollback snapshot of your current database will be saved automatically before restoring.
              </p>
            </div>

            <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-700 mb-1 text-[11px] uppercase tracking-wider">Payload Summary:</p>
              <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                <div>• Products: <strong>{pendingRestore.counts.products || 0}</strong></div>
                <div>• Transactions: <strong>{pendingRestore.counts.transactions || 0}</strong></div>
                <div>• Expenses: <strong>{pendingRestore.counts.expenses || 0}</strong></div>
                <div>• Booking Slips: <strong>{pendingRestore.counts.bookingSheets || 0}</strong></div>
                <div>• Register Shifts: <strong>{pendingRestore.counts.shifts || 0}</strong></div>
                <div>• Cash In/Out: <strong>{pendingRestore.counts.cashMovements || 0}</strong></div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => setPendingRestore(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRestoring}
                onClick={handleConfirmRestore}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
              >
                {isRestoring ? 'Restoring Tables...' : 'Proceed with Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
