import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

// Spec 0003: colors come only from the DESIGN.md tokens. Flags an arbitrary
// hex (`bg-[#fff]`) or a Tailwind palette color (`text-gray-500`) in class
// strings. Inline `style` hex values are left to review.
const PALETTE =
  "(bg|text|border|ring|outline|fill|stroke|from|to|via)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)\\b";
const RAW_COLOR = `/-\\[#|${PALETTE}/`;
const MESSAGE = "Use a design token (see DESIGN.md)";
const classStrings = (scope) => [
  { selector: `${scope} Literal[value=${RAW_COLOR}]`, message: MESSAGE },
  { selector: `${scope} TemplateElement[value.raw=${RAW_COLOR}]`, message: MESSAGE },
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...classStrings("JSXAttribute[name.name='className']"),
        ...classStrings("CallExpression[callee.name=/^(cn|cva)$/]"),
      ],
    },
  },
  // Last, so Prettier owns formatting and ESLint only checks code.
  prettier,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "drizzle/**"]),
]);
