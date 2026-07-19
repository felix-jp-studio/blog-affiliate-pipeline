import type { Element, ElementContent, Root, Text } from "hast";
import type { Plugin } from "unified";

function getHeadingText(node: Element): string {
  return node.children
    .map((child) => (child.type === "text" ? child.value : ""))
    .join("")
    .trim();
}

function isSummaryHeading(node: Element): boolean {
  if (node.tagName !== "h2") {
    return false;
  }

  const normalized = getHeadingText(node).replace(/\s+/g, "");
  return normalized.includes("結論");
}

function isSectionBreak(node: ElementContent): boolean {
  return (
    node.type === "element" && (node.tagName === "h1" || node.tagName === "h2")
  );
}

export const rehypeSummaryCallout: Plugin<[], Root> = () => {
  return (tree) => {
    const { children } = tree;

    for (let index = 0; index < children.length; index += 1) {
      const node = children[index];
      if (node.type !== "element" || !isSummaryHeading(node)) {
        continue;
      }

      const sectionNodes: ElementContent[] = [node];
      let nextIndex = index + 1;

      while (nextIndex < children.length) {
        const sibling = children[nextIndex];
        if (isSectionBreak(sibling)) {
          break;
        }
        sectionNodes.push(sibling);
        nextIndex += 1;
      }

      const wrapper: Element = {
        type: "element",
        tagName: "div",
        properties: { className: ["callout-summary"] },
        children: sectionNodes,
      };

      children.splice(index, nextIndex - index, wrapper);
      break;
    }
  };
};
