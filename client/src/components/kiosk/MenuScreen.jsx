function MenuScreen({ menuItems, cart, onSelectItem, onGoToCart }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-4xl font-bold">☕ Select Your Coffee</h1>
          <button
            onClick={onGoToCart}
            className="bg-white text-primary px-8 py-4 rounded-lg font-semibold text-xl hover:bg-accent hover:text-white transition-all flex items-center gap-3"
          >
            <span>🛒 Cart</span>
            {cart.length > 0 && (
              <span className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-3 gap-8">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectItem(item)}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 overflow-hidden"
            >
              <div className="aspect-square bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-8xl">☕</span>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{item.name}</h3>
                <p className="text-gray-600 text-lg">{item.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MenuScreen;
