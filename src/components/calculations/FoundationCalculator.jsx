// Motor de cálculo de bases aisladas según normativas argentinas
// v3.0 (Fase 7): Normativas basadas en clases extensibles

// ─── CLASE BASE ────────────────────────────────────────────────────────────────
class Normativa {
  constructor(cfg) { this._c = cfg; }
  get name()            { return this._c.name; }
  get country()         { return this._c.country; }
  get phi_flexion()     { return this._c.phi_flexion; }
  get phi_shear()       { return this._c.phi_shear; }
  get phi_punching()    { return this._c.phi_punching; }
  get gamma_c()         { return this._c.gamma_c; }
  get gamma_s()         { return this._c.gamma_s; }
  get min_cover()       { return this._c.min_cover; }
  get min_steel_ratio() { return this._c.min_steel_ratio; }
  get ld_factor()       { return this._c.ld_factor; }
  minSteel(b, d)        { return this.min_steel_ratio * b * d; }
  verifyPunching(N, fc, bo, d) {
    const Vc = (this.phi_punching * 1.1 * Math.sqrt(fc) * bo * d) / 1000;
    return { Vc, ok: N <= Vc, ratio: (N / Vc) * 100 };
  }
  shearCapacity(fc, bw, d) {
    return (this.phi_shear * 0.53 * Math.sqrt(fc) * bw * d) / 1000;
  }
  toJSON() { return { name: this.name, country: this.country, phi_flexion: this.phi_flexion, phi_shear: this.phi_shear, phi_punching: this.phi_punching, gamma_c: this.gamma_c, gamma_s: this.gamma_s, min_cover: this.min_cover, min_steel_ratio: this.min_steel_ratio, ld_factor: this.ld_factor }; }
}

// ─── CIRSOC 2005 ──────────────────────────────────────────────────────────────
class CIRSOC2005 extends Normativa {
  constructor() { super({ name: "CIRSOC 201-2005", country: "Argentina", phi_flexion: 0.90, phi_shear: 0.75, phi_punching: 0.75, gamma_c: 1.50, gamma_s: 1.15, min_cover: 7.5, min_steel_ratio: 0.0018, ld_factor: 6.3 }); }
}

// ─── CIRSOC 1982 ──────────────────────────────────────────────────────────────
class CIRSOC1982 extends Normativa {
  constructor() { super({ name: "CIRSOC 201-1982", country: "Argentina (antigua)", phi_flexion: 0.90, phi_shear: 0.85, phi_punching: 0.85, gamma_c: 1.40, gamma_s: 1.15, min_cover: 5.0, min_steel_ratio: 0.0020, ld_factor: 5.8 }); }
  verifyPunching(N, fc, bo, d) {
    const Vc = (this.phi_punching * 1.0 * Math.sqrt(fc) * bo * d) / 1000;
    return { Vc, ok: N <= Vc, ratio: (N / Vc) * 100 };
  }
}

// ─── ACI 318-19 ───────────────────────────────────────────────────────────────
class ACI318 extends Normativa {
  constructor() { super({ name: "ACI 318-19", country: "USA", phi_flexion: 0.90, phi_shear: 0.75, phi_punching: 0.75, gamma_c: 1.00, gamma_s: 1.00, min_cover: 7.5, min_steel_ratio: 0.0018, ld_factor: 6.3 }); }
  verifyPunching(N, fc, bo, d) {
    const phi = this.phi_punching, sqfc = Math.sqrt(fc);
    const Vc1 = phi * 6 * sqfc * bo * d / 1000;
    const Vc2 = phi * (40 * d / bo + 2) * sqfc * bo * d / 1000;
    const Vc3 = phi * 4 * sqfc * bo * d / 1000;
    const Vc  = Math.min(Vc1, Vc2, Vc3);
    return { Vc, ok: N <= Vc, ratio: (N / Vc) * 100 };
  }
}

