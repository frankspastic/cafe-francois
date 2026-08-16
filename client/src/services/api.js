const API_BASE = '/api';
const TOKEN_KEY = 'cafe-francois-barista-token';

// ---------------------------------------------------------------------------
// Barista session token
// ---------------------------------------------------------------------------

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null; // Safari private mode
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore — the session just won't survive a reload.
  }
}

// Notifies the app when the server rejects our token, so the dashboard can drop
// back to the PIN screen instead of silently failing every request.
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (response.status === 401 && auth) {
    setToken(null);
    if (onUnauthorized) onUnauthorized();
    throw new Error('Your session expired. Please enter the PIN again.');
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }

  return data;
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export const menuAPI = {
  getAll: () => request('/menu'),
  getAllAdmin: () => request('/menu?admin=true', { auth: true }),
  getCustomizations: () => request('/menu/customizations'),
  getCategories: () => request('/menu/categories'),

  create: (item) => request('/menu', { method: 'POST', body: item, auth: true }),
  update: (id, item) => request(`/menu/${id}`, { method: 'PUT', body: item, auth: true }),
  delete: (id) => request(`/menu/${id}`, { method: 'DELETE', auth: true }),

  createCustomization: (type, name) =>
    request('/menu/customizations', { method: 'POST', body: { type, name }, auth: true }),
  deleteCustomization: (id) =>
    request(`/menu/customizations/${id}`, { method: 'DELETE', auth: true }),

  reorder: (items) => request('/menu/reorder', { method: 'PATCH', body: { items }, auth: true }),
  reorderCategories: (items) =>
    request('/menu/categories/reorder', { method: 'PATCH', body: { items }, auth: true })
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const settingsAPI = {
  getAll: () => request('/settings'),
  set: (key, value) => request(`/settings/${key}`, { method: 'PUT', body: { value }, auth: true })
};

// ---------------------------------------------------------------------------
// Barista authentication
// ---------------------------------------------------------------------------

export const baristaAPI = {
  async verifyPin(pin) {
    const response = await fetch(`${API_BASE}/settings/barista-pin/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    const data = await response.json().catch(() => ({}));

    if (response.status === 429) {
      return { valid: false, lockedOut: true, message: data.error };
    }
    if (data.valid && data.token) {
      setToken(data.token);
      return { valid: true };
    }
    return { valid: false };
  },

  // Confirms a stored token still works, so a reload doesn't force the PIN again.
  async restoreSession() {
    if (!getToken()) return false;
    try {
      await request('/settings/barista-pin/session', { auth: true });
      return true;
    } catch {
      return false;
    }
  },

  async logout() {
    try {
      await request('/settings/barista-pin/logout', { method: 'POST', auth: true });
    } catch {
      // Even if the server call fails, drop the local token.
    }
    setToken(null);
  },

  async changePin(currentPin, newPin) {
    const data = await request('/settings/barista-pin', {
      method: 'PUT',
      body: { currentPin, newPin },
      auth: true
    });
    // Changing the PIN invalidates every session, including this one.
    if (data?.token) setToken(data.token);
    return data;
  },

  backupUrl: () => `${API_BASE}/settings/backup?token=${encodeURIComponent(getToken() || '')}`,

  // Uploads a .db file to replace the live database — e.g. moving a dev
  // database to production. The server invalidates every session (including
  // this one) once it's done, since the uploaded file has its own PIN hash.
  async restore(file) {
    const response = await fetch(`${API_BASE}/settings/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        Authorization: `Bearer ${getToken() || ''}`
      },
      body: file
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Restore failed (${response.status})`);
    }
    setToken(null);
    return data;
  }
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const ordersAPI = {
  getActive: () => request('/orders', { auth: true }),
  getArchived: () => request('/orders/archived', { auth: true }),
  getById: (id) => request(`/orders/${id}`),
  create: (order) => request('/orders', { method: 'POST', body: order }),
  updateStatus: (id, status) =>
    request(`/orders/${id}/status`, { method: 'PATCH', body: { status }, auth: true }),
  reprint: (id) => request(`/orders/${id}/print`, { method: 'POST', auth: true })
};
