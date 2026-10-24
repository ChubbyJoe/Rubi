import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

// AC-2: the eslint.config.mjs rule that keeps raw colors out of class strings.
const MESSAGE = "Use a design token (see DESIGN.md)";
const eslint = new ESLint();

const tokenErrors = async (code: string) => {
  const [result] = await eslint.lintText(code, { filePath: "src/components/sample.tsx" });
  return result.messages.filter((m) => m.message === MESSAGE).length;
};

describe("design token lint rule", () => {
  // covers: AC-2
  it.each([
    ["a palette color in className", `export const A = () => <p className="text-gray-500" />;`],
    ["an arbitrary hex in className", `export const A = () => <p className="bg-[#fff]" />;`],
    [
      "a palette color in a className template",
      "export const A = ({ x }: { x: string }) => <p className={`${x} border-red-500`} />;",
    ],
    [
      "a palette color inside cn()",
      `import { cn } from "@/lib/utils";\nexport const A = () => <p className={cn("p-2", "bg-white")} />;`,
    ],
    [
      "a palette color inside cva()",
      `import { cva } from "class-variance-authority";\nexport const v = cva("ring-blue-600");`,
    ],
  ])(
    "flags %s",
    async (_, code) => {
      // cn() inside className matches both selectors, so count at least one.
      expect(await tokenErrors(code)).toBeGreaterThanOrEqual(1);
    },
    30_000,
  );

  it("allows design token classes", async () => {
    expect(
      await tokenErrors(
        `export const A = () => <p className="bg-background text-muted-foreground border-border ring-ring" />;`,
      ),
    ).toBe(0);
  }, 30_000);

  it("does not flag a word that only starts like a palette name", async () => {
    expect(await tokenErrors(`export const A = () => <p className="text-redact" />;`)).toBe(0);
  }, 30_000);
});
