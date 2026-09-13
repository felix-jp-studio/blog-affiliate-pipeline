import {
  markdownRehypePlugins,
  markdownRemarkPlugins,
} from "../../markdown-plugins.ts";
import { renderMarkdown } from "./markdown.ts";

/** 有料本文の Markdown を、記事本文と同じプラグイン構成で HTML にする。 */
export function renderPremiumMarkdown(markdown: string): Promise<string> {
  return renderMarkdown(markdown, markdownRemarkPlugins, markdownRehypePlugins);
}
