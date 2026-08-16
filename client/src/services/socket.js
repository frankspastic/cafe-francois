import { io } from 'socket.io-client';
import { getToken } from './api';

// In dev, Vite proxies to the local server; in prod, client and server share an origin.
const SOCKET_URL = import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin;

class SocketService {
  constructor() {
    this.socket = null;
    // Remembered so we can re-join after a reconnect, which otherwise drops
    // room membership and silently stops delivering order events.
    this.baristaJoined = false;
    this.subscribedOrderId = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL);

      this.socket.on('connect', () => {
        console.log('Socket connected');
        if (this.baristaJoined) this.joinBarista();
        if (this.subscribedOrderId) this.subscribeToOrder(this.subscribedOrderId);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    }
    return this.socket;
  }

  // Order events are scoped to rooms, so the dashboard has to prove it is a
  // barista before it receives anything.
  joinBarista() {
    this.connect();
    this.baristaJoined = true;
    const token = getToken();
    if (token) this.socket.emit('barista:join', token);
  }

  leaveBarista() {
    this.baristaJoined = false;
  }

  // Guests only receive updates for the order they placed.
  subscribeToOrder(orderId) {
    if (!orderId) return;
    this.connect();
    this.subscribedOrderId = orderId;
    this.socket.emit('order:subscribe', orderId);
  }

  unsubscribeFromOrder() {
    this.subscribedOrderId = null;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.baristaJoined = false;
    this.subscribedOrderId = null;
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

export default new SocketService();
