import type { Element, Root, Text } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { nextHeadingId } from "../utils/heading-slug.ts";

function getTextContent(node: Element): string {
  const parts: string[] = [];

  visit(node, "text", (textNode: Text) => {
    parts.push(textNode.value);
  });

  return parts.join("");
}

export const rehypeHeadings: Plugin<[], Root> = () => {
  const slugCounts = new Map<string, number>();

  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "h2" && node.tagName !== "h3") {
        return;
      }

      const text = getTextContent(node);
      const id = nextHeadingId(text, slugCounts);

      node.properties = node.properties ?? {};
      node.properties.id = id;
    });
  };
};
