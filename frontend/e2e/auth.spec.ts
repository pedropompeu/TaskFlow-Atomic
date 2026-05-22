import { test, expect } from '@playwright/test';
import { login, TEST_USER } from './helpers';

test.describe('Autenticação', () => {
  test('exibe o formulário de login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder('seu@email.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('mostra erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('seu@email.com').fill('naoexiste@x.com');
    await page.getByPlaceholder('••••••••').fill('senhaerrada');
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page.getByRole('alert').or(page.locator('text=/inválid|incorret|erro/i'))).toBeVisible({ timeout: 5000 });
  });

  test('faz login e redireciona para o dashboard', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/meus quadros/i)).toBeVisible();
  });

  test('faz logout com sucesso', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: /sair/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
