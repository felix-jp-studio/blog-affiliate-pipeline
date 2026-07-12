export type WpPostStatus = "draft" | "publish" | "future" | "pending" | "private";

export type WpPostPayload = {
  title: string;
  content: string;
  status: WpPostStatus;
  slug?: string;
  categories?: number[];
  tags?: number[];
};

export type WpPostResponse = {
  id: number;
  link: string;
  status: string;
  slug: string;
};

export type PublishStateEntry = {
  keywordId?: number;
  slug: string;
  wpPostId: number;
  url: string;
  status: WpPostStatus;
  publishedAt: string;
};

export type PublishState = {
  articles: PublishStateEntry[];
};

export type ArticleFrontmatter = {
  title: string;
  slug?: string;
  keywordId?: number;
  articleType?: string;
  status?: WpPostStatus;
};
