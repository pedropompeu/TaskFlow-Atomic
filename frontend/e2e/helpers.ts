import { Page } from '@playwright/test';

export const TEST_USER = {
  name: 'Usuário Teste',
  email: process.env.E2E_USER_EMAIL || 'teste@taskflow.dev',
  password: process.env.E2E_USER_PASSWORD || 'Senha@123',
};

export async function login(page: Page) {
  await page.goto('/login');
  await page.getByPlaceholder('seu@email.com').fill(TEST_USER.email);
  await page.getByPlaceholder('••••••••').fill(TEST_USER.password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL('**/dashboard');
}

export async function createBoard(page: Page, title: string) {
  await page.getByRole('button', { name: /novo quadro/i }).click();
  await page.getByPlaceholder('Título do quadro').fill(title);
  await page.getByRole('button', { name: /^criar$/i }).click();
  await page.waitForSelector(`text=${title}`);
}