// ─── EUROCODE 2 ───────────────────────────────────────────────────────────────
class Eurocode2 extends Normativa {
  constructor() { super({ name: "Eurocode 2", country: "Europa", phi_flexion: 1.00, phi_shear: 1.00, phi_punching: 1.00, gamma_c: 1.50, gamma_s: 1.15, min_cover: 5.0, min_steel_ratio: 0.0013, ld_factor: 5.5 }); }
  _vRdc(fc, d) {
    const d_mm = d * 10, k = Math.min(1 + Math.sqrt(200 / d_mm), 2.0), fck = fc / 10.2, rho = 0.005;
    return Math.max(0.12 * k * Math.pow(100 * rho * fck, 1/3), 0.035 * Math.pow(k, 1.5) * Math.pow(fck, 0.5));
  }
  verifyPunching(N, fc, bo, d) {
    const Vc = this._vRdc(fc, d) * (bo * 10) * (d * 10) / 1e6 * 101970;
    return { Vc, ok: N <= Vc, ratio: (N / Vc) * 100 };
  }
  shearCapacity(fc, bw, d) {
    return this._vRdc(fc, d) * (bw * 10) * (d * 10) / 1e6 * 101970;
  }
}

// ─── REGISTRO ─────────────────────────────────────────────────────────────────
export const NORMATIVES = {
  CIRSOC_2005: new CIRSOC2005(),
  CIRSOC_1982: new CIRSOC1982(),
  ACI_318:     new ACI318(),
  EUROCODE_2:  new Eurocode2(),
};

const _NORM = NORMATIVES;

export const STEEL_DIAMETERS = [6, 8, 10, 12, 16, 20, 25, 32];

