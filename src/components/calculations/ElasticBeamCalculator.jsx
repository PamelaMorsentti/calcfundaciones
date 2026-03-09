// Motor de cálculo de vigas sobre lecho elástico
// v2.0: Solución analítica de Hetényi para vigas infinitas/semi-infinitas
//       + Solución FEM (Elementos Finitos) para vigas finitas (Mejora 1.6)
//       Fix: I = b·h³/12 (corregido de h⁴)

export function calculateElasticBeam(data) {
  const { beamType } = data;
  if (beamType === 'finite') {
    return calculateFiniteBeamFEM(data);
  } else {
    return calculateInfiniteBeam(data);
  }
}

// ===================================================================
// SOLUCIÓN ANALÍTICA DE HETÉNYI (vigas infinitas y semi-infinitas)
// ===================================================================
function calculateInfiniteBeam(data) {
  const { beamType, width, height, length, E, C, loads } = data;

  const b = width * 100;   // m → cm
  const h = height * 100;  // m → cm

  // Momento de inercia (CORREGIDO: h³, no h⁴)
  const I = (b * Math.pow(h, 3)) / 12;
  const EI = E * I;

  // Parámetro característico de Winkler
  const alpha = Math.pow((C * b) / (4 * EI), 0.25); // [1/cm]

  // Longitud de influencia
  const Lp = (2.5 * Math.PI) / alpha;

  const results = {
    input: { ...data },
    parameters: {
      alpha,
      Lp,
      EI,
      I,
      lambda: alpha * (length ? length * 100 : Lp * 2),
      method: 'analytical_hetenyi'
    },
    points: [],
    maxValues: { pressure: 0, moment: 0, shear: 0, deflection: 0 }
  };

  // Funciones de Hetényi para carga puntual P₀ a distancia x:
  const P_fn = (x, P0) => (alpha / (2 * b)) * (Math.cos(alpha * x) + Math.sin(alpha * x)) * Math.exp(-alpha * x) * P0;
  const M_fn = (x, P0) => (P0 / (4 * alpha)) * (Math.sin(alpha * x) - Math.cos(alpha * x)) * Math.exp(-alpha * x);
  const Q_fn = (x, P0) => (-P0 / 2) * Math.cos(alpha * x) * Math.exp(-alpha * x);

  // Funciones para momento aplicado M₀:
  const P_mom = (x, M0) => ((alpha * alpha) / b) * M0 * Math.sin(alpha * x) * Math.exp(-alpha * x);
  const M_mom = (x, M0) => (M0 / 2) * (Math.cos(alpha * x) + Math.sin(alpha * x)) * Math.exp(-alpha * x);
  const Q_mom = (x, M0) => (alpha * M0) * Math.sin(alpha * x) * Math.exp(-alpha * x);

  const numPoints = 101;
  const xMax = Lp * 2;
  const dx = xMax / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    const x = i * dx;
    let pressure = 0;
    let moment = 0;
    let shear = 0;

    for (const load of loads) {
      const xi = Math.abs(x - load.position * 100);
      if (load.type === 'point') {
        if (xi < xMax * 2) {
          pressure += P_fn(xi, load.value);
          moment += M_fn(xi, load.value);
          shear += Q_fn(xi, load.value);
        }
      } else if (load.type === 'moment') {
        pressure += P_mom(xi, load.value);
        moment += M_mom(xi, load.value);
        shear += Q_mom(xi, load.value);
      } else if (load.type === 'distributed') {
        pressure += load.value / b;
      }
    }

    results.points.push({ x: x / 100, pressure: Math.max(0, pressure), moment, shear });

    if (Math.abs(pressure) > results.maxValues.pressure) {
      results.maxValues.pressure = Math.abs(pressure);
      results.maxValues.pressureAt = x / 100;
    }
    if (Math.abs(moment) > results.maxValues.moment) {
      results.maxValues.moment = Math.abs(moment);
      results.maxValues.momentAt = x / 100;
    }
    if (Math.abs(shear) > results.maxValues.shear) {
      results.maxValues.shear = Math.abs(shear);
      results.maxValues.shearAt = x / 100;
    }
  }

  return results;
}

