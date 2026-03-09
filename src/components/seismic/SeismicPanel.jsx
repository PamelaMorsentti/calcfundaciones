import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Zap, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import {
  calculateSeismic,
  SEISMIC_ZONES,
  SOIL_TYPES,
  STRUCTURAL_SYSTEMS,
  IMPORTANCE_FACTORS,
} from '../calculations/SeismicCalculator';

const DEFAULT_PARAMS = {
  zone: 'zone_2',
  soil_type: 'S2',
  structural_system: 'DME',
  importance: 'normal',
  total_weight: 500000,
  n_floors: 5,
  floor_height: 3.0,
};

export default function SeismicPanel({ projectId }) {
  const queryClient = useQueryClient();
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [results, setResults] = useState(null);

  const { data: analyses } = useQuery({
    queryKey: ['seismic', projectId],
    queryFn: () => base44.entities.SeismicAnalysis.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  // Load latest analysis if exists
  useEffect(() => {
    if (analyses?.length > 0) {
      const latest = analyses[analyses.length - 1];
      setParams(p => ({ ...DEFAULT_PARAMS, ...latest }));
      if (latest.results) setResults(latest.results);
    }
  }, [analyses]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (analyses?.length > 0) {
        return base44.entities.SeismicAnalysis.update(analyses[analyses.length - 1].id, data);
      }
      return base44.entities.SeismicAnalysis.create(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seismic', projectId] }),
  });

  const set = (k, v) => setParams(p => ({ ...p, [k]: v }));

  const handleCalculate = () => {
    const r = calculateSeismic(params);
    setResults(r);
  };

  const handleSave = () => {
    saveMutation.mutate({ ...params, project_id: projectId, name: 'Análisis Sísmico', results, status: 'calculated' });
  };

  const zone = SEISMIC_ZONES[params.zone];
  const soil = SOIL_TYPES[params.soil_type];
  const sys = STRUCTURAL_SYSTEMS[params.structural_system];

  const floorChartData = results?.floor_forces?.map(f => ({
    piso: `P${f.floor}`,
    fuerza_tn: (f.force / 1000).toFixed(2),
    raw: f.force / 1000,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form */}
        <Card className="lg:col-span-4 p-5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg"><Zap className="w-5 h-5 text-amber-600" /></div>
            <h3 className="font-semibold text-slate-800">Parámetros Sísmicos</h3>
          </div>

          {/* Zona */}
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Zona Sísmica</Label>
            <Select value={params.zone} onValueChange={v => set('zone', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(SEISMIC_ZONES).map(([k, z]) => (
                  <SelectItem key={k} value={k}>{z.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Suelo */}
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Tipo de Suelo</Label>
            <Select value={params.soil_type} onValueChange={v => set('soil_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(SOIL_TYPES).map(([k, s]) => (
                  <SelectItem key={k} value={k}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sistema estructural */}
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Sistema Estructural</Label>
            <Select value={params.structural_system} onValueChange={v => set('structural_system', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STRUCTURAL_SYSTEMS).map(([k, s]) => (
                  <SelectItem key={k} value={k}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Importancia */}
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Importancia</Label>
            <Select value={params.importance} onValueChange={v => set('importance', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(IMPORTANCE_FACTORS).map(([k, f]) => (
                  <SelectItem key={k} value={k}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Peso total W (kg)</Label>
              <Input type="number" value={params.total_weight} step={10000}
                onChange={e => set('total_weight', parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">N° Pisos</Label>
              <Input type="number" value={params.n_floors} min={1} step={1}
                onChange={e => set('n_floors', parseInt(e.target.value) || 1)} className="h-9 text-sm" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs text-slate-500">Alt. de piso típico (m)</Label>
              <Input type="number" value={params.floor_height} min={2.5} step={0.25}
                onChange={e => set('floor_height', parseFloat(e.target.value) || 3)} className="h-9 text-sm" />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleCalculate} className="flex-1 bg-slate-900 hover:bg-slate-800">Calcular</Button>
            {results && (
              <Button onClick={handleSave} variant="outline" disabled={saveMutation.isPending}>
                <Save className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>

        {/* Results */}
        <div className="lg:col-span-8 space-y-5">
          {!results ? (
            <Card className="p-12 text-center">
              <Zap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Configure los parámetros y presione Calcular</p>
            </Card>
          ) : (
            <>
              {/* Key metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Período T', value: `${results.period.T.toFixed(3)} s`, sub: results.period.T_type, color: 'text-slate-800' },
                  { label: 'Coef. Ce', value: `${(results.coefficients.Ce * 100).toFixed(2)}%`, sub: `a₀=${results.coefficients.a0} · ψ=${results.coefficients.psi}`, color: 'text-blue-700' },
                  { label: 'Cortante V', value: `${(results.base_shear.V / 1000).toFixed(1)} tn`, sub: `Ce·W`, color: 'text-amber-700' },
                  { label: 'Momento volcador', value: `${(results.overturning_moment / 1000).toFixed(0)} tn·m`, sub: 'en base', color: 'text-red-700' },
                ].map(m => (
                  <Card key={m.label} className="p-4 text-center">
                    <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
                    <div className="text-sm font-medium text-slate-600 mt-1">{m.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{m.sub}</div>
                  </Card>
                ))}
              </div>

              {/* Zone indicator */}
              <Card className="p-4 flex items-center gap-4">
                <div className="w-4 h-12 rounded-full" style={{ backgroundColor: zone?.color }} />
                <div>
                  <p className="font-semibold text-slate-800">{zone?.name} · {soil?.name}</p>
                  <p className="text-sm text-slate-500">{sys?.name} · Rd = {results.coefficients.Rd} · γ = {results.coefficients.gamma}</p>
                </div>
                {results.coefficients.a0 >= 0.20 && (
                  <Badge className="ml-auto bg-red-100 text-red-700">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Zona de alto riesgo
                  </Badge>
                )}
              </Card>

              {/* Floor forces chart */}
              {floorChartData.length > 0 && (
                <Card className="p-5">
                  <h4 className="font-semibold text-slate-700 mb-4">Distribución de Fuerzas Sísmicas por Piso</h4>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={floorChartData} layout="vertical">
                        <XAxis type="number" tickFormatter={v => `${v} tn`} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="piso" width={30} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={v => [`${parseFloat(v).toFixed(2)} tn`, 'Fuerza']} />
                        <Bar dataKey="raw" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    Incremento estimado por columna: {(results.foundation_load_increment / 1000).toFixed(2)} tn (verificar con rigidez real)
                  </p>
                </Card>
              )}

              {/* Floor forces table */}
              <Card className="p-5">
                <h4 className="font-semibold text-slate-700 mb-3">Tabla de Fuerzas por Nivel</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-slate-500 text-xs">
                      <th className="text-left py-2">Piso</th>
                      <th className="text-right py-2">h (m)</th>
                      <th className="text-right py-2">w (tn)</th>
                      <th className="text-right py-2">Fx (tn)</th>
                      <th className="text-right py-2">w·h (tn·m)</th>
                    </tr></thead>
                    <tbody>
                      {results.floor_forces.map(f => (
                        <tr key={f.floor} className="border-b border-slate-100">
                          <td className="py-2 font-medium">Piso {f.floor}</td>
                          <td className="text-right py-2 font-mono">{f.height.toFixed(1)}</td>
                          <td className="text-right py-2 font-mono">{(f.weight / 1000).toFixed(1)}</td>
                          <td className="text-right py-2 font-mono font-bold text-blue-700">{(f.force / 1000).toFixed(2)}</td>
                          <td className="text-right py-2 font-mono text-slate-400">{((f.weight * f.height) / 1000).toFixed(0)}</td>
                        </tr>
                      ))}
                      <tr className="font-semibold text-slate-800 bg-slate-50">
                        <td className="py-2" colSpan={3}>TOTAL</td>
                        <td className="text-right py-2 font-mono text-blue-800">
                          {(results.base_shear.V / 1000).toFixed(2)} tn
                        </td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}