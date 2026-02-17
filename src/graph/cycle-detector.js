export function detectCycles(features) {
  // Build adjacency list from depends_on
  const adj = new Map();
  for (const f of features) {
    const id = f.feature_id;
    const deps = f.depends_on || [];
    adj.set(id, deps);
  }

  const cycles = [];
  const visited = new Set();
  const inStack = new Set();
  const path = [];

  function dfs(node) {
    if (inStack.has(node)) {
      // Found a cycle — extract it
      const cycleStart = path.indexOf(node);
      if (cycleStart >= 0) {
        cycles.push([...path.slice(cycleStart), node]);
      }
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    inStack.add(node);
    path.push(node);

    const neighbors = adj.get(node) || [];
    for (const neighbor of neighbors) {
      dfs(neighbor);
    }

    path.pop();
    inStack.delete(node);
  }

  for (const id of adj.keys()) {
    dfs(id);
  }

  return cycles;
}
