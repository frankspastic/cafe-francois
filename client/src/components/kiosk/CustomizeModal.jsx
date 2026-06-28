import { useState } from 'react';

function CustomizeModal({ item, customizations, onClose, onAddToCart }) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-primary text-white p-8 rounded-t-3xl">
          <h2 className="text-4xl font-bold">{item.name}</h2>
          <p className="text-xl opacity-90 mt-2">{item.description}</p>
        </div>

        {/* Customization Options */}
        <div className="p-8 space-y-8">
          {/* Size */}
          {allowedTypes.includes('size') && (
            <div>
              <h3 className="text-2xl font-semibold mb-4">Size</h3>
              <div className="grid grid-cols-3 gap-4">
                {customizations.size.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.name)}
                    className={`p-6 rounded-xl border-2 text-xl font-semibold transition-all ${
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
              <h3 className="text-2xl font-semibold mb-4">Milk Type</h3>
              <div className="grid grid-cols-3 gap-4">
                {customizations.milk.map((milk) => (
                  <button
                    key={milk.id}
                    onClick={() => setSelectedMilk(milk.name)}
                    className={`p-6 rounded-xl border-2 text-xl font-semibold transition-all ${
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
              <h3 className="text-2xl font-semibold mb-4">Extras (Optional)</h3>
              <div className="grid grid-cols-2 gap-4">
                {customizations.extra.map((extra) => (
                  <button
                    key={extra.id}
                    onClick={() => handleToggleExtra(extra.name)}
                    className={`p-6 rounded-xl border-2 text-xl font-semibold transition-all ${
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
        <div className="p-8 bg-gray-50 rounded-b-3xl flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-8 py-6 bg-gray-300 text-gray-700 rounded-xl text-2xl font-semibold hover:bg-gray-400 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleAddToCart}
            className="flex-1 px-8 py-6 bg-primary text-white rounded-xl text-2xl font-semibold hover:bg-secondary transition-all"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomizeModal;
