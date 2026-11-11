import React, { useState } from 'react';

type ReportTab = 'items' | 'journal' | 'payments' | 'expenses' | 'closings';
type DateFilter = 'today' | 'week' | 'month' | 'custom';

export const ReportsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('items');
  const [dateFilter, setDateFilter] = useState<DateFilter>('week');
  const [currentPage, setCurrentPage] = useState(1);

  // Dynamic filter state
  const handleResetFilters = () => {
    setDateFilter('week');
    setActiveTab('items');
    setCurrentPage(1);
  };

  const handlePrintSummary = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Item Code,Item Name,Category,Quantity Sold,Avg Price,Gross Revenue,Sales Share\n' +
      '#ITEM-0104,Chicken Biryani (Special),Rice & Biryani,364,500,182000,17.5%\n' +
      '#ITEM-0208,Chicken Karahi (Desi Ghee),Main Curries,196,800,156800,15.1%\n' +
      '#ITEM-0312,Mutton Seekh Kebab,BBQ & Grills,238,550,130900,12.6%\n' +
      '#ITEM-0402,Garlic Roghani Naan,Tandoor & Breads,602,80,48160,4.6%\n' +
      '#ITEM-0501,Fresh Mint Lemonade,Beverages,220,180,39600,3.8%';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DinePos_Reports_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col w-full space-y-6 select-none font-sans" data-purpose="reports-view">
      {/* BEGIN: Page Header & Filters Bar */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4" data-purpose="page-header">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Reports</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-200/70 text-slate-700 rounded-full">
              Analytics Desk
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Understand sales performance, payment channels, and restaurant operating costs.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Date Filter */}
          <div className="inline-flex p-1 bg-slate-200/70 rounded-xl text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                dateFilter === 'today' ? 'bg-[#3FA9A8] text-white font-semibold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('week')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                dateFilter === 'week' ? 'bg-[#3FA9A8] text-white font-semibold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('month')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                dateFilter === 'month' ? 'bg-[#3FA9A8] text-white font-semibold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('custom')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                dateFilter === 'custom' ? 'bg-[#3FA9A8] text-white font-semibold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <span>Custom</span>
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </button>
          </div>

          {/* Reset Filter */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            Reset
          </button>

          {/* Export Report */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            Export
          </button>

          {/* Print Summary Primary */}
          <button
            type="button"
            onClick={handlePrintSummary}
            className="px-3.5 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            Print Summary
          </button>
        </div>
      </section>
      {/* END: Page Header & Filters Bar */}

      {/* BEGIN: Key Performance Indicator (KPI) Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-purpose="metric-cards">
        {/* KPI 1: Total Sales */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between relative hover:border-[#3FA9A8] transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#3FA9A8]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M12 7v10m-3-6.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer" type="button">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="4" r="1.5"></circle>
                <circle cx="10" cy="10" r="1.5"></circle>
                <circle cx="10" cy="16" r="1.5"></circle>
              </svg>
            </button>
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-500 font-medium">This Week&apos;s Gross Sales</span>
            <div className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">Rs. 1,038,900</div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 10l7-7m0 0l7 7m-7-7v18" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>14.2%</span>
              <span className="text-slate-400 font-normal">from last week</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Completed Transactions */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between relative hover:border-[#3FA9A8] transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#3FA9A8]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer" type="button">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="4" r="1.5"></circle>
                <circle cx="10" cy="10" r="1.5"></circle>
                <circle cx="10" cy="16" r="1.5"></circle>
              </svg>
            </button>
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-500 font-medium">Completed Orders</span>
            <div className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">1,288</div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 10l7-7m0 0l7 7m-7-7v18" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>9.5%</span>
              <span className="text-slate-400 font-normal">from last week</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Average Bill Value */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between relative hover:border-[#3FA9A8] transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#3FA9A8]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer" type="button">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="4" r="1.5"></circle>
                <circle cx="10" cy="10" r="1.5"></circle>
                <circle cx="10" cy="16" r="1.5"></circle>
              </svg>
            </button>
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-500 font-medium">Average Ticket / Bill</span>
            <div className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">Rs. 806.60</div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 10l7-7m0 0l7 7m-7-7v18" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>4.1%</span>
              <span className="text-slate-400 font-normal">from last week</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Recorded Expenses */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between relative hover:border-[#3FA9A8] transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#3FA9A8]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer" type="button">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="4" r="1.5"></circle>
                <circle cx="10" cy="10" r="1.5"></circle>
                <circle cx="10" cy="16" r="1.5"></circle>
              </svg>
            </button>
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-500 font-medium">Recorded Expenses</span>
            <div className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">Rs. 127,400</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              <span>28 vouchers logged this week</span>
            </div>
          </div>
        </div>
      </section>
      {/* END: Key Performance Indicator Cards */}

      {/* BEGIN: Analytics Panels (Row 2: Top Selling, Category Share, Channels & Expenses) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5" data-purpose="charts-row-2">
        {/* Top Velocity Dishes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Top-Selling Dishes</h3>
                <p className="text-xs text-slate-400">High velocity weekly revenue drivers</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('items')}
                className="text-xs font-semibold text-[#3FA9A8] hover:underline cursor-pointer"
              >
                View Matrix →
              </button>
            </div>
            {/* List items */}
            <div className="divide-y divide-slate-100 mt-2 text-xs">
              {/* Item 1 */}
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] flex items-center justify-center">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">Chicken Biryani (Special)</p>
                    <p className="text-[11px] text-slate-400">364 orders logged</p>
                  </div>
                </div>
                <span className="font-bold text-slate-800">Rs. 182,000</span>
              </div>
              {/* Item 2 */}
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">Chicken Karahi (Desi Ghee)</p>
                    <p className="text-[11px] text-slate-400">196 orders logged</p>
                  </div>
                </div>
                <span className="font-bold text-slate-800">Rs. 156,800</span>
              </div>
              {/* Item 3 */}
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">Mutton Seekh Kebab</p>
                    <p className="text-[11px] text-slate-400">238 orders logged</p>
                  </div>
                </div>
                <span className="font-bold text-slate-800">Rs. 130,900</span>
              </div>
              {/* Item 4 */}
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                    4
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">Garlic Roghani Naan</p>
                    <p className="text-[11px] text-slate-400">602 orders logged</p>
                  </div>
                </div>
                <span className="font-bold text-slate-800">Rs. 48,160</span>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 text-right">
            <span className="text-[11px] text-slate-400">Top 4 dishes generate 50% of revenue</span>
          </div>
        </div>

        {/* Sales by Menu Category */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Sales by Category</h3>
                <p className="text-xs text-slate-400">Product family volume contribution</p>
              </div>
              <span className="text-xs text-slate-400 font-medium">5 Groups</span>
            </div>
            {/* Category Bars */}
            <div className="space-y-3 mt-3.5 text-xs">
              {/* Rice & Biryani */}
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Rice &amp; Biryani</span>
                  <span className="font-bold text-slate-800">
                    36% <span className="text-slate-400 font-normal">(Rs. 374k)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-[#3FA9A8] h-2 rounded-full transition-all duration-500" style={{ width: '36%' }}></div>
                </div>
              </div>
              {/* Main Curries */}
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Main Curries &amp; Karahi</span>
                  <span className="font-bold text-slate-800">
                    28% <span className="text-slate-400 font-normal">(Rs. 290k)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-teal-600 h-2 rounded-full transition-all duration-500" style={{ width: '28%' }}></div>
                </div>
              </div>
              {/* BBQ & Grills */}
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>BBQ &amp; Grills</span>
                  <span className="font-bold text-slate-800">
                    21% <span className="text-slate-400 font-normal">(Rs. 218k)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-500 h-2 rounded-full transition-all duration-500" style={{ width: '21%' }}></div>
                </div>
              </div>
              {/* Tandoor & Breads */}
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Tandoor &amp; Breads</span>
                  <span className="font-bold text-slate-800">
                    9% <span className="text-slate-400 font-normal">(Rs. 93k)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: '9%' }}></div>
                </div>
              </div>
              {/* Beverages */}
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Beverages &amp; Desserts</span>
                  <span className="font-bold text-slate-800">
                    6% <span className="text-slate-400 font-normal">(Rs. 62k)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-slate-400 h-2 rounded-full transition-all duration-500" style={{ width: '6%' }}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 text-xs text-slate-400">
            Updated in real-time from active registers
          </div>
        </div>

        {/* Order Channels & Expenses Summary */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Order Channels &amp; Outlays</h3>
                <p className="text-xs text-slate-400">Dining modes &amp; expense distribution</p>
              </div>
              <span className="text-xs text-slate-400">1,288 Orders</span>
            </div>
            {/* Order Channels Section */}
            <div className="mt-3 space-y-2.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Service Channels</span>
              {/* Dine-In */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-700 font-medium">Dine-In (876 orders)</span>
                  <span className="font-bold text-slate-800">
                    Rs. 706,450 <span className="text-slate-400 font-normal">(68%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-[#3FA9A8] h-2 rounded-full transition-all duration-500" style={{ width: '68%' }}></div>
                </div>
              </div>
              {/* Takeaway / Counter */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-700 font-medium">Takeaway / Counter (412 orders)</span>
                  <span className="font-bold text-slate-800">
                    Rs. 332,450 <span className="text-slate-400 font-normal">(32%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-400 h-2 rounded-full transition-all duration-500" style={{ width: '32%' }}></div>
                </div>
              </div>
            </div>
            {/* Expense Category Split Section */}
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Expense Breakdown (Rs. 127,400)
              </span>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Kitchen Raw Supplies</span>
                <span className="font-semibold text-slate-800">
                  Rs. 81,500 <span className="text-slate-400 text-[11px] font-normal">(64%)</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Utilities, Gas Refill &amp; Power</span>
                <span className="font-semibold text-slate-800">
                  Rs. 28,000 <span className="text-slate-400 text-[11px] font-normal">(22%)</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Staff Meals &amp; Petty Cash</span>
                <span className="font-semibold text-slate-800">
                  Rs. 17,900 <span className="text-slate-400 text-[11px] font-normal">(14%)</span>
                </span>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 text-[11px] text-amber-700 bg-amber-50/70 p-2 rounded-lg mt-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>COGS pending inventory count; gross sales minus expense is not net profit.</span>
          </div>
        </div>
      </section>
      {/* END: Analytics Panels Row 2 */}

      {/* BEGIN: Detailed Reports Table Section with Sub-Navigation Tabs */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" data-purpose="detailed-report-table">
        {/* Segmented Tab Navigation */}
        <div className="px-6 pt-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1 overflow-x-auto text-xs font-semibold">
            {/* Tabs */}
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={`px-3.5 py-2.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'items'
                  ? 'border-b-2 border-[#3FA9A8] text-[#3FA9A8] font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:border-b-2 hover:border-slate-300'
              }`}
            >
              Item-wise Sales Breakdown
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('journal')}
              className={`px-3.5 py-2.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'journal'
                  ? 'border-b-2 border-[#3FA9A8] text-[#3FA9A8] font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:border-b-2 hover:border-slate-300'
              }`}
            >
              Daily Sales Journal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`px-3.5 py-2.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'payments'
                  ? 'border-b-2 border-[#3FA9A8] text-[#3FA9A8] font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:border-b-2 hover:border-slate-300'
              }`}
            >
              Payment Reconciliation
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className={`px-3.5 py-2.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'expenses'
                  ? 'border-b-2 border-[#3FA9A8] text-[#3FA9A8] font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:border-b-2 hover:border-slate-300'
              }`}
            >
              Expense Audit Register
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('closings')}
              className={`px-3.5 py-2.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'closings'
                  ? 'border-b-2 border-[#3FA9A8] text-[#3FA9A8] font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:border-b-2 hover:border-slate-300'
              }`}
            >
              Cash Closing Records
            </button>
          </div>

          {/* Table Specific Search/Filter */}
          <div className="pb-2.5 sm:pb-0">
            <span className="text-xs text-slate-400 font-medium">Showing top 5 of 48 items</span>
          </div>
        </div>

        {/* Table Data Content */}
        <div className="overflow-x-auto">
          {activeTab === 'items' && (
            <table className="w-full text-left text-xs" id="item-sales-table">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6" scope="col">Item Code &amp; Name</th>
                  <th className="py-3 px-6" scope="col">Category</th>
                  <th className="py-3 px-6 text-center" scope="col">Quantity Sold</th>
                  <th className="py-3 px-6 text-right" scope="col">Avg Unit Price</th>
                  <th className="py-3 px-6 text-right" scope="col">Gross Revenue</th>
                  <th className="py-3 px-6 text-right" scope="col">Sales Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {/* Row 1 */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <div>
                      <p className="font-bold">Chicken Biryani (Special)</p>
                      <span className="text-[11px] text-slate-400">#ITEM-0104 • Full Plate</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[11px] font-medium border border-teal-200/50">
                      Rice &amp; Biryani
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-center font-bold text-slate-800">364</td>
                  <td className="py-3.5 px-6 text-right text-slate-600">Rs. 500</td>
                  <td className="py-3.5 px-6 text-right font-bold text-slate-900">Rs. 182,000</td>
                  <td className="py-3.5 px-6 text-right font-semibold text-emerald-600">17.5%</td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <div>
                      <p className="font-bold">Chicken Karahi (Desi Ghee)</p>
                      <span className="text-[11px] text-slate-400">#ITEM-0208 • Half Portion</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200/50">
                      Main Curries
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-center font-bold text-slate-800">196</td>
                  <td className="py-3.5 px-6 text-right text-slate-600">Rs. 800</td>
                  <td className="py-3.5 px-6 text-right font-bold text-slate-900">Rs. 156,800</td>
                  <td className="py-3.5 px-6 text-right font-semibold text-emerald-600">15.1%</td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <div>
                      <p className="font-bold">Mutton Seekh Kebab</p>
                      <span className="text-[11px] text-slate-400">#ITEM-0312 • 4 Skewers</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium border border-amber-200/50">
                      BBQ &amp; Grills
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-center font-bold text-slate-800">238</td>
                  <td className="py-3.5 px-6 text-right text-slate-600">Rs. 550</td>
                  <td className="py-3.5 px-6 text-right font-bold text-slate-900">Rs. 130,900</td>
                  <td className="py-3.5 px-6 text-right font-semibold text-emerald-600">12.6%</td>
                </tr>

                {/* Row 4 */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <div>
                      <p className="font-bold">Garlic Roghani Naan</p>
                      <span className="text-[11px] text-slate-400">#ITEM-0402 • Freshly Baked</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-[11px] font-medium border border-orange-200/50">
                      Tandoor &amp; Breads
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-center font-bold text-slate-800">602</td>
                  <td className="py-3.5 px-6 text-right text-slate-600">Rs. 80</td>
                  <td className="py-3.5 px-6 text-right font-bold text-slate-900">Rs. 48,160</td>
                  <td className="py-3.5 px-6 text-right font-semibold text-emerald-600">4.6%</td>
                </tr>

                {/* Row 5 */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <div>
                      <p className="font-bold">Fresh Mint Lemonade</p>
                      <span className="text-[11px] text-slate-400">#ITEM-0501 • Chilled Jug</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-200/50">
                      Beverages
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-center font-bold text-slate-800">220</td>
                  <td className="py-3.5 px-6 text-right text-slate-600">Rs. 180</td>
                  <td className="py-3.5 px-6 text-right font-bold text-slate-900">Rs. 39,600</td>
                  <td className="py-3.5 px-6 text-right font-semibold text-emerald-600">3.8%</td>
                </tr>
              </tbody>
            </table>
          )}

          {activeTab === 'journal' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Date &amp; Day</th>
                  <th className="py-3 px-6 text-center">Orders</th>
                  <th className="py-3 px-6 text-right">Cash Sales</th>
                  <th className="py-3 px-6 text-right">Card / Digital</th>
                  <th className="py-3 px-6 text-right">Gross Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-6 font-bold text-slate-900">Today (Thursday)</td>
                  <td className="py-3.5 px-6 text-center font-bold text-slate-800">184</td>
                  <td className="py-3.5 px-6 text-right text-slate-700">Rs. 86,100</td>
                  <td className="py-3.5 px-6 text-right text-slate-700">Rs. 56,410</td>
                  <td className="py-3.5 px-6 text-right font-bold text-emerald-700">Rs. 142,510</td>
                </tr>
                <tr className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-6 font-bold text-slate-900">Yesterday (Wednesday)</td>
                  <td className="py-3.5 px-6 text-center font-bold text-slate-800">198</td>
                  <td className="py-3.5 px-6 text-right text-slate-700">Rs. 92,340</td>
                  <td className="py-3.5 px-6 text-right text-slate-700">Rs. 62,100</td>
                  <td className="py-3.5 px-6 text-right font-bold text-emerald-700">Rs. 154,440</td>
                </tr>
                <tr className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-6 font-bold text-slate-900">Tuesday</td>
                  <td className="py-3.5 px-6 text-center font-bold text-slate-800">172</td>
                  <td className="py-3.5 px-6 text-right text-slate-700">Rs. 81,200</td>
                  <td className="py-3.5 px-6 text-right text-slate-700">Rs. 51,900</td>
                  <td className="py-3.5 px-6 text-right font-bold text-emerald-700">Rs. 133,100</td>
                </tr>
              </tbody>
            </table>
          )}

          {activeTab === 'payments' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Tender Channel</th>
                  <th className="py-3 px-6 text-center">Transactions</th>
                  <th className="py-3 px-6 text-right">Gross Collections</th>
                  <th className="py-3 px-6 text-right">Volume Share</th>
                  <th className="py-3 px-6 text-center">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-6 font-bold text-slate-900">Cash Counter (Station 1 &amp; 2)</td>
                  <td className="py-3.5 px-6 text-center">642</td>
                  <td className="py-3.5 px-6 text-right font-bold text-slate-900">Rs. 518,400</td>
                  <td className="py-3.5 px-6 text-right text-emerald-600 font-bold">49.9%</td>
                  <td className="py-3.5 px-6 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">Immediate Drawer</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-6 font-bold text-slate-900">JazzCash Merchant QR</td>
                  <td className="py-3.5 px-6 text-center">312</td>
                  <td className="py-3.5 px-6 text-right font-bold text-slate-900">Rs. 268,200</td>
                  <td className="py-3.5 px-6 text-right text-emerald-600 font-bold">25.8%</td>
                  <td className="py-3.5 px-6 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold">Direct Wallet T+0</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-6 font-bold text-slate-900">Easypaisa Merchant QR</td>
                  <td className="py-3.5 px-6 text-center">244</td>
                  <td className="py-3.5 px-6 text-right font-bold text-slate-900">Rs. 189,400</td>
                  <td className="py-3.5 px-6 text-right text-emerald-600 font-bold">18.2%</td>
                  <td className="py-3.5 px-6 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-semibold">Direct Wallet T+0</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-6 font-bold text-slate-900">Debit / Credit Card POS</td>
                  <td className="py-3.5 px-6 text-center">90</td>
                  <td className="py-3.5 px-6 text-right font-bold text-slate-900">Rs. 62,900</td>
                  <td className="py-3.5 px-6 text-right text-emerald-600 font-bold">6.1%</td>
                  <td className="py-3.5 px-6 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold">Bank Batch T+1</span>
                  </td>
                </tr>
              </tbody>
            </table>
          )}

          {activeTab === 'expenses' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Expense Category</th>
                  <th className="py-3 px-6 text-center">Vouchers Count</th>
                  <th className="py-3 px-6 text-right">Drawer Paid</th>
                  <th className="py-3 px-6 text-right">Petty Safe Paid</th>
                  <th className="py-3 px-6 text-right">Total Outlays</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-6 font-bold text-slate-900">Kitchen Raw Supplies (Poultry, Meat, Spices)</td>
                  <td className="py-3.5 px-6 text-center">14</td>
                  <td className="py-3.5 px-6 text-right text-slate-700">Rs. 68,000</td>
                  <td className="py-3.5 px-6 text-right text-slate-700">Rs. 13,500</td>
                  <td className="py-3.5 px-6 text-right font-bold text-rose-600">Rs. 81,500</td>
                </tr>
                <tr className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-6 font-bold text-slate-900">Utilities, LPG Gas Cylinders &amp; Diesel</td>
                  <td className="py-3.5 px-6 text-center">6</td>
                  <td className="py-3.5 px-6 text-right text-slate-700">Rs. 12,000</td>
                  <td className="py-3.5 px-6 text-right text-slate-700">Rs. 16,000</td>
                  <td className="py-3.5 px-6 text-right font-bold text-rose-600">Rs. 28,000</td>
                </tr>
                <tr className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-6 font-bold text-slate-900">Staff Meals &amp; Refreshments</td>
                  <td className="py-3.5 px-6 text-center">8</td>
                  <td className="py-3.5 px-6 text-right text-slate-700">Rs. 14,200</td>
                  <td className="py-3.5 px-6 text-right text-slate-700">Rs. 3,700</td>
                  <td className="py-3.5 px-6 text-right font-bold text-rose-600">Rs. 17,900</td>
                </tr>
              </tbody>
            </table>
          )}

          {activeTab === 'closings' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Shift &amp; Date</th>
                  <th className="py-3 px-6">Cashier</th>
                  <th className="py-3 px-6 text-right">Expected Cash</th>
                  <th className="py-3 px-6 text-right">Counted Cash</th>
                  <th className="py-3 px-6 text-center">Variance</th>
                  <th className="py-3 px-6 text-center">Z-Report #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-6 font-bold text-slate-900">Yesterday • Evening Shift</td>
                  <td className="py-3.5 px-6">Asim Khan</td>
                  <td className="py-3.5 px-6 text-right">Rs. 92,340</td>
                  <td className="py-3.5 px-6 text-right font-bold text-slate-900">Rs. 92,340</td>
                  <td className="py-3.5 px-6 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">Rs. 0 (Balanced)</span>
                  </td>
                  <td className="py-3.5 px-6 text-center font-mono">#Z-2024-0088</td>
                </tr>
                <tr className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-6 font-bold text-slate-900">Yesterday • Morning Shift</td>
                  <td className="py-3.5 px-6">John Doe</td>
                  <td className="py-3.5 px-6 text-right">Rs. 61,120</td>
                  <td className="py-3.5 px-6 text-right font-bold text-slate-900">Rs. 61,120</td>
                  <td className="py-3.5 px-6 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">Rs. 0 (Balanced)</span>
                  </td>
                  <td className="py-3.5 px-6 text-center font-mono">#Z-2024-0087</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Table Footer and Pagination Controls */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Sample illustrative figures • Sourced from local SQLite audit database</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
            >
              Previous
            </button>
            <span className="px-2 font-medium text-slate-800">Page {currentPage} of 10</span>
            <button
              type="button"
              disabled={currentPage >= 10}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>
      {/* END: Detailed Reports Table Section */}
    </div>
  );
};
