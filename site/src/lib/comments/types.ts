export type CommentStatus = "pending" | "approved" | "rejected";

export type Comment = {
  id: string;
  articleSlug: string;
  authorName: string;
  body: string;
  status: CommentStatus;
  createdAt: string;
  approvedAt?: string;
  ipHash?: string;
};

export type PublicComment = Pick<
  Comment,
  "id" | "authorName" | "body" | "createdAt" | "approvedAt"
>;