export function calculateFoundation(data, normative = "CIRSOC_2005") {
  // Acepta key string o instancia directa de Normativa (Fase 7)
  const norm = (typeof normative === 'string') ? _NORM[normative] : normative;
  const {
    type,        // centered, edge, corner
    mode,        // design, verification
    N,           // Carga columna (kg)
    P,           // Carga total (kg)
    cx,          // Dimensión columna X (cm)
    cy,          // Dimensión columna Y (cm)
    A,           // Ancho base (cm)
    B,           // Largo base (cm)
    H,           // Altura base (cm)
    cover,       // Recubrimiento (cm)
    sigma_adm,   // Tensión admisible terreno (kg/cm²)
    fc,          // f'c hormigón (kg/cm²)
    fy,          // fy acero (kg/cm²)
    Mx_col = 0,  // Momento en base columna sobre eje X (kg·cm) - por viento/sismo en Y
    My_col = 0   // Momento en base columna sobre eje Y (kg·cm) - por viento/sismo en X
  } = data;

  const results = {
    input: { ...data, normative },
    dimensions: {},
    stresses: {},
    reinforcement: {},
    checks: {},
    status: "calculated"
  };

  // Altura útil
  const d = H - cover - 1; // -1 cm por radio de barra estimado

  // =============== CÁLCULO DE DIMENSIONES (modo diseño) ===============
  if (mode === "design") {
    if (A && B) {
      results.dimensions.A = A;
      results.dimensions.B = B;
      results.dimensions.user_provided = true;
    } else {
      let area_req = P / sigma_adm;
      if (type === "centered") {
        const side = Math.sqrt(area_req);
        results.dimensions.A = Math.ceil(side / 5) * 5;
        results.dimensions.B = results.dimensions.A;
      } else if (type === "edge") {
        results.dimensions.A = Math.ceil(Math.sqrt(area_req * 0.6) / 5) * 5;
        results.dimensions.B = Math.ceil(area_req / results.dimensions.A / 5) * 5;
      } else if (type === "corner") {
        results.dimensions.A = Math.ceil(Math.sqrt(area_req * 0.8) / 5) * 5;
        results.dimensions.B = Math.ceil(area_req / results.dimensions.A / 5) * 5;
      }
      results.dimensions.auto_calculated = true;
    }
  } else {
    results.dimensions.A = A;
    results.dimensions.B = B;
  }

  const Af = results.dimensions.A;
  const Bf = results.dimensions.B;
  const area = Af * Bf;

  // =============== TENSIONES CON EXCENTRICIDAD ===============
  // Mejora 1.3: Distribución no uniforme de presiones con momentos en columna
  // Fórmula general: σ(x,y) = P/(A·B) ± My_col·x/Iy ± Mx_col·y/Ix
  // donde Iy = Bf·Af³/12, Ix = Af·Bf³/12

  const sigma_avg = P / area;
  const has_eccentricity = Math.abs(Mx_col) > 0 || Math.abs(My_col) > 0;

  // Módulos resistentes (sección transversal de la planta de la zapata)
  // My_col → variación en X → W_x_resiste_My = Bf·Af²/6
  // Mx_col → variación en Y → W_y_resiste_Mx = Af·Bf²/6
  const Wx_for_My = (Bf * Af * Af) / 6;
  const Wy_for_Mx = (Af * Bf * Bf) / 6;

  const delta_x = Math.abs(My_col) / Wx_for_My; // variación de σ en X por My_col
  const delta_y = Math.abs(Mx_col) / Wy_for_Mx; // variación de σ en Y por Mx_col

  const sigma_max = sigma_avg + delta_x + delta_y;
  const sigma_min = sigma_avg - delta_x - delta_y;

  // Excentricidades
  const ex = P > 0 ? Math.abs(My_col) / P : 0; // excentricidad en X (cm)
  const ey = P > 0 ? Math.abs(Mx_col) / P : 0; // excentricidad en Y (cm)

  // Condición de núcleo central (no tracción)
  const kern_limit_val = ex / Af + ey / Bf;    // ≤ 1/6 para no tracción
  const kern_ok = sigma_min >= 0;

  results.stresses.sigma_avg = sigma_avg;
  results.stresses.sigma = sigma_max;
  results.stresses.sigma_min = sigma_min;
  results.stresses.sigma_adm = sigma_adm;
  results.stresses.utilization = (sigma_max / sigma_adm) * 100;
  results.stresses.ex = ex;
  results.stresses.ey = ey;
  results.stresses.kern_ok = kern_ok;
  results.stresses.kern_limit = kern_limit_val;
  results.stresses.has_eccentricity = has_eccentricity;
  results.stresses.delta_x = delta_x;
  results.stresses.delta_y = delta_y;

  results.checks.soil_ok = sigma_max <= sigma_adm;

  // =============== CÁLCULO DE MOMENTOS FLECTORES (distribución trapecial) ===============
  // Mejora 1.3: Con excentricidad, la presión varía linealmente en el voladizo
  // → se integra la distribución trapecial en lugar de usar presión uniforme

  const vx = (Af - cx) / 2; // Volado en X
  const vy = (Bf - cy) / 2; // Volado en Y
  results.stresses.vx = vx;
  results.stresses.vy = vy;

  let Mx, My;

  if (has_eccentricity) {
    // Voladizo X (vx), afectado por My_col (delta_x):
    // σ varía linealmente desde sigma_avg (en centro) hasta sigma_avg±delta_x (en borde)
    // En cara de columna (x = cx/2): σ_cf = sigma_avg + delta_x·(cx/Af)
    // En borde (x = Af/2): σ_edge = sigma_avg + delta_x
    const sigma_cf_x = sigma_avg + delta_x * (cx / Af);
    const sigma_edge_x = sigma_avg + delta_x;
    results.stresses.sigma_col_x = sigma_cf_x;
    results.stresses.sigma_edge_x = sigma_edge_x;

    // Momento trapecial por unidad de ancho en Y:
    // M = σ_cf·vx²/2 + (σ_edge - σ_cf)·vx²/3 = vx²·(σ_cf + 2·σ_edge)/6
    Mx = Math.max(0, (vx * vx * (sigma_cf_x + 2 * sigma_edge_x)) / 6);

    // Voladizo Y (vy), afectado por Mx_col (delta_y):
    const sigma_cf_y = sigma_avg + delta_y * (cy / Bf);
    const sigma_edge_y = sigma_avg + delta_y;
    results.stresses.sigma_col_y = sigma_cf_y;
    results.stresses.sigma_edge_y = sigma_edge_y;

    My = Math.max(0, (vy * vy * (sigma_cf_y + 2 * sigma_edge_y)) / 6);
  } else {
    // Caso concéntrico: distribución uniforme (fórmula original)
    Mx = (sigma_avg * vx * vx) / 2;
    My = (sigma_avg * vy * vy) / 2;
  }

  results.stresses.Mx = Mx;
  results.stresses.My = My;

  // =============== CÁLCULO DE ARMADURA ===============
  const fc_design = fc / norm.gamma_c;
  const fy_design = fy / norm.gamma_s;

  // Fase 6: Cálculo preciso con compatibilidad de deformaciones
  // Armadura en X resiste My (voladizo en Y)
  const Asx_data = calculateSteelAreaPrecise(My * Bf, fc_design, fy_design, Bf, d, norm.phi_flexion);
  // Armadura en Y resiste Mx (voladizo en X)
  const Asy_data = calculateSteelAreaPrecise(Mx * Af, fc_design, fy_design, Af, d, norm.phi_flexion);

  // Fase 7: cuantía mínima delegada al método de la clase normativa
  const As_min_x = norm.minSteel(Bf, d);
  const As_min_y = norm.minSteel(Af, d);

  results.reinforcement.As_x = Math.max(Asx_data.As, As_min_x);
  results.reinforcement.As_y = Math.max(Asy_data.As, As_min_y);
  results.reinforcement.As_min_x = As_min_x;
  results.reinforcement.As_min_y = As_min_y;
  results.reinforcement.bars_x = proposeBars(results.reinforcement.As_x, Bf);
  results.reinforcement.bars_y = proposeBars(results.reinforcement.As_y, Af);

  // Datos de compatibilidad de deformaciones (para display avanzado)
  results.reinforcement.section_x = {
    state: Asx_data.state,
    et: Asx_data.et,
    beta1: Asx_data.beta1,
    a: Asx_data.a,
    c: Asx_data.c,
    As_bal: Asx_data.As_bal,
    is_over_reinforced: Asx_data.is_over_reinforced,
  };
  results.reinforcement.section_y = {
    state: Asy_data.state,
    et: Asy_data.et,
    beta1: Asy_data.beta1,
    a: Asy_data.a,
    c: Asy_data.c,
    As_bal: Asy_data.As_bal,
    is_over_reinforced: Asy_data.is_over_reinforced,
  };

  // =============== VERIFICACIÓN LONGITUD DE ANCLAJE (Mejora 1.5) ===============
  // Fórmula CIRSOC/ACI: ld = fy·db / (k·√f'c)  [cm, kg/cm²]
  // Condiciones básicas: barras inferiores, sin recubrimiento especial
  const bars_x = results.reinforcement.bars_x;
  const bars_y = results.reinforcement.bars_y;

  if (bars_x && bars_y) {
    const db_x = bars_x.diameter / 10;  // mm → cm
    const db_y = bars_y.diameter / 10;

    const ld_x = (fy * db_x) / (norm.ld_factor * Math.sqrt(fc));
    const ld_y = (fy * db_y) / (norm.ld_factor * Math.sqrt(fc));

    // Longitud disponible = volado - recubrimiento
    const l_avail_x = vx - cover;
    const l_avail_y = vy - cover;

    // Con gancho estándar 90°: 0.7 × ld (con cubierta adecuada)
    const ld_hook_x = 0.7 * ld_x;
    const ld_hook_y = 0.7 * ld_y;

    const straight_ok_x = ld_x <= l_avail_x;
    const straight_ok_y = ld_y <= l_avail_y;
    const hook_ok_x = ld_hook_x <= l_avail_x;
    const hook_ok_y = ld_hook_y <= l_avail_y;

    results.development_length = {
      ld_x, ld_y,
      ld_hook_x, ld_hook_y,
      l_avail_x, l_avail_y,
      db_x, db_y,
      straight_ok_x, straight_ok_y,
      hook_ok_x, hook_ok_y,
      anchor_ok_x: straight_ok_x || hook_ok_x,
      anchor_ok_y: straight_ok_y || hook_ok_y,
      // Détail del anclaje requerido:
      detail_x: straight_ok_x ? 'straight' : hook_ok_x ? 'hook' : 'insufficient',
      detail_y: straight_ok_y ? 'straight' : hook_ok_y ? 'hook' : 'insufficient',
    };

    results.checks.development_x = results.development_length.anchor_ok_x;
    results.checks.development_y = results.development_length.anchor_ok_y;
  }

  // =============== VERIFICACIÓN AL PUNZONADO (Fase 7: método de instancia) ===============
  const bo = 2 * (cx + d) + 2 * (cy + d);
  const punching = norm.verifyPunching(N, fc, bo, d);
  results.checks.punching = { bo, Vu: N, ...punching };

  // =============== VERIFICACIÓN AL CORTE (Fase 7: método de instancia) ===============
  // Se usa sigma_max (conservador) para la sección crítica a distancia d
  const Vu_x = sigma_max * (vx - d) * Bf;
  const Vu_y = sigma_max * (vy - d) * Af;
  const Vc_x = norm.shearCapacity(fc, Bf, d);
  const Vc_y = norm.shearCapacity(fc, Af, d);

  results.checks.shear_x = { Vu: Vu_x, Vc: Vc_x, ok: Vu_x <= Vc_x };
  results.checks.shear_y = { Vu: Vu_y, Vc: Vc_y, ok: Vu_y <= Vc_y };

  // Estado final
  results.checks.all_ok =
    results.checks.soil_ok &&
    results.checks.punching.ok &&
    results.checks.shear_x.ok &&
    results.checks.shear_y.ok;

  results.status = results.checks.all_ok ? "verified" : "failed";

  // =============== SUGERENCIAS SI NO VERIFICA ===============
  if (!results.checks.all_ok) {
    results.suggestions = [];
    if (!results.checks.soil_ok) {
      const required_area = P / sigma_adm;
      const suggested_side = Math.ceil(Math.sqrt(required_area) / 5) * 5;
      results.suggestions.push({
        type: 'dimension',
        message: `Incrementar dimensiones de la base. Sugerido: ${suggested_side} × ${suggested_side} cm`,
        suggested_A: suggested_side,
        suggested_B: suggested_side
      });
    }
    if (!results.checks.punching.ok) {
      const ratio = results.checks.punching.Vu / results.checks.punching.Vc;
      const suggested_H = Math.ceil((H * Math.sqrt(ratio)) / 5) * 5;
      results.suggestions.push({
        type: 'height',
        message: `Incrementar altura para resistir punzonado. Sugerido: H = ${suggested_H} cm`,
        suggested_H
      });
    }
    if (!results.checks.shear_x.ok || !results.checks.shear_y.ok) {
      const ratioX = results.checks.shear_x.Vu / results.checks.shear_x.Vc;
      const ratioY = results.checks.shear_y.Vu / results.checks.shear_y.Vc;
      const maxRatio = Math.max(ratioX, ratioY);
      const suggested_H = Math.ceil((H * Math.sqrt(maxRatio)) / 5) * 5;
      results.suggestions.push({
        type: 'height',
        message: `Incrementar altura para resistir corte. Sugerido: H = ${suggested_H} cm`,
        suggested_H
      });
    }
  }

  return results;
}

