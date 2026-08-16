function GuestOrderStatus({ order, onNewOrder }) {
  const getStatusDisplay = () => {
    switch (order.status) {
      case 'pending': {
        const ahead = order.queue_position;
        let message = 'Your order is in the queue';
        if (ahead === 0) message = "You're next up";
        else if (ahead > 0) message = `${ahead} order${ahead === 1 ? '' : 's'} ahead of you`;
        return {
          icon: '⏳',
          title: 'Order Received',
          message,
          color: 'bg-yellow-500'
        };
      }
      case 'in-progress':
        return {
          icon: '☕',
          title: 'Being Prepared',
          message: 'Your coffee is being made',
          color: 'bg-blue-500'
        };
      case 'completed':
        return {
          icon: '✅',
          title: 'Order Ready!',
          message: 'Your coffee is ready for pickup',
          color: 'bg-green-500'
        };
      case 'cancelled':
        return {
          icon: '🚫',
          title: 'Order Cancelled',
          message: 'Please check with the barista',
          color: 'bg-red-500'
        };
      default:
        return {
          icon: '📋',
          title: 'Order Status',
          message: 'Check your order status',
          color: 'bg-gray-500'
        };
    }
  };

  const formatCustomizations = (customizations) => {
    const parts = [];
    if (customizations.size) parts.push(customizations.size);
    if (customizations.milk) parts.push(customizations.milk);
    if (customizations.extras && customizations.extras.length > 0) {
      parts.push(...customizations.extras);
    }
    return parts.join(' • ');
  };

  const status = getStatusDisplay();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`${status.color} text-white p-4 shadow-lg`}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">Order Status</h1>
        </div>
      </div>

      {/* Status */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
          <div className="text-8xl mb-4">{status.icon}</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{status.title}</h2>
          <p className="text-xl text-gray-600 mb-4">{status.message}</p>
          <p className="text-lg text-gray-500">Order for: <span className="font-semibold">{order.customer_name}</span></p>
          {order.daily_number && (
            <p className="text-sm text-gray-400 mt-1">Order #{order.daily_number}</p>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Your Items</h3>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
                <h4 className="font-semibold text-gray-800">{item.menu_item_name}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {formatCustomizations(item.customizations)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* New Order Button (once the order is done with, either way) */}
        {(order.status === 'completed' || order.status === 'cancelled') && (
          <button
            onClick={onNewOrder}
            className="w-full bg-primary text-white px-6 py-4 rounded-xl text-lg font-semibold hover:bg-secondary transition-all"
          >
            Place Another Order
          </button>
        )}
      </div>
    </div>
  );
}

export default GuestOrderStatus;
