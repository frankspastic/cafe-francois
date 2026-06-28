function CartScreen({ cart, onRemoveItem, onContinueShopping, onCheckout }) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold">🛒 Your Cart</h1>
        </div>
      </div>

      {/* Cart Items */}
      <div className="max-w-4xl mx-auto p-8">
        {cart.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-3xl text-gray-500 mb-8">Your cart is empty</p>
            <button
              onClick={onContinueShopping}
              className="bg-primary text-white px-12 py-6 rounded-xl text-2xl font-semibold hover:bg-secondary transition-all"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {cart.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800">{item.name}</h3>
                    <p className="text-lg text-gray-600 mt-1">
                      {formatCustomizations(item.customizations)}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="ml-4 bg-red-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-red-600 transition-all"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-4">
              <button
                onClick={onContinueShopping}
                className="flex-1 bg-gray-300 text-gray-700 px-8 py-6 rounded-xl text-2xl font-semibold hover:bg-gray-400 transition-all"
              >
                Add More Items
              </button>
              <button
                onClick={onCheckout}
                className="flex-1 bg-primary text-white px-8 py-6 rounded-xl text-2xl font-semibold hover:bg-secondary transition-all"
              >
                Checkout ({cart.length} item{cart.length !== 1 ? 's' : ''})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CartScreen;
