import { expect, test } from "@playwright/test";
import { loginAsUser } from "./helpers";

test("ai chat updates the board when the API returns a board", async ({
  page,
}) => {
  await loginAsUser(page);

  await page.route("**/api/ai/chat", async (route) => {
    const board = {
      columns: [
        { id: "col-backlog", title: "AI Backlog", cardIds: ["card-1", "card-2"] },
        { id: "col-discovery", title: "Discovery", cardIds: ["card-3"] },
        { id: "col-progress", title: "In Progress", cardIds: ["card-4", "card-5"] },
        { id: "col-review", title: "Review", cardIds: ["card-6"] },
        { id: "col-done", title: "Done", cardIds: ["card-7", "card-8"] },
      ],
      cards: {
        "card-1": {
          id: "card-1",
          title: "Align roadmap themes",
          details: "Draft quarterly themes with impact statements and metrics.",
        },
        "card-2": {
          id: "card-2",
          title: "Gather customer signals",
          details: "Review support tags, sales notes, and churn feedback.",
        },
        "card-3": {
          id: "card-3",
          title: "Prototype analytics view",
          details: "Sketch initial dashboard layout and key drill-downs.",
        },
        "card-4": {
          id: "card-4",
          title: "Refine status language",
          details: "Standardize column labels and tone across the board.",
        },
        "card-5": {
          id: "card-5",
          title: "Design card layout",
          details: "Add hierarchy and spacing for scanning dense lists.",
        },
        "card-6": {
          id: "card-6",
          title: "QA micro-interactions",
          details: "Verify hover, focus, and loading states.",
        },
        "card-7": {
          id: "card-7",
          title: "Ship marketing page",
          details: "Final copy approved and asset pack delivered.",
        },
        "card-8": {
          id: "card-8",
          title: "Close onboarding sprint",
          details: "Document release notes and share internally.",
        },
      },
    };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "I renamed the backlog column.",
        board,
      }),
    });
  });

  await page.getByTestId("ai-chat-open").click();

  await page.getByLabel("Chat message").fill("Rename backlog to AI Backlog");
  await page.getByRole("button", { name: /send/i }).click();

  await expect(page.getByTestId("ai-message-assistant")).toContainText(
    "renamed the backlog"
  );
  await expect(
    page.getByTestId("column-col-backlog").getByLabel("Column title")
  ).toHaveValue("AI Backlog");
});
