// @ts-check
import { expect, test } from '@playwright/test';

const API_URL = process.env.E2E_API_URL || 'http://localhost:5101/api';

async function getAvailableProduct(request) {
  const response = await request.get(`${API_URL}/products`, {
    params: { inStock: 'true', limit: '1' },
  });
  expect(response.ok()).toBeTruthy();
  const products = await response.json();
  return products.find((product) => product.stock > 0);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});

test('serverul răspunde și homepage-ul se încarcă din aplicația reală', async ({ page, request }) => {
  const health = await request.get(`${API_URL}/health`);
  expect(health.ok()).toBeTruthy();

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Ciocolată\s+artizanală/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Vezi catalogul/i })).toBeVisible();
});

test('catalogul real afișează produse din server', async ({ page, request }) => {
  const product = await getAvailableProduct(request);
  test.skip(!product, 'Nu există produse în stoc în baza de date reală.');

  await page.goto('/catalog');
  await expect(page.getByRole('heading', { name: /Catalog|Tablete|Praline|Trufe|Cadouri/i })).toBeVisible();
  await expect(page.getByRole('link', { name: product.name, exact: true })).toBeVisible();
});

test('înregistrare prin API real și login prin formular', async ({ page, request }) => {
  const stamp = `${Date.now()}.${Math.random().toString(36).slice(2)}`;
  const email = `playwright.${stamp}@test.local`;
  const password = `test-${stamp}`;

  const register = await request.post(`${API_URL}/auth/register`, {
    data: {
      name: 'Client Playwright',
      phone: '0700000000',
      email,
      password,
    },
  });
  expect(register.ok()).toBeTruthy();

  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByLabel('Parolă', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Intră în cont' }).click();

  await expect(page).toHaveURL(/\/cont$/);
  await expect(page.getByRole('heading', { name: 'Client Playwright' })).toBeVisible();
});

test('coș și checkout creează o comandă reală când există stoc', async ({ page, request }) => {
  const product = await getAvailableProduct(request);
  test.skip(!product, 'Nu există produse în stoc pentru testul de comandă.');

  await page.goto(`/produs/${product._id}`);
  await expect(page.getByRole('heading', { name: product.name })).toBeVisible();
  await page.getByRole('button', { name: /Adaugă în coș/i }).first().click();
  await page.waitForFunction(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    return cart.length > 0;
  });

  await page.goto('/cos');
  await expect(page.getByRole('heading', { name: 'Coș' })).toBeVisible();
  await expect(page.getByText(product.name).first()).toBeVisible();

  await page.getByRole('link', { name: /Continuă la checkout/i }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  await page.getByLabel('Nume complet').fill('Comandă Playwright');
  await page.getByRole('textbox', { name: 'Telefon' }).fill('0700000000');
  await page.locator('#f-email').fill(`order.${Date.now()}@test.local`);
  await page.getByRole('button', { name: 'Plasează comanda' }).click();

  await expect(page).toHaveURL(/\/comanda\/[a-f0-9]{24}$/);
  await expect(page.getByRole('heading', { name: /Comanda .* a fost plasată/i })).toBeVisible();
});

test('pagina admin redirecționează vizitatorii neautentificați la login', async ({ page }) => {
  await page.goto('/admin');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Bine ai revenit' })).toBeVisible();
});
