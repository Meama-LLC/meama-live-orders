import { NextResponse } from 'next/server';
import { STORES } from '../../../lib/shopify';

// Fetch orders from a single Shopify store via Admin REST API
async function fetchStoreOrders(store, since, token) {
  const params = new URLSearchParams({
    status: 'any',
    limit: '250',
    created_at_min: since,
    fields: 'id,name,total_price,created_at,customer,email,line_items,shipping_address',
  });

  const url = `https://${store.domain}/admin/api/2024-01/orders.json?${params}`;

  const res = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${store.domain} responded ${res.status}: ${text.slice(0, 120)}`);
  }

  const { orders = [] } = await res.json();

  return orders
    .map((order) => {
      const total = parseFloat(order.total_price || 0);
      if (total <= 0) return null;

      // Build customer display name
      let customer = '';
      if (order.customer?.first_name || order.customer?.last_name) {
        customer = `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim();
      } else if (order.email) {
        // Convert email local part to readable name  e.g. john.doe123 → John Doe
        customer = order.email
          .split('@')[0]
          .replace(/[._0-9]/g, ' ')
          .trim()
          .split(' ')
          .filter((w) => w.length > 1)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }

      const lineItems = order.line_items || [];
      const prod =
        lineItems.length > 0
          ? lineItems
              .map((i) => {
                let t = (i.title || 'Product').slice(0, 50);
                return t + (i.quantity > 1 ? ' x' + i.quantity : '');
              })
              .join(', ')
          : 'Coffee Order';

      const qty = lineItems.reduce((s, i) => s + (i.quantity || 1), 0) || 1;
      const city =
        order.shipping_address?.city ||
        order.shipping_address?.province ||
        store.defaultRegion;

      return {
        id: String(order.id),
        name: order.name,
        total,
        customer,
        prod,
        qty,
        city,
        createdAt: order.created_at,
      };
    })
    .filter(Boolean);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // Default: load from today's start if no since param
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const since = searchParams.get('since') || todayStart.toISOString();

  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'SHOPIFY_ACCESS_TOKEN env var is not set' },
      { status: 500 }
    );
  }

  // Fetch all stores in parallel
  const results = await Promise.allSettled(
    STORES.map((store) => fetchStoreOrders(store, since, token))
  );

  const storeOrders = {};
  const errors = [];

  results.forEach((result, i) => {
    const store = STORES[i];
    if (result.status === 'fulfilled') {
      storeOrders[store.id] = result.value;
    } else {
      console.error(`[shopify] ${store.domain}:`, result.reason?.message || result.reason);
      errors.push({ store: store.id, error: result.reason?.message || 'fetch failed' });
      storeOrders[store.id] = [];
    }
  });

  return NextResponse.json({ orders: storeOrders, errors, fetchedAt: new Date().toISOString() });
}
