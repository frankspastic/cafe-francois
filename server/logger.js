// Verbose request/order tracing is useful while developing but floods the logs
// (and Railway's log quota) in production. Set DEBUG=true to turn it back on.
const enabled = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';

export function debug(...args) {
  if (enabled) console.log(...args);
}

export const isDebugEnabled = enabled;
