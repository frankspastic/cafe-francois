# Café François - Coffee Ordering App

A web-based coffee ordering system for home use, featuring a kiosk mode for iPad, mobile guest ordering, and a barista management dashboard.

## Features

### Kiosk View (iPad - Landscape)
- Welcome screen with easy-to-use interface
- Browse coffee menu with images
- Customize drinks (size, milk type, extras)
- Multi-item cart system
- Customer name entry
- Auto-reset after 30 seconds of inactivity
- Prevents iPad from sleeping

### Guest Mobile View
- Accessible via QR code or direct URL
- Responsive mobile design
- Same ordering capabilities as kiosk
- Real-time order status tracking
- Browser notifications when order is ready

### Barista Dashboard (iPad - PIN Protected)
- PIN protection (default: 1234)
- Active order management board
- Visual and audio notifications for new orders
- Drag-and-drop order status updates (pending → in-progress → completed)
- Menu management (add/edit/remove items)
- Order history with search
- QR code generator for guest access
- Prevents iPad from sleeping

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Database**: SQL.js (pure JavaScript SQLite - no compilation needed!)
- **Real-time**: Socket.io for live updates
- **QR Codes**: qrcode.react

## Installation

### Prerequisites
- Node.js 18+ and npm installed

### Setup Steps

1. **Navigate to the project directory**:
   ```bash
   cd /Users/frankmaulit/Sites/cafe-francois
   ```

2. **Install server dependencies**:
   ```bash
   cd server
   npm install
   cd ..
   ```

3. **Install client dependencies**:
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Start the application**:
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:3000`
   - Frontend dev server on `http://localhost:5173`

3. **Access the app**:
   - **Kiosk (iPad)**: `http://localhost:5173/kiosk`
   - **Guest Mobile**: `http://localhost:5173/order`
   - **Barista Dashboard**: `http://localhost:5173/barista`

## Default Configuration

### Barista PIN
The default PIN is `1234`. Change it from **Barista → Appearance → Barista PIN**.
It is stored as a bcrypt hash in the database, so it survives redeploys and is
never exposed to the browser. See [Security model](#security-model) if you forget it.

### Default Menu
The app comes with 7 default coffee drinks:
- Espresso
- Americano
- Cappuccino
- Latte
- Mocha
- Cold Brew
- Iced Latte

You can add, edit, or remove items through the Barista Dashboard → Menu Management.

### Customization Options
- **Sizes**: Small, Medium, Large
- **Milk Types**: Whole, 2%, Oat, Almond, Soy
- **Extras**: Extra Shot, Vanilla, Caramel, Hazelnut

## Usage

### For Guests

1. **Kiosk Mode** (iPad at your coffee station):
   - Tap "Start Your Order"
   - Browse and select drinks
   - Customize each drink
   - Enter your name
   - Order submitted!

2. **Mobile Mode** (scan QR code):
   - Scan QR code from barista dashboard
   - Browse and order from your phone
   - Track order status in real-time
   - Get notified when ready

### For Barista

1. Access barista dashboard at `/barista`
2. Enter PIN (default: 1234)
3. View active orders in two columns:
   - **Pending**: New orders waiting to be started
   - **In Progress**: Orders being prepared
4. Tap "Start Preparing" to move to in-progress
5. Tap "Mark as Complete" when done
6. Manage menu items in Menu Management tab
7. View order history in Order History tab
8. Generate/print QR code in QR Code tab

## Database

The app uses SQLite, stored in `server/db/cafe-francois.db`. The database is automatically created and seeded on first run.

To reset the database:
```bash
rm server/db/cafe-francois.db
npm run dev:server
```

## Project Structure

```
cafe-francois/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── kiosk/      # Kiosk view components
│   │   │   ├── guest/      # Guest mobile components
│   │   │   └── barista/    # Barista dashboard components
│   │   ├── views/          # Main view pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API and socket services
│   │   └── App.jsx
│   └── package.json
├── server/                 # Express backend
│   ├── db/                 # SQLite database
│   ├── routes/             # API routes
│   ├── models/             # Data models
│   └── server.js
└── package.json
```

## Customization

### Adding Coffee Images
Replace the placeholder emoji (☕) with actual images:
1. Add images to `client/public/images/`
2. Update menu items with image URLs via Menu Management
3. Or edit database directly

### Changing Colors
Edit `client/tailwind.config.js`:
```js
colors: {
  primary: '#6F4E37',    // Main brown
  secondary: '#A0826D',  // Lighter brown
  accent: '#D4A574',     // Accent color
}
```

### Adding Notification Sound
Add an audio file at `client/public/notification.mp3` for new order alerts.

## Deployment

The app deploys as a **single service**: `npm run build` compiles the client, and
the Express server serves the built files alongside the API, so there is only one
process and one origin in production.

```bash
npm run build   # build the client into client/dist
npm start       # serve API + client on $PORT
```

### Railway

1. Deploy from the GitHub repo with the **root directory** set to `/`.
2. Add a **volume** mounted at `/data` — without it, the SQLite database is wiped
   on every deploy.
3. Set `DB_PATH=/data/cafe-francois.db`. Leave `PORT` alone; Railway injects it.
4. Do not set `LABEL_PRINTER_NAME` — label printing talks to a local CUPS printer
   and no-ops in the cloud.
5. Add the custom domain in Railway, then point a CNAME at the target it shows.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | Server port (default 3000; Railway sets this) |
| `DB_PATH` | SQLite file location (default `server/db/cafe-francois.db`) |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowlist (default `http://localhost:5173`) |
| `BARISTA_PIN` | Seeds the initial PIN on first run only |
| `RESET_BARISTA_PIN` | Forces the PIN back to this value on startup — see below |
| `LABEL_PRINTER_NAME` | CUPS printer name; unset disables printing |
| `DEBUG` | `true` for verbose order/database logging |

### Backups

The database is a single SQLite file. Download a copy any time from
**Barista → Appearance → Backup**, and keep one before a redeploy or a big menu
change.

## Security model

The barista dashboard is PIN-protected, and the API enforces it:

- The PIN is stored as a **bcrypt hash** in the database, never in the client bundle.
- A correct PIN returns a **session token**; every menu, settings, and order-management
  endpoint requires it. Placing an order is the only public write.
- PIN attempts are **rate limited** with a growing lockout, since a 4-digit PIN is
  only 10,000 combinations.
- Order events are delivered over **scoped socket rooms** — baristas see all orders,
  a guest sees only their own, and an unauthenticated listener sees nothing.

### Forgot the PIN?

Set `RESET_BARISTA_PIN` to a new 4-digit value and restart the server. It overwrites
the stored PIN on startup and logs a warning. **Remove the variable afterward** —
otherwise it resets the PIN on every restart.

## Testing

```bash
npm test    # server tests (node:test)
npm run lint
```

## Troubleshooting

### Orders not updating in real-time
- Check that WebSocket connection is established
- Look for socket connection logs in browser console

### iPad going to sleep
- Ensure Wake Lock API is supported (Safari 16.4+)
- Check browser console for wake lock errors
- As fallback, adjust iPad settings to prevent auto-sleep

### Can't access from phone
- Ensure phone and server are on same network
- Use server's local IP instead of localhost
- Example: `http://192.168.1.100:5173/order`

## License

MIT

## Credits

Built for home coffee enthusiasts who want to provide a professional ordering experience for their guests!
