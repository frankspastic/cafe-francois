function GuestMenuScreen({ menuItems, cart, onSelectItem, onGoToCart }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-primary text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
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
      </div>

      {/* Menu Grid */}
      <div className="max-w-4xl mx-auto p-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Choose Your Coffee</h2>
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectItem(item)}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden"
            >
              <div className="aspect-square bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-6xl">☕</span>
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