// =============== AJUSTE AUTOMÁTICO ITERATIVO ===============
export function autoAdjustFoundation(data, normative = "CIRSOC_2005", maxIterations = 20) {
  let currentData = { ...data };
  let iteration = 0;
  let lastResults = null;

  while (iteration < maxIterations) {
    const results = calculateFoundation(currentData, normative);
    lastResults = results;

    if (results.checks.all_ok) {
      return { success: true, results, iterations: iteration, finalData: currentData };
    }

    let adjusted = false;

    if (!results.checks.soil_ok && results.suggestions) {
      const dimSuggestion = results.suggestions.find(s => s.type === 'dimension');
      if (dimSuggestion) {
        currentData.A = dimSuggestion.suggested_A;
        currentData.B = dimSuggestion.suggested_B;
        adjusted = true;
      }
    }

    if (!results.checks.punching.ok || !results.checks.shear_x.ok || !results.checks.shear_y.ok) {
      const heightSuggestion = results.suggestions?.find(s => s.type === 'height');
      if (heightSuggestion) {
        currentData.H = heightSuggestion.suggested_H;
        adjusted = true;
      }
    }

    if (!adjusted) {
      currentData.A = Math.ceil(currentData.A * 1.1 / 5) * 5;
      currentData.B = Math.ceil(currentData.B * 1.1 / 5) * 5;
      currentData.H = Math.ceil(currentData.H * 1.05 / 5) * 5;
    }

    iteration++;
  }

  return {
    success: false,
    results: lastResults,
    iterations: maxIterations,
    finalData: currentData,
    message: 'No se pudo verificar en el número máximo de iteraciones'
  };
}

