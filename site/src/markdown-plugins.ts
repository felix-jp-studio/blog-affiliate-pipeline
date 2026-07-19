import { rehypeAffiliateAndTables } from "./plugins/rehype-affiliate-tables.ts";
import { rehypeHeadings } from "./plugins/rehype-headings.ts";

export const markdownRehypePlugins = [rehypeHeadings, rehypeAffiliateAndTables];
