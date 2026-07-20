export type NavItem = {
  label: string;
  href: string;
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export const mainNav: NavItem[] = [
  { label: "格安SIM", href: "/sim" },
  { label: "光回線", href: "/hikari" },
  { label: "固定費", href: "/cost" },
  { label: "お困り系", href: "/trouble" },
];

export function buildBreadcrumbs(items: BreadcrumbItem[]): BreadcrumbItem[] {
  return [{ label: "ホーム", href: "/" }, ...items];
}