// ===================================================================
// SOLUCIÓN FEM PARA VIGAS FINITAS (Mejora 1.6)
// Elementos viga Euler-Bernoulli + resortes de Winkler distribuidos
// Condiciones de borde: extremos libres (sin restricción)
// ===================================================================
function calculateFiniteBeamFEM(data) {
  const { width, height, length, E, C, loads } = data;

  const b = width * 100;      // m → cm
  const h = height * 100;     // m → cm
  const L = length * 100;     // m → cm

  // Momento de inercia (CORREGIDO: h³)
  const I = (b * Math.pow(h, 3)) / 12;
  const EI = E * I;

  // Rigidez del lecho elástico por unidad de longitud [kg/cm/cm = kg/cm²]
  const k_spring = C * b;

  // Parámetro α (para mostrar en panel de parámetros)
  const alpha = Math.pow((C * b) / (4 * EI), 0.25);
  const Lp = (2.5 * Math.PI) / alpha;

  const results = {
    input: { ...data },
    parameters: {
      alpha,
      Lp,
      EI,
      I,
      lambda: alpha * L,
      method: 'fem_winkler',
      lambda_description: `λ = α·L = ${(alpha * L).toFixed(2)} (${alpha * L < 2.5 ? 'viga rígida' : alpha * L < 5 ? 'viga media' : 'viga flexible'})`
    },
    points: [],
    maxValues: { pressure: 0, moment: 0, shear: 0, deflection: 0 }
  };

  const n = 60; // Número de elementos (suficiente precisión)
  const Le = L / n;
  const nNodes = n + 1;
  const nDOF = 2 * nNodes;

  // --- Construcción de la matriz de rigidez global ---
  // K[i][j] almacenado como array plano: índice = i*nDOF + j
  const K = new Float64Array(nDOF * nDOF);
  const F = new Float64Array(nDOF);

  const setK = (i, j, v) => { K[i * nDOF + j] += v; };

  for (let e = 0; e < n; e++) {
    const i1 = 2 * e;       // DOF nodo izquierdo: [w, θ]
    const i2 = 2 * (e + 1); // DOF nodo derecho

    const EIL3 = EI / (Le * Le * Le);
    const EIL2 = EI / (Le * Le);
    const EIL1 = EI / Le;
    const kL = k_spring * Le;

    // Matriz de rigidez del elemento viga (Euler-Bernoulli)
    const dofs = [i1, i1 + 1, i2, i2 + 1];
    const Kb = [
      [12 * EIL3,    6 * EIL2,  -12 * EIL3,   6 * EIL2],
      [6 * EIL2,     4 * EIL1,   -6 * EIL2,   2 * EIL1],
      [-12 * EIL3,  -6 * EIL2,   12 * EIL3,  -6 * EIL2],
      [6 * EIL2,     2 * EIL1,   -6 * EIL2,   4 * EIL1]
    ];

    // Matriz de rigidez consistente del resorte de Winkler
    // (integración exacta de los polinomios de Hermite)
    const Ks = [
      [156 * kL / 420,    22 * Le * kL / 420,   54 * kL / 420,  -13 * Le * kL / 420],
      [22 * Le * kL / 420, 4 * Le * Le * kL / 420, 13 * Le * kL / 420, -3 * Le * Le * kL / 420],
      [54 * kL / 420,    13 * Le * kL / 420,  156 * kL / 420,  -22 * Le * kL / 420],
      [-13 * Le * kL / 420, -3 * Le * Le * kL / 420, -22 * Le * kL / 420, 4 * Le * Le * kL / 420]
    ];

    for (let a = 0; a < 4; a++) {
      for (let bb = 0; bb < 4; bb++) {
        setK(dofs[a], dofs[bb], Kb[a][bb] + Ks[a][bb]);
      }
    }
  }

  // --- Aplicación de cargas ---
  for (const load of loads) {
    const xLoad = load.position * 100; // m → cm

    if (load.type === 'point') {
      // Distribución consistente con funciones de forma de Hermite
      const eIdx = Math.min(Math.floor(xLoad / Le), n - 1);
      const xi = (xLoad - eIdx * Le) / Le; // coord. local [0, 1]
      const N1 = 1 - 3 * xi * xi + 2 * xi * xi * xi;
      const N2 = Le * xi * (1 - xi) * (1 - xi);
      const N3 = 3 * xi * xi - 2 * xi * xi * xi;
      const N4 = Le * xi * xi * (xi - 1);
      F[2 * eIdx]         += N1 * load.value;
      F[2 * eIdx + 1]     += N2 * load.value;
      F[2 * (eIdx + 1)]   += N3 * load.value;
      F[2 * (eIdx + 1) + 1] += N4 * load.value;

    } else if (load.type === 'moment') {
      const nodeIdx = Math.min(Math.round(xLoad / Le), n);
      F[2 * nodeIdx + 1] += load.value;

    } else if (load.type === 'distributed') {
      // Vector de carga consistente para carga distribuida uniforme
      const q = load.value;
      for (let e = 0; e < n; e++) {
        F[2 * e]           += q * Le / 2;
        F[2 * e + 1]       += q * Le * Le / 12;
        F[2 * (e + 1)]     += q * Le / 2;
        F[2 * (e + 1) + 1] -= q * Le * Le / 12;
      }
    }
  }

  // --- Resolución del sistema K·U = F ---
  const U = solveGaussian(K, F, nDOF);

  // --- Post-proceso: momentos en cada nodo ---
  // Se usa la interpolación hermítica exacta (más precisa que diferencias finitas)
  const node_moments = new Float64Array(nNodes);
  const node_shears = new Float64Array(nNodes);
  const moment_count = new Float64Array(nNodes);
  const shear_count = new Float64Array(nNodes);

  for (let e = 0; e < n; e++) {
    const w1 = U[2 * e] || 0;
    const th1 = U[2 * e + 1] || 0;
    const w2 = U[2 * (e + 1)] || 0;
    const th2 = U[2 * (e + 1) + 1] || 0;

    // d²w/dx² en ξ=0 (nodo izquierdo):
    // = (-6/Le²)·w1 + (-4/Le)·θ1 + (6/Le²)·w2 + (-2/Le)·θ2
    const d2w_left = (-6 / (Le * Le)) * w1 + (-4 / Le) * th1 + (6 / (Le * Le)) * w2 + (-2 / Le) * th2;
    const M_left = -EI * d2w_left;

    // d²w/dx² en ξ=1 (nodo derecho):
    // = (6/Le²)·w1 + (2/Le)·θ1 + (-6/Le²)·w2 + (4/Le)·θ2
    const d2w_right = (6 / (Le * Le)) * w1 + (2 / Le) * th1 + (-6 / (Le * Le)) * w2 + (4 / Le) * th2;
    const M_right = -EI * d2w_right;

    // Cortante en elemento (constante para cargas puntuales entre nodos):
    const V_elem = EI / (Le * Le * Le) * (12 * (w1 - w2) + 6 * Le * (th1 + th2));

    node_moments[e] += M_left;
    moment_count[e]++;
    node_moments[e + 1] += M_right;
    moment_count[e + 1]++;

    node_shears[e] += V_elem;
    shear_count[e]++;
    node_shears[e + 1] += -V_elem;
    shear_count[e + 1]++;
  }

  // --- Construir array de puntos de resultado ---
  for (let i = 0; i <= n; i++) {
    const x = (i * Le) / 100; // cm → m
    const w = U[2 * i] || 0;
    const pressure = Math.max(0, C * w); // presión de contacto [kg/cm²], solo compresión

    const moment = moment_count[i] > 0 ? node_moments[i] / moment_count[i] : 0;
    const shear = shear_count[i] > 0 ? node_shears[i] / shear_count[i] : 0;

    const pt = { x, pressure, moment, shear };
    results.points.push(pt);

    if (pressure > results.maxValues.pressure) {
      results.maxValues.pressure = pressure;
      results.maxValues.pressureAt = x;
    }
    if (Math.abs(moment) > results.maxValues.moment) {
      results.maxValues.moment = Math.abs(moment);
      results.maxValues.momentAt = x;
    }
    if (Math.abs(shear) > results.maxValues.shear) {
      results.maxValues.shear = Math.abs(shear);
      results.maxValues.shearAt = x;
    }
    if (Math.abs(w) > results.maxValues.deflection) {
      results.maxValues.deflection = Math.abs(w);
      results.maxValues.deflectionAt = x;
    }
  }

  return results;
}

