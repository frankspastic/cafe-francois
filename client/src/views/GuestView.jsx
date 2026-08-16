import { useState, useEffect } from 'react';
import GuestMenuScreen from '../components/guest/GuestMenuScreen';
import GuestCustomizeModal from '../components/guest/GuestCustomizeModal';
import GuestCartScreen from '../components/guest/GuestCartScreen';
import GuestNameScreen from '../components/guest/GuestNameScreen';
import GuestOrderStatus from '../components/guest/GuestOrderStatus';
import { menuAPI, ordersAPI } from '../services/api';
import socketService from '../services/socket';

const SCREENS = {
  MENU: 'menu',
  CART: 'cart',
  NAME: 'name',
  STATUS: 'status'
};

// Guests refresh, lock their phone, or tap away mid-wait. Remember the order
// they placed so they come back to its status instead of an empty menu.
const ACTIVE_ORDER_KEY = 'cafe-francois-active-order';

function readStoredOrderId() {
  try {
    const raw = localStorage.getItem(ACTIVE_ORDER_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

function storeOrderId(id) {
  try {
    if (id) localStorage.setItem(ACTIVE_ORDER_KEY, String(id));
    else localStorage.removeItem(ACTIVE_ORDER_KEY);
  } catch {
    // Private browsing — status tracking just won't survive a reload.
  }
}

function GuestView() {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.MENU);
  const [menuItems, setMenuItems] = useState([]);
  const [customizations, setCustomizations] = useState({ size: [], milk: [], extra: [] });
  const [cart, setCart] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load menu, customizations, and any order still in progress from a previous visit
  useEffect(() => {
    const loadData = async () => {
      try {
        const [menuData, customData] = await Promise.all([
          menuAPI.getAll(),
          menuAPI.getCustomizations()
        ]);
        setMenuItems(menuData);
        setCustomizations(customData);

        const storedId = readStoredOrderId();
        if (storedId) {
          try {
            const order = await ordersAPI.getById(storedId);
            // Completed orders are done with — don't drag guests back to them.
            if (order && order.status !== 'completed' && order.status !== 'cancelled') {
              setCurrentOrder(order);
              setCurrentScreen(SCREENS.STATUS);
            } else {
              storeOrderId(null);
            }
          } catch {
            storeOrderId(null); // Order was deleted or the id is stale.
          }
        }
      } catch (error) {
        console.error('Error loading menu:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Listen for updates to this guest's order
  useEffect(() => {
    if (!currentOrder) return;

    const orderId = currentOrder.id;
    socketService.subscribeToOrder(orderId);

    const handleOrderUpdate = (updatedOrder) => {
      if (updatedOrder.id !== orderId) return;

      setCurrentOrder(updatedOrder);

      if (updatedOrder.status === 'completed') {
        storeOrderId(null);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Your order is ready!', {
            body: 'Your coffee is ready for pickup.',
            icon: '/coffee-icon.svg'
          });
        }
      } else if (updatedOrder.status === 'cancelled') {
        storeOrderId(null);
      }
    };

    socketService.on('order-status-updated', handleOrderUpdate);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socketService.off('order-status-updated', handleOrderUpdate);
    };
    // Only re-subscribe when the tracked order changes, not on every status tick —
    // depending on the whole object would tear down the listener on each update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrder?.id]);

  const handleSelectItem = (item) => {
    setSelectedItem(item);
  };

  const handleAddToCart = (item, selectedCustomizations) => {
    setCart([...cart, { ...item, customizations: selectedCustomizations }]);
    setSelectedItem(null);
  };

  const handleGoToCart = () => {
    setCurrentScreen(SCREENS.CART);
  };

  const handleContinueShopping = () => {
    setCurrentScreen(SCREENS.MENU);
  };

  const handleRemoveFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleCheckout = () => {
    setCurrentScreen(SCREENS.NAME);
  };

  const handleSubmitName = async (name) => {
    try {
      const orderData = {
        customer_name: name,
        items: cart.map(item => ({
          menu_item_id: item.id,
          customizations: item.customizations
        }))
      };

      const order = await ordersAPI.create(orderData);
      storeOrderId(order.id);
      setCurrentOrder(order);
      setCart([]);
      setCurrentScreen(SCREENS.STATUS);
    } catch (error) {
      console.error('Error submitting order:', error);
      alert(error.message || 'Failed to submit order. Please try again.');
    }
  };

  const handleNewOrder = () => {
    storeOrderId(null);
    socketService.unsubscribeFromOrder();
    setCurrentOrder(null);
    setCart([]);
    setCurrentScreen(SCREENS.MENU);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentScreen === SCREENS.MENU && (
        <GuestMenuScreen
          menuItems={menuItems}
          cart={cart}
          onSelectItem={handleSelectItem}
          onGoToCart={handleGoToCart}
        />
      )}

      {currentScreen === SCREENS.CART && (
        <GuestCartScreen
          cart={cart}
          onRemoveItem={handleRemoveFromCart}
          onContinueShopping={handleContinueShopping}
          onCheckout={handleCheckout}
        />
      )}

      {currentScreen === SCREENS.NAME && (
        <GuestNameScreen onSubmit={handleSubmitName} onBack={handleContinueShopping} />
      )}

      {currentScreen === SCREENS.STATUS && currentOrder && (
        <GuestOrderStatus order={currentOrder} onNewOrder={handleNewOrder} />
      )}

      {selectedItem && (
        <GuestCustomizeModal
          item={selectedItem}
          customizations={customizations}
          onClose={() => setSelectedItem(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}

export default GuestView;
