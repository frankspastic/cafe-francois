import { useState, useEffect } from 'react';
import { menuAPI } from '../../services/api';

const TYPES = [
  { key: 'size', label: 'Sizes' },
  { key: 'milk', label: 'Milk Options' },
  { key: 'extra', label: 'Extras & Syrups' },
];

function CustomizationManagement() {
  const [customizations, setCustomizations] = useState({ size: [], milk: [], extra: [] });
  const [newOption, setNewOption] = useState({ size: '', milk: '', extra: '' });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await menuAPI.getCustomizations();
      setCustomizations(data);
    } catch (error) {
      console.error('Error loading customizations:', error);
    }
  };

  const handleAdd = async (type) => {
    const name = newOption[type].trim();
    if (!name) return;
    try {
      await menuAPI.createCustomization(type, name);
      setNewOption(prev => ({ ...prev, [type]: '' }));
      await load();
    } catch (error) {
      console.error('Error adding customization:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await menuAPI.deleteCustomization(id);
      await load();
    } catch (error) {
      console.error('Error deleting customization:', error);
    }
  };

  return (
    <div className="mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Customization Options</h2>
      <div className="grid grid-cols-3 gap-6">
        {TYPES.map(({ key, label }) => (
          <div key={key} className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-700 mb-4">{label}</h3>
            <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
              {customizations[key].map(opt => (
                <span
                  key={opt.id}
                  className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                >
                  {opt.name}
                  <button
                    onClick={() => handleDelete(opt.id)}
                    className="text-gray-400 hover:text-red-500 ml-1 font-bold leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newOption[key]}
                onChange={e => setNewOption(prev => ({ ...prev, [key]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleAdd(key)}
                placeholder={`Add ${label.toLowerCase()}...`}
                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-primary focus:outline-none"
              />
              <button
                onClick={() => handleAdd(key)}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-secondary transition-all"
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CustomizationManagement;
