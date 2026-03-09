// ============================================================
// Exportador DXF para Zapatas Aisladas (formato R12 ASCII)
// Genera: Vista en Planta + Corte Transversal + Rótulo
// ============================================================

// ── Primitivas DXF ──────────────────────────────────────────
const line = (x1, y1, x2, y2, layer = '0', color = '') =>
  `0\nLINE\n8\n${layer}\n${color ? `62\n${color}\n` : ''}10\n${x1.toFixed(2)}\n20\n${y1.toFixed(2)}\n30\n0.00\n11\n${x2.toFixed(2)}\n21\n${y2.toFixed(2)}\n31\n0.00\n`;

const rect = (x1, y1, w, h, layer = '0', color = '') =>
  line(x1, y1, x1 + w, y1, layer, color) +
  line(x1 + w, y1, x1 + w, y1 + h, layer, color) +
  line(x1 + w, y1 + h, x1, y1 + h, layer, color) +
  line(x1, y1 + h, x1, y1, layer, color);

const text = (x, y, height, str, layer = 'TEXTO', hjust = 0) =>
  `0\nTEXT\n8\n${layer}\n10\n${x.toFixed(2)}\n20\n${y.toFixed(2)}\n30\n0.00\n40\n${height}\n1\n${str}\n72\n${hjust}\n`;

const dim = (x1, y1, x2, y2, tx, ty, label, layer = 'COTAS') => {
  // Simple cota: líneas de extensión + línea de cota + texto
  const mid = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
  return (
    line(x1, y1, tx + (x1 - x2 < 0 ? -1 : 1) * 0, ty, layer) +
    line(x2, y2, tx + (x1 - x2 < 0 ? 1 : -1) * 0, ty, layer) +
    line(tx - Math.abs(x2 - x1) / 2, ty, tx + Math.abs(x2 - x1) / 2, ty, layer) +
    text(tx, ty + 5, 7, label, layer, 1)
  );
};

