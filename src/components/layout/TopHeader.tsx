import React from 'react';
import { Search, Bell, ShoppingBag } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

export const TopHeader: React.FC = () => {
  const { globalSearch, setGlobalSearch } = useUIStore();

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

        {/* Offline SQLite: Synced Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Offline SQLite: Synced</span>
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
