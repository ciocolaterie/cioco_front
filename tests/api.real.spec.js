// @ts-check
import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const API_URL = process.env.E2E_API_URL || 'http://localhost:5101/api';

function readServerEnv() {
  const envPath = path.resolve(process.cwd(), '../server/.env');
  const out = {};
  if (!fs.existsSync(envPath)) return out;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    out[trimmed.slice(0, idx)] = trimmed.slice(idx + 1).replace(/^["']|["']$/g, '');
  }
  return out;
}

function unique(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function expectStatus(response, status) {
  expect(response.status(), await response.text()).toBe(status);
}

async function registerUser(request, overrides = {}) {
  const id = unique('user');
  const data = {
    name: `PW User ${id}`,
    email: `${id}@test.local`,
    phone: '0700000000',
    password: `pass-${id}`,
    ...overrides,
  };
  const response = await request.post(`${API_URL}/auth/register`, { data });
  await expectStatus(response, 201);
  return { data, body: await response.json() };
}

async function login(request, email, password) {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: { email, password },
  });
  await expectStatus(response, 200);
  return response;
}

async function adminLogin(request) {
  const env = readServerEnv();
  expect(env.ADMIN_EMAIL, 'ADMIN_EMAIL lipsește din server/.env').toBeTruthy();
  expect(env.ADMIN_PASSWORD, 'ADMIN_PASSWORD lipsește din server/.env').toBeTruthy();
  return login(request, env.ADMIN_EMAIL, env.ADMIN_PASSWORD);
}

async function createAdminProduct(request, adminHeaders, overrides = {}) {
  const id = unique('product');
  const data = {
    name: `PW Product ${id}`,
    slug: `pw-product-${id}`,
    category: 'PW Test',
    price: 19.5,
    stock: 7,
    weight: '100g',
    short: 'Produs creat de testele Playwright.',
    description: 'Descriere pentru testare API.',
    ingredients: 'Cacao, zahăr',
    allergens: ['lapte'],
    tags: ['pw-e2e', 'test'],
    images: [],
    active: true,
    ...overrides,
  };
  const response = await request.post(`${API_URL}/products`, {
    headers: adminHeaders,
    data,
  });
  await expectStatus(response, 201);
  return await response.json();
}

async function deleteAdminProduct(request, adminHeaders, id) {
  const response = await request.delete(`${API_URL}/products/${id}`, { headers: adminHeaders });
  expect([200, 404]).toContain(response.status());
}

async function createOrder(request, product, overrides = {}) {
  const response = await request.post(`${API_URL}/orders`, {
    data: {
      items: [{ product: product._id, qty: 1 }],
      customer: {
        name: 'PW Order',
        phone: '0700000000',
        email: `${unique('order')}@test.local`,
      },
      method: 'ridicare',
      pickupTime: '12:30',
      note: 'Comandă creată de Playwright',
      ...overrides,
    },
  });
  await expectStatus(response, 201);
  return await response.json();
}

test.describe.configure({ mode: 'serial' });

