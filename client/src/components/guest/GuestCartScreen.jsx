function GuestCartScreen({ cart, onRemoveItem, onContinueShopping, onCheckout }) {
  const formatCustomizations = (customizations) => {
    const parts = [];
    if (customizations.size) parts.push(customizations.size);
    if (customizations.milk) parts.push(customizations.milk);
    if (customizations.extras && customizations.extras.length > 0) {
      parts.push(...customizations.extras);
    }
    return parts.join(' • ');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-primary text-white p-4 shadow-lg sticky top-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">🛒 Your Cart</h1>
        </div>
      </div>

      {/* Cart Items */}
      <div className="max-w-4xl mx-auto p-4">
        {cart.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500 mb-6">Your cart is empty</p>
            <button
              onClick={onContinueShopping}
              className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-secondary transition-all"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {cart.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatCustomizations(item.customizations)}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="ml-3 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-all"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Footer Buttons */}
            <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
              <div className="max-w-4xl mx-auto flex gap-3">
                <button
                  onClick={onContinueShopping}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-all"
                >
                  Add More
                </button>
                <button
                  onClick={onCheckout}
                  className="flex-1 bg-primary text-white px-4 py-3 rounded-lg font-semibold hover:bg-secondary transition-all"
                >
                  Checkout ({cart.length})
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default GuestCartScreen;
