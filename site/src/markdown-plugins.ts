import { remarkAffiliatePlaceholders } from "./plugins/remark-affiliate-placeholders.ts";
import { rehypeAffiliateAndTables } from "./plugins/rehype-affiliate-tables.ts";
import { rehypeAffiliateCta } from "./plugins/rehype-affiliate-cta.ts";
import { rehypeHeadings } from "./plugins/rehype-headings.ts";
import { rehypeSummaryCallout } from "./plugins/rehype-summary-callout.ts";

export const markdownRemarkPlugins = [remarkAffiliatePlaceholders];

export const markdownRehypePlugins = [
  rehypeHeadings,
  rehypeSummaryCallout,
  rehypeAffiliateAndTables,
  rehypeAffiliateCta,
];
