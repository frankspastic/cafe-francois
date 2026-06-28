import { useState, useEffect, useRef } from 'react';
import PinLogin from '../components/barista/PinLogin';
import OrderBoard from '../components/barista/OrderBoard';
import MenuManagement from '../components/barista/MenuManagement';
import ArchivedOrders from '../components/barista/ArchivedOrders';
import QRCodeDisplay from '../components/barista/QRCodeDisplay';
import { ordersAPI } from '../services/api';
import socketService from '../services/socket';
import { useWakeLock } from '../hooks/useWakeLock';

const TABS = {
  ORDERS: 'orders',
  MENU: 'menu',
  ARCHIVED: 'archived',
  QR: 'qr'
};

// Simple PIN - in production, this would be env variable or in database
const BARISTA_PIN = '1234';

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
        if (updatedOrder.status === 'completed') {
          // Refresh archived if on that tab
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

  const handleLogin = (pin) => {
    if (pin === BARISTA_PIN) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
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
    <div className="min-h-screen bg-gray-50">
      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {/* Header with Tabs */}
      <div className="bg-primary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold mb-4">☕ Barista Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab(TABS.ORDERS)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === TABS.ORDERS
                  ? 'bg-white text-primary'
                  : 'bg-primary-light hover:bg-secondary text-white'
              }`}
            >
              Active Orders
              {orders.length > 0 && (
                <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                  {orders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab(TABS.MENU)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === TABS.MENU
                  ? 'bg-white text-primary'
                  : 'bg-primary-light hover:bg-secondary text-white'
              }`}
            >
              Menu Management
            </button>
            <button
              onClick={() => setActiveTab(TABS.ARCHIVED)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === TABS.ARCHIVED
                  ? 'bg-white text-primary'
                  : 'bg-primary-light hover:bg-secondary text-white'
              }`}
            >
              Order History
            </button>
            <button
              onClick={() => setActiveTab(TABS.QR)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === TABS.QR
                  ? 'bg-white text-primary'
                  : 'bg-primary-light hover:bg-secondary text-white'
              }`}
            >
              QR Code
            </button>
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
      </div>
    </div>
  );
}

export default BaristaView;
