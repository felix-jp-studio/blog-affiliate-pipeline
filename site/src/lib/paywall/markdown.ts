import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified, type Pluggable } from "unified";

/**
 * Markdown を HTML 文字列にする。
 * Astro の Markdown レンダリングと同じ remark/rehype プラグインを渡せるようにして、
 * 有料パートの見た目を無料パートと揃える。
 */
export async function renderMarkdown(
  markdown: string,
  remarkPlugins: Pluggable[] = [],
  rehypePlugins: Pluggable[] = [],
): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkPlugins)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypePlugins)
    .use(rehypeStringify);

  return String(await processor.process(markdown));
}
