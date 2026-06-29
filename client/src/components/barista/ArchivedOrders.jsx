import { useState } from 'react';

function ArchivedOrders({ orders }) {
  const [searchTerm, setSearchTerm] = useState('');

  const formatCustomizations = (customizations) => {
    const parts = [];
    if (customizations.size) parts.push(customizations.size);
    if (customizations.milk) parts.push(customizations.milk);
    if (customizations.extras?.length > 0) parts.push(...customizations.extras);
    return parts.join(' • ');
  };

  const formatDateTime = (timestamp) =>
    new Date(timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const filteredOrders = orders.filter(order =>
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-stone-100 mb-4">Order History</h2>
        <input
          type="text"
          placeholder="Search by customer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-3 bg-stone-900 border-2 border-stone-700 text-stone-100 placeholder-stone-500 rounded-lg focus:border-accent focus:outline-none"
        />
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-2xl text-stone-500">
            {searchTerm ? 'No orders found' : 'No completed orders yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-stone-900 border border-stone-800 rounded-xl shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-stone-100">{order.customer_name}</h3>
                  <p className="text-sm text-stone-500">Ordered: {formatDateTime(order.created_at)}</p>
                  <p className="text-sm text-stone-500">Completed: {formatDateTime(order.completed_at)}</p>
                </div>
                <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-semibold">
                  Completed
                </span>
              </div>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="bg-stone-800 rounded-lg p-3">
                    <h4 className="font-bold text-stone-200">{item.menu_item_name}</h4>
                    <p className="text-sm text-stone-500 mt-1">{formatCustomizations(item.customizations)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ArchivedOrders;
