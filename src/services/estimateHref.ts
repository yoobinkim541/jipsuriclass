export function buildEstimateHref(options: {
  works?: string[];
  workIds?: string[];
  sourceServicePath?: string | null;
  sourcePricingPath?: string | null;
  project?: string;
  issue?: string;
}) {
  const params = new URLSearchParams();

  if (options.works?.length) {
    params.set("works", options.works.join(","));
  }
  if (options.workIds?.length) {
    params.set("workIds", options.workIds.join(","));
  }
  if (options.sourceServicePath) {
    params.set("sourceService", options.sourceServicePath);
  }
  if (options.sourcePricingPath) {
    params.set("sourcePricing", options.sourcePricingPath);
  }
  if (options.project) {
    params.set("project", options.project);
  }
  if (options.issue) {
    params.set("issue", options.issue);
  }

  const query = params.toString();
  return query ? `/estimate?${query}` : "/estimate";
}
