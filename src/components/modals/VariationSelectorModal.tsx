import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useCartStore } from '../../store/useCartStore';

export const VariationSelectorModal: React.FC = () => {
  const { 
    variationModalOpen, 
    setVariationModalOpen, 
    selectedProductForVariation 
  } = useUIStore();
  const { addToCart } = useCartStore();

  const [selectedSize, setSelectedSize] = useState<'Regular' | 'Large' | 'Extra Large'>('Regular');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  if (!variationModalOpen || !selectedProductForVariation) return null;

  const sizePrices: Record<string, number> = {
    'Regular': 0,
    'Large': 0.50,
    'Extra Large': 1.00,
  };

  const addonsList = [
    { name: 'Extra Shot / Double Portion', price: 0.75 },
    { name: 'Oat Milk / Dairy Free', price: 0.50 },
    { name: 'Extra Sauce / Dressing', price: 0.40 },
    { name: 'Sugar-Free Syrup', price: 0.35 },
  ];

  const toggleAddon = (name: string) => {
    setSelectedAddons((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const calculateModifierPrice = () => {
    let extra = sizePrices[selectedSize] || 0;
    selectedAddons.forEach((addonName) => {
      const match = addonsList.find((a) => a.name === addonName);
      if (match) extra += match.price;
    });
    return selectedProductForVariation.price + extra;
  };

  const handleConfirm = () => {
    const variationLabel = `${selectedSize}${selectedAddons.length ? ` + ${selectedAddons.length} addons` : ''}`;
    const modifiedProduct = {
      ...selectedProductForVariation,
      price: calculateModifierPrice(),
    };

    addToCart(modifiedProduct, variationLabel);
    setVariationModalOpen(false);
    setSelectedAddons([]);
    setSelectedSize('Regular');
    setSpecialInstructions('');
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none"
    >
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 bg-white rounded-xl border border-slate-200">
              {selectedProductForVariation.icon}
            </span>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#43AAA9]">
                Product Modifiers
              </span>
              <h3 className="text-base font-bold text-slate-800">
                {selectedProductForVariation.name}
              </h3>
            </div>
          </div>
          <button 
            onClick={() => setVariationModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 space-y-4 max-h-[420px] overflow-y-auto text-xs">
          {/* Size Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-2">Select Portion / Size</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Regular', 'Large', 'Extra Large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`p-2.5 rounded-xl text-center font-semibold border transition-all ${
                    selectedSize === size
                      ? 'border-[#43AAA9] bg-teal-50 text-teal-900 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div>{size}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {sizePrices[size] > 0 ? `+$${sizePrices[size].toFixed(2)}` : 'Standard'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Add-ons Checklist */}
          <div>
            <label className="block font-semibold text-slate-700 mb-2">Optional Additions</label>
            <div className="space-y-1.5">
              {addonsList.map((addon) => {
                const isChecked = selectedAddons.includes(addon.name);
                return (
                  <div
                    key={addon.name}
                    onClick={() => toggleAddon(addon.name)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      isChecked
                        ? 'border-[#43AAA9] bg-teal-50/50 text-teal-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isChecked ? 'bg-[#43AAA9] border-[#43AAA9] text-white' : 'border-slate-300'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="font-medium">{addon.name}</span>
                    </div>
                    <span className="font-bold text-slate-600">+${addon.price.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Special Preparation Instructions</label>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Extra hot, decaf, oat milk..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-[#43AAA9] focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 font-medium">Item Total</span>
            <div className="text-lg font-bold text-slate-800">
              ${calculateModifierPrice().toFixed(2)}
            </div>
          </div>
          <button
            onClick={handleConfirm}
            className="py-3 px-6 bg-[#43AAA9] hover:bg-[#359392] text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.99]"
          >
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
};
