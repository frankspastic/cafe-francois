function OrderBoard({ orders, onUpdateStatus }) {
  const formatCustomizations = (customizations) => {
    if (!customizations) return '';
    const parts = [];
    if (customizations.size) parts.push(customizations.size);
    if (customizations.milk) parts.push(customizations.milk);
    if (customizations.extras?.length > 0) parts.push(...customizations.extras);
    return parts.join(' • ');
  };

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  if (!orders || !Array.isArray(orders)) {
    return <div className="text-center py-20"><p className="text-2xl text-stone-500">Loading orders...</p></div>;
  }

  const pendingOrders = orders.filter(o => o?.status === 'pending');
  const inProgressOrders = orders.filter(o => o?.status === 'in-progress');

  if (orders.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-3xl text-stone-500">No active orders</p>
        <p className="text-xl text-stone-600 mt-2">New orders will appear here</p>
      </div>
    );
  }

  const OrderCard = ({ order }) => {
    const isPending = order.status === 'pending';
    return (
      <div className={`bg-stone-900 border border-stone-800 border-l-4 rounded-xl shadow-md p-6 ${
        isPending ? 'border-l-amber-500' : 'border-l-blue-500'
      }`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold text-stone-100">{order.customer_name}</h3>
            <p className="text-sm text-stone-500 mt-0.5">
              {order.daily_number ? `#${order.daily_number} · ` : ''}{formatTime(order.created_at)}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            isPending ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
          }`}>
            {isPending ? 'Pending' : 'In Progress'}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          {order.items?.length > 0 ? order.items.map((item, idx) => (
            <div key={idx} className="bg-stone-800 rounded-lg p-3">
              <h4 className="font-bold text-stone-200">{item.menu_item_name || 'Unknown Item'}</h4>
              <p className="text-sm text-stone-500 mt-0.5">{formatCustomizations(item.customizations)}</p>
            </div>
          )) : (
            <div className="bg-stone-800 rounded-lg p-3">
              <p className="text-sm text-stone-500">No items in order</p>
            </div>
          )}
        </div>

        {isPending ? (
          <div className="flex gap-2">
            <button
              onClick={() => onUpdateStatus(order.id, 'in-progress')}
              className="flex-1 bg-accent text-stone-900 px-4 py-3 rounded-lg font-semibold hover:brightness-110 transition-all"
            >
              Start Preparing
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, 'cancelled')}
              className="bg-red-900/30 text-red-400 px-4 py-3 rounded-lg font-semibold hover:bg-red-900/50 transition-all"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => onUpdateStatus(order.id, 'completed')}
            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-500 transition-all"
          >
            Mark as Complete
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <h2 className="text-xl font-bold mb-4 text-stone-400 uppercase tracking-widest text-sm">
          Pending <span className="text-amber-500">({pendingOrders.length})</span>
        </h2>
        <div className="space-y-4">
          {pendingOrders.map(order => <OrderCard key={order.id} order={order} />)}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4 text-stone-400 uppercase tracking-widest text-sm">
          In Progress <span className="text-blue-400">({inProgressOrders.length})</span>
        </h2>
        <div className="space-y-4">
          {inProgressOrders.map(order => <OrderCard key={order.id} order={order} />)}
        </div>
      </div>
    </div>
  );
}

export default OrderBoard;
