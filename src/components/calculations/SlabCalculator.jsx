// ============================================================
// Calculadora de Losas de Cimentación (Mat/Raft Foundation)
// Método: Czerny / Tiras de Marcus + ACI 318 / CIRSOC 2005
// ============================================================

// Coeficientes de Czerny para losa simplemente apoyada en 4 lados
// r = lmax/lmin ≥ 1.0
// Mx = ax * q * lmin²  [momento por unidad de ancho en dirección lmin]
// My = ay * q * lmin²  [momento por unidad de ancho en dirección lmax]
const CZERNY = [
  { r: 1.00, ax: 0.0368, ay: 0.0368 },
  { r: 1.10, ax: 0.0399, ay: 0.0330 },
  { r: 1.20, ax: 0.0426, ay: 0.0293 },
  { r: 1.30, ax: 0.0450, ay: 0.0263 },
  { r: 1.40, ax: 0.0469, ay: 0.0236 },
  { r: 1.50, ax: 0.0485, ay: 0.0213 },
  { r: 1.75, ax: 0.0512, ay: 0.0168 },
  { r: 2.00, ax: 0.0530, ay: 0.0132 },
  { r: 3.00, ax: 0.0537, ay: 0.0059 },
];

function interpolateCzerny(r) {
  const capped = Math.min(Math.max(r, 1.0), 3.0);
  for (let i = 0; i < CZERNY.length - 1; i++) {
    const lo = CZERNY[i], hi = CZERNY[i + 1];
    if (capped >= lo.r && capped <= hi.r) {
      const t = (capped - lo.r) / (hi.r - lo.r);
      return {
        ax: lo.ax + t * (hi.ax - lo.ax),
        ay: lo.ay + t * (hi.ay - lo.ay),
      };
    }
  }
  return CZERNY[CZERNY.length - 1];
}

// Selección de barras [diámetro mm, área cm²]
const REBAR_SIZES = [8, 10, 12, 14, 16, 20, 22, 25];
const REBAR_AREA = { 8: 0.503, 10: 0.785, 12: 1.131, 14: 1.539, 16: 2.011, 20: 3.142, 22: 3.801, 25: 4.909 };

function selectBarsPerMeter(As_m) {
  // As_m: cm²/m needed
  for (const d of REBAR_SIZES) {
    for (const esp of [7, 8, 10, 12, 15, 20, 25]) {
      const n = Math.floor(100 / esp);
      const area = n * REBAR_AREA[d];
      if (area >= As_m) {
        return {
          diameter: d,
          spacing: esp,
          count_per_m: n,
          area_provided: area,
          description: `Ø${d}c/${esp}cm (${area.toFixed(2)} cm²/m)`,
        };
      }
    }
  }
  // If nothing fits, use Ø25@7cm
  const n = Math.floor(100 / 7);
  return { diameter: 25, spacing: 7, count_per_m: n, area_provided: n * 4.909, description: `Ø25c/7cm` };
}

// Espesor mínimo por punzonado (estimación)
function hMinPunching(N_col, col_cx, col_cy, fc) {
  const fc_MPa = fc / 10.197;
  // Vc = 0.33*sqrt(f'c)*b0*d [N] = 0.33*sqrt(fc_MPa)*b0_mm*d_mm
  // Aproximamos b0 ≈ 4*(col+d) y Vu = 1.4*N_col
  // d ≈ ∛(1.4*N_col / (0.33*sqrt(fc_MPa) * 4))  → simplificado
  let d = 20; // cm initial guess
  for (let i = 0; i < 30; i++) {
    const b0 = 4 * (col_cx + col_cy + 2 * d); // cm
    const Vc = 0.33 * Math.sqrt(fc_MPa) * (b0 * 10) * (d * 10) / 1000; // kg
    const Vu = 1.4 * N_col;
    if (Vu <= Vc) break;
    d += 2;
  }
  return d + 8; // d + estimated cover
}

