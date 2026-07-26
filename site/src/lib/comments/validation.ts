const AUTHOR_MIN = 1;
const AUTHOR_MAX = 32;
const BODY_MIN = 10;
const BODY_MAX = 1000;
const SLUG_PATTERN = /^[a-z0-9-]+$/;

export type CommentInput = {
  articleSlug: string;
  authorName: string;
  body: string;
};

export function validateCommentInput(input: CommentInput): string | null {
  const slug = input.articleSlug?.trim() ?? "";
  if (!slug || !SLUG_PATTERN.test(slug)) {
    return "記事の指定が不正です。";
  }

  const authorName = input.authorName?.trim() ?? "";
  if (authorName.length < AUTHOR_MIN || authorName.length > AUTHOR_MAX) {
    return `お名前は${AUTHOR_MIN}〜${AUTHOR_MAX}文字で入力してください。`;
  }

  const body = input.body?.trim() ?? "";
  if (body.length < BODY_MIN || body.length > BODY_MAX) {
    return `コメントは${BODY_MIN}〜${BODY_MAX}文字で入力してください。`;
  }

  return null;
}

export function sanitizeCommentText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}
