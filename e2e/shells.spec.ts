import { expect, test, type Page } from "@playwright/test";

// Spec 0003, AC-3, AC-8, AC-9, AC-10: the Admin and Shop shells against the
// seeded dev branch (npm run db:seed). Ada owns the published "ada-fabrics".
const SELLER = { name: "Ada Okafor", email: "ada@seed.rubi.test", password: "rubi-seed-password" };
const STORE = { name: "Ada's Fabrics", slug: "ada-fabrics" };
// Better Auth rate limits sign in, so the read only tests share one session.
const SELLER_STATE = "test-results/.auth/seller.json";
const SIGN_IN_URL = /\/sign-in(\?.*)?$/;

async function signIn(page: Page) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(SELLER.email);
  await page.getByLabel("Password").fill(SELLER.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/app");
}

test.describe("Admin shell", () => {
  // covers: AC-8 (security: the shell never renders without a session)
  test("sends a signed out visitor to sign in", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveURL(SIGN_IN_URL);
  });

  test.describe("signed in", () => {
    test.describe.configure({ mode: "serial" });
    test.use({ storageState: SELLER_STATE });

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext({ storageState: undefined });
      await signIn(await context.newPage());
      await context.storageState({ path: SELLER_STATE });
      await context.close();
    });

    test.beforeEach(async ({ page }) => {
      await page.goto("/app");
    });

    // covers: AC-8
    test("at 390px shows the bottom tab bar with Home as the current page", async ({ page }) => {
      const tabBar = page.getByRole("navigation", { name: "Main" }).filter({ hasText: "More" });
      await expect(tabBar).toBeVisible();
      await expect(tabBar.getByRole("link", { name: "Home" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });

    // covers: AC-8
    test("shows the store name in the topbar", async ({ page }) => {
      await expect(page.getByRole("banner").getByText(STORE.name)).toBeVisible();
    });

    // covers: AC-8
    test("has one main, and Skip to content moves focus into it", async ({ page }) => {
      await expect(page.locator("main")).toHaveCount(1);
      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator("main#main")).toBeFocused();
    });

    // covers: AC-8
    test("More sheet links to the published shop in a new tab", async ({ page }) => {
      await page.getByRole("button", { name: "More" }).click();
      const sheet = page.getByRole("dialog", { name: STORE.name });
      await expect(sheet).toBeVisible();
      const viewShop = sheet.getByRole("link", { name: "View shop" });
      await expect(viewShop).toHaveAttribute("href", `/s/${STORE.slug}`);
      await expect(viewShop).toHaveAttribute("target", "_blank");
    });

    // covers: AC-8, AC-10
    test("at 1280px shows the sidebar wordmark and View shop in the topbar", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      const sidebar = page.getByRole("complementary");
      // The DotMark hides at this width; only the wordmark is left.
      await expect(sidebar.locator('[role="img"][aria-label="Rubi"]:visible')).toHaveCount(1);
      await expect(sidebar.getByText("rub")).toBeVisible();
      await expect(
        page.getByRole("banner").getByRole("link", { name: "View shop" }),
      ).toHaveAttribute("href", `/s/${STORE.slug}`);
    });
  });

  // Its own session: signing out revokes it on the server.
  // covers: AC-8
  test("account menu shows the seller and signs out to /sign-in", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Account" }).click();
    const menu = page.getByRole("menu");
    await expect(menu.getByText(SELLER.name)).toBeVisible();
    await expect(menu.getByText(SELLER.email)).toBeVisible();
    await menu.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL(SIGN_IN_URL);

    // The session is gone, not just the page.
    await page.goto("/app");
    await expect(page).toHaveURL(SIGN_IN_URL);
  });
});

test.describe("Shop shell", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(`/s/${STORE.slug}`);
  });

  // covers: AC-3
  test("stays light when the system is dark", async ({ page }) => {
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe("rgb(252, 247, 248)");
  });

  // covers: AC-9
  test("header links the store name home and there is one main", async ({ page }) => {
    await expect(page.getByRole("banner").getByRole("link", { name: STORE.name })).toHaveAttribute(
      "href",
      `/s/${STORE.slug}`,
    );
    await expect(page.locator("main")).toHaveCount(1);
  });

  // covers: AC-9, AC-10
  test("footer says Powered by rubi and links to sign up", async ({ page }) => {
    const powered = page.getByRole("contentinfo").getByRole("link", { name: /Powered by/ });
    await expect(powered).toHaveAttribute("href", "/sign-up");
    await expect(powered.getByRole("img", { name: "Rubi" })).toBeVisible();
  });
});

// covers: AC-9 (failure path). The layout streams before notFound() runs, so
// Next keeps a 200 status and marks the page noindex instead.
test("an unknown shop shows the not found page, kept out of search", async ({ page }) => {
  await page.goto("/s/no-such-store-here");
  await expect(page.getByRole("heading", { name: "Page not found", level: 1 })).toBeVisible();
  await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
});
