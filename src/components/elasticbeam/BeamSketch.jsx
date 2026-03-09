import React from 'react';
import { Card } from "@/components/ui/card";

/**
 * Esquema SVG de la viga de fundación con columnas y presión del suelo.
 */
export default function BeamSketch({ columns, beamLength, beamWidth, beamHeight, results }) {
  const W = 680, H = 200;
  const margin = { left: 30, right: 30, top: 60, bottom: 40 };
  const drawW = W - margin.left - margin.right;
  const drawH = H - margin.top - margin.bottom;

  const L = beamLength || 10; // m
  const toX = (x) => margin.left + (x / L) * drawW;

  // Presión del suelo (normalizada)
  const maxP = results?.maxValues?.pressure || 1;
  const pressureScale = 30 / maxP; // max 30px de altura

  const beamTop = margin.top + 15;
  const beamH_px = 30;
  const beamBot = beamTop + beamH_px;

  return (
    <Card className="p-4">
      <div className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
        Esquema — Viga de Fundación Continua
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        {/* Suelo */}
        <rect x={margin.left} y={beamBot} width={drawW} height={drawH - beamH_px - 5}
          fill="#f5f0e8" stroke="#d4c4a0" strokeWidth="1" />

        {/* Líneas de suelo (hatch) */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i}
            x1={margin.left + i * (drawW / 12)} y1={beamBot + 2}
            x2={margin.left + i * (drawW / 12) - 10} y2={beamBot + 14}
            stroke="#c4b08a" strokeWidth="1" />
        ))}

        {/* Presión del suelo (diagrama relleno) */}
        {results?.points?.length > 0 && (() => {
          const pts = results.points;
          const pathParts = pts.map((pt, i) => {
            const px = toX(pt.x);
            const py = beamBot + Math.min(pt.pressure * pressureScale, 35);
            return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
          });
          const first = toX(pts[0].x);
          const last = toX(pts[pts.length - 1].x);
          return (
            <path
              d={`${pathParts.join(' ')} L ${last} ${beamBot} L ${first} ${beamBot} Z`}
              fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" opacity="0.8"
            />
          );
        })()}

        {/* Viga */}
        <rect x={margin.left} y={beamTop} width={drawW} height={beamH_px}
          fill="#cbd5e1" stroke="#64748b" strokeWidth="1.5" rx="2" />

        {/* Armadura (línea roja dentro de la viga) */}
        <line x1={margin.left + 5} y1={beamBot - 6} x2={margin.left + drawW - 5} y2={beamBot - 6}
          stroke="#ef4444" strokeWidth="2" strokeDasharray="6 3" />

        {/* Columnas */}
        {(columns || []).map((col, i) => {
          const cx = toX(col.x);
          const colW = Math.max(12, Math.min((col.cx / (L * 100)) * drawW * 2, 24));
          const arrowH = 40;
          const N_ton = (col.N / 1000).toFixed(0);

          return (
            <g key={i}>
              {/* Fuste de columna */}
              <rect x={cx - colW / 2} y={margin.top - 30} width={colW} height={30}
                fill="#94a3b8" stroke="#475569" strokeWidth="1" />
              {/* Flecha de carga */}
              <line x1={cx} y1={margin.top - 30 - arrowH + 10} x2={cx} y2={margin.top - 30}
                stroke="#1e293b" strokeWidth="1.5"
                markerEnd="url(#arrow)" />
              {/* Etiqueta columna */}
              <text x={cx} y={margin.top - 30 - arrowH} textAnchor="middle"
                fontSize="9" fill="#1e293b" fontWeight="600">
                {col.name}
              </text>
              <text x={cx} y={margin.top - 30 - arrowH + 10} textAnchor="middle"
                fontSize="8" fill="#64748b">
                {N_ton}t
              </text>
            </g>
          );
        })}

        {/* Cota de longitud */}
        <line x1={margin.left} y1={H - 15} x2={margin.left + drawW} y2={H - 15}
          stroke="#94a3b8" strokeWidth="1" markerStart="url(#tick)" markerEnd="url(#tick)" />
        <text x={margin.left + drawW / 2} y={H - 4} textAnchor="middle" fontSize="9" fill="#64748b">
          L = {L.toFixed(1)} m
        </text>

        {/* Marcas de posición */}
        {(columns || []).map((col, i) => (
          <text key={i} x={toX(col.x)} y={H - 15} textAnchor="middle" fontSize="8" fill="#94a3b8">
            |
          </text>
        ))}

        {/* Defs: flecha */}
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#1e293b" />
          </marker>
        </defs>
      </svg>

      <div className="flex gap-4 mt-2 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-1 bg-red-400 rounded"></span>
          Armadura longitudinal
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-2 bg-amber-200 border border-amber-400 rounded"></span>
          Presión terreno
        </span>
      </div>
    </Card>
  );
}