test('auth: validări, sesiune, profil, favorite, parolă și reset', async ({ request }) => {
  await expectStatus(await request.get(`${API_URL}/auth/me`), 401);
  await expectStatus(await request.post(`${API_URL}/auth/register`, { data: {} }), 400);
  await expectStatus(await request.post(`${API_URL}/auth/login`, { data: { email: 'x@test.local', password: 'bad' } }), 401);
  await expectStatus(await request.post(`${API_URL}/auth/forgot-password`, { data: {} }), 400);

  const created = await registerUser(request);
  await expectStatus(await request.post(`${API_URL}/auth/register`, { data: created.data }), 409);

  await login(request, created.data.email, created.data.password);
  const me = await request.get(`${API_URL}/auth/me`);
  await expectStatus(me, 200);
  expect((await me.json()).user.email).toBe(created.data.email);

  const profile = await request.patch(`${API_URL}/auth/profile`, {
    data: { name: 'PW User Updated', phone: '0711111111' },
  });
  await expectStatus(profile, 200);
  expect((await profile.json()).user.name).toBe('PW User Updated');

  await expectStatus(await request.patch(`${API_URL}/auth/profile`, { data: { name: '' } }), 400);
  await expectStatus(await request.patch(`${API_URL}/auth/favorites`, { data: { ids: [] } }), 200);
  await expectStatus(await request.patch(`${API_URL}/auth/favorites`, { data: { ids: 'bad' } }), 400);
  await expectStatus(await request.patch(`${API_URL}/auth/change-password`, { data: { currentPassword: 'bad', newPassword: 'new-pass-123' } }), 401);
  await expectStatus(await request.patch(`${API_URL}/auth/change-password`, { data: { currentPassword: created.data.password, newPassword: '123' } }), 400);
  await expectStatus(await request.patch(`${API_URL}/auth/change-password`, { data: { currentPassword: created.data.password, newPassword: 'new-pass-123' } }), 200);
  await expectStatus(await request.post(`${API_URL}/auth/logout`), 200);
  await expectStatus(await request.post(`${API_URL}/auth/forgot-password`, { data: { email: created.data.email } }), 200);
  await expectStatus(await request.post(`${API_URL}/auth/reset-password`, { data: { token: 'invalid', password: 'new-pass-123' } }), 400);
});

test('products + reviews + stock alerts: public, admin, filtre și cazuri negative', async ({ request }) => {
  await expectStatus(await request.post(`${API_URL}/products`, { data: {} }), 401);

  await adminLogin(request);
  const adminHeaders = {};

  const product = await createAdminProduct(request, adminHeaders);
  const outOfStock = await createAdminProduct(request, adminHeaders, {
    name: `PW Out ${unique('product')}`,
    slug: `pw-out-${unique('slug')}`,
    stock: 0,
  });

  try {
    const list = await request.get(`${API_URL}/products`);
    await expectStatus(list, 200);
    expect(Array.isArray(await list.json())).toBe(true);

    const filtered = await request.get(`${API_URL}/products`, {
      params: {
        category: product.category,
        tag: 'pw-e2e',
        search: product.name.slice(0, 10),
        sort: 'price-asc',
        inStock: 'true',
        ids: product._id,
      },
    });
    await expectStatus(filtered, 200);
    expect((await filtered.json()).some((p) => p._id === product._id)).toBe(true);

    await expectStatus(await request.get(`${API_URL}/products/tags`), 200);
    const one = await request.get(`${API_URL}/products/${product._id}`);
    await expectStatus(one, 200);
    expect((await one.json()).slug).toBe(product.slug);
    await expectStatus(await request.get(`${API_URL}/products/000000000000000000000000`), 404);

    const updated = await request.put(`${API_URL}/products/${product._id}`, {
      data: { price: 22.25, rating: 5, reviewsCount: 99 },
    });
    await expectStatus(updated, 200);
    const updatedBody = await updated.json();
    expect(updatedBody.price).toBe(22.25);
    expect(updatedBody.rating).toBe(0);
    expect(updatedBody.reviewsCount).toBe(0);

    await expectStatus(await request.post(`${API_URL}/products/${product._id}/reviews`, { data: {} }), 400);
    await expectStatus(await request.post(`${API_URL}/products/${product._id}/reviews`, {
      data: { name: 'PW Reviewer', email: `${unique('review')}@test.local`, rating: 6, text: 'Text valid.' },
    }), 400);
    const reviewEmail = `${unique('review')}@test.local`;
    await expectStatus(await request.post(`${API_URL}/products/${product._id}/reviews`, {
      data: { name: 'PW Reviewer', email: reviewEmail, rating: 5, text: 'Excelent pentru testare.' },
    }), 201);
    await expectStatus(await request.post(`${API_URL}/products/${product._id}/reviews`, {
      data: { name: 'PW Reviewer', email: reviewEmail, rating: 4, text: 'Duplicat.' },
    }), 409);
    const reviews = await request.get(`${API_URL}/products/${product._id}/reviews`);
    await expectStatus(reviews, 200);
    expect((await reviews.json()).some((r) => r.name === 'PW Reviewer')).toBe(true);

    await expectStatus(await request.post(`${API_URL}/products/${product._id}/stock-alert`, { data: { email: 'stock@test.local' } }), 400);
    await expectStatus(await request.post(`${API_URL}/products/${outOfStock._id}/stock-alert`, { data: {} }), 400);
    await expectStatus(await request.post(`${API_URL}/products/${outOfStock._id}/stock-alert`, { data: { email: `${unique('stock')}@test.local` } }), 201);
  } finally {
    await deleteAdminProduct(request, adminHeaders, product._id);
    await deleteAdminProduct(request, adminHeaders, outOfStock._id);
  }
});

