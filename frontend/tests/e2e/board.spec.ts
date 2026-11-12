import { expect, test, type Locator, type Page } from "@playwright/test";
import { initialWorkspace } from "../../src/lib/workspace";

function column(page: Page, id: string): Locator {
  return page.getByTestId(`column-${id}`);
}

// Every test starts from the same clean dummy board on the server.
test.beforeEach(async ({ request }) => {
  const response = await request.put("/api/workspace", { data: initialWorkspace });
  expect(response.ok()).toBe(true);
});

/** Open the board and wait until it has loaded from the API. */
async function loadBoard(page: Page) {
  await page.goto("/");
  await expect(page.getByTestId("column-1")).toBeVisible();
  await expect(page.getByTestId("column-5")).toBeVisible();
  await expect(page.getByTestId("card-1")).toBeVisible();
}

async function cardOrder(within: Locator): Promise<string[]> {
  return within
    .locator('[data-testid^="card-"]')
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-testid") ?? ""),
    );
}

async function dragCard(page: Page, cardId: string, target: Locator) {
  const card = page.getByTestId(`card-${cardId}`);
  const box = await card.boundingBox();
  if (!box) throw new Error(`card-${cardId} not rendered`);
  await card.hover();
  await page.mouse.down();
  // Nudge past the pointer sensor's activation distance to start the drag.
  await page.mouse.move(box.x + box.width / 2 + 15, box.y + box.height / 2 + 15, {
    steps: 3,
  });
  await target.hover();
  await page.mouse.up();
}

test("renders the board with five columns and dummy data", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await loadBoard(page);

  const titles = ["Backlog", "To Do", "In Progress", "In Review", "Done"];
  for (const [index, title] of titles.entries()) {
    const section = column(page, String(index + 1));
    await expect(section).toBeVisible();
    await expect(section.getByRole("button", { name: title })).toBeVisible();
  }

  await expect(page.getByRole("heading", { name: "Launch Board" })).toBeVisible();
  await expect(page.getByTestId("card-8")).toContainText("Build drag-and-drop board");
  await expect(page.getByTestId("column-1-count")).toHaveText("4");
  await expect(page.getByTestId("column-5-count")).toHaveText("3");

  const hydrationErrors = consoleErrors.filter((message) => /hydrat/i.test(message));
  expect(hydrationErrors).toEqual([]);
});

test("renames a column inline", async ({ page }) => {
  await loadBoard(page);

  await page.getByRole("button", { name: "In Review" }).click();
  const input = page.getByLabel("Column title");
  await expect(input).toHaveValue("In Review");
  await input.fill("QA");
  await input.press("Enter");

  await expect(page.getByRole("button", { name: "QA" })).toBeVisible();
  await expect(page.getByRole("button", { name: "In Review" })).toHaveCount(0);
});