// =============== FUNCIONES AUXILIARES ===============

/**
 * Cálculo preciso de armadura por flexión usando iteración de compatibilidad de deformaciones.
 * Fase 6: método iterativo con β₁ variable, verificación de εt y cuantía balanceada.
 * @returns {object} { As, a, c, et, fs, state, beta1, As_bal, As_max, is_over_reinforced }
 */
export function calculateSteelAreaPrecise(Mu, fc, fy, b, d, phi) {
  if (Mu <= 0 || b <= 0 || d <= 0) {
    return { As: 0, a: 0, c: 0, et: 999, fs: fy, state: 'zero', beta1: 0.85, As_bal: 0, As_max: 0, is_over_reinforced: false };
  }

  const Es  = 2_000_000; // kg/cm² — módulo de elasticidad del acero
  const ecu = 0.003;     // deformación última del hormigón (ACI/CIRSOC)
  const ey  = fy / Es;   // deformación de fluencia del acero

  // Factor β₁ (ACI 318-19 §22.2.2.4 / CIRSOC)
  let beta1;
  if      (fc <= 280) beta1 = 0.85;
  else if (fc >= 560) beta1 = 0.65;
  else                beta1 = 0.85 - 0.05 * (fc - 280) / 70;

  // ── Iteración por sustitución directa ──────────────────────────
  // Arrancamos asumiendo sección controlada por tracción (fs = fy).
  let a = d / 10; // estimación inicial del bloque equivalente
  let As = 0;
  let fs = fy;

  for (let iter = 0; iter < 60; iter++) {
    const a_prev = a;

    // Requerimiento de acero dado 'a'
    const lever = d - a / 2;
    As = lever > 0 ? Mu / (phi * fs * lever) : b * d * 0.04;

    // Actualizar profundidad de bloque
    a = (As * fs) / (0.85 * fc * b);
    const c = a / beta1;

    // Deformación real en el acero
    const et = c > 0 ? ecu * (d - c) / c : 999;

    // Tensión real en el acero (puede no haber fluido)
    fs = Math.min(Math.max(et * Es, 0), fy);

    if (Math.abs(a - a_prev) / Math.max(a_prev, 0.001) < 1e-5) break;
  }

  const c_final = a / beta1;
  const et_final = c_final > 0 ? ecu * (d - c_final) / c_final : 999;

  // ── Verificación de cuantía balanceada ─────────────────────────
  // cb: profundidad del eje neutro en condición balanceada
  const cb = (ecu / (ecu + ey)) * d;
  const ab = beta1 * cb;
  const As_bal = (0.85 * fc * ab * b) / fy;
  const As_max = 0.75 * As_bal; // Límite ACI/CIRSOC para ductilidad

  // Si la sección es sobre-reforzada → avisar (no se trunca: se reporta)
  const is_over_reinforced = As > As_max;

  // ── Estado de la sección ───────────────────────────────────────
  let state;
  if      (et_final >= 0.005) state = 'tension-controlled';   // φ = 0.9 correcto
  else if (et_final >= 0.004) state = 'transition';            // reducir φ
  else                         state = 'compression-controlled'; // redesign

  return {
    As: Math.max(0, As),
    a,
    c: c_final,
    et: et_final,
    fs,
    state,
    beta1,
    As_bal,
    As_max,
    is_over_reinforced,
  };
}

