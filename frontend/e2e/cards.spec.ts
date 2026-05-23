import { test, expect } from '@playwright/test';
import { login, createBoard } from './helpers';

test.describe('Cards', () => {
  let boardTitle: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    boardTitle = `Quadro Cards ${Date.now()}`;
    await createBoard(page, boardTitle);
    await page.getByText(boardTitle).click();
    await page.waitForURL(/\/dashboard\/.+/);
  });

  test('cria um card na coluna A Fazer', async ({ page }) => {
    const cardTitle = 'Card de teste E2E';
    await page.getByPlaceholder(/novo card|título/i).first().fill(cardTitle);
    await page.keyboard.press('Enter');
    await expect(page.getByText(cardTitle)).toBeVisible({ timeout: 5000 });
  });

  test('abre o modal de edição ao clicar no título do card', async ({ page }) => {
    const cardTitle = `Card Modal ${Date.now()}`;
    await page.getByPlaceholder(/novo card|título/i).first().fill(cardTitle);
    await page.keyboard.press('Enter');
    await page.getByText(cardTitle).click();
    await expect(page.getByRole('heading', { name: /descrição/i }).or(
      page.locator('textarea[placeholder*="descrição"]')
    )).toBeVisible({ timeout: 5000 });
  });

  test('edita o título do card via modal', async ({ page }) => {
    const original = `Card Original ${Date.now()}`;
    const updated = `Card Editado ${Date.now()}`;
    await page.getByPlaceholder(/novo card|título/i).first().fill(original);
    await page.keyboard.press('Enter');
    await page.getByText(original).click();
    const titleInput = page.locator('input[value*="Card Original"]').or(
      page.locator('.modal input').first()
    );
    await titleInput.clear();
    await titleInput.fill(updated);
    await titleInput.blur();
    await page.keyboard.press('Escape');
    await expect(page.getByText(updated)).toBeVisible({ timeout: 5000 });
  });

  test('filtra cards pelo campo de busca', async ({ page }) => {
    const cardA = `Alpha ${Date.now()}`;
    const cardB = `Beta ${Date.now()}`;
    for (const t of [cardA, cardB]) {
      await page.getByPlaceholder(/novo card|título/i).first().fill(t);
      await page.keyboard.press('Enter');
      await page.waitForSelector(`text=${t}`);
    }
    await page.getByPlaceholder(/filtrar cards/i).fill('Alpha');
    await expect(page.getByText(cardA)).toBeVisible();
    await expect(page.getByText(cardB)).not.toBeVisible();
  });

  test('exclui um card (com confirmação)', async ({ page }) => {
    const cardTitle = `Card Del ${Date.now()}`;
    await page.getByPlaceholder(/novo card|título/i).first().fill(cardTitle);
    await page.keyboard.press('Enter');
    await page.waitForSelector(`text=${cardTitle}`);
    const cardEl = page.locator(`text=${cardTitle}`).locator('..');
    await cardEl.hover();
    await cardEl.getByRole('button', { name: /excluir card/i }).click();
    // Confirmar no dialog
    await page.getByRole('button', { name: /^Excluir$/i }).click();
    await expect(page.getByText(cardTitle)).not.toBeVisible({ timeout: 5000 });
  });

  test('adiciona um comentário no card, verifica e exclui', async ({ page }) => {
    const cardTitle = `Card Comentário ${Date.now()}`;
    const commentText = `Comentário E2E ${Date.now()}`;

    // Cria o card
    await page.getByPlaceholder(/novo card|título/i).first().fill(cardTitle);
    await page.keyboard.press('Enter');
    await page.waitForSelector(`text=${cardTitle}`);

    // Abre o modal
    await page.getByText(cardTitle).click();
    await page.waitForSelector('textarea[placeholder*="comentário"]', { timeout: 5000 });

    // Digita e envia comentário
    await page.locator('textarea[placeholder*="comentário"]').fill(commentText);
    await page.getByRole('button', { name: /enviar comentário/i }).click();

    // Verifica que o comentário apareceu
    await expect(page.getByText(commentText)).toBeVisible({ timeout: 5000 });

    // Exclui o comentário
    await page.getByText(commentText).locator('..').locator('..').hover();
    await page.getByLabel(/excluir comentário/i).click();
    await expect(page.getByText(commentText)).not.toBeVisible({ timeout: 5000 });
  });
});
