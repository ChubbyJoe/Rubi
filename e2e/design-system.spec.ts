import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Spec 0003, AC-12 (with AC-3, AC-6, AC-7): the four preview variants at
// 390 by 844 have no serious or critical axe violations, and tabbing reaches
// every enabled control with a visible focus outline.
const VARIANTS = [
  { name: "Admin light", path: "/dev/ui", colorScheme: "light" },
  { name: "Admin dark", path: "/dev/ui", colorScheme: "dark" },
  { name: "Shop warm", path: "/dev/ui/shop", colorScheme: "light" },
  { name: "Shop stone", path: "/dev/ui/shop?neutrals=stone", colorScheme: "light" },
] as const;

const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

async function open(page: Page, path: string, colorScheme: "light" | "dark") {
  await page.emulateMedia({ colorScheme });
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

for (const { name, path, colorScheme } of VARIANTS) {
  test.describe(name, () => {
    test("has no serious or critical axe violations", async ({ page }) => {
      await open(page, path, colorScheme);
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        // The Next.js dev tools badge is not part of the app.
        .exclude("nextjs-portal")
        .analyze();
      const blocking = violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
      expect(blocking).toEqual([]);
    });

    test("tabbing reaches every enabled control with a visible outline", async ({ page }) => {
      await open(page, path, colorScheme);
      const expected = await page.evaluate(
        (selector) =>
          [...document.querySelectorAll<HTMLElement>(selector)].filter(
            (el) => el.closest("nextjs-portal") === null && el.getClientRects().length > 0,
          ).length,
        TABBABLE,
      );

      const seen = new Set<string>();
      for (let i = 0; i < expected + 5 && seen.size < expected; i++) {
        await page.keyboard.press("Tab");
        const focus = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body || el.closest("nextjs-portal")) return null;
          // A field inside an input group draws its outline on the group.
          const ringed = el.closest<HTMLElement>('[data-slot="input-group"]') ?? el;
          const style = getComputedStyle(ringed);
          if (!el.dataset.tabProbe) el.dataset.tabProbe = String(Math.random());
          return {
            key: el.dataset.tabProbe,
            label: `${el.tagName} ${el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 30)}`,
            outline: style.outlineStyle !== "none" && parseFloat(style.outlineWidth) >= 2,
          };
        });
        if (!focus) continue;
        expect(focus.outline, `focus outline on ${focus.label}`).toBe(true);
        seen.add(focus.key);
      }
      expect(seen.size).toBe(expected);
    });
  });
}

test("shop preview is never dark", async ({ page }) => {
  await open(page, "/dev/ui/shop", "dark");
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe("rgb(252, 247, 248)");
});

test("stone preview focus ring is the teal accent, not the stone ink", async ({ page }) => {
  await open(page, "/dev/ui/shop?neutrals=stone", "light");
  const ring = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--ring").trim(),
  );
  expect(ring).toBe("#0f766e");
});
