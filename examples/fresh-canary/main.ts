import { App, fsRoutes, trailingSlashes } from "@fresh/core";

export const app = new App({ root: import.meta.url })
  .use(trailingSlashes("never"));

await fsRoutes(app, {
  loadIsland: (p) => import(`./islands/${p}`),
  loadRoute: (p) => import(`./routes/${p}`),
});
