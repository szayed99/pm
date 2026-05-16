import { expect, test } from "@playwright/test";
import { loginAsUser } from "./helpers";

test("shows login when not authenticated", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Kanban Studio" })).toBeVisible();
  await expect(page.getByLabel("Username")).toBeVisible();
  await expect(page.locator('[data-testid^="column-"]')).toHaveCount(0);
});

test("rejects invalid credentials", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Username").fill("wrong");
  await page.getByLabel("Password").fill("wrong");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByText(/invalid username or password/i)).toBeVisible();
  await expect(page.locator('[data-testid^="column-"]')).toHaveCount(0);
});

test("logs in, persists on refresh, and logs out", async ({ page }) => {
  await loginAsUser(page);
  await page.reload();
  await expect(page.locator('[data-testid^="column-"]')).toHaveCount(5);

  await page.getByRole("button", { name: /log out/i }).click();
  await expect(page.getByLabel("Username")).toBeVisible();
  await expect(page.locator('[data-testid^="column-"]')).toHaveCount(0);
});
