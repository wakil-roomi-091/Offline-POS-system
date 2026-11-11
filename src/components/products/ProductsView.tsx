import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useUIStore } from '../../store/useUIStore';
import type { Product } from '../../types';

const EMPTY_PRODUCTS: Product[] = [];

export const ProductsView: React.FC = () => {
  const { setProductFormModalOpen, setEditingProduct } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [sortOption, setSortOption] = useState<'name-asc' | 'price-desc' | 'price-asc' | 'most-ordered'>('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const pageSize = 7;

  const products = useLiveQuery(() => db.products.toArray(), []) ?? EMPTY_PRODUCTS;

  // Metrics computation
  const totalItems = products.length;
  const availableCount = products.filter((p) => p.isAvailable).length;
  const outOfStockCount = totalItems - availableCount;
  const availablePct = totalItems > 0 ? ((availableCount / totalItems) * 100).toFixed(1) : '100';

  // Unique categories
  const categoriesList = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return cats.length > 0
      ? cats
      : ['Rice & Biryani', 'Main Curries & Karahi', 'BBQ & Grills', 'Tandoor & Breads', 'Beverages', 'Desserts & Sweets', 'Extras & Condiments'];
  }, [products]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Availability filter
    if (statusFilter === 'available') {
      result = result.filter((p) => p.isAvailable);
    } else if (statusFilter === 'unavailable') {
      result = result.filter((p) => !p.isAvailable);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortOption === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortOption === 'price-desc') {
        return (b.price || 0) - (a.price || 0);
      }
      if (sortOption === 'price-asc') {
        return (a.price || 0) - (b.price || 0);
      }
      if (sortOption === 'most-ordered') {
        return (b.stock || 0) - (a.stock || 0);
      }
      return 0;
    });

    return result;
  }, [products, searchQuery, selectedCategory, statusFilter, sortOption]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProductIds(paginatedProducts.map((p) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((item) => item !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const handleToggleAvailability = async (product: Product) => {
    await db.products.update(product.id, { isAvailable: !product.isAvailable });
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setProductFormModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setProductFormModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await db.products.delete(id);
      setSelectedProductIds(selectedProductIds.filter((i) => i !== id));
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `DinePos_Menu_Catalog_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setStatusFilter('all');
    setSortOption('name-asc');
    setCurrentPage(1);
  };

  // Category badge style generator
  const getCategoryBadgeClass = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('rice') || cat.includes('biryani')) {
      return 'bg-amber-50 text-amber-800 border-amber-200/60';
    }
    if (cat.includes('curry') || cat.includes('karahi')) {
      return 'bg-rose-50 text-rose-800 border-rose-200/60';
    }
    if (cat.includes('bbq') || cat.includes('grill')) {
      return 'bg-yellow-50 text-yellow-800 border-yellow-200/60';
    }
    if (cat.includes('tandoor') || cat.includes('bread') || cat.includes('naan')) {
      return 'bg-stone-100 text-stone-800 border-stone-200';
    }
    if (cat.includes('beverage') || cat.includes('drink') || cat.includes('chai')) {
      return 'bg-blue-50 text-blue-700 border-blue-200/60';
    }
    if (cat.includes('dessert') || cat.includes('sweet')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Icon badge background color generator
  const getIconContainerClass = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('rice') || cat.includes('biryani')) {
      return 'bg-orange-100 text-orange-600 border-orange-200';
    }
    if (cat.includes('curry') || cat.includes('karahi')) {
      return 'bg-red-100 text-red-600 border-red-200';
    }
    if (cat.includes('bbq') || cat.includes('grill')) {
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
    if (cat.includes('tandoor') || cat.includes('bread')) {
      return 'bg-amber-100 text-amber-700 border-amber-200';
    }
    if (cat.includes('beverage') || cat.includes('drink')) {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    }
    if (cat.includes('extra') || cat.includes('condiment')) {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
    return 'bg-teal-50 text-[#3FA9A8] border-teal-200';
  };

  return (
    <div className="flex flex-col gap-6 select-none font-sans" data-purpose="products-management">
      {/* BEGIN: Products Header & Summary Bar */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" data-purpose="products-header">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Products</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage your restaurant menu, prices, and availability.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            type="button"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>Import / Export</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 bg-[#3FA9A8] hover:bg-[#349695] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all cursor-pointer active:scale-98"
            type="button"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>Add Product</span>
          </button>
        </div>
      </section>
      {/* END: Products Header & Summary Bar */}

      {/* BEGIN: Metric Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-purpose="metrics-summary">
        {/* Metric 1: Total Items */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Menu Items</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{totalItems} Items</p>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
              <span>+3 new this month</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-[#3FA9A8] flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
        </div>

        {/* Metric 2: Active Available */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Active Available</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{availableCount} Available</p>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
              <span>{availablePct}% ready to order</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
        </div>

        {/* Metric 3: Out of Stock */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Out of Stock / 86'd</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{outOfStockCount} Disabled</p>
            <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium mt-1">
              <span>Immediate restock needed</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
        </div>

        {/* Metric 4: Categories */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Categories</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{categoriesList.length} Categories</p>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-1 truncate max-w-[170px]">
              <span>Biryani, Karahi, BBQ &amp; more</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-[#3FA9A8] flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
        </div>
      </section>
      {/* END: Metric Summary Cards */}

      {/* BEGIN: Filter & Action Bar */}
      <section className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3" data-purpose="table-filter-toolbar">
        {/* Search and Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search in Table */}
          <div className="relative w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </span>
            <input
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] focus:border-[#3FA9A8]"
              placeholder="Search product name, code, SKU..."
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Category Selector */}
          <select
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] cursor-pointer"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All">All Categories ({categoriesList.length})</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Availability Filter */}
          <select
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] cursor-pointer"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
          >
            <option value="all">Status: All ({totalItems})</option>
            <option value="available">Available Only ({availableCount})</option>
            <option value="unavailable">Unavailable / 86'd ({outOfStockCount})</option>
          </select>

          {/* Sort Filter */}
          <select
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] cursor-pointer"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
          >
            <option value="name-asc">Sort: Name A-Z</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="most-ordered">Most Stocked</option>
          </select>

          {/* Reset Filter */}
          {(searchQuery || selectedCategory !== 'All' || statusFilter !== 'all') && (
            <button
              onClick={clearFilters}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1 transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* View Options / Export Quick Action */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            Total shown: <strong className="text-slate-700">{filteredProducts.length} of {totalItems}</strong>
          </span>
          <button 
            type="button"
            onClick={clearFilters}
            className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
            title="Refresh table view"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 4h18M3 10h18M3 16h18" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </button>
        </div>
      </section>
      {/* END: Filter & Action Bar */}

      {/* BEGIN: Products Table */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col" data-purpose="products-data-table">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 w-12 text-center">
                  <input
                    className="rounded border-slate-300 text-[#3FA9A8] focus:ring-[#3FA9A8]"
                    type="checkbox"
                    checked={paginatedProducts.length > 0 && selectedProductIds.length === paginatedProducts.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="py-3.5 px-4">Product Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Size / Variations</th>
                <th className="py-3.5 px-4">Selling Price</th>
                <th className="py-3.5 px-4">Availability</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No products found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const isChecked = selectedProductIds.includes(p.id);
                  const isUnavailable = !p.isAvailable;
                  const iconStyleClass = getIconContainerClass(p.category);
                  const categoryBadgeClass = getCategoryBadgeClass(p.category);

                  // Variations display
                  let variationsDisplay = p.portionSize || 'Standard Portion';
                  if (p.isMultiSize && p.variations && p.variations.length > 0) {
                    variationsDisplay = `${p.variations.map((v) => v.name).join(' / ')} (${p.variations.length} Variations)`;
                  }

                  // Price display
                  let priceDisplay: React.ReactNode = <span>Rs. {p.price.toLocaleString()}</span>;
                  if (p.isComplimentary) {
                    priceDisplay = <span className="text-emerald-700 font-bold">Rs. 0 (Free)</span>;
                  } else if (p.isMultiSize && p.variations && p.variations.length > 1) {
                    const prices = p.variations.map((v) => v.price).sort((a, b) => a - b);
                    priceDisplay = (
                      <>
                        <span className="font-bold text-slate-900">Rs. {prices[0].toLocaleString()}</span>
                        <span className="text-slate-400 font-normal text-[11px]"> – Rs. {prices[prices.length - 1].toLocaleString()}</span>
                      </>
                    );
                  }

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        isUnavailable ? 'bg-slate-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          className="rounded border-slate-300 text-[#3FA9A8] focus:ring-[#3FA9A8]"
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(p.id)}
                        />
                      </td>

                      {/* Product Details */}
                      <td className={`py-3.5 px-4 ${isUnavailable ? 'opacity-75' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shrink-0 border ${iconStyleClass}`}
                          >
                            {p.icon || '🍽️'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-semibold text-slate-900 text-sm ${
                                  isUnavailable ? 'line-through' : ''
                                }`}
                              >
                                {p.name}
                              </span>
                              {isUnavailable ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                  86'd (Out of Stock)
                                </span>
                              ) : p.dietaryTag ? (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                    p.dietaryTag === 'Veg' || p.dietaryTag === 'Vegetarian'
                                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                      : 'bg-red-50 text-red-600 border-red-100'
                                  }`}
                                >
                                  {p.dietaryTag}
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600 border border-red-100">
                                  Non-Veg
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                              SKU: {p.sku || `#PRD-${p.id.slice(-4)}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className={`py-3.5 px-4 ${isUnavailable ? 'opacity-75' : ''}`}>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${categoryBadgeClass}`}>
                          {p.category}
                        </span>
                      </td>

                      {/* Size / Variations */}
                      <td className={`py-3.5 px-4 text-slate-600 font-medium ${isUnavailable ? 'text-slate-500' : ''}`}>
                        {variationsDisplay}
                      </td>

                      {/* Selling Price */}
                      <td className={`py-3.5 px-4 ${isUnavailable ? 'opacity-75' : ''}`}>
                        {priceDisplay}
                      </td>

                      {/* Availability Toggle */}
                      <td className="py-3.5 px-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={p.isAvailable}
                            onChange={() => handleToggleAvailability(p)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3FA9A8]"></div>
                          <span
                            className={`ml-2 text-[11px] font-medium ${
                              p.isAvailable ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                          >
                            {p.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </label>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Item"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round"></path>
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Item"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="1.5"></circle>
                              <circle cx="6" cy="12" r="1.5"></circle>
                              <circle cx="18" cy="12" r="1.5"></circle>
                            </svg>
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

        {/* Table Footer / Pagination */}
        <div className="border-t border-slate-200 px-4 py-3 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{filteredProducts.length === 0 ? 0 : startIndex + 1}</span> to{' '}
            <span className="font-semibold text-slate-700">
              {Math.min(startIndex + pageSize, filteredProducts.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-700">{filteredProducts.length}</span> products
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage === 1}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-white text-slate-400 hover:text-slate-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setCurrentPage(pageNumber)}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  validCurrentPage === pageNumber
                    ? 'bg-[#3FA9A8] text-white shadow-xs'
                    : 'border border-slate-200 hover:bg-white text-slate-700'
                }`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage === totalPages}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </button>
          </div>
        </div>
      </section>
      {/* END: Products Table */}
    </div>
  );
};