// ===================================================================
// RESOLUCIÓN DEL SISTEMA LINEAL K·U = F (Eliminación Gaussiana)
// con pivoteo parcial para estabilidad numérica
// ===================================================================
function solveGaussian(Kflat, Farray, n) {
  // Convertir a arrays regulares para manipulación
  const A = [];
  for (let i = 0; i < n; i++) {
    A.push(Array.from(Kflat.subarray(i * n, (i + 1) * n)));
  }
  const b = Array.from(Farray);

  for (let col = 0; col < n; col++) {
    // Pivoteo parcial (estabilidad numérica)
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(A[row][col]) > Math.abs(A[maxRow][col])) maxRow = row;
    }
    [A[col], A[maxRow]] = [A[maxRow], A[col]];
    [b[col], b[maxRow]] = [b[maxRow], b[col]];

    if (Math.abs(A[col][col]) < 1e-14) continue;

    for (let row = col + 1; row < n; row++) {
      const factor = A[row][col] / A[col][col];
      for (let k = col; k < n; k++) {
        A[row][k] -= factor * A[col][k];
      }
      b[row] -= factor * b[col];
    }
  }

  // Sustitución regresiva
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(A[i][i]) < 1e-14) continue;
    x[i] = b[i];
    for (let j = i + 1; j < n; j++) x[i] -= A[i][j] * x[j];
    x[i] /= A[i][i];
  }
  return x;
}

// Coeficientes de balasto típicos (Terzaghi / Bowles)
export const BALLAST_COEFFICIENTS = {
  "Arena suelta": { min: 1, max: 3 },
  "Arena media": { min: 3, max: 10 },
  "Arena compacta": { min: 10, max: 20 },
  "Arcilla blanda": { min: 0.5, max: 2 },
  "Arcilla media": { min: 2, max: 5 },
  "Arcilla dura": { min: 5, max: 10 },
  "Grava": { min: 10, max: 30 },
  "Tosca": { min: 20, max: 50 }
};