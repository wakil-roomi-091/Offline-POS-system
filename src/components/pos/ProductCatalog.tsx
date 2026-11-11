import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCartStore } from '../../store/useCartStore';
import { useUIStore } from '../../store/useUIStore';
import { db, INITIAL_PRODUCTS } from '../../db';
import type { Product } from '../../types';
import { AlertTriangle, PackageX, Plus } from 'lucide-react';

export const ProductCatalog: React.FC = () => {
  const [currentCategory, setCurrentCategory] = useState<string>('all');
  const { addToCart, cart } = useCartStore();
  const { globalSearch, setVariationModalOpen, setSelectedProductForVariation } = useUIStore();

  // Reactive live products from IndexedDB
  const liveProducts = useLiveQuery(() => db.products.toArray(), []) || [];
  const products = liveProducts.length > 0 ? liveProducts : INITIAL_PRODUCTS;

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = currentCategory === 'all' || product.category === currentCategory;
      const matchesSearch = !globalSearch || 
        product.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(globalSearch.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, currentCategory, globalSearch]);

  const handleProductClick = (item: Product) => {
    const stock = item.stock ?? 0;
    if (!item.isAvailable || stock <= 0) {
      alert(`"${item.name}" is currently Out of Stock.`);
      return;
    }

    if (item.isMultiSize || (item.variations && item.variations.length > 0)) {
      setSelectedProductForVariation(item);
      setVariationModalOpen(true);
    } else {
      addToCart(item, undefined, stock);
    }
  };

  return (
    <div className="lg:col-span-7 flex flex-col gap-5 select-none">
      {/* Category Filter Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          {categories.map((cat) => {
            const isActive = currentCategory === cat;
            const label = cat === 'all' ? 'All Dishes' : cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCurrentCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#3FA9A8] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="shrink-0 text-xs text-slate-400 font-medium">
          {filteredProducts.length} items
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5" id="productGrid">
        {filteredProducts.map((item: Product) => {
          const stock = item.stock ?? 0;
          const isOutOfStock = !item.isAvailable || stock <= 0;
          const isLowStock = !isOutOfStock && stock <= (item.lowStockThreshold ?? 10);
          const cartItem = cart.find((c) => c.productId === item.id);
          const inCartQty = cartItem?.qty || 0;

          return (
            <div
              key={item.id}
              onClick={() => handleProductClick(item)}
              className={`bg-white rounded-2xl p-3 border transition-all flex flex-col justify-between group relative overflow-hidden ${
                isOutOfStock
                  ? 'border-rose-100 bg-rose-50/20 opacity-75 cursor-not-allowed'
                  : 'border-slate-100 shadow-2xs hover:shadow-md hover:border-teal-200 cursor-pointer active:scale-[0.99]'
              }`}
            >
              {/* Image & Stock Badge Overlay */}
              <div className="aspect-square w-full rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-4xl shadow-inner relative overflow-hidden">
                <span className={`transition-transform duration-200 ${isOutOfStock ? 'grayscale opacity-50' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>

                {/* In Cart Indicator */}
                {inCartQty > 0 && (
                  <span className="absolute top-2 right-2 bg-[#3FA9A8] text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                    {inCartQty}
                  </span>
                )}

                {/* Stock Status Badge */}
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-center">
                  {isOutOfStock ? (
                    <span className="w-full text-center py-0.5 bg-rose-500/95 text-white font-bold text-[9px] uppercase tracking-wider rounded-md shadow-xs flex items-center justify-center gap-1">
                      <PackageX className="w-2.5 h-2.5" />
                      Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="w-full text-center py-0.5 bg-amber-500/90 text-white font-bold text-[9px] rounded-md shadow-xs flex items-center justify-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Low Stock ({stock})
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold text-slate-500 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md border border-slate-200/60 shadow-2xs">
                      {stock} in stock
                    </span>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="mt-2.5">
                <h4 className="text-xs font-semibold text-slate-900 truncate" title={item.name}>
                  {item.name}
                </h4>
                
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-bold text-slate-900">
                    Rs. {item.price.toLocaleString()}
                  </span>

                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(item);
                    }}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors shadow-2xs ${
                      isOutOfStock
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-[#3FA9A8] hover:bg-[#349695] text-white cursor-pointer active:scale-95'
                    }`}
                    title={isOutOfStock ? 'Item is out of stock' : 'Add to sale'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
