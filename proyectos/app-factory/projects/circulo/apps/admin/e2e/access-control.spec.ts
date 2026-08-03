import { expect, test } from '@playwright/test';

/**
 * The real security boundary is the database (RLS + `is_staff()`), verified
 * in `supabase/tests/rls.test.sql`. What these tests cover is the layer in
 * front of it: an unauthenticated visitor never sees a protected page's
 * content, wrong credentials produce a visible error, and a role-gated page
 * tells a signed-in moderator it isn't for them rather than showing nothing
 * or throwing.
 */

const PROTECTED_ROUTES = ['/', '/reports', '/users', '/metrics', '/audit', '/flags'];

for (const route of PROTECTED_ROUTES) {
  test(`${route} shows the login gate, not its content, when signed out`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole('heading', { name: 'Panel de moderación' })).toBeVisible();
    await expect(page.getByLabel('Correo')).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toBeVisible();
  });
}

test('wrong credentials show an error and do not navigate away', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Correo').fill('nadie@demo.circulo.app');
  await page.getByLabel('Contraseña').fill('contraseña-incorrecta');
  await page.getByRole('button', { name: 'Entrar' }).click();

  // `getByRole('alert')` also matches Next's route announcer; scope to ours.
  await expect(page.locator('p[role="alert"]')).toContainText('No pudimos iniciar sesión');
  await expect(page.getByRole('heading', { name: 'Panel de moderación' })).toBeVisible();
});

test('a moderator can sign in and reach the overview, but not the audit log', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Correo').fill('mod@demo.circulo.app');
  await page.getByLabel('Contraseña').fill('demo-circulo-2026');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByRole('heading', { name: 'Resumen operativo' })).toBeVisible();

  await page.goto('/audit');
  await expect(page.getByRole('heading', { name: 'Sin permisos suficientes' })).toBeVisible();
});

test('an admin can sign in and reach the audit log', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Correo').fill('admin@demo.circulo.app');
  await page.getByLabel('Contraseña').fill('demo-circulo-2026');
  await page.getByRole('button', { name: 'Entrar' }).click();

  // Wait for the session to actually land before navigating away, or the next
  // page load can race ahead of Supabase persisting it.
  await expect(page.getByRole('heading', { name: 'Resumen operativo' })).toBeVisible();

  await page.goto('/audit');
  await expect(page.getByRole('heading', { name: 'Registro de auditoría' })).toBeVisible();
  await expect(page.getByText('Sin permisos suficientes')).toHaveCount(0);
});
