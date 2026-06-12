// esbuild alias target used only by patch-static-html.mjs.
// The SEO prerender bundle pulls src/data.ts for business/landing data;
// icon components are irrelevant there, so any named import resolves to a no-op.
module.exports = new Proxy({}, { get: () => () => null });
