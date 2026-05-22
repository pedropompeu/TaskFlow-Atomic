import { test, expect } from '@playwright/test';
import { login, createBoard } from './helpers';

test.describe('Quadros', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('exibe a página de quadros após login', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /meus quadros/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /novo quadro/i })).toBeVisible();
  });

  test('cria um novo quadro e o exibe na lista', async ({ page }) => {
    const title = `Quadro E2E ${Date.now()}`;
    await createBoard(page, title);
    await expect(page.getByText(title)).toBeVisible();
  });

  test('navega para dentro do quadro ao clicar', async ({ page }) => {
    const title = `Quadro Nav ${Date.now()}`;
    await createBoard(page, title);
    await page.getByText(title).click();
    await expect(page).toHaveURL(/\/dashboard\/.+/);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
  });

  test('exibe as 4 colunas do kanban ao entrar no quadro', async ({ page }) => {
    const title = `Quadro Colunas ${Date.now()}`;
    await createBoard(page, title);
    await page.getByText(title).click();
    for (const col of ['A Fazer', 'Em Andamento', 'Em Revisão', 'Concluído']) {
      await expect(page.getByText(col)).toBeVisible();
    }
  });

  test('exclui um quadro', async ({ page }) => {
    const title = `Quadro Del ${Date.now()}`;
    await createBoard(page, title);
    const card = page.locator(`[aria-label="Excluir quadro"]`).first();
    await page.getByText(title).hover();
    await card.click();
    await expect(page.getByText(title)).not.toBeVisible({ timeout: 5000 });
  });
});
