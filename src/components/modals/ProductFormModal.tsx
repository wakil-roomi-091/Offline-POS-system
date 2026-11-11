import React, { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { db } from '../../db';
import type { Product, ProductVariation } from '../../types';

const EMOJI_OPTIONS = [
  '🍛', '🍲', '🍢', '🫓', '☕', '🥗', '🥤', '🧁', '🍗', '🥩',
  '☕', '🍵', '🫖', '🥯', '🥪', '🍰', '🍪', '🍔', '🍕', '🍟'
];

const CATEGORY_OPTIONS = [
  'Rice & Biryani',
  'Main Curries & Karahi',
  'BBQ & Grills',
  'Tandoor & Breads',
  'Beverages',
  'Desserts & Sweets',
  'Extras & Condiments',
];

const DIETARY_OPTIONS = [
  'Non-Vegetarian',
  'Vegetarian',
  'Egg-Only',
  'Vegan',
];

export const ProductFormModal: React.FC = () => {
  const { productFormModalOpen, setProductFormModalOpen, editingProduct, setEditingProduct } = useUIStore();

  const [prevProduct, setPrevProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Rice & Biryani');
  const [dietaryTag, setDietaryTag] = useState('Non-Vegetarian');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🍛');
  const [isMultiSize, setIsMultiSize] = useState(false);
  const [singlePrice, setSinglePrice] = useState('450');
  const [costPrice, setCostPrice] = useState('220');
  const [stock, setStock] = useState('50');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [supplierName, setSupplierName] = useState('');
  const [variations, setVariations] = useState<ProductVariation[]>([
    { name: 'Single / Half', price: 450, sku: 'SKU-S' },
    { name: 'Double / Full', price: 850, sku: 'SKU-F' },
  ]);
  const [isComplimentary, setIsComplimentary] = useState(false);
  const [showOnPos, setShowOnPos] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Sync state when editing product changes
  if (editingProduct !== prevProduct) {
    setPrevProduct(editingProduct);
    if (editingProduct) {
      setName(editingProduct.name || '');
      setSku(editingProduct.sku || `#PRD-4091`);
      setCategory(editingProduct.category || 'Rice & Biryani');
      setDietaryTag(
        editingProduct.dietaryTag === 'Veg'
          ? 'Vegetarian'
          : editingProduct.dietaryTag === 'Non-Veg'
          ? 'Non-Vegetarian'
          : editingProduct.dietaryTag || 'Non-Vegetarian'
      );
      setDescription(editingProduct.description || '');
      setIcon(editingProduct.icon || '🍛');
      setIsMultiSize(Boolean(editingProduct.isMultiSize || (editingProduct.variations && editingProduct.variations.length > 0)));
      setSinglePrice((editingProduct.price || 0).toString());
      setCostPrice((editingProduct.costPrice ?? Math.round((editingProduct.price || 0) * 0.45)).toString());
      setStock((editingProduct.stock ?? 50).toString());
      setLowStockThreshold((editingProduct.lowStockThreshold ?? 10).toString());
      setSupplierName(editingProduct.supplierName || '');
      setVariations(
        editingProduct.variations && editingProduct.variations.length > 0
          ? editingProduct.variations
          : [
              { name: 'Single / Half', price: editingProduct.price || 450, sku: `${editingProduct.sku || 'SKU'}-S` },
              { name: 'Double / Full', price: (editingProduct.price || 450) * 1.8, sku: `${editingProduct.sku || 'SKU'}-F` },
            ]
      );
      setIsComplimentary(Boolean(editingProduct.isComplimentary));
      setShowOnPos(editingProduct.showOnPos !== false);
      setIsAvailable(editingProduct.isAvailable !== false);
    } else {
      const generatedSku = `#PRD-1082`;
      setName('');
      setSku(generatedSku);
      setCategory('Rice & Biryani');
      setDietaryTag('Non-Vegetarian');
      setDescription('');
      setIcon('🍛');
      setIsMultiSize(false);
      setSinglePrice('450');
      setCostPrice('220');
      setStock('50');
      setLowStockThreshold('10');
      setSupplierName('');
      setVariations([
        { name: 'Single / Half', price: 450, sku: `${generatedSku}-S` },
        { name: 'Double / Full', price: 850, sku: `${generatedSku}-F` },
      ]);
      setIsComplimentary(false);
      setShowOnPos(true);
      setIsAvailable(true);
    }
  }

  const closeModal = useCallback(() => {
    setEditingProduct(null);
    setProductFormModalOpen(false);
    setShowEmojiPicker(false);
  }, [setEditingProduct, setProductFormModalOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && productFormModalOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [productFormModalOpen, closeModal]);

  if (!productFormModalOpen) return null;

  const handleAddVariation = () => {
    setVariations([
      ...variations,
      { name: `Size ${variations.length + 1}`, price: 0, sku: `${sku}-${variations.length + 1}` },
    ]);
  };

  const handleUpdateVariation = (index: number, field: keyof ProductVariation, value: any) => {
    const updated = [...variations];
    updated[index] = { ...updated[index], [field]: value };
    setVariations(updated);
  };

  const handleRemoveVariation = (index: number) => {
    if (variations.length <= 1) return;
    setVariations(variations.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      alert('Product name is required.');
      return;
    }

    const calculatedPrice = isComplimentary
      ? 0
      : isMultiSize && variations.length > 0
      ? variations[0].price
      : parseFloat(singlePrice) || 0;

    const shortDietaryTag =
      dietaryTag === 'Vegetarian' || dietaryTag === 'Veg'
        ? 'Veg'
        : dietaryTag === 'Non-Vegetarian' || dietaryTag === 'Non-Veg'
        ? 'Non-Veg'
        : dietaryTag;

    const portionSize = isMultiSize
      ? `${variations.map((v) => v.name).join(' / ')} (${variations.length} Variations)`
      : isComplimentary
      ? 'Complimentary Add-on'
      : 'Standard Portion';

    const parsedCost = parseFloat(costPrice) || 0;
    const parsedStock = Math.max(0, parseInt(stock) || 0);
    const parsedThreshold = Math.max(1, parseInt(lowStockThreshold) || 10);

    if (editingProduct) {
      await db.products.update(editingProduct.id, {
        name: name.trim(),
        sku: sku.trim(),
        category,
        dietaryTag: shortDietaryTag,
        description: description.trim(),
        icon,
        price: calculatedPrice,
        costPrice: parsedCost,
        stock: parsedStock,
        lowStockThreshold: parsedThreshold,
        supplierName: supplierName.trim(),
        isMultiSize,
        variations: isMultiSize ? variations : [],
        isComplimentary,
        showOnPos,
        isAvailable,
        portionSize,
      });
    } else {
      const newProduct: Product = {
        id: `p-${Date.now()}`,
        name: name.trim(),
        sku: sku.trim(),
        category,
        dietaryTag: shortDietaryTag,
        description: description.trim(),
        icon,
        price: calculatedPrice,
        costPrice: parsedCost,
        stock: parsedStock,
        lowStockThreshold: parsedThreshold,
        supplierName: supplierName.trim(),
        isMultiSize,
        variations: isMultiSize ? variations : [],
        isComplimentary,
        showOnPos,
        isAvailable,
        portionSize,
      };
      await db.products.add(newProduct);
    }

    closeModal();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 flex justify-end font-sans select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
      data-purpose="product-slide-over"
    >
      {/* Slide-over Card Panel */}
      <div className="w-full max-w-xl bg-white shadow-2xl h-full flex flex-col transform transition-transform duration-300 ease-out border-l border-slate-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Configure item details, sizes, and pricing.</p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </button>
        </div>

        {/* Drawer Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Product Name & SKU */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="block font-semibold text-slate-700">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                className="w-full text-xs rounded-xl border border-slate-200 focus:border-[#3FA9A8] focus:ring-1 focus:ring-[#3FA9A8] py-2 px-3 outline-none"
                placeholder="e.g. Chicken Karahi"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">Product SKU / Code</label>
              <input
                className="w-full text-xs font-mono rounded-xl border border-slate-200 focus:border-[#3FA9A8] focus:ring-1 focus:ring-[#3FA9A8] py-2 px-3 bg-slate-50 outline-none"
                placeholder="#PRD-0000"
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>
          </div>

          {/* Category & Diet Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                className="w-full text-xs rounded-xl border border-slate-200 focus:border-[#3FA9A8] focus:ring-1 focus:ring-[#3FA9A8] py-2 px-3 outline-none bg-white"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">Dietary Tag</label>
              <select
                className="w-full text-xs rounded-xl border border-slate-200 focus:border-[#3FA9A8] focus:ring-1 focus:ring-[#3FA9A8] py-2 px-3 outline-none bg-white"
                value={dietaryTag}
                onChange={(e) => setDietaryTag(e.target.value)}
              >
                {DIETARY_OPTIONS.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description / Kitchen Instruction */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">Kitchen Description & Notes</label>
            <textarea
              className="w-full text-xs rounded-xl border border-slate-200 focus:border-[#3FA9A8] focus:ring-1 focus:ring-[#3FA9A8] p-3 outline-none"
              placeholder="e.g. Cooked with authentic basmati rice, potatoes, and tender marinated chicken pieces..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Product Image / Icon Selection */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">Product Image Thumbnail</label>
            <div
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-[#3FA9A8] transition-colors cursor-pointer bg-slate-50/50"
            >
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-2xl flex items-center justify-center border border-teal-200 shadow-xs">
                  {icon}
                </div>
                <p className="font-medium text-slate-700">Click to choose icon or photo</p>
                <p className="text-[10px] text-slate-400">Selected dish icon: {icon}</p>
              </div>
            </div>

            {/* Quick Emoji Icon Picker */}
            {showEmojiPicker && (
              <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm grid grid-cols-10 gap-2 mt-2">
                {EMOJI_OPTIONS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      setIcon(em);
                      setShowEmojiPicker(false);
                    }}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg hover:bg-teal-50 transition-colors ${
                      icon === em ? 'bg-teal-100 ring-2 ring-[#3FA9A8]' : 'bg-slate-50'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & Variations Section */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Pricing & Portion Sizes</h4>
                <p className="text-[11px] text-slate-400">Add multiple variations like Half / Full or Single / Double</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMultiSize}
                  onChange={(e) => setIsMultiSize(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#3FA9A8]"></div>
                <span className="ml-2 text-[11px] font-medium text-slate-600">Multi-size</span>
              </label>
            </div>

            {isMultiSize ? (
              /* Variations List Container */
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                {variations.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white focus:border-[#3FA9A8] outline-none"
                        placeholder="Size Name (e.g. Single / Half)"
                        type="text"
                        value={v.name}
                        onChange={(e) => handleUpdateVariation(idx, 'name', e.target.value)}
                      />
                    </div>
                    <div className="w-32">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-[11px] font-bold text-slate-400">
                          Rs.
                        </span>
                        <input
                          className="w-full text-xs py-1.5 pl-8 pr-2 rounded-lg border border-slate-200 bg-white font-bold focus:border-[#3FA9A8] outline-none"
                          placeholder="0.00"
                          type="number"
                          value={v.price}
                          onChange={(e) => handleUpdateVariation(idx, 'price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div className="w-24">
                      <input
                        className="w-full text-[11px] font-mono py-1.5 px-2 rounded-lg border border-slate-200 bg-white focus:border-[#3FA9A8] outline-none"
                        placeholder="SKU"
                        type="text"
                        value={v.sku || ''}
                        onChange={(e) => handleUpdateVariation(idx, 'sku', e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariation(idx)}
                      disabled={variations.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Add Variation Action */}
                <button
                  type="button"
                  onClick={handleAddVariation}
                  className="mt-1 text-xs font-semibold text-[#3FA9A8] hover:text-[#349695] inline-flex items-center gap-1 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  <span>+ Add Another Size Variation</span>
                </button>
              </div>
            ) : (
              /* Single Fixed Price Input */
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-700">Standard Price:</span>
                <div className="relative w-40">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-bold text-slate-400">
                    Rs.
                  </span>
                  <input
                    className="w-full text-xs py-1.5 pl-9 pr-2 rounded-lg border border-slate-200 bg-white font-bold focus:border-[#3FA9A8] outline-none"
                    placeholder="0.00"
                    type="number"
                    value={singlePrice}
                    onChange={(e) => setSinglePrice(e.target.value)}
                  />
                </div>
              </div>
            )}
            {/* Inventory & Cost Accounting Section */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Inventory &amp; Cost Valuation</h4>
                <p className="text-[11px] text-slate-400">Track cost of goods sold, profit margin, and restock alert levels.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Cost Price (Rs.) <span className="text-slate-400 font-normal">Per Unit</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-bold text-slate-400">
                      Rs.
                    </span>
                    <input
                      className="w-full text-xs py-1.5 pl-9 pr-2 rounded-lg border border-slate-200 bg-white font-bold focus:border-[#3FA9A8] outline-none"
                      placeholder="0.00"
                      type="number"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Current Stock <span className="text-slate-400 font-normal">Units</span>
                  </label>
                  <input
                    className="w-full text-xs py-1.5 px-3 rounded-lg border border-slate-200 bg-white font-bold focus:border-[#3FA9A8] outline-none"
                    placeholder="50"
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Low Stock Threshold <span className="text-slate-400 font-normal">Alert At</span>
                  </label>
                  <input
                    className="w-full text-xs py-1.5 px-3 rounded-lg border border-slate-200 bg-white font-bold focus:border-[#3FA9A8] outline-none"
                    placeholder="10"
                    type="number"
                    min="1"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Preferred Supplier / Vendor
                  </label>
                  <input
                    className="w-full text-xs py-1.5 px-3 rounded-lg border border-slate-200 bg-white focus:border-[#3FA9A8] outline-none"
                    placeholder="e.g. Madina Poultry Mart"
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                  />
                </div>
              </div>

              {/* Live Profit Margin Calculator Banner */}
              {(() => {
                const sPrice = isComplimentary ? 0 : isMultiSize && variations.length > 0 ? variations[0].price : (parseFloat(singlePrice) || 0);
                const cPrice = parseFloat(costPrice) || 0;
                const unitProfit = Math.max(0, sPrice - cPrice);
                const marginPct = sPrice > 0 ? ((unitProfit / sPrice) * 100).toFixed(1) : '0.0';
                const isHealthy = parseFloat(marginPct) >= 35;

                return (
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    isHealthy ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800' : 'bg-amber-50/70 border-amber-200 text-amber-800'
                  }`}>
                    <div>
                      <span className="font-bold">Unit Gross Margin: </span>
                      <span className="font-extrabold">{marginPct}%</span>
                      <span className="text-[11px] ml-1.5 text-slate-600">
                        (Profit: Rs. {unitProfit.toLocaleString()} / unit)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white shadow-2xs">
                      {isHealthy ? '✓ Healthy Margin' : '⚠️ Low Margin'}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Additional Options & POS Availability */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            {/* Complimentary Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isComplimentary}
                onChange={(e) => setIsComplimentary(e.target.checked)}
                className="rounded border-slate-300 text-[#3FA9A8] focus:ring-[#3FA9A8]"
              />
              <span className="text-slate-700 font-medium">Mark as complimentary item (Rs. 0 / Free condiment)</span>
            </label>

            {/* Availability in Terminal */}
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-emerald-900">Show on POS Terminal</p>
                <p className="text-[11px] text-emerald-700">Cashiers can immediately punch this dish.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnPos}
                  onChange={(e) => setShowOnPos(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* Offline Sync Notice */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd"></path>
            </svg>
            <span>Changes will immediately write to the local SQLite database & synchronize with other POS stations.</span>
          </div>
        </form>

        {/* Drawer Footer Buttons */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 text-xs shadow-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="px-5 py-2 rounded-xl bg-[#3FA9A8] hover:bg-[#349695] text-white font-semibold text-xs shadow-sm hover:shadow cursor-pointer active:scale-98"
          >
            Save Product
          </button>
        </div>
      </div>
    </div>
  );
};
