import React, { useState, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useUIStore } from '../../store/useUIStore';
import type { Product, OrderBookingSheet } from '../../types';
import { 
  Plus, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  AlertTriangle, 
  TrendingUp, 
  Coins, 
  Package, 
  RefreshCw, 
  Search, 
  X, 
  CheckCircle2, 
  MinusCircle,
  PlusCircle,
  FileText
} from 'lucide-react';

const EMPTY_PRODUCTS: Product[] = [];

export const ProductsView: React.FC = () => {
  const { setProductFormModalOpen, setEditingProduct } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock' | 'unavailable'>('all');
  const [sortOption, setSortOption] = useState<'name-asc' | 'price-desc' | 'price-asc' | 'stock-desc' | 'margin-desc'>('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const pageSize = 7;

  // Modals state
  const [showCsvHub, setShowCsvHub] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [csvFeedback, setCsvFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const products = useLiveQuery(() => db.products.toArray(), []) ?? EMPTY_PRODUCTS;

  // Inventory Valuation & Financial Margin Metrics
  const inventoryStats = useMemo(() => {
    let costValuation = 0;
    let retailValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of products) {
      const stock = p.stock || 0;
      const cost = p.costPrice ?? Math.round(p.price * 0.45);
      const threshold = p.lowStockThreshold ?? 10;

      costValuation += stock * cost;
      retailValuation += stock * p.price;

      if (!p.isAvailable || stock === 0) {
        outOfStockCount++;
      } else if (stock <= threshold) {
        lowStockCount++;
      }
    }

    const potentialGrossProfit = Math.max(0, retailValuation - costValuation);
    const avgMarginPct = retailValuation > 0 ? ((potentialGrossProfit / retailValuation) * 100).toFixed(1) : '0.0';

    return {
      totalItems: products.length,
      costValuation,
      retailValuation,
      potentialGrossProfit,
      avgMarginPct,
      lowStockCount,
      outOfStockCount,
      healthyCount: products.length - lowStockCount - outOfStockCount
    };
  }, [products]);

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
          p.category.toLowerCase().includes(q) ||
          (p.supplierName && p.supplierName.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Stock & Availability filter
    if (stockStatusFilter === 'in-stock') {
      result = result.filter((p) => p.isAvailable && (p.stock || 0) > (p.lowStockThreshold ?? 10));
    } else if (stockStatusFilter === 'low-stock') {
      result = result.filter((p) => p.isAvailable && (p.stock || 0) > 0 && (p.stock || 0) <= (p.lowStockThreshold ?? 10));
    } else if (stockStatusFilter === 'out-of-stock') {
      result = result.filter((p) => !p.isAvailable || (p.stock || 0) === 0);
    } else if (stockStatusFilter === 'unavailable') {
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
      if (sortOption === 'stock-desc') {
        return (b.stock || 0) - (a.stock || 0);
      }
      if (sortOption === 'margin-desc') {
        const marginA = a.price > 0 ? (((a.price - (a.costPrice ?? a.price * 0.45)) / a.price) * 100) : 0;
        const marginB = b.price > 0 ? (((b.price - (b.costPrice ?? b.price * 0.45)) / b.price) * 100) : 0;
        return marginB - marginA;
      }
      return 0;
    });

    return result;
  }, [products, searchQuery, selectedCategory, stockStatusFilter, sortOption]);

  // Low stock restock candidate items
  const restockCandidates = useMemo(() => {
    return products.filter((p) => {
      const stock = p.stock || 0;
      const threshold = p.lowStockThreshold ?? 10;
      return stock <= threshold;
    });
  }, [products]);

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

  const handleQuickAdjustStock = async (product: Product, delta: number) => {
    const newStock = Math.max(0, (product.stock || 0) + delta);
    await db.products.update(product.id, {
      stock: newStock,
      isAvailable: newStock > 0 ? product.isAvailable : false
    });
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

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'SKU',
      'Name',
      'Category',
      'SellingPrice',
      'CostPrice',
      'Stock',
      'LowStockThreshold',
      'Supplier',
      'DietaryTag',
      'IsAvailable',
      'PortionSize'
    ];

    const rows = products.map((p) => [
      `"${p.id}"`,
      `"${p.sku || ''}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.price,
      p.costPrice || 0,
      p.stock || 0,
      p.lowStockThreshold || 10,
      `"${(p.supplierName || '').replace(/"/g, '""')}"`,
      `"${p.dietaryTag || 'Non-Veg'}"`,
      p.isAvailable ? 'TRUE' : 'FALSE',
      `"${p.portionSize || 'Standard'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DinePos_Inventory_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download Sample Template
  const handleDownloadSampleCSV = () => {
    const sampleHeaders = 'ID,SKU,Name,Category,SellingPrice,CostPrice,Stock,LowStockThreshold,Supplier,DietaryTag,IsAvailable,PortionSize\r\n';
    const sampleRow1 = '"p101","#PRD-SAMPLE-1","Mutton Karahi Special","Main Curries & Karahi",1450,750,24,10,"Madina Halal Meats","Non-Veg",TRUE,"Half / Full"\r\n';
    const sampleRow2 = '"p102","#PRD-SAMPLE-2","Kandhari Naan","Tandoor & Breads",110,35,80,20,"Punjab Flour Mills","Veg",TRUE,"Standard"\r\n';
    const blob = new Blob(['\uFEFF' + sampleHeaders + sampleRow1 + sampleRow2], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DinePos_Sample_Inventory_Template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // CSV Import
  const handleImportCSVSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

        if (lines.length < 2) {
          setCsvFeedback('Error: File is empty or lacks data rows.');
          return;
        }

        const newItems: Product[] = [];
        let updatedCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map((val) => val.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 5) {
            const id = parts[0] || `p-${Date.now()}-${i}`;
            const sku = parts[1] || `#PRD-${i + 1000}`;
            const name = parts[2] || `Imported Item ${i}`;
            const category = parts[3] || 'Main Curries & Karahi';
            const price = parseFloat(parts[4]) || 0;
            const costPrice = parseFloat(parts[5]) || Math.round(price * 0.45);
            const stock = parseInt(parts[6]) || 50;
            const lowStockThreshold = parseInt(parts[7]) || 10;
            const supplierName = parts[8] || 'Local Vendor';
            const dietaryTag = parts[9] || 'Non-Veg';
            const isAvailable = parts[10] ? parts[10].toUpperCase() === 'TRUE' : true;
            const portionSize = parts[11] || 'Standard Portion';

            const prod: Product = {
              id,
              sku,
              name,
              category,
              price,
              costPrice,
              stock,
              lowStockThreshold,
              supplierName,
              dietaryTag,
              isAvailable,
              portionSize,
              icon: '🍽️',
              isMultiSize: false
            };

            newItems.push(prod);
            updatedCount++;
          }
        }

        if (newItems.length > 0) {
          await db.products.bulkPut(newItems);
          setCsvFeedback(`✓ Successfully imported & synchronized ${updatedCount} products into database!`);
        }
      } catch (err: any) {
        setCsvFeedback(`Error importing CSV: ${err?.message || 'Invalid format'}`);
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Generate Restock Procurement Sheet
  const handleGenerateRestockPO = async () => {
    if (restockCandidates.length === 0) {
      alert('All inventory items are currently at healthy stock levels!');
      return;
    }

    const orderNumber = Math.floor(1000 + Math.random() * 9000);
    const slipId = `#PO-RESTOCK-${orderNumber}`;
    const physicalSlipNo = `#RS-${orderNumber}`;
    const items = restockCandidates.map((p, idx) => {
      const neededQty = Math.max(20, 50 - (p.stock || 0));
      const unitCost = p.costPrice || Math.round(p.price * 0.45);
      return {
        id: `item-${idx + 1}`,
        name: p.name,
        variation: 'Bulk Supply Restock',
        unitPrice: unitCost,
        qty: neededQty,
        total: neededQty * unitCost
      };
    });

    const totalPOValue = items.reduce((sum, i) => sum + i.total, 0);
    const totalQty = items.reduce((sum, i) => sum + i.qty, 0);

    const sheet: OrderBookingSheet = {
      id: slipId,
      physicalSlipNo,
      dateTime: 'Today, Just Now',
      bookerName: 'Inventory Restock Manager',
      bookerId: '#BKR-SYSTEM',
      bookerZone: 'Warehouse Procurement Hub',
      shopName: 'Central Restaurant Kitchen & Store',
      shopAddress: 'Internal Store Replenishment Dept',
      areaZone: 'Kitchen Stockroom',
      itemsCount: items.length,
      skusCount: items.length,
      totalQty,
      bookingValue: totalPOValue,
      status: 'Recorded',
      targetDispatchTime: 'Tomorrow Early Morning',
      managerNotes: `Automated inventory replenishment PO for ${items.length} depleted menu items.`,
      items
    };

    await db.bookingSheets.put(sheet);
    alert(`Restock Procurement Order ${physicalSlipNo} created successfully with ${items.length} items (Total: Rs. ${totalPOValue.toLocaleString()})!\nArchived in Order Booking sheets.`);
    setShowRestockModal(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setStockStatusFilter('all');
    setSortOption('name-asc');
    setCurrentPage(1);
  };

  // Category badge style generator
  const getCategoryBadgeClass = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('rice') || cat.includes('biryani')) return 'bg-amber-50 text-amber-800 border-amber-200/60';
    if (cat.includes('curry') || cat.includes('karahi')) return 'bg-rose-50 text-rose-800 border-rose-200/60';
    if (cat.includes('bbq') || cat.includes('grill')) return 'bg-yellow-50 text-yellow-800 border-yellow-200/60';
    if (cat.includes('tandoor') || cat.includes('bread') || cat.includes('naan')) return 'bg-stone-100 text-stone-800 border-stone-200';
    if (cat.includes('beverage') || cat.includes('drink') || cat.includes('chai')) return 'bg-blue-50 text-blue-700 border-blue-200/60';
    if (cat.includes('dessert') || cat.includes('sweet')) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Icon badge background
  const getIconContainerClass = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('rice') || cat.includes('biryani')) return 'bg-orange-100 text-orange-600 border-orange-200';
    if (cat.includes('curry') || cat.includes('karahi')) return 'bg-red-100 text-red-600 border-red-200';
    if (cat.includes('bbq') || cat.includes('grill')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (cat.includes('tandoor') || cat.includes('bread')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (cat.includes('beverage') || cat.includes('drink')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (cat.includes('extra') || cat.includes('condiment')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    return 'bg-teal-50 text-[#3FA9A8] border-teal-200';
  };

  return (
    <div className="flex flex-col gap-6 select-none font-sans" data-purpose="products-management">
      {/* BEGIN: Products Header & Summary Bar */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" data-purpose="products-header">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory &amp; Products</h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {inventoryStats.totalItems} Active Items
            </span>
            {inventoryStats.lowStockCount > 0 && (
              <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                {inventoryStats.lowStockCount} Low Stock
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock deduction, inventory valuation, cost accounting (COGS), profit margins &amp; bulk catalog management.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowRestockModal(true)}
            className="inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-100/80 border border-amber-300 text-amber-800 px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
            type="button"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Restock PO Alerts ({inventoryStats.lowStockCount})</span>
          </button>

          <button
            onClick={() => setShowCsvHub(true)}
            className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            type="button"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Import / Export CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 bg-[#3FA9A8] hover:bg-[#349695] active:bg-[#2A7978] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all cursor-pointer active:scale-98"
            type="button"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Add Product</span>
          </button>
        </div>
      </section>
      {/* END: Products Header & Summary Bar */}

      {/* BEGIN: Enhanced Inventory Valuation & Margin Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-purpose="metrics-summary">
        {/* Metric 1: Cost Valuation (COGS Assets) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Inventory Cost Value (COGS)</p>
            <p className="text-xl font-bold text-slate-900 mt-1">Rs. {inventoryStats.costValuation.toLocaleString()}</p>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-1">
              <span>Retail Value: Rs. {inventoryStats.retailValuation.toLocaleString()}</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-[#3FA9A8] flex items-center justify-center">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Estimated Gross Margin % */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Average Profit Margin</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{inventoryStats.avgMarginPct}% Margin</p>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium mt-1">
              <span>Potential Profit: Rs. {inventoryStats.potentialGrossProfit.toLocaleString()}</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Low Stock & Out of Stock Alerts */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Depleted &amp; Low Stock</p>
            <p className="text-xl font-bold text-amber-600 mt-1">
              {inventoryStats.lowStockCount + inventoryStats.outOfStockCount} Items
            </p>
            <div className="flex items-center gap-1 text-[11px] text-amber-700 font-medium mt-1">
              <span>{inventoryStats.lowStockCount} Low • {inventoryStats.outOfStockCount} Out of Stock</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Stock Health & Categories */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Catalog Health</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{inventoryStats.healthyCount} In Stock</p>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-1 truncate max-w-[170px]">
              <span>Across {categoriesList.length} Categories</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-[#3FA9A8] flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </section>
      {/* END: Enhanced Inventory Valuation & Margin Summary Cards */}

      {/* BEGIN: Filter & Action Bar */}
      <section className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3" data-purpose="table-filter-toolbar">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search in Table */}
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] focus:border-[#3FA9A8]"
              placeholder="Search dishes, SKU, supplier..."
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

          {/* Stock Level & Status Filter */}
          <select
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#3FA9A8] cursor-pointer"
            value={stockStatusFilter}
            onChange={(e) => {
              setStockStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
          >
            <option value="all">Stock Status: All ({products.length})</option>
            <option value="in-stock">In Stock Healthy ({inventoryStats.healthyCount})</option>
            <option value="low-stock">⚠️ Low Stock Only ({inventoryStats.lowStockCount})</option>
            <option value="out-of-stock">🚫 Out of Stock (0)</option>
            <option value="unavailable">Disabled / 86'd</option>
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
            <option value="stock-desc">Stock: High to Low</option>
            <option value="margin-desc">Profit Margin: High to Low</option>
          </select>

          {/* Reset Filter */}
          {(searchQuery || selectedCategory !== 'All' || stockStatusFilter !== 'all') && (
            <button
              onClick={clearFilters}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1 transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            Total shown: <strong className="text-slate-700">{filteredProducts.length} of {products.length}</strong>
          </span>
          <button 
            type="button"
            onClick={clearFilters}
            className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
            title="Refresh table view"
          >
            <RefreshCw className="w-4 h-4" />
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
                <th className="py-3.5 px-4">Item Details &amp; Supplier</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Cost Price (COGS)</th>
                <th className="py-3.5 px-4 text-right">Selling Price</th>
                <th className="py-3.5 px-4 text-center">Gross Margin</th>
                <th className="py-3.5 px-4">Current Stock</th>
                <th className="py-3.5 px-4 text-center">POS Live</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No products found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const isChecked = selectedProductIds.includes(p.id);
                  const isUnavailable = !p.isAvailable;
                  const iconStyleClass = getIconContainerClass(p.category);
                  const categoryBadgeClass = getCategoryBadgeClass(p.category);

                  const stock = p.stock || 0;
                  const threshold = p.lowStockThreshold ?? 10;
                  const isOutOfStock = stock === 0 || !p.isAvailable;
                  const isLowStock = !isOutOfStock && stock <= threshold;

                  const cost = p.costPrice ?? Math.round(p.price * 0.45);
                  const profit = Math.max(0, p.price - cost);
                  const marginPct = p.price > 0 ? ((profit / p.price) * 100).toFixed(1) : '0.0';
                  const marginNum = parseFloat(marginPct);

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        isOutOfStock ? 'bg-rose-50/20' : isLowStock ? 'bg-amber-50/20' : ''
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

                      {/* Product Details & Supplier */}
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
                                  isUnavailable ? 'line-through text-slate-400' : ''
                                }`}
                              >
                                {p.name}
                              </span>
                              {p.dietaryTag && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                    p.dietaryTag === 'Veg' || p.dietaryTag === 'Vegetarian'
                                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                      : 'bg-red-50 text-red-600 border-red-100'
                                  }`}
                                >
                                  {p.dietaryTag}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                              <span>SKU: {p.sku || `#PRD-${p.id.slice(-4)}`}</span>
                              {p.supplierName && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-500 font-sans">Vendor: {p.supplierName}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className={`py-3.5 px-4 ${isUnavailable ? 'opacity-75' : ''}`}>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${categoryBadgeClass}`}>
                          {p.category}
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-600 tabular-nums">
                        Rs. {cost.toLocaleString()}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                        Rs. {p.price.toLocaleString()}
                      </td>

                      {/* Margin % */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          marginNum >= 45 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : marginNum >= 25 
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {marginPct}%
                        </span>
                      </td>

                      {/* Stock Quantity with Visual Status & Quick Adjustment Steppers */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickAdjustStock(p, -5)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer rounded hover:bg-slate-100"
                            title="Decrease stock by 5 units"
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                          </button>
                          
                          <div className="min-w-[90px]">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                                🚫 0 (Out)
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                ⚠️ {stock} (Low)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                ✓ {stock} Units
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleQuickAdjustStock(p, 5)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer rounded hover:bg-slate-100"
                            title="Increase stock by 5 units"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Availability Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={p.isAvailable}
                            onChange={() => handleToggleAvailability(p)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#3FA9A8]"></div>
                        </label>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Item & Pricing"
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

      {/* CSV IMPORT / EXPORT HUB MODAL */}
      {showCsvHub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col font-sans">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Bulk Inventory Spreadsheet Hub</h3>
                  <p className="text-xs text-slate-500">Export or import your catalog via CSV / Excel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCsvHub(false);
                  setCsvFeedback(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {csvFeedback && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  csvFeedback.startsWith('✓') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {csvFeedback}
                </div>
              )}

              {/* Action 1: Export Active Catalog */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Export Current Inventory (.csv)</h4>
                  <p className="text-[11px] text-slate-500">Download all {products.length} menu dishes with costs, prices &amp; stock.</p>
                </div>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>

              {/* Action 2: Download Sample Template */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Download Sample CSV Template</h4>
                  <p className="text-[11px] text-slate-500">Pre-formatted template with all mandatory column headers.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleCSV}
                  className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  Template
                </button>
              </div>

              {/* Action 3: Upload & Import CSV */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportCSVSelected}
                  accept=".csv"
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-teal-50 text-[#3FA9A8] mx-auto flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Import Products from CSV</p>
                  <p className="text-[11px] text-slate-500">Select a CSV file to bulk add or update your menu</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#3FA9A8] hover:bg-[#349695] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Choose CSV File
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCsvHub(false);
                  setCsvFeedback(null);
                }}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTOCK PROCUREMENT ORDER MODAL */}
      {showRestockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col font-sans max-h-[90vh]">
            <div className="p-5 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Low Stock Procurement &amp; Restock PO</h3>
                  <p className="text-xs text-amber-800">
                    {restockCandidates.length} items currently below safety threshold
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRestockModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {restockCandidates.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-800">All Stocks Healthy!</p>
                  <p className="text-xs">No items currently require replenishment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600">
                    The following menu dishes are depleted or near minimum threshold. Recommended restock quantity will restore inventory to 50 buffer units.
                  </p>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-400 font-semibold text-[10px] uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Item &amp; Supplier</th>
                          <th className="py-2.5 px-3 text-center">Current Stock</th>
                          <th className="py-2.5 px-3 text-center">Safety Level</th>
                          <th className="py-2.5 px-3 text-right">Unit Cost</th>
                          <th className="py-2.5 px-3 text-right">Reorder Qty</th>
                          <th className="py-2.5 px-3 text-right">Est. Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {restockCandidates.map((p) => {
                          const stock = p.stock || 0;
                          const threshold = p.lowStockThreshold ?? 10;
                          const unitCost = p.costPrice || Math.round(p.price * 0.45);
                          const reorderQty = Math.max(20, 50 - stock);
                          const totalCost = reorderQty * unitCost;

                          return (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3">
                                <p className="font-bold text-slate-800">{p.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{p.supplierName || 'Default Supplier'}</p>
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-rose-600">
                                {stock}
                              </td>
                              <td className="py-2.5 px-3 text-center text-slate-500">
                                {threshold}
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                                Rs. {unitCost.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-emerald-700 tabular-nums">
                                +{reorderQty}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                                Rs. {totalCost.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {restockCandidates.length} Item(s) Selected for Purchase Order
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={restockCandidates.length === 0}
                  onClick={handleGenerateRestockPO}
                  className="px-4 py-2 bg-[#3FA9A8] hover:bg-[#359392] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  Generate Procurement Sheet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