export function calculateSlab(params) {
  const {
    Lx, Ly, h,
    total_load: P,
    n_cols_x = 2, n_cols_y = 2,
    col_cx = 30, col_cy = 30,
    cover = 7.5,
    soil_capacity: sigma_adm,
    concrete_fc: fc,
    steel_fy: fy,
  } = params;

  const fc_MPa = fc / 10.197;

  // 1. Presión de suelo
  const area_cm2 = Lx * Ly;
  const q = P / area_cm2; // kg/cm²
  const soil_ok = q <= sigma_adm;
  const soil_util = (q / sigma_adm) * 100;

  // 2. Vanos promedio
  const n_spans_x = Math.max(n_cols_x - 1, 1);
  const n_spans_y = Math.max(n_cols_y - 1, 1);
  const span_x = Lx / n_spans_x; // cm
  const span_y = Ly / n_spans_y; // cm

  // 3. Czerny: lmin/lmax por vano
  const lmin = Math.min(span_x, span_y);
  const lmax = Math.max(span_x, span_y);
  const r = Math.min(lmax / lmin, 3.0);
  const { ax, ay } = interpolateCzerny(r);

  // 4. Momentos por unidad de ancho
  // Mx: en dirección perpendicular a lmin (bending across short span)
  // My: en dirección perpendicular a lmax
  const Mx_cm = ax * q * lmin * lmin; // kg·cm/cm
  const My_cm = ay * q * lmin * lmin;

  // 5. Profundidad efectiva
  const phi_bar = 16; // mm assumed
  const d = Math.max(h - cover - phi_bar / 20, 1); // cm

  // 6. Acero requerido por unidad de ancho
  const phi_f = 0.85;
  const j = 0.9;
  // As [cm²/cm] = M [kg·cm/cm] / (phi*fy*j*d)
  const As_x_cm = Mx_cm / (phi_f * fy * j * d);
  const As_y_cm = My_cm / (phi_f * fy * j * d);
  // Por metro lineal
  const As_x_req = As_x_cm * 100;
  const As_y_req = As_y_cm * 100;

  // 7. Acero mínimo
  const rho_min = fy >= 4200 ? 0.0018 : 0.0020;
  const As_min = rho_min * 100 * d; // cm²/m (franja de 100cm)

  const As_x = Math.max(As_x_req, As_min);
  const As_y = Math.max(As_y_req, As_min);

  // 8. Selección de barras
  const bars_x = selectBarsPerMeter(As_x);
  const bars_y = selectBarsPerMeter(As_y);

  // 9. Verificación de espesor
  const h_min_span = lmin / 20; // mínimo por relación de vano
  const h_min_abs = 25; // mínimo absoluto para losa de cimentación (cm)
  const N_col = P / (n_cols_x * n_cols_y);
  const h_min_punch = hMinPunching(N_col, col_cx, col_cy, fc);
  const h_min = Math.max(h_min_span, h_min_abs, h_min_punch);
  const thickness_ok = h >= h_min;

  // 10. Punzonado en columna interior (peor caso)
  const b0 = 2 * (col_cx + col_cy + 2 * d); // cm
  const Vc_punch_kg = 0.33 * Math.sqrt(fc_MPa) * (b0 * 10) * (d * 10) / 1000; // kg
  const Vu_punch_kg = 1.4 * N_col;
  const punching_ok = Vu_punch_kg >= 0 && Vu_punch_kg <= Vc_punch_kg;
  const punching_util = (Vu_punch_kg / Vc_punch_kg) * 100;

  const all_ok = soil_ok && thickness_ok && punching_ok;

  // 11. Sugerencias
  const suggestions = [];
  if (!soil_ok) {
    const A_needed = Math.ceil(Math.sqrt(P / sigma_adm) * 1.1);
    suggestions.push({ msg: `Ampliar losa. Área mínima: ${(P / sigma_adm / 1e4).toFixed(1)} m². Pruebe ${A_needed}×${A_needed} cm`, type: 'soil' });
  }
  if (!thickness_ok) {
    suggestions.push({ msg: `Aumentar espesor a mínimo h = ${Math.ceil(h_min / 5) * 5} cm`, type: 'thickness', h_suggested: Math.ceil(h_min / 5) * 5 });
  }
  if (!punching_ok) {
    suggestions.push({ msg: `Verificar punzonado: aumentar h o resistencia del hormigón`, type: 'punching' });
  }

  return {
    status: all_ok ? 'calculated' : 'failed',
    checks: { all_ok, soil_ok, thickness_ok, punching_ok },
    geometry: {
      Lx, Ly, h,
      area_m2: area_cm2 / 1e4,
      volume_m3: (area_cm2 * h) / 1e6,
    },
    soil: { q, sigma_adm, utilization: soil_util },
    spans: { span_x, span_y, lmin, lmax, r },
    czerny: { ax, ay },
    moments: {
      Mx: Mx_cm / 100, // ton·m/m para display
      My: My_cm / 100,
    },
    depth: { d, h, h_min, cover },
    reinforcement: {
      As_x, As_y, As_min,
      As_x_req, As_y_req,
      bars_x, bars_y,
    },
    punching: {
      N_col,
      b0,
      Vc: Vc_punch_kg,
      Vu: Vu_punch_kg,
      utilization: punching_util,
      ok: punching_ok,
    },
    suggestions,
  };
}

export function autoAdjustSlab(params) {
  // Try increasing h until thickness and punching pass
  let h = params.slab_h || 30;
  for (let attempt = 0; attempt < 20; attempt++) {
    const res = calculateSlab({ ...params, h });
    if (res.checks.thickness_ok && res.checks.punching_ok) {
      return { success: true, h, results: res };
    }
    h += 5;
  }
  const res = calculateSlab({ ...params, h });
  return { success: false, h, results: res };
}