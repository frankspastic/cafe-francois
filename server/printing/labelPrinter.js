import { spawn } from 'child_process';

const LINE_WIDTH = 20;
const SEPARATOR = ' '.repeat(2) + '-'.repeat(LINE_WIDTH);

function center(text, width = LINE_WIDTH) {
  const truncated = text.length > width ? text.slice(0, width) : text;
  const pad = Math.max(0, width - truncated.length);
  const left = Math.floor(pad / 2);
  return ' '.repeat(left + 2) + truncated;
}

export function formatLabel(order) {
  const time = new Date(order.created_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: process.env.TZ || undefined,
  });

  const lines = [
    '',
    center('CAFE FRANCOIS'),
    center(`ORDER #${order.daily_number ?? order.id}  ${time}`),
    SEPARATOR,
    center(order.customer_name.toUpperCase()),
    '',
  ];

  for (const item of order.items) {
    lines.push(center(item.menu_item_name));
    const c = item.customizations || {};
    const parts = [];
    if (c.size) parts.push(c.size);
    if (c.milk) parts.push(c.milk);
    if (parts.length) lines.push(center(parts.join(' • ')));
    if (c.extras && c.extras.length > 0) {
      lines.push(center(c.extras.join(', ')));
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function printLabel(order) {
  const printerName = process.env.LABEL_PRINTER_NAME;

  if (!printerName) {
    console.warn('[LabelPrinter] LABEL_PRINTER_NAME not set — skipping print');
    return;
  }

  const label = formatLabel(order);
  const lp = spawn('lp', ['-d', printerName, '-o', 'media=Custom.144x144'], { stdio: ['pipe', 'pipe', 'pipe'] });

  lp.stdin.write(label, 'utf8');
  lp.stdin.end();

  lp.on('error', (err) => {
    console.error('[LabelPrinter] Failed to spawn lp:', err.message);
  });

  lp.on('close', (code) => {
    if (code !== 0) {
      console.error(`[LabelPrinter] lp exited with code ${code} for order #${order.id}`);
    } else {
      console.log(`[LabelPrinter] Printed order #${order.id} on ${printerName}`);
    }
  });

  lp.stderr.on('data', (data) => {
    console.error('[LabelPrinter] lp stderr:', data.toString().trim());
  });
}
