export const visualPages = {
  contact: {
    path: "/contact",
    visualLocator: "main",
    visualSnapshot: "contact-main.png",
    textSnapshot: "contact-main.txt",
  },
  homepage: {
    path: "/",
    visualLocator: "main",
    visualSnapshot: "homepage-main.png",
    textSnapshot: "homepage-head.txt",
  },
  simHub: {
    path: "/sim",
    visualLocator: ".category-hub",
    visualSnapshot: "sim-hub.png",
    textSnapshot: "sim-hub-head.txt",
  },
  hikariHub: {
    path: "/hikari",
    visualLocator: ".category-hub",
    visualSnapshot: "hikari-hub.png",
    textSnapshot: "hikari-hub-head.txt",
  },
  costHub: {
    path: "/cost",
    visualLocator: ".category-hub",
    visualSnapshot: "cost-hub.png",
    textSnapshot: "cost-hub-head.txt",
  },
  articleTemplate: {
    path: "/articles/sim-20gb-osusume",
    visualLocator: ".article-shell",
    visualSnapshot: "article-sim-20gb.png",
    textSnapshot: "article-sim-20gb-head.txt",
  },
  crosssellArticle: {
    path: "/articles/au-denki-setwari",
    visualLocator: ".article-shell",
    visualSnapshot: "article-au-denki-setwari.png",
    textSnapshot: "article-au-denki-setwari-head.txt",
  },
} as const;
