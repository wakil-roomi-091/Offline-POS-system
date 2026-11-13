import React from 'react';
import { useUIStore } from '../../store/useUIStore';
import type { ActiveTab } from '../../types';

interface NavItem {
  id: ActiveTab;
  label: string;
  badge?: string | number;
  renderIcon: (isActive: boolean) => React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    renderIcon: (isActive) => (
      <svg
        className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#3FA9A8]' : 'text-white/70'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'pos',
    label: 'POS Terminal',
    renderIcon: (isActive) => (
      <svg
        className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#3FA9A8]' : 'text-white/70'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'products',
    label: 'Products',
    renderIcon: (isActive) => (
      <svg
        className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#3FA9A8]' : 'text-white/70'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        viewBox="0 0 24 24"
      >
        <path
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'transactions',
    label: 'Transactions',
    renderIcon: (isActive) => (
      <svg
        className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#3FA9A8]' : 'text-white/70'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect height="14" rx="2" width="20" x="2" y="5"></rect>
        <line x1="2" x2="22" y1="10" y2="10"></line>
      </svg>
    ),
  },
  {
    id: 'customers',
    label: 'Customers & Khata',
    renderIcon: (isActive) => (
      <svg
        className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#3FA9A8]' : 'text-white/70'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'expenses',
    label: 'Expenses',
    renderIcon: (isActive) => (
      <svg
        className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#3FA9A8]' : 'text-white/70'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect height="16" rx="2" width="18" x="3" y="4"></rect>
        <line x1="7" x2="17" y1="8" y2="8"></line>
        <line x1="7" x2="13" y1="12" y2="12"></line>
      </svg>
    ),
  },
  {
    id: 'cash_closing',
    label: 'Cash Closing',
    renderIcon: (isActive) => (
      <svg
        className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#3FA9A8]' : 'text-white/70'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'order_bookers',
    label: 'Order Bookers',
    renderIcon: (isActive) => (
      <svg
        className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#3FA9A8]' : 'text-white/70'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'order_booking',
    label: 'Order Booking',
    renderIcon: (isActive) => (
      <svg
        className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#3FA9A8]' : 'text-white/70'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'reports',
    label: 'Reports',
    renderIcon: (isActive) => (
      <svg
        className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#3FA9A8]' : 'text-white/70'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    renderIcon: (isActive) => (
      <svg
        className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#3FA9A8]' : 'text-white/70'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    ),
  },
];

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useUIStore();

  return (
    <aside 
      className="w-[260px] min-w-[260px] bg-gradient-to-b from-[#3FA9A8] to-[#349695] text-white flex flex-col justify-between p-4 z-20 shadow-lg select-none font-sans"
      data-purpose="app-sidebar"
    >
      {/* Top Brand & Navigation */}
      <div className="space-y-6">
        {/* Brand Logo & App Name */}
        <div className="flex items-center gap-3 px-2 pt-1 pb-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center p-2 shadow-inner">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect height="7" rx="2" width="7" x="3" y="3"></rect>
              <rect height="7" rx="2" width="7" x="14" y="3"></rect>
              <rect height="7" rx="2" width="7" x="3" y="14"></rect>
              <rect height="7" rx="2" width="7" x="14" y="14"></rect>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight">DinePos</h1>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-teal-100 opacity-90">Restaurant Suite</p>
          </div>
        </div>

        {/* Main Navigation Menu */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all text-sm cursor-pointer ${
                  isActive
                    ? 'font-semibold bg-white text-[#3FA9A8] shadow-md'
                    : 'font-medium text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.renderIcon(isActive)}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-[#3FA9A8]/15 text-[#3FA9A8]'
                        : 'bg-white/20 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Sidebar Cards */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        {/* Help Support Widget */}
        <div 
          onClick={() => alert('DinePos Help & Support: Hotline available 24/7 at +1 (555) 234-5678')}
          className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl flex items-center gap-3 border border-white/10 cursor-pointer hover:bg-white/15 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
          <div className="truncate text-left">
            <p className="text-xs font-semibold text-white">Need Help?</p>
            <p className="text-[11px] text-teal-100 opacity-90 truncate">Contact support</p>
          </div>
        </div>

        {/* Current User Profile Pill */}
        <div 
          onClick={() => setActiveTab('settings')}
          className="bg-white/10 backdrop-blur-sm p-2.5 rounded-2xl flex items-center justify-between border border-white/10 cursor-pointer hover:bg-white/15 transition-colors"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-white text-[#3FA9A8] font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              JD
            </div>
            <div className="truncate text-left">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-semibold text-white truncate">John Doe</span>
              </div>
              <p className="text-[10px] text-teal-100 opacity-80 truncate pl-3">Station 1 (Admin)</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-white/70 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </div>
      </div>
    </aside>
  );
};
