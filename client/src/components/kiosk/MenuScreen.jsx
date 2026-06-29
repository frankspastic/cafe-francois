import { useState } from 'react';

function MenuCard({ item, onSelectItem }) {
  return (
    <button
      onClick={() => onSelectItem(item)}
      className="bg-stone-900 rounded-2xl overflow-hidden hover:ring-2 hover:ring-accent transition-all text-left group border border-stone-800"
    >
      <div className="h-32 md:h-52 bg-gradient-to-br from-primary via-stone-800 to-stone-900 flex items-center justify-center overflow-hidden">
        {item.image_url
          ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <span className="text-5xl md:text-8xl group-hover:scale-110 transition-transform duration-300">☕</span>
        }
      </div>
      <div className="p-3 md:p-5">
        <h3 className="text-base md:text-xl font-bold text-stone-100">{item.name}</h3>
        <p className="text-stone-500 text-xs md:text-sm mt-1 line-clamp-2">{item.description}</p>
        <div className="mt-2 md:mt-4">
          <span className="text-accent text-xs md:text-sm font-semibold">Customize →</span>
        </div>
      </div>
    </button>
  );
}

function MenuScreen({ menuItems, cart, onSelectItem, onGoToCart }) {
  const categoryOrder = [...new Set(menuItems.map(i => i.category).filter(Boolean))];
  const categories = ['All', ...categoryOrder];
  const [selectedCategory, setSelectedCategory] = useState('All');

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Header */}
      <div className="bg-stone-900 border-b border-stone-800 px-4 md:px-8 py-4 md:py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-stone-100 tracking-tight">Café François</h1>
          </div>
          <button
            onClick={onGoToCart}
            className="relative bg-accent text-stone-900 px-4 md:px-8 py-2.5 md:py-3.5 rounded-2xl font-bold text-sm md:text-lg hover:brightness-110 transition-all flex items-center gap-2 md:gap-3 shadow-lg shadow-accent/20"
          >
            <span>🛒</span>
            <span className="hidden sm:inline">Cart</span>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-xs font-bold">
                {cart.length}
              </span>
            )}
          </button>
        </div>

        {/* Category Tabs */}
        <div className="max-w-7xl mx-auto mt-3 md:mt-5 flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 md:px-6 py-1.5 md:py-2 rounded-full font-semibold text-sm md:text-base whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-accent text-stone-900'
                  : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 md:space-y-12">
        {selectedCategory === 'All' ? (
          // Grouped by category
          categoryOrder.map(cat => {
            const items = menuItems.filter(i => i.category === cat);
            if (!items.length) return null;
            return (
              <div key={cat}>
                <div className="flex items-center gap-4 mb-4 md:mb-6">
                  <h2 className="text-lg md:text-2xl font-bold text-stone-100">{cat}</h2>
                  <div className="flex-1 h-px bg-stone-800" />
                  <span className="text-stone-600 text-sm">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                  {items.map(item => (
                    <MenuCard key={item.id} item={item} onSelectItem={onSelectItem} />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          // Single category flat grid
          <div>
            <div className="flex items-center gap-4 mb-4 md:mb-6">
              <h2 className="text-lg md:text-2xl font-bold text-stone-100">{selectedCategory}</h2>
              <div className="flex-1 h-px bg-stone-800" />
              <span className="text-stone-600 text-sm">
                {menuItems.filter(i => i.category === selectedCategory).length} items
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              {menuItems.filter(i => i.category === selectedCategory).map(item => (
                <MenuCard key={item.id} item={item} onSelectItem={onSelectItem} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MenuScreen;
