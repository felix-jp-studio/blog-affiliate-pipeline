import type { Element, Root, Text } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

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

function hasClass(node: Element, className: string): boolean {
  const classNames = node.properties?.className;
  if (Array.isArray(classNames)) {
    return classNames.includes(className);
  }
  return classNames === className;
}

function getMeaningfulChildren(node: Element) {
  return node.children.filter(
    (child) => child.type !== "text" || (child as Text).value.trim().length > 0,
  );
}

function getLinkText(node: Element): string {
  return node.children
    .map((child) => (child.type === "text" ? child.value : ""))
    .join("")
    .trim();
}

function extractCarrierLabel(linkText: string): string {
  return (
    linkText
      .replace(/の公式(?:サイト)?(?:を)?(?:見る|確認)/g, "")
      .replace(/公式(?:サイト)?(?:で)?(?:確認|見る)/g, "")
      .trim() || linkText
  );
}

function paragraphIsStandaloneAffiliateLink(node: Element): node is Element {
  if (node.tagName !== "p") {
    return false;
  }

  const meaningful = getMeaningfulChildren(node);
  return (
    meaningful.length === 1 &&
    meaningful[0].type === "element" &&
    meaningful[0].tagName === "a" &&
    hasClass(meaningful[0], "affiliate-link")
  );
}

export const rehypeAffiliateCta: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      if (
        !paragraphIsStandaloneAffiliateLink(node) ||
        !parent ||
        typeof index !== "number" ||
        (parent.type !== "element" && parent.type !== "root")
      ) {
        return;
      }

      const linkNode = getMeaningfulChildren(node)[0] as Element;
      const linkText = getLinkText(linkNode);
      const carrierLabel = extractCarrierLabel(linkText);

      linkNode.properties = {
        ...linkNode.properties,
        className: appendClass(
          linkNode.properties?.className as string | string[] | undefined,
          "affiliate-cta-block__action",
        ),
      };

      if (
        linkNode.children.length === 1 &&
        linkNode.children[0].type === "text"
      ) {
        linkNode.children[0].value = "公式サイトで確認";
      }

      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: { className: ["affiliate-cta-block"] },
        children: [
          {
            type: "element",
            tagName: "div",
            properties: { className: ["affiliate-cta-block__content"] },
            children: [
              {
                type: "element",
                tagName: "p",
                properties: { className: ["affiliate-cta-block__title"] },
                children: [{ type: "text", value: carrierLabel }],
              },
              {
                type: "element",
                tagName: "p",
                properties: { className: ["affiliate-cta-block__desc"] },
                children: [
                  {
                    type: "text",
                    value:
                      "料金・キャンペーン・適用条件は公式サイトで最新情報をご確認ください。",
                  },
                ],
              },
            ],
          },
          linkNode,
        ],
      };
    });
  };
};
