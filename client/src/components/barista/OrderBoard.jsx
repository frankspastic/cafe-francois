function OrderBoard({ orders, onUpdateStatus }) {
  console.log('[OrderBoard] Rendering with orders:', orders);

  const formatCustomizations = (customizations) => {
    if (!customizations) return '';
    const parts = [];
    if (customizations.size) parts.push(customizations.size);
    if (customizations.milk) parts.push(customizations.milk);
    if (customizations.extras && customizations.extras.length > 0) {
      parts.push(...customizations.extras);
    }
    return parts.join(' • ');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 border-yellow-500';
      case 'in-progress':
        return 'bg-blue-100 border-blue-500';
      default:
        return 'bg-gray-100 border-gray-500';
    }
  };

  // Safety check for orders
  if (!orders || !Array.isArray(orders)) {
    return (
      <div className="text-center py-20">
        <p className="text-3xl text-gray-500">Loading orders...</p>
      </div>
    );
  }

  const pendingOrders = orders.filter(o => o && o.status === 'pending');
  const inProgressOrders = orders.filter(o => o && o.status === 'in-progress');

  console.log('[OrderBoard] Pending orders:', pendingOrders);
  console.log('[OrderBoard] In-progress orders:', inProgressOrders);

  return (
    <div>
      {orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-3xl text-gray-500">No active orders</p>
          <p className="text-xl text-gray-400 mt-2">New orders will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* Pending Orders */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-700">
              Pending ({pendingOrders.length})
            </h2>
            <div className="space-y-4">
              {pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className={`${getStatusColor(order.status)} border-l-4 rounded-lg shadow-md p-6`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">
                        {order.customer_name}
                      </h3>
                      <p className="text-sm text-gray-600">{formatTime(order.created_at)}</p>
                    </div>
                    <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Pending
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <div key={idx} className="bg-white rounded p-3">
                          <h4 className="font-bold text-gray-800">{item.menu_item_name || 'Unknown Item'}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatCustomizations(item.customizations)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white rounded p-3">
                        <p className="text-sm text-gray-500">No items in order</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onUpdateStatus(order.id, 'in-progress')}
                      className="flex-1 bg-blue-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-all"
                    >
                      Start Preparing
                    </button>
                    <button
                      onClick={() => onUpdateStatus(order.id, 'cancelled')}
                      className="bg-red-100 text-red-600 px-4 py-3 rounded-lg font-semibold hover:bg-red-200 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* In Progress Orders */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-700">
              In Progress ({inProgressOrders.length})
            </h2>
            <div className="space-y-4">
              {inProgressOrders.map((order) => (
                <div
                  key={order.id}
                  className={`${getStatusColor(order.status)} border-l-4 rounded-lg shadow-md p-6`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">
                        {order.customer_name}
                      </h3>
                      <p className="text-sm text-gray-600">{formatTime(order.created_at)}</p>
                    </div>
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      In Progress
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <div key={idx} className="bg-white rounded p-3">
                          <h4 className="font-bold text-gray-800">{item.menu_item_name || 'Unknown Item'}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatCustomizations(item.customizations)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white rounded p-3">
                        <p className="text-sm text-gray-500">No items in order</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onUpdateStatus(order.id, 'completed')}
                    className="w-full bg-green-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all"
                  >
                    Mark as Complete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderBoard;
