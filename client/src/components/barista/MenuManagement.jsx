import { useState, useEffect } from 'react';
import { menuAPI } from '../../services/api';
import CustomizationManagement from './CustomizationManagement';

function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    available: 1
  });

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const items = await menuAPI.getAll();
      setMenuItems(items);
    } catch (error) {
      console.error('Error loading menu:', error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      image_url: item.image_url || '',
      available: item.available
    });
    setIsEditing(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      image_url: '',
      available: 1
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingItem(null);
    setFormData({ name: '', description: '', image_url: '', available: 1 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await menuAPI.update(editingItem.id, formData);
      } else {
        await menuAPI.create(formData);
      }
      await loadMenu();
      handleCancel();
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('Failed to save menu item');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to remove this item?')) {
      try {
        await menuAPI.delete(id);
        await loadMenu();
      } catch (error) {
        console.error('Error deleting menu item:', error);
        alert('Failed to delete menu item');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Menu Management</h2>
        <button
          onClick={handleNew}
          className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary transition-all"
        >
          + Add New Item
        </button>
      </div>

      {isEditing ? (
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h3 className="text-2xl font-bold mb-6">
            {editingItem ? 'Edit Menu Item' : 'New Menu Item'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Image URL (optional)
              </label>
              <input
                type="text"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.available === 1}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked ? 1 : 0 })}
                className="w-5 h-5"
              />
              <label className="text-sm font-semibold text-gray-700">
                Available to order
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-secondary transition-all"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="aspect-square bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-6xl">☕</span>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-800 mb-1">{item.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-all"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CustomizationManagement />
    </div>
  );
}

export default MenuManagement;
