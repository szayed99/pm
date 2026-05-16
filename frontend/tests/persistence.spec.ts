import { expect, test } from "@playwright/test";
import { loginAsUser } from "./helpers";

test("persists column rename after refresh", async ({ page }) => {
  await loginAsUser(page);
  const firstColumn = page.locator('[data-testid^="column-"]').first();
  const input = firstColumn.getByLabel("Column title");
  await input.fill("Saved column name");
  await page.waitForTimeout(500);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Kanban Studio" })).toBeVisible();
  await expect(firstColumn.getByLabel("Column title")).toHaveValue("Saved column name");
});