test("keeps the old title when renaming is cancelled with Escape", async ({ page }) => {
  await loadBoard(page);

  await page.getByRole("button", { name: "Backlog" }).click();
  const input = page.getByLabel("Column title");
  await input.fill("Ideas");
  await input.press("Escape");

  await expect(page.getByRole("button", { name: "Backlog" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ideas" })).toHaveCount(0);
});

test("adds a card with title and details", async ({ page }) => {
  await loadBoard(page);

  const target = column(page, "2");
  await target.getByRole("button", { name: "+ Add card" }).click();
  await page.getByLabel("Card title").fill("Book the venue");
  await page.getByLabel("Card details").fill("Capacity for 120 guests.");
  await target.getByRole("button", { name: "Add card", exact: true }).click();

  await expect(target.getByText("Book the venue")).toBeVisible();
  await expect(target.getByText("Capacity for 120 guests.")).toBeVisible();
  await expect(page.getByTestId("column-2-count")).toHaveText("4");
});

test("does not add a card when the form is cancelled", async ({ page }) => {
  await loadBoard(page);

  const target = column(page, "2");
  await target.getByRole("button", { name: "+ Add card" }).click();
  await page.getByLabel("Card title").fill("Never added");
  await target.getByRole("button", { name: "Cancel" }).click();

  await expect(target.getByText("Never added")).toHaveCount(0);
  await expect(page.getByTestId("column-2-count")).toHaveText("3");
  await expect(target.getByRole("button", { name: "+ Add card" })).toBeVisible();
});

test("deletes a card", async ({ page }) => {
  await loadBoard(page);

  const card = page.getByTestId("card-5");
  await card.getByRole("button", { name: "Delete card: Design empty states" }).click();

  await expect(page.getByTestId("card-5")).toHaveCount(0);
  await expect(page.getByTestId("column-2-count")).toHaveText("2");
});

test("moves a card to another column by dragging", async ({ page }) => {
  await loadBoard(page);

  await dragCard(page, "4", column(page, "3"));

  const target = column(page, "3");
  await expect(target).toContainText("Spike: offline read-only mode");
  await expect(column(page, "1")).not.toContainText("Spike: offline read-only mode");
  await expect(page.getByTestId("column-1-count")).toHaveText("3");
  await expect(page.getByTestId("column-3-count")).toHaveText("4");
});

test("reorders a card within a column by dragging", async ({ page }) => {
  await loadBoard(page);

  const backlog = column(page, "1");
  expect(await cardOrder(backlog)).toEqual(["card-1", "card-2", "card-3", "card-4"]);

  await dragCard(page, "1", page.getByTestId("card-3"));

  expect(await cardOrder(backlog)).toEqual(["card-2", "card-3", "card-1", "card-4"]);
  await expect(page.getByTestId("column-1-count")).toHaveText("4");
});

test("moves a card to another column with the keyboard", async ({ page }) => {
  await loadBoard(page);

  const card = page.getByTestId("card-1");
  await card.focus();
  await page.keyboard.press("Space"); // lift the card
  for (let i = 0; i < 6; i += 1) {
    await page.keyboard.press("ArrowRight");
  }
  await page.keyboard.press("Space"); // drop

  const target = column(page, "2");
  await expect(target).toContainText("Audit accessibility across the app");
  await expect(column(page, "1")).not.toContainText("Audit accessibility across the app");
  await expect(page.getByTestId("column-1-count")).toHaveText("3");
  await expect(page.getByTestId("column-2-count")).toHaveText("4");
});

test("persists card positions across page reloads", async ({ page, request }) => {
  await loadBoard(page);

  await dragCard(page, "4", column(page, "3"));

  // Wait until the save has landed on the server before reloading.
  await expect
    .poll(async () => {
      const saved = await (await request.get("/api/workspace")).json();
      return saved.sheets[0].columns[2].cards.length;
    })
    .toBe(4);

  await page.reload();
  await expect(page.getByTestId("card-1")).toBeVisible();

  const target = column(page, "3");
  await expect(target).toContainText("Spike: offline read-only mode");
  await expect(column(page, "1")).not.toContainText("Spike: offline read-only mode");
  await expect(page.getByTestId("column-1-count")).toHaveText("3");
  await expect(page.getByTestId("column-3-count")).toHaveText("4");
});

test("persists renamed columns and added cards across page reloads", async ({
  page,
  request,
}) => {
  await loadBoard(page);

  await page.getByRole("button", { name: "In Review" }).click();
  const titleInput = page.getByLabel("Column title");
  await titleInput.fill("QA");
  await titleInput.press("Enter");

  const target = column(page, "2");
  await target.getByRole("button", { name: "+ Add card" }).click();
  await page.getByLabel("Card title").fill("Book the venue");
  await page.getByLabel("Card details").fill("Capacity for 120 guests.");
  await target.getByRole("button", { name: "Add card", exact: true }).click();
  await expect(target.getByText("Book the venue")).toBeVisible();

  // Wait until both changes have landed on the server before reloading.
  await expect
    .poll(async () => {
      const { columns } = (await (await request.get("/api/workspace")).json()).sheets[0];
      return {
        column2Cards: columns[1].cards.length,
        column4Title: columns[3].title,
      };
    })
    .toEqual({ column2Cards: 4, column4Title: "QA" });

  await page.reload();
  await expect(page.getByTestId("card-1")).toBeVisible();

  await expect(page.getByRole("button", { name: "QA" })).toBeVisible();
  await expect(page.getByRole("button", { name: "In Review" })).toHaveCount(0);
  await expect(target.getByText("Book the venue")).toBeVisible();
  await expect(target.getByText("Capacity for 120 guests.")).toBeVisible();
  await expect(page.getByTestId("column-2-count")).toHaveText("4");
});