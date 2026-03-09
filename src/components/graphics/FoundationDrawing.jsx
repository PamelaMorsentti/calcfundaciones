import React from 'react';

export default function FoundationDrawing({ foundation, results, showReinforcement = true }) {
  if (!foundation) return null;

  const A = results?.dimensions?.A || foundation.base_width_A || 200;
  const B = results?.dimensions?.B || foundation.base_length_B || 200;
  const H = foundation.base_height_H || 50;
  const cx = foundation.column_cx || 30;
  const cy = foundation.column_cy || 30;
  const type = foundation.type || "centered";

  // Escala para SVG
  const maxDim = Math.max(A, B);
  const scale = 280 / maxDim;
  const sA = A * scale;
  const sB = B * scale;
  const sH = H * scale * 0.8;
  const sCx = cx * scale;
  const sCy = cy * scale;

  // Posición de columna según tipo
  let colX = (sA - sCx) / 2;
  let colY = (sB - sCy) / 2;
  
  if (type === "edge") {
    colX = 10;
  } else if (type === "corner") {
    colX = 10;
    colY = 10;
  }

  // Armadura
  const barsX = results?.reinforcement?.bars_x || { count: 5, diameter: 12 };
  const barsY = results?.reinforcement?.bars_y || { count: 5, diameter: 12 };

  return (
    <div className="space-y-6">
      {/* Vista en Planta */}
      <div className="bg-slate-50 rounded-xl p-4">
        <h4 className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide">Vista en Planta</h4>
        <svg viewBox={`0 0 ${sA + 60} ${sB + 60}`} className="w-full h-auto max-h-64">
          {/* Fondo base */}
          <rect
            x="30"
            y="30"
            width={sA}
            height={sB}
            fill="#e2e8f0"
            stroke="#475569"
            strokeWidth="2"
          />
          
          {/* Columna */}
          <rect
            x={30 + colX}
            y={30 + colY}
            width={sCx}
            height={sCy}
            fill="#64748b"
            stroke="#1e293b"
            strokeWidth="2"
          />
          
          {/* Armadura si está habilitada */}
          {showReinforcement && (
            <>
              {/* Barras en X */}
              {Array.from({ length: barsX.count }).map((_, i) => {
                const spacing = sB / (barsX.count + 1);
                return (
                  <line
                    key={`x-${i}`}
                    x1="35"
                    y1={30 + spacing * (i + 1)}
                    x2={25 + sA}
                    y2={30 + spacing * (i + 1)}
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                );
              })}
              {/* Barras en Y */}
              {Array.from({ length: barsY.count }).map((_, i) => {
                const spacing = sA / (barsY.count + 1);
                return (
                  <line
                    key={`y-${i}`}
                    x1={30 + spacing * (i + 1)}
                    y1="35"
                    x2={30 + spacing * (i + 1)}
                    y2={25 + sB}
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                );
              })}
            </>
          )}
          
          {/* Cotas */}
          {/* Cota horizontal */}
          <line x1="30" y1={sB + 45} x2={30 + sA} y2={sB + 45} stroke="#94a3b8" strokeWidth="1" />
          <line x1="30" y1={sB + 40} x2="30" y2={sB + 50} stroke="#94a3b8" strokeWidth="1" />
          <line x1={30 + sA} y1={sB + 40} x2={30 + sA} y2={sB + 50} stroke="#94a3b8" strokeWidth="1" />
          <text x={30 + sA / 2} y={sB + 58} textAnchor="middle" className="text-[10px] fill-slate-600">
            A = {A} cm
          </text>
          
          {/* Cota vertical */}
          <line x1={sA + 45} y1="30" x2={sA + 45} y2={30 + sB} stroke="#94a3b8" strokeWidth="1" />
          <line x1={sA + 40} y1="30" x2={sA + 50} y2="30" stroke="#94a3b8" strokeWidth="1" />
          <line x1={sA + 40} y1={30 + sB} x2={sA + 50} y2={30 + sB} stroke="#94a3b8" strokeWidth="1" />
          <text 
            x={sA + 55} 
            y={30 + sB / 2} 
            textAnchor="middle" 
            className="text-[10px] fill-slate-600"
            transform={`rotate(90, ${sA + 55}, ${30 + sB / 2})`}
          >
            B = {B} cm
          </text>
        </svg>
      </div>

      {/* Vista en Corte */}
      <div className="bg-slate-50 rounded-xl p-4">
        <h4 className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide">Corte Transversal</h4>
        <svg viewBox={`0 0 ${sA + 60} ${sH + 80}`} className="w-full h-auto max-h-40">
          {/* Terreno */}
          <pattern id="soil" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M0,10 L10,0" stroke="#94a3b8" strokeWidth="0.5" fill="none" />
          </pattern>
          <rect x="0" y={sH + 40} width={sA + 60} height="30" fill="url(#soil)" />
          
          {/* Base */}
          <rect
            x="30"
            y="40"
            width={sA}
            height={sH}
            fill="#cbd5e1"
            stroke="#475569"
            strokeWidth="2"
          />
          
          {/* Columna emergente */}
          <rect
            x={30 + colX}
            y="10"
            width={sCx}
            height="30"
            fill="#94a3b8"
            stroke="#475569"
            strokeWidth="2"
          />
          
          {/* Armadura inferior */}
          {showReinforcement && (
            <>
              <line
                x1="35"
                y1={35 + sH}
                x2={25 + sA}
                y2={35 + sH}
                stroke="#ef4444"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Círculos representando barras */}
              {Array.from({ length: 5 }).map((_, i) => (
                <circle
                  key={i}
                  cx={45 + (i * (sA - 30) / 4)}
                  cy={35 + sH}
                  r="3"
                  fill="#ef4444"
                />
              ))}
            </>
          )}
          
          {/* Cota altura */}
          <line x1="15" y1="40" x2="15" y2={40 + sH} stroke="#94a3b8" strokeWidth="1" />
          <line x1="10" y1="40" x2="20" y2="40" stroke="#94a3b8" strokeWidth="1" />
          <line x1="10" y1={40 + sH} x2="20" y2={40 + sH} stroke="#94a3b8" strokeWidth="1" />
          <text 
            x="5" 
            y={40 + sH / 2} 
            textAnchor="middle" 
            className="text-[10px] fill-slate-600"
            transform={`rotate(-90, 5, ${40 + sH / 2})`}
          >
            H = {H} cm
          </text>
        </svg>
      </div>

      {/* Leyenda de armadura */}
      {showReinforcement && results?.reinforcement && (
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-red-500"></div>
            <span className="text-slate-600">Arm. X: {barsX.description || `${barsX.count}Ø${barsX.diameter}`}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-blue-500"></div>
            <span className="text-slate-600">Arm. Y: {barsY.description || `${barsY.count}Ø${barsY.diameter}`}</span>
          </div>
        </div>
      )}
    </div>
  );
}