// ── Generador principal ──────────────────────────────────────
export function generateFoundationDXF(foundation, results, projectName = '') {
  const A  = results?.dimensions?.A  || foundation.base_width_A  || 200;
  const B  = results?.dimensions?.B  || foundation.base_length_B || 200;
  const H  = foundation.base_height_H || 50;
  const cx = foundation.column_cx || 30;
  const cy = foundation.column_cy || 30;
  const cover = foundation.cover || 7.5;
  const bars_x = results?.reinforcement?.bars_x;
  const bars_y = results?.reinforcement?.bars_y;

  // ── VISTA EN PLANTA (offset 0, 0) ──
  let entities = '';

  // Contorno losa
  entities += rect(0, 0, A, B, 'CONTORNO', 7);

  // Columna (centrada)
  const col_x = (A - cx) / 2;
  const col_y = (B - cy) / 2;
  entities += rect(col_x, col_y, cx, cy, 'COLUMNA', 1);
  entities += text(col_x + cx / 2, col_y + cy / 2, 5, `${cx}x${cy}`, 'COLUMNA', 1);

  // Armadura X (líneas paralelas a X)
  if (bars_x) {
    const n = Math.min(bars_x.count || 6, 16);
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const y = cover + t * (B - 2 * cover);
      entities += line(cover, y, A - cover, y, 'ARMADURA_X', 1);
    }
  }

  // Armadura Y (líneas paralelas a Y)
  if (bars_y) {
    const n = Math.min(bars_y.count || 6, 16);
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const x = cover + t * (A - 2 * cover);
      entities += line(x, cover, x, B - cover, 'ARMADURA_Y', 5);
    }
  }

  // Cotas planta
  entities += dim(0, 0, A, 0, A / 2, -30, `A=${A}cm`, 'COTAS');
  entities += dim(0, 0, 0, B, -30, B / 2, `B=${B}cm`, 'COTAS');

  // ── CORTE TRANSVERSAL (offset A+80, 0) ──
  const ox = A + 80;

  // Contorno corte (sección A–A)
  entities += rect(ox, 0, A, H, 'CONTORNO', 7);

  // Columna en corte
  entities += rect(ox + col_x, H, cx, H * 0.6, 'COLUMNA', 1);

  // Barras en corte (X) como círculos → representados con puntos (crucetas)
  if (bars_x) {
    const n = Math.min(bars_x.count || 6, 16);
    const db = (bars_x.diameter || 16) / 20; // radio en cm
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const x = ox + cover + t * (A - 2 * cover);
      const y = cover;
      entities += line(x - db, y - db, x + db, y + db, 'ARMADURA_X', 1);
      entities += line(x - db, y + db, x + db, y - db, 'ARMADURA_X', 1);
    }
  }

  // Cotas corte
  entities += dim(ox, 0, ox + A, 0, ox + A / 2, -30, `A=${A}cm`, 'COTAS');
  entities += line(ox + A + 10, 0, ox + A + 10, H, 'COTAS');
  entities += text(ox + A + 15, H / 2, 7, `H=${H}cm`, 'COTAS');

  // Nivel de suelo
  entities += line(ox - 20, 0, ox + A + 40, 0, 'NPT');
  entities += text(ox + A + 20, 2, 6, 'N.P.T.', 'NPT');

  // ── RÓTULO ──
  const rx = 0, ry = B + 60;
  entities += rect(rx, ry, A * 2 + 80, 60, 'ROTULO', 7);
  entities += line(rx, ry + 30, rx + A * 2 + 80, ry + 30, 'ROTULO', 7);
  entities += text(rx + 5, ry + 40, 8, `PROYECTO: ${projectName || 'Sin nombre'}`, 'ROTULO');
  entities += text(rx + 5, ry + 12, 8, `BASE: ${foundation.name || 'B1'}  |  ${A}x${B}x${H} cm`, 'ROTULO');
  if (bars_x) entities += text(rx + 5, ry + 2, 6, `Arm.X: ${bars_x.description || ''}  |  Arm.Y: ${bars_y?.description || ''}`, 'ROTULO');

  // ── Leyenda de capas ──
  const lx = A * 2 + 100;
  const legends = [
    { layer: 'CONTORNO',   color: '7  (blanco)',   desc: 'Contorno losa' },
    { layer: 'COLUMNA',    color: '1  (rojo)',     desc: 'Columna' },
    { layer: 'ARMADURA_X', color: '1  (rojo)',     desc: 'Armadura dirección X' },
    { layer: 'ARMADURA_Y', color: '5  (azul)',     desc: 'Armadura dirección Y' },
    { layer: 'COTAS',      color: '3  (verde)',    desc: 'Cotas y dimensiones' },
    { layer: 'NPT',        color: '6  (magenta)', desc: 'Nivel de terreno' },
  ];
  legends.forEach((l, i) => {
    entities += text(lx, B - i * 12, 6, `${l.layer}: ${l.desc}`, 'ROTULO');
  });

  // ── Encabezado DXF R12 ──
  const header = `0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n9\n$INSUNITS\n70\n5\n0\nENDSEC\n`;

  // ── Tabla de capas ──
  const layerDefs = ['CONTORNO 7', 'COLUMNA 1', 'ARMADURA_X 1', 'ARMADURA_Y 5', 'COTAS 3', 'NPT 6', 'ROTULO 2', 'TEXTO 7']
    .map(l => {
      const [name, c] = l.split(' ');
      return `0\nLAYER\n2\n${name}\n70\n0\n62\n${c}\n`;
    })
    .join('');

  const tables = `0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n8\n${layerDefs}0\nENDTAB\n0\nENDSEC\n`;

  const dxf = `${header}${tables}0\nSECTION\n2\nENTITIES\n${entities}0\nENDSEC\n0\nEOF\n`;
  return dxf;
}

export function downloadDXF(dxfContent, filename = 'zapata.dxf') {
  const blob = new Blob([dxfContent], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}