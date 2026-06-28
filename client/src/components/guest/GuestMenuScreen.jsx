import { useState } from 'react';

function GuestMenuScreen({ menuItems, cart, onSelectItem, onGoToCart }) {
  const categories = ['All', ...new Set(menuItems.map(i => i.category).filter(Boolean))];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const visibleItems = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter(i => i.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-primary text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 pt-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">☕ Café François</h1>
          <button
            onClick={onGoToCart}
            className="bg-white text-primary px-4 py-2 rounded-lg font-semibold hover:bg-accent hover:text-white transition-all flex items-center gap-2"
          >
            <span>🛒</span>
            {cart.length > 0 && (
              <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                {cart.length}
              </span>
            )}
          </button>
        </div>

        {/* Category Tabs */}
        {categories.length > 2 && (
          <div className="max-w-4xl mx-auto px-4 pb-3 mt-3 flex gap-2 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-white text-primary'
                    : 'bg-primary-light text-white hover:bg-secondary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Menu Grid */}
      <div className="max-w-4xl mx-auto p-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          {selectedCategory === 'All' ? 'All Items' : selectedCategory}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectItem(item)}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden"
            >
              <div className="aspect-square bg-gradient-to-br from-primary to-secondary flex items-center justify-center overflow-hidden">
                {item.image_url
                  ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  : <span className="text-6xl">☕</span>
                }
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-1">{item.name}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GuestMenuScreen;
