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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-8 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-stone-800 p-8 rounded-t-3xl">
          <h2 className="text-4xl font-bold text-stone-100">{item.name}</h2>
          <p className="text-lg text-stone-300 mt-2">{item.description}</p>
        </div>

        {/* Customization Options */}
        <div className="p-8 space-y-8">
          {/* Size */}
          {allowedTypes.includes('size') && (
            <div>
              <h3 className="text-xl font-semibold text-stone-300 mb-4 uppercase tracking-widest text-sm">Size</h3>
              <div className="grid grid-cols-3 gap-4">
                {customizations.size.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.name)}
                    className={`p-6 rounded-2xl border-2 text-xl font-semibold transition-all ${
                      selectedSize === size.name
                        ? 'border-accent bg-accent text-stone-900'
                        : 'border-stone-700 text-stone-300 hover:border-accent/50'
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
              <h3 className="text-xl font-semibold text-stone-300 mb-4 uppercase tracking-widest text-sm">Milk Type</h3>
              <div className="grid grid-cols-3 gap-4">
                {customizations.milk.map((milk) => (
                  <button
                    key={milk.id}
                    onClick={() => setSelectedMilk(milk.name)}
                    className={`p-6 rounded-2xl border-2 text-xl font-semibold transition-all ${
                      selectedMilk === milk.name
                        ? 'border-accent bg-accent text-stone-900'
                        : 'border-stone-700 text-stone-300 hover:border-accent/50'
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
              <h3 className="text-xl font-semibold text-stone-300 mb-4 uppercase tracking-widest text-sm">Extras <span className="text-stone-600 normal-case tracking-normal text-base">(optional)</span></h3>
              <div className="grid grid-cols-2 gap-4">
                {customizations.extra.map((extra) => (
                  <button
                    key={extra.id}
                    onClick={() => handleToggleExtra(extra.name)}
                    className={`p-6 rounded-2xl border-2 text-xl font-semibold transition-all ${
                      selectedExtras.includes(extra.name)
                        ? 'border-accent bg-accent text-stone-900'
                        : 'border-stone-700 text-stone-300 hover:border-accent/50'
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
        <div className="p-8 border-t border-stone-800 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-8 py-6 bg-stone-800 text-stone-300 rounded-2xl text-2xl font-semibold hover:bg-stone-700 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleAddToCart}
            className="flex-1 px-8 py-6 bg-accent text-stone-900 rounded-2xl text-2xl font-bold hover:brightness-110 transition-all shadow-lg shadow-accent/20"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomizeModal;
