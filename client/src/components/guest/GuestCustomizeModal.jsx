import { useState } from 'react';

function GuestCustomizeModal({ item, customizations, onClose, onAddToCart }) {
  const allowedTypes = item.allowed_customization_types || ['size', 'milk', 'extra'];
  const [selectedSize, setSelectedSize] = useState(customizations.size[1]?.name || 'Medium');
  const [selectedMilk, setSelectedMilk] = useState(customizations.milk[0]?.name || 'Whole Milk');
  const [selectedExtras, setSelectedExtras] = useState([]);

  const handleToggleExtra = (extra) => {
    if (selectedExtras.includes(extra)) {
      setSelectedExtras(selectedExtras.filter(e => e !== extra));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  };

  const handleAddToCart = () => {
    onAddToCart(item, {
      size: allowedTypes.includes('size') ? selectedSize : null,
      milk: allowedTypes.includes('milk') ? selectedMilk : null,
      extras: allowedTypes.includes('extra') ? selectedExtras : [],
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-3xl shadow-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-primary text-white p-4 rounded-t-3xl sticky top-0">
          <h2 className="text-2xl font-bold">{item.name}</h2>
          <p className="text-sm opacity-90 mt-1">{item.description}</p>
        </div>

        {/* Customization Options */}
        <div className="p-4 space-y-6">
          {/* Size */}
          {allowedTypes.includes('size') && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Size</h3>
              <div className="grid grid-cols-3 gap-2">
                {customizations.size.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.name)}
                    className={`p-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                      selectedSize === size.name
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Milk */}
          {allowedTypes.includes('milk') && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Milk Type</h3>
              <div className="grid grid-cols-2 gap-2">
                {customizations.milk.map((milk) => (
                  <button
                    key={milk.id}
                    onClick={() => setSelectedMilk(milk.name)}
                    className={`p-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                      selectedMilk === milk.name
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    {milk.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Extras */}
          {allowedTypes.includes('extra') && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Extras (Optional)</h3>
              <div className="grid grid-cols-2 gap-2">
                {customizations.extra.map((extra) => (
                  <button
                    key={extra.id}
                    onClick={() => handleToggleExtra(extra.name)}
                    className={`p-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                      selectedExtras.includes(extra.name)
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    {extra.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 flex gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleAddToCart}
            className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-secondary transition-all"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default GuestCustomizeModal;
