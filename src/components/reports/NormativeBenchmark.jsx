import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateFoundation, NORMATIVES } from '../calculations/FoundationCalculator';
import { Scale, CheckCircle2, XCircle, Play } from 'lucide-react';

const NORM_COLORS = {
  CIRSOC_2005: '#3b82f6',
  CIRSOC_1982: '#8b5cf6',
  ACI_318:     '#f59e0b',
  EUROCODE_2:  '#10b981',
};

export default function NormativeBenchmark({ foundations, project }) {
  const [benchmark, setBenchmark] = useState(null);
  const [running, setRunning] = useState(false);
  const [selectedFoundation, setSelectedFoundation] = useState(foundations[0]?.id || null);

  const runBenchmark = () => {
    setRunning(true);
    setTimeout(() => {
      const results = {};
      foundations.forEach(f => {
        results[f.id] = {};
        Object.keys(NORMATIVES).forEach(norm => {
          try {
            results[f.id][norm] = calculateFoundation({
              type: f.type || 'centered',
              mode: 'verification',
              N: f.column_load_N,
              P: f.total_load_P,
              cx: f.column_cx || 30,
              cy: f.column_cy || 30,
              A: f.base_width_A || f.results?.dimensions?.A || 200,
              B: f.base_length_B || f.results?.dimensions?.B || 200,
              H: f.base_height_H || 50,
              cover: f.cover || 7.5,
              sigma_adm: f.soil_capacity || project?.soil_bearing_capacity || 2,
              fc: f.concrete_fc || project?.concrete_strength || 210,
              fy: f.steel_fy || project?.steel_yield || 4200,
              Mx_col: f.Mx_col || 0,
              My_col: f.My_col || 0,
            }, norm);
          } catch (e) {
            results[f.id][norm] = null;
          }
        });
      });
      setBenchmark(results);
      setRunning(false);
    }, 600);
  };

  const sel = foundations.find(f => f.id === selectedFoundation);
  const selResults = benchmark?.[selectedFoundation];

  // Build chart data for the selected foundation
  const chartData = selResults ? Object.entries(selResults).map(([norm, r]) => ({
    norm: norm.replace('_', ' '),
    'Suelo (%)': r?.stresses?.utilization ? Math.round(r.stresses.utilization) : 0,
    'Punzonado (%)': r?.checks?.punching?.Vu && r?.checks?.punching?.Vc
      ? Math.round((r.checks.punching.Vu / r.checks.punching.Vc) * 100) : 0,
    'As X (cm²)': r?.reinforcement?.As_x ? parseFloat(r.reinforcement.As_x.toFixed(1)) : 0,
  })) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg"><Scale className="w-5 h-5 text-indigo-600" /></div>
          <div>
            <h3 className="font-semibold text-slate-800">Benchmark Normativo</h3>
            <p className="text-sm text-slate-500">Comparación CIRSOC 2005 · CIRSOC 1982 · ACI 318 · EUROCODE 2</p>
          </div>
        </div>
        <Button onClick={runBenchmark} disabled={running || foundations.length === 0} className="bg-indigo-600 hover:bg-indigo-700">
          <Play className="w-4 h-4 mr-2" />
          {running ? 'Calculando...' : 'Ejecutar Benchmark'}
        </Button>
      </div>

      {foundations.length === 0 && (
        <Card className="p-8 text-center text-slate-400">No hay bases calculadas en este proyecto</Card>
      )}

      {benchmark && (
        <>
          {/* Foundation selector */}
          <div className="flex gap-2 flex-wrap">
            {foundations.map(f => (
              <Button
                key={f.id}
                variant={selectedFoundation === f.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFoundation(f.id)}
              >
                {f.name || 'Sin nombre'}
              </Button>
            ))}
          </div>

          {selResults && sel && (
            <>
              {/* Status table */}
              <Card className="p-5">
                <h4 className="font-semibold text-slate-700 mb-4">Base: {sel.name} — Verificaciones por Normativa</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-slate-500 text-xs">
                        <th className="text-left py-2 pr-4">Verificación</th>
                        {Object.keys(NORMATIVES).map(n => (
                          <th key={n} className="text-center py-2 px-2" style={{ color: NORM_COLORS[n] }}>{n.replace('_', ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: 'Suelo', fn: r => `${r?.stresses?.utilization?.toFixed(0) || '-'}%`, okFn: r => r?.checks?.soil_ok },
                        { key: 'Punzonado', fn: r => r?.checks?.punching ? `${((r.checks.punching.Vu / r.checks.punching.Vc) * 100).toFixed(0)}%` : '-', okFn: r => r?.checks?.punching?.ok },
                        { key: 'Corte X', fn: r => r?.checks?.shear_x ? `${((r.checks.shear_x.Vu / r.checks.shear_x.Vc) * 100).toFixed(0)}%` : '-', okFn: r => r?.checks?.shear_x?.ok },
                        { key: 'Corte Y', fn: r => r?.checks?.shear_y ? `${((r.checks.shear_y.Vu / r.checks.shear_y.Vc) * 100).toFixed(0)}%` : '-', okFn: r => r?.checks?.shear_y?.ok },
                        { key: 'As X (cm²)', fn: r => r?.reinforcement?.As_x?.toFixed(2) || '-', okFn: () => true },
                        { key: 'As Y (cm²)', fn: r => r?.reinforcement?.As_y?.toFixed(2) || '-', okFn: () => true },
                        { key: 'Arm. X', fn: r => r?.reinforcement?.bars_x?.description || '-', okFn: () => true },
                      ].map(row => (
                        <tr key={row.key} className="border-b border-slate-100">
                          <td className="py-2 pr-4 font-medium text-slate-600">{row.key}</td>
                          {Object.keys(NORMATIVES).map(n => {
                            const r = selResults[n];
                            const ok = row.okFn(r);
                            return (
                              <td key={n} className="text-center py-2 px-2">
                                <span className={`font-mono text-xs ${ok === false ? 'text-red-600 font-bold' : ok === true ? 'text-emerald-700' : 'text-slate-600'}`}>
                                  {row.fn(r)}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      {/* Verifica overall */}
                      <tr className="bg-slate-50 font-semibold">
                        <td className="py-2 pr-4">Verifica</td>
                        {Object.keys(NORMATIVES).map(n => {
                          const ok = selResults[n]?.checks?.all_ok;
                          return (
                            <td key={n} className="text-center py-2">
                              {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Card className="p-5">
                  <h4 className="font-semibold text-slate-700 mb-4">Utilización Suelo y Punzonado</h4>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="norm" tick={{ fontSize: 10 }} />
                        <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={v => `${v}%`} />
                        <Legend />
                        <Bar dataKey="Suelo (%)" fill="#3b82f6" radius={[4,4,0,0]} />
                        <Bar dataKey="Punzonado (%)" fill="#f59e0b" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-5">
                  <h4 className="font-semibold text-slate-700 mb-4">Acero X requerido (cm²)</h4>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="norm" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="As X (cm²)" fill="#10b981" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}