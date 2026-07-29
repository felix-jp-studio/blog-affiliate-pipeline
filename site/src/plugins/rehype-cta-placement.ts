import type { Element, Root } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import {
  resolveCtaPlacement,
  type CtaPlacement,
} from "../data/cta-placement.ts";

function hasClass(node: Element, className: string): boolean {
  const classNames = node.properties?.className;
  if (Array.isArray(classNames)) {
    return classNames.includes(className);
  }
  return classNames === className;
}

function isCtaBlock(node: Element): boolean {
  return node.tagName === "div" && hasClass(node, "affiliate-cta-block");
}

function headingText(node: Element): string {
  return node.children
    .map((child) =>
      "value" in child && child.type === "text" ? child.value : "",
    )
    .join("")
    .trim();
}

function parseCommentPlacement(value: string): CtaPlacement | null {
  const match = value.match(/^cta-placement:(after-table|before-conclusion)$/);
  return match ? (match[1] as CtaPlacement) : null;
}

function resolveSlugFromFile(file?: { path?: string }): string | undefined {
  if (!file?.path) {
    return undefined;
  }
  const match = file.path.match(/\/articles\/([^/]+)\.md$/);
  return match?.[1];
}

function extractCommentPlacement(tree: Root): CtaPlacement | null {
  let placement: CtaPlacement | null = null;
  visit(tree, (node) => {
    if (placement) {
      return;
    }
    if (node.type === "comment") {
      placement = parseCommentPlacement(String(node.value).trim());
    }
    if (node.type === "raw" && typeof node.value === "string") {
      const rawMatch = node.value.match(
        /<!--\s*cta-placement:(after-table|before-conclusion)\s*-->/,
      );
      if (rawMatch) {
        placement = rawMatch[1] as CtaPlacement;
      }
    }
  });
  return placement;
}

function removeCtaBlocks(tree: Root): Element[] {
  const blocks: Element[] = [];
  visit(tree, "element", (node, index, parent) => {
    if (!isCtaBlock(node) || !parent || typeof index !== "number") {
      return;
    }
    blocks.push(node);
    parent.children.splice(index, 1);
    return index;
  });
  return blocks;
}

function findAfterTableInsertPoint(
  tree: Root,
): { parent: Element | Root; index: number } | null {
  let target: { parent: Element | Root; index: number } | null = null;
  visit(tree, "element", (node, index, parent) => {
    if (target || !parent || typeof index !== "number") {
      return;
    }
    if (node.tagName === "div" && hasClass(node, "table-wrap")) {
      target = { parent, index: index + 1 };
    }
  });
  return target;
}

function findBeforeConclusionInsertPoint(
  tree: Root,
): { parent: Element | Root; index: number } | null {
  let target: { parent: Element | Root; index: number } | null = null;
  visit(tree, "element", (node, index, parent) => {
    if (
      target ||
      !parent ||
      typeof index !== "number" ||
      node.tagName !== "h2"
    ) {
      return;
    }
    const text = headingText(node);
    if (/まとめ|結論|FAQ|よくある質問/.test(text)) {
      target = { parent, index };
    }
  });
  return target;
}

export const rehypeCtaPlacement: Plugin<[], Root> =
  function rehypeCtaPlacement() {
    return (tree, file) => {
      const slug = resolveSlugFromFile(file);
      const commentPlacement = extractCommentPlacement(tree);
      const placement = resolveCtaPlacement(slug, commentPlacement);
      const ctaBlocks = removeCtaBlocks(tree);

      if (ctaBlocks.length === 0) {
        return;
      }

      const target =
        placement === "before-conclusion"
          ? findBeforeConclusionInsertPoint(tree)
          : findAfterTableInsertPoint(tree);

      if (!target) {
        return;
      }

      target.parent.children.splice(target.index, 0, ...ctaBlocks);
    };
  };
