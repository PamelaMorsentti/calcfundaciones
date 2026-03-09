// ============================================================
// Motor de Optimización Avanzado para Zapatas Aisladas
// Método: Grid Search en dos pasadas (coarse + fine)
// Objetivo: minimizar costo (hormigón + acero)
// ============================================================
import { calculateFoundation } from './FoundationCalculator';

// Precios por defecto (USD)
export const DEFAULT_COST_PARAMS = {
  concrete_usd_m3: 180,  // USD/m³
  steel_usd_kg: 1.50,    // USD/kg
  steel_density: 7850,   // kg/m³
};

function computeCost(A, B, H, results, costParams) {
  const { concrete_usd_m3, steel_usd_kg, steel_density } = costParams;

  // Volumen de hormigón (m³)
  const V_concrete = (A * B * H) / 1e6;

  // Peso del acero (kg) — estimado desde áreas de acero
  const r = results?.reinforcement;
  if (!r) return Infinity;
  // As_x (cm²/m) * B[m] + As_y (cm²/m) * A[m] → cm² total → m² → m³ → kg
  const As_x_total = (r.As_x / 10000) * (B / 100); // m² sección acero en X
  const As_y_total = (r.As_y / 10000) * (A / 100); // m²
  const W_steel = (As_x_total + As_y_total) * steel_density * 1.1; // +10% empalmes

  return V_concrete * concrete_usd_m3 + W_steel * steel_usd_kg;
}

export function optimizeFoundation(baseParams, normative, costParams = DEFAULT_COST_PARAMS, onProgress = null) {
  const {
    N, P, cx, cy, Mx_col = 0, My_col = 0,
    cover, sigma_adm, fc, fy, type = 'centered'
  } = baseParams;

  let bestResult = null;
  let bestCost = Infinity;
  let iterations = 0;

  // PASADA 1: Búsqueda gruesa
  const A_range = { min: 100, max: 600, step: 20 };
  const B_range = { min: 100, max: 600, step: 20 };
  const H_range = { min: 30,  max: 150, step: 10 };

  const totalIter1 =
    ((A_range.max - A_range.min) / A_range.step + 1) *
    ((B_range.max - B_range.min) / B_range.step + 1) *
    ((H_range.max - H_range.min) / H_range.step + 1);

  for (let A = A_range.min; A <= A_range.max; A += A_range.step) {
    for (let B = B_range.min; B <= B_range.max; B += B_range.step) {
      for (let H = H_range.min; H <= H_range.max; H += H_range.step) {
        iterations++;
        const res = calculateFoundation({ type, mode: 'verification', N, P, cx, cy, A, B, H, cover, sigma_adm, fc, fy, Mx_col, My_col }, normative);
        if (res?.checks?.all_ok) {
          const cost = computeCost(A, B, H, res, costParams);
          if (cost < bestCost) {
            bestCost = cost;
            bestResult = { A, B, H, cost, results: res };
          }
        }
      }
    }
  }

  // PASADA 2: Refinamiento alrededor del mejor
  if (bestResult) {
    const { A: A0, B: B0, H: H0 } = bestResult;
    const step2 = 5;
    const range2 = 30;

    for (let A = Math.max(100, A0 - range2); A <= Math.min(600, A0 + range2); A += step2) {
      for (let B = Math.max(100, B0 - range2); B <= Math.min(600, B0 + range2); B += step2) {
        for (let H = Math.max(25, H0 - 20); H <= Math.min(200, H0 + 20); H += step2) {
          iterations++;
          const res = calculateFoundation({ type, mode: 'verification', N, P, cx, cy, A, B, H, cover, sigma_adm, fc, fy, Mx_col, My_col }, normative);
          if (res?.checks?.all_ok) {
            const cost = computeCost(A, B, H, res, costParams);
            if (cost < bestCost) {
              bestCost = cost;
              bestResult = { A, B, H, cost, results: res };
            }
          }
        }
      }
    }
  }

  if (!bestResult) {
    return { success: false, message: 'No se encontró solución factible en el rango de búsqueda', iterations };
  }

  // Breakdown de costos
  const { A, B, H, results: res } = bestResult;
  const V_concrete = (A * B * H) / 1e6;
  const r = res.reinforcement;
  const As_x_total = (r.As_x / 10000) * (B / 100);
  const As_y_total = (r.As_y / 10000) * (A / 100);
  const W_steel = (As_x_total + As_y_total) * costParams.steel_density * 1.1;

  return {
    success: true,
    optimal: {
      A, B, H,
      cost: bestCost,
      cost_breakdown: {
        concrete_m3: V_concrete,
        concrete_cost: V_concrete * costParams.concrete_usd_m3,
        steel_kg: W_steel,
        steel_cost: W_steel * costParams.steel_usd_kg,
      },
    },
    results: res,
    iterations,
    normative,
  };
}