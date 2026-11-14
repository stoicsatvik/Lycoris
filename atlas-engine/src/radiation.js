// Radiation: standard pressure model, Experimental Claire, fitting and validation (framework sections 4 and 7).

// X = P / (10 g)   → g/cm², P in Pa, g in m/s².
export const columnMass = (pressurePa, g) => pressurePa / (10 * g);

// Standard GCR: Ḋ = Ḋref(t) · exp[−μ (X − Xref)]. Subtracting Xref stops shielding being counted twice.
export const gcrRate = ({ doseRef, X, Xref, mu }) => doseRef * Math.exp(-mu * (X - Xref));

// Experimental Claire: ln(Ḋ/Ḋref) = −μC (X − Xref) + βT (T − Tref) + βᵀz. All terms must come from one joint fit.
export const claireRate = ({ doseRef, X, Xref, muC, betaT, T, Tref, beta = [], z = [] }) =>
  doseRef * Math.exp(-muC * (X - Xref) + betaT * (T - Tref) + beta.reduce((s, b, i) => s + b * z[i], 0));

// Ḣ = Q_GCR · Ḋ_GCR + Q_SEP · Ḋ_SEP. A missing solar-event term is reported as not modelled, never as zero.
export function equivalentRate({ dGCR, qGCR, dSEP = null, qSEP = null }) {
  const sepKnown = dSEP != null && qSEP != null;
  return { h: qGCR * dGCR + (sepKnown ? qSEP * dSEP : 0), sep: sepKnown ? "modelled" : "solar-event contribution not modelled" };
}

// ---- Fitting: within-sol least squares, so the Sun's slow changes cancel. obs: [{sol, dose, X, T, z?: []}]
function centredBySol(obs, cols) {
  const bySol = new Map();
  for (const o of obs) (bySol.get(o.sol) ?? bySol.set(o.sol, []).get(o.sol)).push(o);
  const rows = [];
  for (const g of bySol.values()) {
    if (g.length < 3) continue;
    const m = (f) => g.reduce((s, o) => s + f(o), 0) / g.length;
    const my = m((o) => Math.log(o.dose)), mx = cols.map((f) => m(f));
    for (const o of g) rows.push({ y: Math.log(o.dose) - my, x: cols.map((f, j) => f(o) - mx[j]) });
  }
  return rows;
}
function solve(A, b) { // Gaussian elimination with partial pivoting
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    const p = M.reduce((best, r, i) => (i >= c && Math.abs(r[c]) > Math.abs(M[best][c]) ? i : best), c);
    [M[c], M[p]] = [M[p], M[c]];
    if (Math.abs(M[c][c]) < 1e-15) throw new Error("fit is singular: predictors are collinear or constant");
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}
function inverse(A) { return A.map((_, i) => solve(A, A.map((__, j) => (i === j ? 1 : 0)))); }

// Fits ln(dose) anomaly = Σ coef·predictor anomaly. Returns coefficients, standard errors and sample size.
export function fitWithinSol(obs, { useT = true, zCount = 0 } = {}) {
  const cols = [(o) => o.X, ...(useT ? [(o) => o.T] : []), ...Array.from({ length: zCount }, (_, j) => (o) => o.z[j])];
  const rows = centredBySol(obs, cols), k = cols.length, n = rows.length;
  if (n <= k + 1) throw new Error(`not enough observations to fit (${n})`);
  const XtX = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => rows.reduce((s, r) => s + r.x[i] * r.x[j], 0)));
  const Xty = Array.from({ length: k }, (_, i) => rows.reduce((s, r) => s + r.x[i] * r.y, 0));
  const coef = solve(XtX, Xty);
  const rss = rows.reduce((s, r) => s + (r.y - r.x.reduce((a, x, i) => a + x * coef[i], 0)) ** 2, 0);
  const inv = inverse(XtX), s2 = rss / (n - k);
  const se = coef.map((_, i) => Math.sqrt(s2 * inv[i][i]));
  return { mu: -coef[0], muSE: se[0], betaT: useT ? coef[1] : 0, betaTSE: useT ? se[1] : 0, beta: coef.slice(useT ? 2 : 1), n };
}

// Held-out check: fit on training sols, predict each held-out reading relative to its own sol mean, compare MAE.
// ΔMAE = MAE_standard − MAE_Claire (positive: Claire predicts better on these sols).
export function crossValidate(obs, { folds = 5 } = {}) {
  const sols = [...new Set(obs.map((o) => o.sol))].sort((a, b) => a - b);
  let errS = 0, errC = 0, n = 0;
  for (let f = 0; f < folds; f++) {
    const test = new Set(sols.filter((_, i) => i % folds === f));
    const train = obs.filter((o) => !test.has(o.sol)), held = obs.filter((o) => test.has(o.sol));
    const s = fitWithinSol(train, { useT: false }), c = fitWithinSol(train, { useT: true });
    const rows = centredBySol(held, [(o) => o.X, (o) => o.T]);
    for (const r of rows) {
      errS += Math.abs(Math.exp(r.y) - Math.exp(-s.mu * r.x[0]));
      errC += Math.abs(Math.exp(r.y) - Math.exp(-c.mu * r.x[0] + c.betaT * r.x[1]));
      n++;
    }
  }
  return { maeStandard: errS / n, maeClaire: errC / n, deltaMAE: (errS - errC) / n, n, folds, unit: "fraction of the sol-mean dose" };
}
