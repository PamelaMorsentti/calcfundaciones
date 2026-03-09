import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Card } from "@/components/ui/card";

// ─── Gráfico As_req vs As_min ───────────────────────────────────────────────
export function ReinforcementComparisonChart({ foundations }) {
  const data = foundations
    .filter(f => f.results?.reinforcement)
    .map(f => ({
      name: f.name || 'Base',
      'As X req': parseFloat((f.results.reinforcement.As_x || 0).toFixed(2)),
      'As X min': parseFloat((f.results.reinforcement.As_min_x || 0).toFixed(2)),
      'As Y req': parseFloat((f.results.reinforcement.As_y || 0).toFixed(2)),
      'As Y min': parseFloat((f.results.reinforcement.As_min_y || 0).toFixed(2)),
    }));

  if (data.length === 0) return null;

  return (
    <Card className="p-5">
      <h4 className="text-sm font-semibold text-slate-700 mb-4">
        Armadura Requerida vs Mínima (cm²)
      </h4>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit=" cm²" />
          <Tooltip
            formatter={(val, name) => [`${val} cm²`, name]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="As X req" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          <Bar dataKey="As X min" fill="#93c5fd" radius={[3, 3, 0, 0]} />
          <Bar dataKey="As Y req" fill="#10b981" radius={[3, 3, 0, 0]} />
          <Bar dataKey="As Y min" fill="#6ee7b7" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ─── Diagrama de utilización (radar) ────────────────────────────────────────
const FULL_MARK = 100;

function buildRadarData(foundation) {
  const r = foundation.results;
  if (!r) return [];
  const soil = r.stresses?.utilization ?? 0;
  const punch = r.checks?.punching
    ? Math.min((r.checks.punching.Vu / r.checks.punching.Vc) * 100, 150)
    : 0;
  const shearX = r.checks?.shear_x
    ? Math.min((r.checks.shear_x.Vu / r.checks.shear_x.Vc) * 100, 150)
    : 0;
  const shearY = r.checks?.shear_y
    ? Math.min((r.checks.shear_y.Vu / r.checks.shear_y.Vc) * 100, 150)
    : 0;
  const asRatio = r.reinforcement
    ? Math.min((r.reinforcement.As_x / (r.reinforcement.As_min_x || 1)) * 50, 150)
    : 0;

  return [
    { check: 'Suelo',      value: parseFloat(soil.toFixed(1)),   full: FULL_MARK },
    { check: 'Punzonado',  value: parseFloat(punch.toFixed(1)),  full: FULL_MARK },
    { check: 'Corte X',   value: parseFloat(shearX.toFixed(1)), full: FULL_MARK },
    { check: 'Corte Y',   value: parseFloat(shearY.toFixed(1)), full: FULL_MARK },
    { check: 'Armadura',  value: parseFloat(asRatio.toFixed(1)),full: FULL_MARK },
  ];
}

export function UtilizationRadarChart({ foundation }) {
  const data = buildRadarData(foundation);
  if (data.length === 0) return null;

  return (
    <Card className="p-5">
      <h4 className="text-sm font-semibold text-slate-700 mb-1">
        Utilización — {foundation.name}
      </h4>
      <p className="text-xs text-slate-400 mb-3">100% = límite normativo</p>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="check" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 150]} tick={{ fontSize: 9 }} />
          <Radar
            name="Límite"
            dataKey="full"
            stroke="#f87171"
            fill="#fee2e2"
            fillOpacity={0.3}
          />
          <Radar
            name="Utilización"
            dataKey="value"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.4}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Tooltip
            formatter={(val) => [`${val}%`]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  );
}