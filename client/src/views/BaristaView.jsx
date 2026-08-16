import { useState, useEffect, useRef } from 'react';
import PinLogin from '../components/barista/PinLogin';
import OrderBoard from '../components/barista/OrderBoard';
import MenuManagement from '../components/barista/MenuManagement';
import ArchivedOrders from '../components/barista/ArchivedOrders';
import QRCodeDisplay from '../components/barista/QRCodeDisplay';
import AppearanceSettings from '../components/barista/AppearanceSettings';
import { ordersAPI, baristaAPI } from '../services/api';
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
  const [activeTab, setActiveTab] = useState(TABS.ORDERS);
  const [orders, setOrders] = useState([]);
  const [archivedOrders, setArchivedOrders] = useState([]);
  const audioRef = useRef(null);

  // Enable wake lock to prevent iPad from sleeping
  useWakeLock();

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

    console.log('[Barista] Setting up socket listeners...');
    const socket = socketService.connect();

    const handleNewOrder = (order) => {
      console.log('[Barista] New order received via socket:', order);
      setOrders(prev => {
        console.log('[Barista] Current orders:', prev);
        const newOrders = [order, ...prev];
        console.log('[Barista] Updated orders:', newOrders);
        return newOrders;
      });

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
      console.log('[Barista] Order status updated via socket:', updatedOrder);
      setOrders(prev => {
        const filtered = prev.filter(o => o.id !== updatedOrder.id);
        if (updatedOrder.status === 'completed' || updatedOrder.status === 'cancelled') {
          if (activeTab === TABS.ARCHIVED) {
            ordersAPI.getArchived().then(setArchivedOrders);
          }
          return filtered;
        }
        return [updatedOrder, ...filtered];
      });
    };

    console.log('[Barista] Registering socket event handlers...');
    socketService.on('new-order', handleNewOrder);
    socketService.on('order-status-updated', handleOrderUpdate);
    console.log('[Barista] Socket event handlers registered');

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      console.log('[Barista] Cleaning up socket listeners');
      socketService.off('new-order', handleNewOrder);
      socketService.off('order-status-updated', handleOrderUpdate);
    };
  }, [isAuthenticated, activeTab]);

  const handleLogin = async (pin) => {
    try {
      const { valid } = await baristaAPI.verifyPin(pin);
      if (valid) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  if (!isAuthenticated) {
    return <PinLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-stone-950">
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {/* Header with Tabs */}
      <div className="bg-stone-900 border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-stone-100 tracking-tight mb-4">Café François — Barista</h1>
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
