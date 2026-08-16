import { useState, useEffect, useRef } from 'react';
import PinLogin from '../components/barista/PinLogin';
import OrderBoard from '../components/barista/OrderBoard';
import MenuManagement from '../components/barista/MenuManagement';
import ArchivedOrders from '../components/barista/ArchivedOrders';
import QRCodeDisplay from '../components/barista/QRCodeDisplay';
import AppearanceSettings from '../components/barista/AppearanceSettings';
import { ordersAPI, baristaAPI, setUnauthorizedHandler } from '../services/api';
import socketService from '../services/socket';
import { useWakeLock } from '../hooks/useWakeLock';

const TABS = {
  ORDERS: 'orders',
  MENU: 'menu',
  ARCHIVED: 'archived',
  QR: 'qr',
  APPEARANCE: 'appearance'
};

function BaristaView() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [activeTab, setActiveTab] = useState(TABS.ORDERS);
  const [orders, setOrders] = useState([]);
  const [archivedOrders, setArchivedOrders] = useState([]);
  const audioRef = useRef(null);
  const audioUnlockedRef = useRef(false);

  // Enable wake lock to prevent iPad from sleeping
  useWakeLock();

  // iOS refuses to play audio until the element has been started inside a real
  // user gesture, so the new-order chime stays silent unless we prime it on a
  // tap. Called from the PIN keypad and from the first tap on the dashboard.
  const unlockAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/notification.mp3');
      audioRef.current.preload = 'auto';
    }
    if (audioUnlockedRef.current) return;
    audioRef.current
      .play()
      .then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioUnlockedRef.current = true;
      })
      .catch(() => {
        // Still locked — the next gesture will try again.
      });
  };

  // Restoring a session skips the keypad, so catch the first tap anywhere.
  useEffect(() => {
    if (!isAuthenticated) return;
    const handler = () => unlockAudio();
    document.addEventListener('pointerdown', handler, { once: true });
    return () => document.removeEventListener('pointerdown', handler);
  }, [isAuthenticated]);

  // A stored token means a reload doesn't have to ask for the PIN again.
  useEffect(() => {
    baristaAPI.restoreSession()
      .then(valid => {
        if (valid) {
          setIsAuthenticated(true);
          socketService.joinBarista();
        }
      })
      .finally(() => setIsRestoringSession(false));
  }, []);

  // If the server ever rejects our token, drop straight back to the PIN screen
  // rather than leaving a dashboard that silently fails every action.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setIsAuthenticated(false);
      socketService.leaveBarista();
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Load orders
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadOrders = async () => {
      try {
        const activeOrders = await ordersAPI.getActive();
        setOrders(activeOrders);
      } catch (error) {
        console.error('Error loading orders:', error);
      }
    };

    loadOrders();
  }, [isAuthenticated]);

  // Load archived orders when tab is active
  useEffect(() => {
    if (!isAuthenticated || activeTab !== TABS.ARCHIVED) return;

    const loadArchived = async () => {
      try {
        const archived = await ordersAPI.getArchived();
        setArchivedOrders(archived);
      } catch (error) {
        console.error('Error loading archived orders:', error);
      }
    };

    loadArchived();
  }, [isAuthenticated, activeTab]);

  // Listen for new orders and updates
  useEffect(() => {
    if (!isAuthenticated) return;

    socketService.connect();

    const handleNewOrder = (order) => {
      // The board lists oldest first, so a new order belongs at the end —
      // otherwise the live view and a reloaded view disagree on the queue.
      setOrders(prev => (prev.some(o => o.id === order.id) ? prev : [...prev, order]));

      // Play notification sound
      if (audioRef.current) {
        audioRef.current.play().catch(err => console.error('Audio play error:', err));
      }

      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Order!', {
          body: `Order from ${order.customer_name}`,
          icon: '/coffee-icon.svg'
        });
      }
    };

    const handleOrderUpdate = (updatedOrder) => {
      setOrders(prev => {
        const filtered = prev.filter(o => o.id !== updatedOrder.id);
        if (updatedOrder.status === 'completed' || updatedOrder.status === 'cancelled') {
          if (activeTab === TABS.ARCHIVED) {
            ordersAPI.getArchived()
              .then(setArchivedOrders)
              .catch(error => console.error('Error refreshing history:', error));
          }
          return filtered;
        }
        // Keep the order in its original queue position rather than jumping it
        // to the front when its status changes.
        const index = prev.findIndex(o => o.id === updatedOrder.id);
        if (index === -1) return [...filtered, updatedOrder];
        return [...filtered.slice(0, index), updatedOrder, ...filtered.slice(index)];
      });
    };

    socketService.on('new-order', handleNewOrder);
    socketService.on('order-status-updated', handleOrderUpdate);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socketService.off('new-order', handleNewOrder);
      socketService.off('order-status-updated', handleOrderUpdate);
    };
  }, [isAuthenticated, activeTab]);

  const handleLogin = async (pin) => {
    const result = await baristaAPI.verifyPin(pin);
    if (result.valid) {
      setIsAuthenticated(true);
      socketService.joinBarista();
    }
    return result;
  };

  const handleLogout = async () => {
    await baristaAPI.logout();
    socketService.leaveBarista();
    setIsAuthenticated(false);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <p className="text-stone-500 text-lg">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PinLogin onLogin={handleLogin} onUserGesture={unlockAudio} />;
  }

  return (
    <div className="min-h-screen bg-stone-950">

      {/* Header with Tabs */}
      <div className="bg-stone-900 border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-stone-100 tracking-tight">Café François — Barista</h1>
            <button
              onClick={handleLogout}
              className="text-sm text-stone-500 hover:text-stone-300 font-semibold px-4 py-2 rounded-lg hover:bg-stone-800 transition-all"
            >
              Sign out
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { tab: TABS.ORDERS, label: 'Active Orders', badge: orders.length },
              { tab: TABS.MENU, label: 'Menu' },
              { tab: TABS.ARCHIVED, label: 'Order History' },
              { tab: TABS.QR, label: 'QR Code' },
              { tab: TABS.APPEARANCE, label: 'Appearance' },
            ].map(({ tab, label, badge }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-lg font-semibold transition-all text-sm ${
                  activeTab === tab
                    ? 'bg-accent text-stone-900'
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                }`}
              >
                {label}
                {badge > 0 && (
                  <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {activeTab === TABS.ORDERS && (
          <OrderBoard orders={orders} onUpdateStatus={handleUpdateStatus} />
        )}
        {activeTab === TABS.MENU && <MenuManagement />}
        {activeTab === TABS.ARCHIVED && <ArchivedOrders orders={archivedOrders} />}
        {activeTab === TABS.QR && <QRCodeDisplay />}
        {activeTab === TABS.APPEARANCE && <AppearanceSettings />}
      </div>
    </div>
  );
}

export default BaristaView;
