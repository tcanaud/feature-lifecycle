export function applyFilters(features, filters) {
  if (!filters) return features;

  let result = features;

  if (filters.stage) {
    result = result.filter((f) => f.stage === filters.stage);
  }

  if (filters.health) {
    result = result.filter((f) => f.health === filters.health);
  }

  if (filters.tag) {
    result = result.filter((f) => {
      const tags = f.tags || [];
      return tags.includes(filters.tag);
    });
  }

  return result;
}