// Wrapper simple que devuelve sólo el valor de As (compatibilidad interna)
function calculateSteelArea(Mu, fc, fy, b, d, phi) {
  return calculateSteelAreaPrecise(Mu, fc, fy, b, d, phi).As;
}

function proposeBars(As, width) {
  // Propone combinación de barras para cubrir As
  for (const dia of STEEL_DIAMETERS) {
    const areaBar = Math.PI * (dia / 10) * (dia / 10) / 4; // cm²
    const n = Math.ceil(As / areaBar);
    const spacing = Math.floor(width / (n + 1));
    if (spacing >= 10 && spacing <= 30) {
      return {
        diameter: dia,
        count: n,
        spacing,
        area_provided: n * areaBar,
        description: `${n}Ø${dia} c/${spacing}cm`
      };
    }
  }
  // Fallback: usar Ø16
  const dia = 16;
  const areaBar = Math.PI * (dia / 10) * (dia / 10) / 4;
  const n = Math.ceil(As / areaBar);
  return {
    diameter: dia,
    count: n,
    spacing: Math.floor(width / (n + 1)),
    area_provided: n * areaBar,
    description: `${n}Ø${dia}`
  };
}

export function formatNumber(num, decimals = 2) {
  if (num === undefined || num === null || isNaN(num)) return "-";
  return num.toLocaleString("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}