import { expect, test } from '@playwright/test';
import { openUnlocked } from './fixtures';

test('viser ugeplanen og kan bladre mellem uger', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-30T08:00:00'));
  await openUnlocked(page);
  await expect(page.getByRole('heading', { name: 'Uge 40' })).toBeVisible();
  await expect(page.getByText('I dag')).toBeVisible();
  await expect(page.getByText('Cykel — endurance')).toBeVisible();

  await page.getByRole('button', { name: 'Forrige uge' }).click();
  await expect(page.getByRole('heading', { name: 'Uge 39' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Forrige uge' })).toBeDisabled();
});

test('fra en styrkedag til hele styrkepasset', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-28T08:00:00'));
  await openUnlocked(page);
  await expect(page.getByText('Dødløft').first()).toBeVisible();
  await page.getByRole('button', { name: 'Se hele styrkepasset' }).click();
  await expect(page.getByRole('heading', { name: 'Styrke' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Core' })).toContainText('Pallof press');

  await page.getByRole('tab', { name: 'Onsdag' }).click();
  await expect(page.getByText('Back extension')).toBeVisible();
});

test('viser den seneste plan når ugens plan mangler', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2030-01-07T08:00:00'));
  await openUnlocked(page);
  await expect(page.getByText('Der er ikke kommet en plan for denne uge endnu')).toBeVisible();
});

test('metoder-fanen', async ({ page }) => {
  await openUnlocked(page);
  await page.getByRole('button', { name: 'Metoder' }).click();
  await expect(page.getByRole('heading', { name: 'Norsk 4×4' })).toBeVisible();
});

test('kalender-fanen viser måneden og dagens sessioner', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-30T08:00:00'));
  await openUnlocked(page);
  await page.getByRole('button', { name: 'Kalender' }).click();
  await expect(page.getByRole('heading', { name: 'september 2026' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Dagens sessioner' })).toContainText('Cykel — endurance');

  await page.getByRole('button', { name: 'Næste måned' }).click();
  await expect(page.getByRole('heading', { name: 'oktober 2026' })).toBeVisible();
  await page.getByRole('button', { name: 'Forrige måned' }).click();
  await page.getByRole('button', { name: /^28\./ }).click();
  await expect(page.getByRole('button', { name: 'Se hele styrkepasset' })).toBeVisible();
});

test('gemmer sidste kg og reps pr. øvelse på telefonen', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-28T08:00:00'));
  await openUnlocked(page);
  await page.getByRole('button', { name: 'Styrke', exact: true }).click();

  const form = page.getByRole('form', { name: 'Log Dødløft' });
  await expect(form.getByRole('button', { name: 'Gem' })).toBeDisabled();
  await form.getByLabel('Kg').fill('130');
  await form.getByLabel('Reps').fill('5');
  await form.getByRole('button', { name: 'Gem' }).click();
  await expect(page.getByText('Sidst: 130 kg × 5')).toBeVisible();

  // A new entry replaces the old one
  await form.getByLabel('Kg').fill('132,5');
  await form.getByLabel('Reps').fill('5, 5, 4');
  await form.getByRole('button', { name: 'Gem' }).click();
  await expect(page.getByText('Sidst: 132,5 kg × 5, 5, 4')).toBeVisible();
  await expect(page.getByText('130 kg × 5')).toHaveCount(0);

  // Still there after reload
  await page.reload();
  await page.getByRole('button', { name: 'Styrke', exact: true }).click();
  await expect(page.getByText('Sidst: 132,5 kg × 5, 5, 4')).toBeVisible();
});
