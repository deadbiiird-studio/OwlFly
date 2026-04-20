const KEY = "owlfly_eval_runs_v1";

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export function loadEvalRuns() {
  if (typeof localStorage === "undefined") return [];
  return safeParse(localStorage.getItem(KEY), []);
}

export function saveEvalRun(summary) {
  if (typeof localStorage === "undefined") return;
  const runs = loadEvalRuns();
  runs.push({
    at: new Date().toISOString(),
    ...summary,
  });
  while (runs.length > 200) runs.shift();
  localStorage.setItem(KEY, JSON.stringify(runs));
}

export function clearEvalRuns() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(KEY);
}