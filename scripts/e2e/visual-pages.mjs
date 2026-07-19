/** @type {ReadonlyArray<{ spec: string; path: string; label: string; visualSnapshot: string; textSnapshot: string }>} */
export const VISUAL_PAGES = [
  {
    spec: "contact.visual.spec.ts",
    path: "/contact",
    label: "contact",
    visualSnapshot: "contact-main.png",
    textSnapshot: "contact-main.txt",
  },
  {
    spec: "sim-hub.visual.spec.ts",
    path: "/sim",
    label: "sim-hub",
    visualSnapshot: "sim-hub.png",
    textSnapshot: "sim-hub-head.txt",
  },
  {
    spec: "article-template.visual.spec.ts",
    path: "/articles/sim-20gb-osusume",
    label: "article-sim-20gb",
    visualSnapshot: "article-sim-20gb.png",
    textSnapshot: "article-sim-20gb-head.txt",
  },
];

/** @param {string} visualSnapshot e.g. "sim-hub.png" */
export function visualSnapshotBase(visualSnapshot) {
  return visualSnapshot.replace(/\.png$/i, "");
}
