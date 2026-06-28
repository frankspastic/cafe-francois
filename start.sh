#!/bin/bash

# Start Café François

echo "🚀 Starting Café François..."
echo ""

# Check if node_modules exist
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd client && npm install && cd ..
fi

echo ""
echo "✅ Starting servers..."
echo "   • Server: http://localhost:3000"
echo "   • Client: http://localhost:5173"
echo ""
echo "📱 Access points:"
echo "   • Kiosk:   http://localhost:5173/kiosk"
echo "   • Guest:   http://localhost:5173/order"
echo "   • Barista: http://localhost:5173/barista (PIN: 1234)"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start both servers
(cd server && npm run dev) & (cd client && npm run dev)

# Wait for both processes
wait
