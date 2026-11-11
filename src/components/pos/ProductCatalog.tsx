import React, { useState } from 'react';
import { useCartStore } from '../../store/useCartStore';
import { useUIStore } from '../../store/useUIStore';
import { INITIAL_PRODUCTS } from '../../db';
import type { CategoryType, Product } from '../../types';

const CATEGORIES: { id: CategoryType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'food', label: 'Food' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'desserts', label: 'Desserts' },
];

export const ProductCatalog: React.FC = () => {
  const [currentCategory, setCurrentCategory] = useState<CategoryType>('all');
  const { addToCart } = useCartStore();
  const { globalSearch } = useUIStore();

  const filteredProducts = INITIAL_PRODUCTS.filter((product) => {
    const matchesCategory = currentCategory === 'all' || product.category === currentCategory;
    const matchesSearch = product.name.toLowerCase().includes(globalSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="lg:col-span-7 flex flex-col gap-5">
      {/* Category Filter Bar + Layout Toggle */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-2" id="categoryFilterContainer">
          {CATEGORIES.map((cat) => {
            const isActive = currentCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCurrentCategory(cat.id)}
                className={`category-btn px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'active bg-[#43AAA9] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Grid view indicator icon */}
        <div className="shrink-0 p-2 bg-white rounded-xl border border-slate-200 text-[#43AAA9] shadow-sm">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </div>
      </div>

      {/* Product Catalog Grid (3 cols on MD, 4 cols on XL) matching the visual arrangement */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4" id="productGrid">
        {filteredProducts.map((item: Product) => (
          <div
            key={item.id}
            onClick={() => addToCart(item)}
            className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
          >
            {/* Food Image Thumbnail Container */}
            <div className="aspect-square w-full rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-4xl shadow-inner relative overflow-hidden">
              <span className="group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
            </div>

            <div className="mt-2.5">
              <h4 className="text-xs font-semibold text-slate-800 truncate">{item.name}</h4>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-bold text-slate-700">${item.price.toFixed(2)}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(item);
                  }}
                  className="w-6 h-6 rounded-md bg-[#43AAA9] hover:bg-[#359392] text-white flex items-center justify-center transition-colors shadow-sm"
                  title="Add to current order"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
