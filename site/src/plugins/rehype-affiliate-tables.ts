import type { Root } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const AFFILIATE_HOSTS = ["px.a8.net", "valuecommerce.com"];

function isAffiliateUrl(href: string): boolean {
  try {
    const host = new URL(href, "https://sim-hikari-guide.com").hostname;
    return AFFILIATE_HOSTS.some((pattern) => host.includes(pattern));
  } catch {
    return false;
  }
}

function appendClass(
  existing: string | string[] | undefined,
  className: string,
): string[] {
  const classes = Array.isArray(existing)
    ? existing
    : existing
      ? [existing]
      : [];
  return [...classes, className];
}

export const rehypeAffiliateAndTables: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      if (
        node.tagName === "table" &&
        parent &&
        typeof index === "number" &&
        parent.type === "element"
      ) {
        parent.children[index] = {
          type: "element",
          tagName: "div",
          properties: { className: ["table-scroll"] },
          children: [node],
        };
      }

      if (node.tagName !== "a" || !node.properties?.href) {
        return;
      }

      const href = String(node.properties.href);
      if (!isAffiliateUrl(href)) {
        return;
      }

      node.properties.rel = "sponsored noopener noreferrer";
      node.properties.target = "_blank";
      node.properties.className = appendClass(
        node.properties.className as string | string[] | undefined,
        "affiliate-link",
      );
    });
  };
};
