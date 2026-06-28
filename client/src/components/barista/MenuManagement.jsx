import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { menuAPI } from '../../services/api';
import CustomizationManagement from './CustomizationManagement';

function GripIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="5" cy="4" r="1.5" /><circle cx="11" cy="4" r="1.5" />
      <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
      <circle cx="5" cy="12" r="1.5" /><circle cx="11" cy="12" r="1.5" />
    </svg>
  );
}

function SortableRow({ item, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
        isDragging
          ? 'opacity-40 shadow-xl border-primary bg-white'
          : item.available
          ? 'bg-white border-gray-200 shadow-sm'
          : 'bg-gray-50 border-gray-200 shadow-sm opacity-60'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
        tabIndex={-1}
      >
        <GripIcon />
      </button>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className={`font-semibold ${item.available ? 'text-gray-800' : 'text-gray-400'}`}>{item.name}</span>
        {!item.available && (
          <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-medium">Hidden</span>
        )}
        {item.description && (
          <span className="text-gray-400 text-sm truncate hidden sm:inline">{item.description}</span>
        )}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => onEdit(item)}
          className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="bg-red-50 text-red-500 hover:bg-red-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function SortableCategory({ category, itemCount, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'opacity-40' : ''}
    >
      <div className="flex items-center gap-3 mb-3">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
          tabIndex={-1}
        >
          <GripIcon />
        </button>
        <h3 className="text-lg font-bold text-gray-700">{category.name}</h3>
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">{itemCount} {itemCount === 1 ? 'item' : 'items'} — drag to reorder</span>
      </div>
      {children}
    </div>
  );
}

function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    available: 1,
    allowed_customization_types: ['size', 'milk', 'extra'],
    category: 'Coffee'
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => { loadMenu(); }, []);

  const loadMenu = async () => {
    try {
      const [items, cats] = await Promise.all([menuAPI.getAllAdmin(), menuAPI.getCategories()]);
      setMenuItems(items);
      setCategories(cats);
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
      available: item.available,
      allowed_customization_types: item.allowed_customization_types || ['size', 'milk', 'extra'],
      category: item.category || 'Coffee'
    });
    setIsEditing(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    setFormData({ name: '', description: '', image_url: '', available: 1, allowed_customization_types: ['size', 'milk', 'extra'], category: 'Coffee' });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingItem(null);
    setFormData({ name: '', description: '', image_url: '', available: 1, allowed_customization_types: ['size', 'milk', 'extra'], category: 'Coffee' });
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

  const handleItemDragEnd = (event, categoryName) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setMenuItems(prev => {
      const catItems = prev.filter(i => (i.category || 'Uncategorized') === categoryName);
      const others = prev.filter(i => (i.category || 'Uncategorized') !== categoryName);
      const reordered = arrayMove(catItems, catItems.findIndex(i => i.id === active.id), catItems.findIndex(i => i.id === over.id));
      menuAPI.reorder(reordered.map((item, idx) => ({ id: item.id, sort_order: idx })));
      return [...others, ...reordered];
    });
  };

  const handleCategoryDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setCategories(prev => {
      const reordered = arrayMove(prev, prev.findIndex(c => c.id === active.id), prev.findIndex(c => c.id === over.id));
      menuAPI.reorderCategories(reordered.map((cat, idx) => ({ id: cat.id, sort_order: idx })));
      return reordered;
    });
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  list="category-options"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Coffee, Tea, Food"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                />
                <datalist id="category-options">
                  {categories.map(cat => <option key={cat.id} value={cat.name} />)}
                </datalist>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Image URL (optional)</label>
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
              <label className="text-sm font-semibold text-gray-700">Available to order</label>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Customization Options</label>
              {[
                { key: 'size', label: 'Size' },
                { key: 'milk', label: 'Milk Type' },
                { key: 'extra', label: 'Extras & Syrups' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.allowed_customization_types.includes(key)}
                    onChange={(e) => {
                      const types = e.target.checked
                        ? [...formData.allowed_customization_types, key]
                        : formData.allowed_customization_types.filter(t => t !== key);
                      setFormData({ ...formData, allowed_customization_types: types });
                    }}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-semibold text-gray-700">{label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={handleCancel} className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-all">
                Cancel
              </button>
              <button type="submit" className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-secondary transition-all">
                Save
              </button>
            </div>
          </form>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
          <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-8 mb-8">
              {categories.map(category => {
                const items = menuItems.filter(i => (i.category || 'Uncategorized') === category.name);
                return (
                  <SortableCategory key={category.id} category={category} itemCount={items.length}>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => handleItemDragEnd(e, category.name)}
                    >
                      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2 ml-6">
                          {items.map(item => (
                            <SortableRow key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </SortableCategory>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <CustomizationManagement />
    </div>
  );
}

export default MenuManagement;
