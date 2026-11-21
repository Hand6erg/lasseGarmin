import { expect, test } from '@playwright/test';

test('data-fanen er låst indtil koden er skrevet, og husker den bagefter', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-21T19:00:00'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Data' }).click();

  const field = page.getByLabel('Kode');
  await field.fill('forkert');
  await page.getByRole('button', { name: 'Lås op' }).click();
  await expect(page.getByRole('alert')).toHaveText('Forkert kode – prøv igen.');

  await field.fill('handberg');
  await page.getByRole('button', { name: 'Lås op' }).click();
  await expect(page.getByRole('heading', { name: 'Træningsmængde pr. uge' })).toBeVisible();
  for (const name of ['Long run', 'Hvilepuls', 'HRV', 'Søvn']) {
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  }

  // Remembered on reload
  await page.reload();
  await page.getByRole('button', { name: 'Data' }).click();
  await expect(page.getByRole('heading', { name: 'Træningsmængde pr. uge' })).toBeVisible();
});
