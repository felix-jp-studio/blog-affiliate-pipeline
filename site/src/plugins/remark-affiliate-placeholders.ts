import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Link, Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import {
  loadAffiliateRules,
  resolveCarrierUrl,
} from "../utils/asp-urls.ts";

const PLACEHOLDER_PATTERN = /^\{\{?AFFILIATE:([a-z0-9-]+)\}\}?$/;

function resolvePlaceholder(carrierId: string): string {
  const rules = loadAffiliateRules();
  const carrier = rules.carriers[carrierId];
  if (!carrier) {
    return `#unknown-carrier-${carrierId}`;
  }
  return resolveCarrierUrl(carrier);
}

export const remarkAffiliatePlaceholders: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "link", (node: Link) => {
      const url = node.url ?? "";
      const match = url.match(PLACEHOLDER_PATTERN);
      if (!match) {
        return;
      }
      node.url = resolvePlaceholder(match[1]);
    });
  };
};
