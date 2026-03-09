import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

export default function BeamDiagram({ results, showPressure = true, showMoment = true, showShear = true }) {
  if (!results?.points?.length) return null;

  const data = results.points.map(p => ({
    x: p.x.toFixed(2),
    pressure: showPressure ? p.pressure : null,
    moment: showMoment ? p.moment : null,
    shear: showShear ? p.shear : null
  }));

  return (
    <div className="space-y-6">
      {/* Diagrama de Presiones */}
      {showPressure && (
        <div className="bg-slate-50 rounded-xl p-4">
          <h4 className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide">
            Presión del Terreno (kg/cm²)
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="x" 
                tick={{ fontSize: 10 }} 
                label={{ value: 'x (m)', position: 'bottom', fontSize: 10 }}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(value) => [value?.toFixed(4) + ' kg/cm²', 'Presión']}
              />
              <Line 
                type="monotone" 
                dataKey="pressure" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={false}
                fill="#fef3c7"
              />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-xs text-slate-500 mt-2">
            Máx: {results.maxValues.pressure?.toFixed(4)} kg/cm² @ x = {results.maxValues.pressureAt?.toFixed(2)} m
          </div>
        </div>
      )}

      {/* Diagrama de Momentos */}
      {showMoment && (
        <div className="bg-slate-50 rounded-xl p-4">
          <h4 className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide">
            Momento Flector (kg·cm)
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="x" 
                tick={{ fontSize: 10 }}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(value) => [value?.toFixed(2) + ' kg·cm', 'Momento']}
              />
              <Line 
                type="monotone" 
                dataKey="moment" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
              />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-xs text-slate-500 mt-2">
            Máx: {results.maxValues.moment?.toFixed(2)} kg·cm @ x = {results.maxValues.momentAt?.toFixed(2)} m
          </div>
        </div>
      )}

      {/* Diagrama de Corte */}
      {showShear && (
        <div className="bg-slate-50 rounded-xl p-4">
          <h4 className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide">
            Esfuerzo de Corte (kg)
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="x" 
                tick={{ fontSize: 10 }}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(value) => [value?.toFixed(2) + ' kg', 'Corte']}
              />
              <Line 
                type="monotone" 
                dataKey="shear" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={false}
              />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-xs text-slate-500 mt-2">
            Máx: {results.maxValues.shear?.toFixed(2)} kg @ x = {results.maxValues.shearAt?.toFixed(2)} m
          </div>
        </div>
      )}
    </div>
  );
}