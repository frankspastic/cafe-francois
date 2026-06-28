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
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Header */}
      <div className="bg-stone-900 border-b border-stone-800 px-8 py-5">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-stone-100 tracking-tight">Your Cart</h1>
          <p className="text-stone-500 text-sm mt-0.5">{cart.length} {cart.length === 1 ? 'item' : 'items'}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        {cart.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-7xl mb-6">🛒</div>
            <p className="text-2xl text-stone-400 mb-10">Your cart is empty</p>
            <button
              onClick={onContinueShopping}
              className="bg-accent text-stone-900 px-12 py-5 rounded-2xl text-xl font-bold hover:brightness-110 transition-all"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-8">
              {cart.map((item, index) => (
                <div
                  key={index}
                  className="bg-stone-900 border border-stone-800 rounded-2xl p-6 flex items-center justify-between"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-stone-700 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                      ☕
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-stone-100">{item.name}</h3>
                      <p className="text-stone-500 text-sm mt-0.5">
                        {formatCustomizations(item.customizations) || 'No customizations'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="ml-4 bg-stone-800 text-red-400 hover:bg-red-500 hover:text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={onContinueShopping}
                className="flex-1 bg-stone-800 text-stone-300 px-8 py-6 rounded-2xl text-2xl font-semibold hover:bg-stone-700 transition-all"
              >
                Add More
              </button>
              <button
                onClick={onCheckout}
                className="flex-1 bg-accent text-stone-900 px-8 py-6 rounded-2xl text-2xl font-bold hover:brightness-110 transition-all shadow-lg shadow-accent/20"
              >
                Checkout →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CartScreen;
