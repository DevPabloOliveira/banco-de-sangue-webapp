import { test, expect } from '@playwright/test';

test('fluxo de cadastro de doador', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.getByRole('link', { name: 'Cadastrar Doador' }).click();

  await page.getByLabel('Nome').fill('Teste E2E');
  await page.getByLabel('Documento').selectOption('rg');
  await page.getByLabel('Tipo sanguíneo').selectOption('o+');
  await page.getByRole('button', { name: 'Salvar' }).click();

  await expect(page).toHaveURL(/sucesso/);
});
