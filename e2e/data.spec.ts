import { expect, test } from '@playwright/test';
import { openUnlocked, serveTestData, TEST_PASSWORD } from './fixtures';

test('hele siden er låst indtil koden er skrevet, og husker den bagefter', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-30T08:00:00'));
  await serveTestData(page);
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Faner' })).toHaveCount(0);
  await expect(page.getByText('Cykel — endurance')).toHaveCount(0);

  const field = page.getByLabel('Kode');
  await field.fill('forkert');
  await page.getByRole('button', { name: 'Lås op' }).click();
  await expect(page.getByRole('alert')).toHaveText('Forkert kode – prøv igen.');

  await field.fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Lås op' }).click();
  await expect(page.getByText('Cykel — endurance')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Cykel — endurance')).toBeVisible();
});

test('data-fanen bruger samme kode', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-21T19:00:00'));
  await openUnlocked(page);
  await page.getByRole('button', { name: 'Data' }).click();
  await expect(page.getByRole('heading', { name: 'Træningsmængde pr. uge' })).toBeVisible();
  for (const name of ['Long run', 'Hvilepuls', 'HRV', 'Søvn']) {
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  }
});
