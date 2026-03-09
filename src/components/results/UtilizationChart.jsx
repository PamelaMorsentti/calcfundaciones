import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-slate-700">{d.payload.subject}</p>
      <p className={`font-mono font-bold ${d.value > 100 ? 'text-red-500' : d.value > 85 ? 'text-amber-500' : 'text-emerald-600'}`}>
        {d.value.toFixed(1)}%
      </p>
    </div>
  );
};

export default function UtilizationChart({ results }) {
  if (!results?.checks) return null;

  const { stresses, checks, reinforcement } = results;

  const punchRatio = checks.punching?.Vu && checks.punching?.Vc
    ? (checks.punching.Vu / checks.punching.Vc) * 100 : 0;

  const shearXRatio = checks.shear_x?.Vu && checks.shear_x?.Vc
    ? (checks.shear_x.Vu / checks.shear_x.Vc) * 100 : 0;

  const shearYRatio = checks.shear_y?.Vu && checks.shear_y?.Vc
    ? (checks.shear_y.Vu / checks.shear_y.Vc) * 100 : 0;

  const flexXRatio = reinforcement?.As_x && reinforcement?.bars_x?.area_provided
    ? (reinforcement.As_x / reinforcement.bars_x.area_provided) * 100 : 0;

  const flexYRatio = reinforcement?.As_y && reinforcement?.bars_y?.area_provided
    ? (reinforcement.As_y / reinforcement.bars_y.area_provided) * 100 : 0;

  const soilUtil = Math.min(stresses?.utilization || 0, 150);

  const data = [
    { subject: 'Suelo', value: soilUtil, limit: 100 },
    { subject: 'Punzonado', value: Math.min(punchRatio, 150), limit: 100 },
    { subject: 'Corte X', value: Math.min(shearXRatio, 150), limit: 100 },
    { subject: 'Corte Y', value: Math.min(shearYRatio, 150), limit: 100 },
    { subject: 'Arm. Y', value: Math.min(flexYRatio, 150), limit: 100 },
    { subject: 'Arm. X', value: Math.min(flexXRatio, 150), limit: 100 },
  ];

  const maxVal = Math.max(...data.map(d => d.value), 110);

  // Barra horizontal por cada verificación
  const barItems = [
    { label: 'Tensión Suelo', value: soilUtil, ok: checks.soil_ok },
    { label: 'Punzonado', value: punchRatio, ok: checks.punching?.ok },
    { label: 'Corte en X', value: shearXRatio, ok: checks.shear_x?.ok },
    { label: 'Corte en Y', value: shearYRatio, ok: checks.shear_y?.ok },
    { label: 'Arm. X (As prov.)', value: flexXRatio, ok: true },
    { label: 'Arm. Y (As prov.)', value: flexYRatio, ok: true },
  ];

  return (
    <div className="space-y-5">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        Diagrama de Utilización
      </h4>

      {/* Radar chart */}
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <Radar
              name="Utilización"
              dataKey="limit"
              stroke="#ef444440"
              fill="#ef444415"
              fillOpacity={1}
            />
            <Radar
              name="Real"
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f650"
              fillOpacity={0.7}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Barras detalladas */}
      <div className="space-y-2">
        {barItems.map(({ label, value, ok }) => {
          const capped = Math.min(value, 100);
          const overflow = value > 100;
          const color = !ok ? 'bg-red-500' : value > 85 ? 'bg-amber-400' : 'bg-emerald-500';
          return (
            <div key={label} className="space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">{label}</span>
                <span className={`font-mono font-semibold ${!ok ? 'text-red-600' : value > 85 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {value.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${color}`}
                  style={{ width: `${capped}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-400 text-center">
        Área azul = utilización real · Área roja = límite 100%
      </p>
    </div>
  );
}