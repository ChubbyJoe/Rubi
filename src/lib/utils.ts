import { createCn } from "cn/config";

// The DESIGN.md type tokens are font sizes, so `text-display-xl` and
// `text-muted-foreground` never knock each other out.
const TYPE_TOKENS = [
  "stat-display",
  "display-xl",
  "display-lg",
  "price-lg",
  "display-sm",
  "title-md",
  "title-sm",
  "body-md",
  "body-sm",
  "table",
  "caption",
  "caption-sm",
  "column-head",
  "badge",
  "button-md",
  "button-sm",
  "link",
  "nav-link",
];

export const cn = createCn({
  extend: { classGroups: { "font-size": [{ text: TYPE_TOKENS }] } },
});
