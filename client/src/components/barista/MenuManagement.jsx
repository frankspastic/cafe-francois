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
          ? 'opacity-40 shadow-xl border-accent bg-stone-900'
          : item.available
          ? 'bg-stone-900 border-stone-800'
          : 'bg-stone-900 border-stone-800 opacity-50'
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
        <span className={`font-semibold ${item.available ? 'text-stone-100' : 'text-stone-500'}`}>{item.name}</span>
        {!item.available && (
          <span className="text-xs bg-stone-700 text-stone-400 px-2 py-0.5 rounded-full font-medium">Hidden</span>
        )}
        {item.description && (
          <span className="text-stone-500 text-sm truncate hidden sm:inline">{item.description}</span>
        )}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => onEdit(item)}
          className="bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="bg-red-900/30 text-red-400 hover:bg-red-900/50 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
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
        <h3 className="text-lg font-bold text-stone-200">{category.name}</h3>
        <div className="flex-1 h-px bg-stone-800" />
        <span className="text-xs text-stone-500">{itemCount} {itemCount === 1 ? 'item' : 'items'} — drag to reorder</span>
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
      menuAPI.reorder(reordered.map((item, idx) => ({ id: item.id, sort_order: idx })))
        .catch(error => console.error('Error saving item order:', error));
      return [...others, ...reordered];
    });
  };

  const handleCategoryDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setCategories(prev => {
      const reordered = arrayMove(prev, prev.findIndex(c => c.id === active.id), prev.findIndex(c => c.id === over.id));
      menuAPI.reorderCategories(reordered.map((cat, idx) => ({ id: cat.id, sort_order: idx })))
        .catch(error => console.error('Error saving category order:', error));
      return reordered;
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-stone-100">Menu Management</h2>
        <button
          onClick={handleNew}
          className="bg-accent text-stone-900 px-6 py-3 rounded-lg font-semibold hover:brightness-110 transition-all"
        >
          + Add New Item
        </button>
      </div>

      {isEditing ? (
        <div className="bg-stone-900 border border-stone-800 rounded-xl shadow-lg p-8 mb-6">
          <h3 className="text-2xl font-bold text-stone-100 mb-6">
            {editingItem ? 'Edit Menu Item' : 'New Menu Item'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-stone-400 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-stone-800 border border-stone-700 text-stone-100 rounded-lg focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-400 mb-2">Category</label>
                <input
                  type="text"
                  list="category-options"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Coffee, Tea, Food"
                  className="w-full px-4 py-2 bg-stone-800 border border-stone-700 text-stone-100 placeholder-stone-500 rounded-lg focus:border-accent focus:outline-none"
                />
                <datalist id="category-options">
                  {categories.map(cat => <option key={cat.id} value={cat.name} />)}
                </datalist>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-400 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-stone-800 border border-stone-700 text-stone-100 rounded-lg focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-400 mb-2">Image URL (optional)</label>
              <input
                type="text"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-4 py-2 bg-stone-800 border border-stone-700 text-stone-100 rounded-lg focus:border-accent focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.available === 1}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked ? 1 : 0 })}
                className="w-5 h-5 accent-[#D4A574]"
              />
              <label className="text-sm font-semibold text-stone-300">Available to order</label>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-400 mb-2">Customization Options</label>
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
                    className="w-5 h-5 accent-[#D4A574]"
                  />
                  <span className="text-sm font-semibold text-stone-300">{label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={handleCancel} className="flex-1 px-6 py-3 bg-stone-700 text-stone-300 rounded-lg font-semibold hover:bg-stone-600 transition-all">
                Cancel
              </button>
              <button type="submit" className="flex-1 px-6 py-3 bg-accent text-stone-900 rounded-lg font-semibold hover:brightness-110 transition-all">
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
