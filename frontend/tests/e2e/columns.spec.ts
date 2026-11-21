import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { initialWorkspace } from "../../src/lib/workspace";

test.beforeEach(async ({ request }) => {
  const response = await request.put("/api/workspace", { data: initialWorkspace });
  expect(response.ok()).toBe(true);
});

async function loadBoard(page: Page) {
  await page.goto("/");
  await expect(page.getByTestId("card-1")).toBeVisible();
}

async function savedColumns(request: APIRequestContext) {
  const { columns } = (await (await request.get("/api/workspace")).json()).sheets[0];
  return columns as { id: string; title: string; cards: { id: string; title: string; details: string }[] }[];
}

async function columnOrder(page: Page): Promise<string[]> {
  return page
    .locator('section[data-testid^="column-"]')
    .evaluateAll((elements) => elements.map((element) => element.getAttribute("data-testid") ?? ""));
}

test("moves a column by dragging its header", async ({ page, request }) => {
  await loadBoard(page);

  const source = page.getByTestId("column-1").locator("header");
  const target = page.getByTestId("column-3").locator("header");
  const from = (await source.boundingBox())!;
  const to = (await target.boundingBox())!;
  await page.mouse.move(from.x + from.width - 60, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width - 40, from.y + from.height / 2, { steps: 3 });
  await page.mouse.move(to.x + to.width / 2 + 20, to.y + to.height / 2, { steps: 15 });
  await page.mouse.up();

  await expect.poll(() => columnOrder(page)).toEqual(["column-2", "column-3", "column-1", "column-4", "column-5"]);
  await expect
    .poll(async () => (await savedColumns(request)).map((column) => column.title))
    .toEqual(["To Do", "In Progress", "Backlog", "In Review", "Done"]);
  await expect(page.getByTestId("column-1-count")).toHaveText("4");
});

test("adds, renames and deletes a column", async ({ page, request }) => {
  await loadBoard(page);

  await page.getByRole("button", { name: "Add column" }).click();
  await page.getByRole("button", { name: "New column", exact: true }).dblclick();
  const input = page.getByLabel("Column title");
  await input.fill("Blocked");
  await input.press("Enter");
  await expect(page.getByRole("button", { name: "Blocked", exact: true })).toBeVisible();
  await expect
    .poll(async () => (await savedColumns(request)).map((column) => column.title))
    .toEqual(["Backlog", "To Do", "In Progress", "In Review", "Done", "Blocked"]);

  // Empty columns go immediately; columns with cards ask first.
  await page.getByRole("button", { name: "Delete column: Blocked" }).click();
  await expect(page.getByRole("button", { name: "Blocked", exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Delete column: Done" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete column" }).click();
  await expect(page.getByTestId("column-5")).toHaveCount(0);
  await expect
    .poll(async () => (await savedColumns(request)).map((column) => column.title))
    .toEqual(["Backlog", "To Do", "In Progress", "In Review"]);
});

test("edits a card by double-clicking it and keeps the edit after reload", async ({ page, request }) => {
  await loadBoard(page);

  const card = page.getByTestId("card-5");
  await card.dblclick();
  await card.getByLabel("Card title").fill("Design empty and error states");
  await card.getByLabel("Card details").fill("Covers 404 too.");
  await card.getByRole("button", { name: "Save" }).click();

  await expect(card).toContainText("Design empty and error states");
  await expect
    .poll(async () => (await savedColumns(request))[1].cards[0])
    .toEqual({ id: "5", title: "Design empty and error states", details: "Covers 404 too." });

  await page.reload();
  await expect(page.getByTestId("card-5")).toContainText("Covers 404 too.");
});

test("cancels a card edit with Escape", async ({ page }) => {
  await loadBoard(page);

  const card = page.getByTestId("card-5");
  await card.dblclick();
  await card.getByLabel("Card title").fill("Should not stick");
  await card.getByLabel("Card title").press("Escape");

  await expect(card).toContainText("Design empty states");
  await expect(card.getByLabel("Card title")).toHaveCount(0);
});
