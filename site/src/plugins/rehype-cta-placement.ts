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

function collectCtaBlocks(
  tree: Root,
): Array<{ node: Element; parent: Element | Root; index: number }> {
  const blocks: Array<{
    node: Element;
    parent: Element | Root;
    index: number;
  }> = [];
  visit(tree, "element", (node, index, parent) => {
    if (!isCtaBlock(node) || !parent || typeof index !== "number") {
      return;
    }
    blocks.push({ node, parent, index });
  });
  return blocks;
}

function removeCollectedCtaBlocks(
  blocks: Array<{ node: Element; parent: Element | Root; index: number }>,
): Element[] {
  for (const block of [...blocks].reverse()) {
    block.parent.children.splice(block.index, 1);
  }
  return blocks.map((block) => block.node);
}

function adjustInsertIndexAfterRemovals(
  target: { parent: Element | Root; index: number },
  removed: Array<{ parent: Element | Root; index: number }>,
): void {
  for (const block of removed) {
    if (block.parent !== target.parent || block.index >= target.index) {
      continue;
    }
    target.index -= 1;
  }
}

function isTableInsideScrollWrapper(
  node: Element,
  parent: Element | Root,
): boolean {
  return (
    node.tagName === "table" &&
    parent.type === "element" &&
    parent.tagName === "div" &&
    hasClass(parent, "table-scroll")
  );
}

function findAfterTableInsertPoint(
  tree: Root,
): { parent: Element | Root; index: number } | null {
  let target: { parent: Element | Root; index: number } | null = null;

  visit(tree, "element", (node, index, parent) => {
    if (target || !parent || typeof index !== "number") {
      return;
    }
    if (node.tagName === "div" && hasClass(node, "table-scroll")) {
      target = { parent, index: index + 1 };
    }
  });

  if (target) {
    return target;
  }

  visit(tree, "element", (node, index, parent) => {
    if (
      target ||
      !parent ||
      typeof index !== "number" ||
      node.tagName !== "table"
    ) {
      return;
    }
    if (isTableInsideScrollWrapper(node, parent)) {
      return;
    }
    target = { parent, index: index + 1 };
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
    if (/^(まとめ|FAQ|よくある質問)$/.test(text)) {
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
      const locatedBlocks = collectCtaBlocks(tree);

      if (locatedBlocks.length === 0) {
        return;
      }

      const target =
        placement === "before-conclusion"
          ? findBeforeConclusionInsertPoint(tree)
          : findAfterTableInsertPoint(tree);

      if (!target) {
        return;
      }

      adjustInsertIndexAfterRemovals(target, locatedBlocks);
      const ctaBlocks = removeCollectedCtaBlocks(locatedBlocks);
      target.parent.children.splice(target.index, 0, ...ctaBlocks);
    };
  };
