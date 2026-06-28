const API_BASE = '/api';

// Menu API
export const menuAPI = {
  async getAll() {
    const response = await fetch(`${API_BASE}/menu`);
    return response.json();
  },

  async getAllAdmin() {
    const response = await fetch(`${API_BASE}/menu?admin=true`);
    return response.json();
  },

  async getCustomizations() {
    const response = await fetch(`${API_BASE}/menu/customizations`);
    return response.json();
  },

  async create(item) {
    const response = await fetch(`${API_BASE}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return response.json();
  },

  async update(id, item) {
    const response = await fetch(`${API_BASE}/menu/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return response.json();
  },

  async delete(id) {
    const response = await fetch(`${API_BASE}/menu/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  async createCustomization(type, name) {
    const response = await fetch(`${API_BASE}/menu/customizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, name })
    });
    return response.json();
  },

  async deleteCustomization(id) {
    const response = await fetch(`${API_BASE}/menu/customizations/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  async reorder(items) {
    const response = await fetch(`${API_BASE}/menu/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    return response.json();
  },

  async getCategories() {
    const response = await fetch(`${API_BASE}/menu/categories`);
    return response.json();
  },

  async reorderCategories(items) {
    const response = await fetch(`${API_BASE}/menu/categories/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    return response.json();
  }
};

// Orders API
export const ordersAPI = {
  async getActive() {
    const response = await fetch(`${API_BASE}/orders`);
    return response.json();
  },

  async getArchived() {
    const response = await fetch(`${API_BASE}/orders/archived`);
    return response.json();
  },

  async getById(id) {
    const response = await fetch(`${API_BASE}/orders/${id}`);
    return response.json();
  },

  async create(order) {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    return response.json();
  },

  async updateStatus(id, status) {
    const response = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return response.json();
  }
};
