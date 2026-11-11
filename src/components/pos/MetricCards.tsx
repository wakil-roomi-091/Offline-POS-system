import React from 'react';

export const MetricCards: React.FC = () => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5" data-purpose="metrics-row">
      {/* Card 1: Total Sales */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-full bg-[#43AAA9] text-white flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-right flex-1 pl-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Total Sales</span>
              <button className="text-slate-300 hover:text-slate-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="10" cy="4" r="1.5" />
                  <circle cx="10" cy="10" r="1.5" />
                  <circle cx="10" cy="16" r="1.5" />
                </svg>
              </button>
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1">$4,892.45</div>
          </div>
        </div>
        <div className="mt-3 text-xs text-emerald-500 font-medium flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M5 10l7-7m0 0l7 7m-7-7v18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
          </svg>
          <span>12.5%</span> <span className="text-slate-400 font-normal">from yesterday</span>
        </div>
      </div>

      {/* Card 2: Orders */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-full bg-[#43AAA9] text-white flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-right flex-1 pl-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Orders</span>
              <button className="text-slate-300 hover:text-slate-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="10" cy="4" r="1.5" />
                  <circle cx="10" cy="10" r="1.5" />
                  <circle cx="10" cy="16" r="1.5" />
                </svg>
              </button>
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1">128</div>
          </div>
        </div>
        <div className="mt-3 text-xs text-emerald-500 font-medium flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M5 10l7-7m0 0l7 7m-7-7v18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
          </svg>
          <span>8.2%</span> <span className="text-slate-400 font-normal">from yesterday</span>
        </div>
      </div>

      {/* Card 3: Customers */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-full bg-[#43AAA9] text-white flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-right flex-1 pl-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Customers</span>
              <button className="text-slate-300 hover:text-slate-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="10" cy="4" r="1.5" />
                  <circle cx="10" cy="10" r="1.5" />
                  <circle cx="10" cy="16" r="1.5" />
                </svg>
              </button>
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1">256</div>
          </div>
        </div>
        <div className="mt-3 text-xs text-emerald-500 font-medium flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M5 10l7-7m0 0l7 7m-7-7v18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
          </svg>
          <span>5.4%</span> <span className="text-slate-400 font-normal">from yesterday</span>
        </div>
      </div>

      {/* Card 4: Avg. Order Value */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-full bg-[#43AAA9] text-white flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-right flex-1 pl-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Avg. Order Value</span>
              <button className="text-slate-300 hover:text-slate-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="10" cy="4" r="1.5" />
                  <circle cx="10" cy="10" r="1.5" />
                  <circle cx="10" cy="16" r="1.5" />
                </svg>
              </button>
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1">$38.22</div>
          </div>
        </div>
        <div className="mt-3 text-xs text-emerald-500 font-medium flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M5 10l7-7m0 0l7 7m-7-7v18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
          </svg>
          <span>3.1%</span> <span className="text-slate-400 font-normal">from yesterday</span>
        </div>
      </div>
    </section>
  );
};
