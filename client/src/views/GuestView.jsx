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

function GuestView() {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.MENU);
  const [menuItems, setMenuItems] = useState([]);
  const [customizations, setCustomizations] = useState({ size: [], milk: [], extra: [] });
  const [cart, setCart] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load menu and customizations
  useEffect(() => {
    const loadData = async () => {
      try {
        const [menuData, customData] = await Promise.all([
          menuAPI.getAll(),
          menuAPI.getCustomizations()
        ]);
        setMenuItems(menuData);
        setCustomizations(customData);
      } catch (error) {
        console.error('Error loading menu:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Listen for order status updates
  useEffect(() => {
    if (!currentOrder) return;

    const socket = socketService.connect();

    const handleOrderUpdate = (updatedOrder) => {
      if (updatedOrder.id === currentOrder.id) {
        setCurrentOrder(updatedOrder);

        // Show notification when order is ready
        if (updatedOrder.status === 'completed') {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Your order is ready!', {
              body: 'Your coffee is ready for pickup.',
              icon: '/coffee-icon.svg'
            });
          }
        }
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
  }, [currentOrder]);

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
      setCurrentOrder(order);
      setCart([]);
      setCurrentScreen(SCREENS.STATUS);
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Failed to submit order. Please try again.');
    }
  };

  const handleNewOrder = () => {
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
