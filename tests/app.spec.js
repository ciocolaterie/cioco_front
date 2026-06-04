// @ts-check
import { expect, test } from '@playwright/test';

const products = [
  {
    _id: 'cioco-dark-70',
    name: 'Tabletă Dark 70%',
    price: 29.9,
    stock: 8,
    rating: 4.8,
    reviewsCount: 12,
    short: 'Cacao intens, finisaj catifelat.',
    tags: ['best-seller'],
    images: [],
    createdAt: '2026-05-01T00:00:00.000Z',
  },
  {
    _id: 'praline-zmeura',
    name: 'Praline cu zmeură',
    price: 42,
    stock: 2,
    rating: 4.9,
    reviewsCount: 7,
    short: 'Umplutură fină cu fructe.',
    tags: ['cadou'],
    images: [],
    createdAt: '2026-05-01T00:00:00.000Z',
  },
];

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api/, '');
    const method = route.request().method();

    if (path === '/auth/me') {
      return route.fulfill({ status: 401, json: { error: 'Neautentificat' } });
    }

    if (path === '/auth/login' && method === 'POST') {
      return route.fulfill({
        json: { user: { _id: 'user-test', name: 'Client Test', role: 'customer', favorites: [] } },
      });
    }

    if (path === '/settings/categories') {
      return route.fulfill({ json: ['Tablete', 'Praline', 'Cadouri'] });
    }

    if (path === '/settings/stats') {
      return route.fulfill({ json: { productCount: 2, avgRating: 4.8, monthlyOrders: 25 } });
    }

    if (path === '/settings/public') {
      return route.fulfill({ json: {} });
    }

    if (path === '/reviews/featured') {
      return route.fulfill({ json: { featured: [], heroReview: null } });
    }

    if (path === '/products/tags') {
      return route.fulfill({ json: ['best-seller', 'cadou'] });
    }

    if (path === '/products') {
      const search = url.searchParams.get('search')?.toLowerCase() || '';
      const category = url.searchParams.get('category') || '';
      const filtered = products.filter((product) => {
        const matchesSearch = !search || product.name.toLowerCase().includes(search);
        const matchesCategory = !category || product.name.toLowerCase().includes(category.toLowerCase());
        return matchesSearch && matchesCategory;
      });
      return route.fulfill({ json: filtered });
    }

    return route.fulfill({ json: {} });
  });
});

test('homepage-ul pornește și navighează spre catalog', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Ciocolată\s+artizanală/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Vezi catalogul/i })).toBeVisible();

  await page.getByRole('link', { name: /Vezi catalogul/i }).click();
  await expect(page).toHaveURL(/\/catalog$/);
  await expect(page.getByRole('heading', { name: 'Catalog' })).toBeVisible();
});

test('catalogul afișează produse și permite căutare', async ({ page }) => {
  await page.goto('/catalog');

  await expect(page.getByRole('link', { name: 'Tabletă Dark 70%', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Praline cu zmeură', exact: true })).toBeVisible();

  await page.getByPlaceholder(/Caută produse/i).fill('zmeură');
  await expect(page.getByRole('link', { name: 'Praline cu zmeură', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tabletă Dark 70%', exact: true })).toBeHidden();
});

test('un client se poate loga din formular', async ({ page }) => {
  await page.goto('/login');

  await page.getByRole('textbox', { name: 'Email' }).fill('client@test.ro');
  await page.getByLabel('Parolă', { exact: true }).fill('parola-test');
  await page.getByRole('button', { name: 'Intră în cont' }).click();

  await expect(page).toHaveURL(/\/cont$/);
});

test('zona admin cere autentificare', async ({ page }) => {
  await page.goto('/admin');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Bine ai revenit' })).toBeVisible();
});
