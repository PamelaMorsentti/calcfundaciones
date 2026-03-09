// ============================================================
// Calculadora de Análisis Sísmico
// Base: INPRES-CIRSOC 103 (Argentina) + referencia NSR-10/ACI
// Método estático equivalente
// ============================================================

export const SEISMIC_ZONES = {
  zone_0: { a0: 0.00, name: 'Zona 0 – Sin riesgo',       color: '#6b7280' },
  zone_1: { a0: 0.04, name: 'Zona 1 – Riesgo leve',      color: '#22c55e' },
  zone_2: { a0: 0.10, name: 'Zona 2 – Riesgo moderado',  color: '#eab308' },
  zone_3: { a0: 0.20, name: 'Zona 3 – Riesgo alto',      color: '#f97316' },
  zone_4: { a0: 0.35, name: 'Zona 4 – Riesgo muy alto',  color: '#ef4444' },
};

export const SOIL_TYPES = {
  S1: { psi: 1.0, Ts: 0.30, name: 'S1 – Roca o suelo muy duro' },
  S2: { psi: 1.2, Ts: 0.45, name: 'S2 – Suelo duro/denso' },
  S3: { psi: 1.5, Ts: 0.60, name: 'S3 – Suelo medianamente denso' },
  S4: { psi: 2.0, Ts: 0.90, name: 'S4 – Suelo blando' },
};

export const STRUCTURAL_SYSTEMS = {
  DM:  { Rd: 6.0, name: 'Dual con muros (DM)' },
  DME: { Rd: 4.5, name: 'Pórticos especiales (DME)' },
  DMO: { Rd: 3.0, name: 'Pórticos ordinarios (DMO)' },
  MM:  { Rd: 4.5, name: 'Muros monolíticos (MM)' },
  MW:  { Rd: 3.5, name: 'Muros de mampostería (MW)' },
};

export const IMPORTANCE_FACTORS = {
  normal:    { gamma: 1.0, name: 'Normal (vivienda, comercio)' },
  essential: { gamma: 1.3, name: 'Esencial (hospitales, escuelas)' },
  critical:  { gamma: 1.5, name: 'Crítica (presas, centrales)' },
};

// Período fundamental de la estructura (aproximación CIRSOC)
// T = Ct * H^(3/4) [s] — H en metros
// Ct = 0.085 (pórticos de hormigón), 0.075 (mixtos), 0.050 (muros)
function buildingPeriod(nFloors, floorHeight, system) {
  const H = nFloors * floorHeight;
  const Ct = (system === 'DM' || system === 'MM') ? 0.050 : 0.075;
  return Ct * Math.pow(H, 0.75);
}

// Coeficiente sísmico Ce (espectro de respuesta simplificado)
function seismicCoefficient(a0, psi, Ts, T, Rd, gamma) {
  // Espectro: Ce = a0 * gamma * psi * S(T) / Rd
  // S(T): plateau para T ≤ Ts, decae para T > Ts
  let S;
  if (T <= Ts) {
    S = 2.5; // plateau del espectro (normalizado)
  } else {
    S = 2.5 * (Ts / T); // caída 1/T
  }
  return (a0 * gamma * psi * S) / Rd;
}

export function calculateSeismic(params) {
  const {
    zone,
    soil_type,
    structural_system,
    importance,
    total_weight: W,   // kg
    n_floors,
    floor_height,       // m
    floor_weights = [], // kg por piso, si están disponibles
  } = params;

  if (!SEISMIC_ZONES[zone] || !W || W <= 0) {
    return { error: 'Datos insuficientes para el cálculo' };
  }

  const { a0 } = SEISMIC_ZONES[zone];
  const { psi, Ts } = SOIL_TYPES[soil_type] || SOIL_TYPES.S2;
  const { Rd } = STRUCTURAL_SYSTEMS[structural_system] || STRUCTURAL_SYSTEMS.DME;
  const { gamma } = IMPORTANCE_FACTORS[importance] || IMPORTANCE_FACTORS.normal;

  // Período
  const T = buildingPeriod(n_floors, floor_height, structural_system);

  // Coeficiente sísmico
  const Ce = seismicCoefficient(a0, psi, Ts, T, Rd, gamma);

  // Cortante basal
  const V = Ce * W; // kg

  // Distribución vertical (triangular + concentrada en cima)
  const Ft = T > 0.7 ? 0.07 * T * V : 0; // porción en la cima (CIRSOC)
  const Vr = V - Ft;

  // Pesos por piso (si no se dan, se distribuyen uniformemente)
  const floorH = [];
  const floorW = [];
  for (let i = 1; i <= n_floors; i++) {
    floorH.push(i * floor_height);
    floorW.push(floor_weights[i - 1] || W / n_floors);
  }

  const sum_wh = floorW.reduce((acc, w, i) => acc + w * floorH[i], 0);

  const forces = floorW.map((w, i) => {
    const Fx = Vr * (w * floorH[i]) / sum_wh + (i === n_floors - 1 ? Ft : 0);
    return {
      floor: i + 1,
      height: floorH[i],
      weight: w,
      force: Fx,
    };
  });

  // Momentos volcador en la base
  const M_overturning = forces.reduce((acc, f) => acc + f.force * f.height, 0); // kg·m

  // Verificación de estabilidad al vuelco (simplificado)
  // Se necesita W y brazo de estabilizador — requiere ancho de base del edificio
  // Aquí reportamos solo el momento para que el ingeniero lo use

  return {
    input: { zone, soil_type, structural_system, importance, W, n_floors, floor_height },
    period: { T, T_type: T <= Ts ? 'Corto (plateau)' : 'Largo (decae)' },
    coefficients: { a0, psi, Ts, T, Rd, gamma, Ce },
    base_shear: { V, Ce_pct: Ce * 100, Ft },
    floor_forces: forces,
    overturning_moment: M_overturning,
    foundation_load_increment: V / n_floors, // carga sísmica adicional por columna (aprox)
  };
}