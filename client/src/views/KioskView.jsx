import { useState, useEffect, useCallback } from 'react';
import WelcomeScreen from '../components/kiosk/WelcomeScreen';
import MenuScreen from '../components/kiosk/MenuScreen';
import CustomizeModal from '../components/kiosk/CustomizeModal';
import CartScreen from '../components/kiosk/CartScreen';
import NameScreen from '../components/kiosk/NameScreen';
import ConfirmationScreen from '../components/kiosk/ConfirmationScreen';
import { menuAPI, ordersAPI } from '../services/api';
import { useIdleTimer } from '../hooks/useIdleTimer';
import { useWakeLock } from '../hooks/useWakeLock';

const SCREENS = {
  WELCOME: 'welcome',
  MENU: 'menu',
  CART: 'cart',
  NAME: 'name',
  CONFIRMATION: 'confirmation'
};

function KioskView() {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.WELCOME);
  const [menuItems, setMenuItems] = useState([]);
  const [customizations, setCustomizations] = useState({ size: [], milk: [], extra: [] });
  const [cart, setCart] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Enable wake lock to prevent iPad from sleeping
  useWakeLock();

  // Auto-reset after 30 seconds of inactivity
  const resetKiosk = useCallback(() => {
    setCurrentScreen(SCREENS.WELCOME);
    setCart([]);
    setSelectedItem(null);
    setCustomerName('');
  }, []);

  useIdleTimer(30000, resetKiosk, currentScreen !== SCREENS.WELCOME);

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

  const handleStartOrder = () => {
    setCurrentScreen(SCREENS.MENU);
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
  };

  const handleAddToCart = (item, selectedCustomizations) => {
    setCart([...cart, { ...item, customizations: selectedCustomizations }]);
    setSelectedItem(null);
  };

  const handleContinueShopping = () => {
    setCurrentScreen(SCREENS.MENU);
  };

  const handleGoToCart = () => {
    setCurrentScreen(SCREENS.CART);
  };

  const handleRemoveFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleCheckout = () => {
    setCurrentScreen(SCREENS.NAME);
  };

  const handleSubmitName = (name) => {
    setCustomerName(name);
    submitOrder(name);
  };

  const submitOrder = async (name) => {
    try {
      const orderData = {
        customer_name: name,
        items: cart.map(item => ({
          menu_item_id: item.id,
          customizations: item.customizations
        }))
      };

      await ordersAPI.create(orderData);
      setCurrentScreen(SCREENS.CONFIRMATION);

      // Auto-reset after 5 seconds on confirmation screen
      setTimeout(resetKiosk, 5000);
    } catch (error) {
      console.error('Error submitting order:', error);
      alert(error.message || 'Failed to submit order. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="kiosk-mode min-h-screen bg-gray-50">
      {currentScreen === SCREENS.WELCOME && (
        <WelcomeScreen onStart={handleStartOrder} />
      )}

      {currentScreen === SCREENS.MENU && (
        <MenuScreen
          menuItems={menuItems}
          cart={cart}
          onSelectItem={handleSelectItem}
          onGoToCart={handleGoToCart}
        />
      )}

      {currentScreen === SCREENS.CART && (
        <CartScreen
          cart={cart}
          onRemoveItem={handleRemoveFromCart}
          onContinueShopping={handleContinueShopping}
          onCheckout={handleCheckout}
        />
      )}

      {currentScreen === SCREENS.NAME && (
        <NameScreen onSubmit={handleSubmitName} />
      )}

      {currentScreen === SCREENS.CONFIRMATION && (
        <ConfirmationScreen customerName={customerName} />
      )}

      {selectedItem && (
        <CustomizeModal
          item={selectedItem}
          customizations={customizations}
          onClose={() => setSelectedItem(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}

export default KioskView;