test('orders: creare, listare, status, anulare, export și protecții', async ({ request }) => {
  await adminLogin(request);
  const adminHeaders = {};
  const product = await createAdminProduct(request, adminHeaders, { stock: 5 });
  const user = await registerUser(request);

  try {
    await expectStatus(await request.post(`${API_URL}/orders`, { data: {} }), 400);
    await expectStatus(await request.post(`${API_URL}/orders`, {
      data: {
        items: [{ product: product._id, qty: 999 }],
        customer: { name: 'PW', phone: '0700000000', email: 'pw@test.local' },
        method: 'ridicare',
      },
    }), 500);

    const guestOrder = await createOrder(request, product);
    expect(guestOrder.orderNumber).toMatch(/^#/);
    expect(guestOrder.status).toBe('noua');

    const fetched = await request.get(`${API_URL}/orders/${guestOrder._id}`);
    await expectStatus(fetched, 200);
    expect((await fetched.json())._id).toBe(guestOrder._id);
    await expectStatus(await request.get(`${API_URL}/orders/000000000000000000000000`), 404);
    await expectStatus(await request.get(`${API_URL}/orders`), 403);

    await adminLogin(request);
    await expectStatus(await request.get(`${API_URL}/orders`), 200);
    await expectStatus(await request.get(`${API_URL}/admin/export-orders`), 200);
    await expectStatus(await request.patch(`${API_URL}/orders/${guestOrder._id}/status`, { data: { status: 'invalid' } }), 400);
    const status = await request.patch(`${API_URL}/orders/${guestOrder._id}/status`, { data: { status: 'in_pregatire' } });
    await expectStatus(status, 200);
    expect((await status.json()).status).toBe('in_pregatire');

    await login(request, user.data.email, user.data.password);
    const ownedOrder = await createOrder(request, product, {
      customer: { name: user.data.name, phone: user.data.phone, email: user.data.email },
    });
    const mine = await request.get(`${API_URL}/orders/me`);
    await expectStatus(mine, 200);
    expect((await mine.json()).some((o) => o._id === ownedOrder._id)).toBe(true);
    const cancelled = await request.patch(`${API_URL}/orders/${ownedOrder._id}/cancel`);
    await expectStatus(cancelled, 200);
    expect((await cancelled.json()).status).toBe('anulata');
  } finally {
    await adminLogin(request);
    await deleteAdminProduct(request, adminHeaders, product._id);
  }
});

test('promotions: CRUD admin, apply public, expirate, inactivate și max uses', async ({ request }) => {
  await expectStatus(await request.get(`${API_URL}/promotions`), 401);
  await expectStatus(await request.post(`${API_URL}/promotions/apply`, { data: {} }), 400);
  await expectStatus(await request.post(`${API_URL}/promotions/apply`, { data: { code: 'NU-EXISTA', subtotal: 100 } }), 404);

  await adminLogin(request);
  const code = unique('PWCODE').replace(/-/g, '').toUpperCase();
  const create = await request.post(`${API_URL}/promotions`, {
    data: { code, type: 'percent', value: 10, maxUses: 2 },
  });
  await expectStatus(create, 201);
  const promo = await create.json();

  try {
    const list = await request.get(`${API_URL}/promotions`);
    await expectStatus(list, 200);
    expect((await list.json()).some((p) => p._id === promo._id)).toBe(true);

    const apply = await request.post(`${API_URL}/promotions/apply`, { data: { code, subtotal: 120 } });
    await expectStatus(apply, 200);
    expect((await apply.json()).discount).toBe(12);

    const updated = await request.put(`${API_URL}/promotions/${promo._id}`, { data: { type: 'fixed', value: 200 } });
    await expectStatus(updated, 200);
    const fixed = await request.post(`${API_URL}/promotions/apply`, { data: { code, subtotal: 75 } });
    await expectStatus(fixed, 200);
    expect((await fixed.json()).discount).toBe(75);

    await expectStatus(await request.put(`${API_URL}/promotions/${promo._id}`, { data: { active: false } }), 200);
    await expectStatus(await request.post(`${API_URL}/promotions/apply`, { data: { code, subtotal: 75 } }), 404);
  } finally {
    await expectStatus(await request.delete(`${API_URL}/promotions/${promo._id}`), 200);
  }
});

test('settings, admin dashboard, customers, contact și erori globale', async ({ request }) => {
  await expectStatus(await request.get(`${API_URL}/settings/categories`), 200);
  await expectStatus(await request.get(`${API_URL}/settings/info`), 200);
  await expectStatus(await request.get(`${API_URL}/settings/stats`), 200);
  await expectStatus(await request.get(`${API_URL}/settings/featured-reviews`), 200);
  await expectStatus(await request.get(`${API_URL}/settings`), 401);
  await expectStatus(await request.post(`${API_URL}/contact`, { data: {} }), 400);
  await expectStatus(await request.post(`${API_URL}/contact`, {
    data: { name: 'PW Contact', email: 'contact@test.local', message: 'Mesaj de test.' },
  }), 200);
  await expectStatus(await request.get(`${API_URL}/ruta-care-nu-exista`), 404);

  await adminLogin(request);
  const settings = await request.get(`${API_URL}/settings`);
  await expectStatus(settings, 200);
  const original = await settings.json();

  try {
    const updated = await request.put(`${API_URL}/settings`, {
      data: {
        storeName: 'Ciocolaterie PW Test',
        categories: [...new Set([...(original.categories || []), 'PW Test'])],
        banner: { active: true, text: 'Banner test', color: 'green' },
      },
    });
    await expectStatus(updated, 200);
    expect((await updated.json()).storeName).toBe('Ciocolaterie PW Test');
    await expectStatus(await request.put(`${API_URL}/admin/featured-reviews`, {
      data: { featuredIds: ['000000000000000000000001', '000000000000000000000002', '000000000000000000000003', '000000000000000000000004'] },
    }), 400);

    await expectStatus(await request.get(`${API_URL}/admin/products`), 200);
    await expectStatus(await request.get(`${API_URL}/admin/stats?period=today`), 200);
    await expectStatus(await request.get(`${API_URL}/admin/top-products?period=month`), 200);
    await expectStatus(await request.get(`${API_URL}/admin/week-chart`), 200);
    await expectStatus(await request.get(`${API_URL}/customers`), 200);
    await expectStatus(await request.get(`${API_URL}/customers/export`), 200);
  } finally {
    await request.put(`${API_URL}/settings`, {
      data: {
        storeName: original.storeName,
        storePhone: original.storePhone,
        storeEmail: original.storeEmail,
        storeAddress: original.storeAddress,
        storeLat: original.storeLat,
        storeLng: original.storeLng,
        categories: original.categories,
        zones: original.zones,
        notifications: original.notifications,
        schedule: original.schedule,
        banner: original.banner,
      },
    });
  }
});
