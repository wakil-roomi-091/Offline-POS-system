import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, ShoppingBag, Database, Wifi, WifiOff, HardDrive, RefreshCw } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { backupService, type SnapshotSummary } from '../../services/backupService';

export const TopHeader: React.FC = () => {
  const { globalSearch, setGlobalSearch, setActiveTab } = useUIStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatusPopover, setShowStatusPopover] = useState(false);
  const [storageEstimate, setStorageEstimate] = useState<{ usedMB: string; quotaMB: string } | null>(null);
  const [lastSnapshot, setLastSnapshot] = useState<SnapshotSummary | null>(() => {
    const snaps = backupService.getLocalSnapshots();
    return snaps.length > 0 ? snaps[0] : null;
  });
  const [isTakingSnapshot, setIsTakingSnapshot] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((est) => {
        const used = ((est.usage || 0) / (1024 * 1024)).toFixed(2);
        const quota = ((est.quota || 0) / (1024 * 1024)).toFixed(0);
        setStorageEstimate({ usedMB: used, quotaMB: quota });
      }).catch(() => {});
    }

    // Close popover when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowStatusPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleQuickSnapshot = async () => {
    setIsTakingSnapshot(true);
    try {
      const snap = await backupService.createAutoSnapshot('Header Quick Snapshot');
      setLastSnapshot(snap);
    } catch (err) {
      console.warn('Quick snapshot failed:', err);
    } finally {
      setIsTakingSnapshot(false);
    }
  };

  return (
    <header 
      className="h-20 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0 select-none z-10 font-sans"
      data-purpose="top-header"
    >
      {/* Left: Greeting & Welcome Subtitle */}
      <div className="flex items-center gap-4">
        <button 
          type="button" 
          className="text-slate-500 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-50 transition-colors"
          title="Toggle Navigation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2 tracking-tight">
            <span>Welcome back, John!</span>
            <span role="img" aria-label="wave">👋</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>
      </div>

      {/* Right: Search, Offline Status, Notification, Register Cart Badges */}
      <div className="flex items-center gap-3.5">
        {/* Search Bar with ⌘K */}
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="searchInput"
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search dishes, menu items, order #..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-12 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] transition-all"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 border border-slate-200 bg-white text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded-md">
            ⌘K
          </span>
        </div>

        {/* Offline Status Badge & Interactive Popover */}
        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setShowStatusPopover(!showStatusPopover)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/80 transition-colors text-xs font-semibold cursor-pointer shadow-xs"
            title="Click for Offline Storage & Integrity Status"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              Offline DB: Active
            </span>
          </button>

          {showStatusPopover && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 text-xs text-slate-700 space-y-3 font-sans">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#3FA9A8]" />
                  <span className="font-bold text-slate-800">Storage & Integrity Hub</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                  Healthy
                </span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600" />}
                    Network Connection
                  </span>
                  <span className="font-semibold text-slate-700">
                    {isOnline ? 'Online (LAN Ready)' : '100% Offline Mode'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                    Storage Used
                  </span>
                  <span className="font-semibold text-slate-700">
                    {storageEstimate ? `${storageEstimate.usedMB} MB / ${storageEstimate.quotaMB} MB` : 'IndexedDB Local'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Last Snapshot</span>
                  <span className="font-semibold text-slate-700 truncate max-w-[140px] text-right" title={lastSnapshot ? lastSnapshot.dateStr : 'None'}>
                    {lastSnapshot ? lastSnapshot.dateStr : 'No snapshots'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  disabled={isTakingSnapshot}
                  onClick={handleQuickSnapshot}
                  className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isTakingSnapshot ? 'animate-spin' : ''}`} />
                  {isTakingSnapshot ? 'Snapshotting...' : 'Take Snapshot'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusPopover(false);
                    setActiveTab('settings');
                  }}
                  className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition cursor-pointer"
                >
                  Settings
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notification Bell with Badge 3 */}
        <button
          type="button"
          className="relative w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#2D8A89] text-white text-[9px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
            3
          </span>
        </button>

        {/* Register / Orders Bag with Badge 2 */}
        <button
          type="button"
          className="relative w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          title="Active Orders Queue"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#2D8A89] text-white text-[9px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
            2
          </span>
        </button>
      </div>
    </header>
  );
};
