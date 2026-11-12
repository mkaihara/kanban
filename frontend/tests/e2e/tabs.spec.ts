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

async function savedNames(request: APIRequestContext): Promise<string[]> {
  const saved = await (await request.get("/api/workspace")).json();
  return saved.sheets.map((sheet: { name: string }) => sheet.name);
}

function tab(page: Page, name: string) {
  return page.getByRole("tab", { name, exact: true });
}

test("adds boards as tabs at the bottom, each with its own cards", async ({ page }) => {
  await loadBoard(page);
  await expect(page.getByTestId("data-file")).toContainText("kanban-e2e");

  await page.getByRole("button", { name: "Add board" }).click();
  await expect(page.getByRole("heading", { name: "Board 2" })).toBeVisible();
  await expect(page.getByText("No cards yet")).toHaveCount(5);

  // The tab bar sits below the board.
  const tabBox = (await tab(page, "Board 2").boundingBox())!;
  const columnBox = (await page.getByTestId("column-1").boundingBox())!;
  expect(tabBox.y).toBeGreaterThan(columnBox.y + columnBox.height);

  const backlog = page.getByTestId("column-1");
  await backlog.getByRole("button", { name: "+ Add card" }).click();
  await page.getByLabel("Card title").fill("Only on board 2");
  await backlog.getByRole("button", { name: "Add card", exact: true }).click();
  await expect(backlog.getByText("Only on board 2")).toBeVisible();

  await tab(page, "Launch Board").click();
  await expect(page.getByRole("heading", { name: "Launch Board" })).toBeVisible();
  await expect(page.getByText("Only on board 2")).toHaveCount(0);
  await expect(page.getByTestId("card-1")).toBeVisible();
});

test("renames a board by double-clicking its tab", async ({ page, request }) => {
  await loadBoard(page);
  await tab(page, "Launch Board").dblclick();
  const input = page.getByLabel("Board name");
  await input.fill("Roadmap");
  await input.press("Enter");

  await expect(tab(page, "Roadmap")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Roadmap" })).toBeVisible();
  await expect.poll(() => savedNames(request)).toEqual(["Roadmap"]);
});

test("deletes a board after confirmation", async ({ page, request }) => {
  await loadBoard(page);
  await page.getByRole("button", { name: "Add board" }).click();
  await expect(tab(page, "Board 2")).toBeVisible();

  await page.getByRole("button", { name: "Delete board: Board 2" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete board" }).click();

  await expect(tab(page, "Board 2")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Launch Board" })).toBeVisible();
  await expect.poll(() => savedNames(request)).toEqual(["Launch Board"]);
});

test("reorders tabs by dragging", async ({ page, request }) => {
  await loadBoard(page);
  await page.getByRole("button", { name: "Add board" }).click();
  await page.getByRole("button", { name: "Add board" }).click();
  await expect(tab(page, "Board 3")).toBeVisible();

  const source = (await tab(page, "Board 3").boundingBox())!;
  const target = (await tab(page, "Launch Board").boundingBox())!;
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
  await page.mouse.down();
  await page.mouse.move(source.x + source.width / 2 - 20, source.y + source.height / 2, { steps: 4 });
  await page.mouse.move(target.x + 10, target.y + target.height / 2, { steps: 10 });
  await page.mouse.up();

  await expect(page.getByRole("tab")).toHaveText(["Board 3", "Launch Board", "Board 2"]);
  await expect.poll(() => savedNames(request)).toEqual(["Board 3", "Launch Board", "Board 2"]);
});

test("boards, names and the active tab survive a reload", async ({ page, request }) => {
  await loadBoard(page);
  await page.getByRole("button", { name: "Add board" }).click();
  await tab(page, "Board 2").dblclick();
  await page.getByLabel("Board name").fill("Personal");
  await page.getByLabel("Board name").press("Enter");
  await expect.poll(() => savedNames(request)).toEqual(["Launch Board", "Personal"]);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Personal" })).toBeVisible();
  await expect(page.getByRole("tab")).toHaveText(["Launch Board", "Personal"]);
  await expect(tab(page, "Personal")).toHaveAttribute("aria-selected", "true");
});
