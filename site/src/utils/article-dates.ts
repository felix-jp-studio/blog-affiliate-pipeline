export function resolveDateModified(
  pubDate: Date,
  dateModified?: Date,
): Date {
  return dateModified ?? pubDate;
}
