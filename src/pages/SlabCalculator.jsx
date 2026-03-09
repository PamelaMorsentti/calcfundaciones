import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Layers, RotateCcw, CheckCircle2, XCircle, Wand2 } from 'lucide-react';
import { calculateSlab, autoAdjustSlab } from '../components/calculations/SlabCalculator';

const DEFAULT = {
  name: 'L1',
  slab_Lx: 800, slab_Ly: 1000, slab_h: 50,
  total_load: 500000,
  n_cols_x: 3, n_cols_y: 4,
  col_cx: 30, col_cy: 30,
  cover: 7.5,
  soil_capacity: 2,
  concrete_fc: 210,
  steel_fy: 4200,
};

function Field({ label, name, value, onChange, unit = '', min, step = 1 }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-slate-500">{label} {unit && <span className="text-slate-400">({unit})</span>}</Label>
      <Input
        type="number" value={value} min={min} step={step}
        onChange={e => onChange(name, parseFloat(e.target.value) || 0)}
        className="h-9 text-sm"
      />
    </div>
  );
}

export default function SlabCalculator() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId');
  const slabId = urlParams.get('slabId');
  const queryClient = useQueryClient();

  const [slab, setSlab] = useState(DEFAULT);
  const [results, setResults] = useState(null);
  const [isCalc, setIsCalc] = useState(false);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => (await base44.entities.Project.filter({ id: projectId }))[0],
    enabled: !!projectId,
  });

  const { data: existingSlab } = useQuery({
    queryKey: ['slab', slabId],
    queryFn: async () => (await base44.entities.SlabFoundation.filter({ id: slabId }))[0],
    enabled: !!slabId,
  });

  useEffect(() => {
    if (existingSlab) {
      setSlab({ ...DEFAULT, ...existingSlab });
      if (existingSlab.results) setResults(existingSlab.results);
    }
  }, [existingSlab]);

  useEffect(() => {
    if (project && !slabId) {
      setSlab(prev => ({
        ...prev,
        soil_capacity: project.soil_bearing_capacity || prev.soil_capacity,
        concrete_fc: project.concrete_strength || prev.concrete_fc,
        steel_fy: project.steel_yield || prev.steel_fy,
      }));
    }
  }, [project, slabId]);

  const saveMutation = useMutation({
    mutationFn: (data) => slabId
      ? base44.entities.SlabFoundation.update(slabId, data)
      : base44.entities.SlabFoundation.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['slabs', projectId] }),
  });

  const handleChange = (name, value) => setSlab(prev => ({ ...prev, [name]: value }));

  const handleCalculate = () => {
    setIsCalc(true);
    setTimeout(() => {
      const r = calculateSlab({
        Lx: slab.slab_Lx, Ly: slab.slab_Ly, h: slab.slab_h,
        total_load: slab.total_load,
        n_cols_x: slab.n_cols_x, n_cols_y: slab.n_cols_y,
        col_cx: slab.col_cx, col_cy: slab.col_cy,
        cover: slab.cover,
        soil_capacity: slab.soil_capacity,
        concrete_fc: slab.concrete_fc,
        steel_fy: slab.steel_fy,
      });
      setResults(r);
      setIsCalc(false);
    }, 300);
  };

  const handleAutoAdjust = () => {
    setIsCalc(true);
    setTimeout(() => {
      const adj = autoAdjustSlab({
        Lx: slab.slab_Lx, Ly: slab.slab_Ly, slab_h: slab.slab_h,
        total_load: slab.total_load,
        n_cols_x: slab.n_cols_x, n_cols_y: slab.n_cols_y,
        col_cx: slab.col_cx, col_cy: slab.col_cy,
        cover: slab.cover,
        soil_capacity: slab.soil_capacity,
        concrete_fc: slab.concrete_fc,
        steel_fy: slab.steel_fy,
      });
      if (adj.success) setSlab(prev => ({ ...prev, slab_h: adj.h }));
      setResults(adj.results);
      setIsCalc(false);
    }, 300);
  };

  const handleSave = () => {
    saveMutation.mutate({ ...slab, project_id: projectId, results, status: results?.status || 'pending' });
  };

  const CheckBadge = ({ ok, label }) => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
      {ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {label}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to={projectId ? createPageUrl(`ProjectDetail?id=${projectId}`) : createPageUrl('Projects')}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-4">
            <ArrowLeft className="w-4 h-4" />
            {project ? `Volver a ${project.name}` : 'Volver'}
          </Link>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Losa de Cimentación</h1>
              <p className="text-slate-500 mt-1">Método Czerny · Verificación ACI 318 / CIRSOC</p>
            </div>
            {results && (
              <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-slate-900 hover:bg-slate-800">
                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <div className="lg:col-span-4">
            <Card className="p-6 sticky top-8 space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg"><Layers className="w-5 h-5 text-slate-600" /></div>
                <h2 className="text-lg font-semibold text-slate-800">Datos de la Losa</h2>
              </div>

              <Field label="Identificador" name="name" value={slab.name} onChange={handleChange} />

              <div className="pt-2 border-t">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Geometría</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Lx" name="slab_Lx" value={slab.slab_Lx} onChange={handleChange} unit="cm" min={100} step={10} />
                  <Field label="Ly" name="slab_Ly" value={slab.slab_Ly} onChange={handleChange} unit="cm" min={100} step={10} />
                  <Field label="Espesor h" name="slab_h" value={slab.slab_h} onChange={handleChange} unit="cm" min={20} step={5} />
                  <Field label="Recubrim." name="cover" value={slab.cover} onChange={handleChange} unit="cm" min={5} step={0.5} />
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Carga y Columnas</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Field label="Carga total P" name="total_load" value={slab.total_load} onChange={handleChange} unit="kg" min={1000} step={1000} />
                  </div>
                  <Field label="Col. en X" name="n_cols_x" value={slab.n_cols_x} onChange={handleChange} min={1} step={1} />
                  <Field label="Col. en Y" name="n_cols_y" value={slab.n_cols_y} onChange={handleChange} min={1} step={1} />
                  <Field label="cx col." name="col_cx" value={slab.col_cx} onChange={handleChange} unit="cm" min={20} step={5} />
                  <Field label="cy col." name="col_cy" value={slab.col_cy} onChange={handleChange} unit="cm" min={20} step={5} />
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Materiales</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="σ adm" name="soil_capacity" value={slab.soil_capacity} onChange={handleChange} unit="kg/cm²" min={0.5} step={0.25} />
                  <Field label="f'c" name="concrete_fc" value={slab.concrete_fc} onChange={handleChange} unit="kg/cm²" min={170} step={10} />
                  <div className="col-span-2">
                    <Field label="fy" name="steel_fy" value={slab.steel_fy} onChange={handleChange} unit="kg/cm²" min={2800} step={100} />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleCalculate} disabled={isCalc} className="flex-1 bg-slate-900 hover:bg-slate-800">
                  {isCalc ? 'Calculando...' : 'Calcular'}
                </Button>
                <Button onClick={handleAutoAdjust} disabled={isCalc} variant="outline" className="flex-1">
                  <Wand2 className="w-4 h-4 mr-1" /> Auto h
                </Button>
                <Button onClick={() => { setSlab(DEFAULT); setResults(null); }} variant="ghost" size="icon">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-8">
            {!results ? (
              <Card className="p-12 text-center">
                <Layers className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">Ingrese los datos y presione Calcular</h3>
              </Card>
            ) : (
              <div className="space-y-5">
                {/* Status */}
                <Card className={`p-5 ${results.checks.all_ok ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    {results.checks.all_ok
                      ? <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      : <XCircle className="w-6 h-6 text-red-600" />}
                    <h3 className={`font-semibold text-lg ${results.checks.all_ok ? 'text-emerald-800' : 'text-red-800'}`}>
                      {results.checks.all_ok ? 'Losa VERIFICA ✓' : 'Losa NO VERIFICA ✗'}
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <CheckBadge ok={results.checks.soil_ok} label={`Suelo (${results.soil.utilization.toFixed(0)}%)`} />
                    <CheckBadge ok={results.checks.thickness_ok} label={`Espesor min ${results.depth.h_min.toFixed(0)} cm`} />
                    <CheckBadge ok={results.checks.punching_ok} label={`Punzonado (${results.punching.utilization.toFixed(0)}%)`} />
                  </div>
                  {results.suggestions?.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {results.suggestions.map((s, i) => (
                        <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                          <span>▶</span>{s.msg}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                {/* Geometry & Soil */}
                <div className="grid grid-cols-2 gap-5">
                  <Card className="p-5">
                    <h4 className="font-semibold text-slate-700 mb-3">Geometría</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Dimensiones</span><span className="font-mono">{slab.slab_Lx} × {slab.slab_Ly} cm</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Espesor h</span><span className="font-mono">{slab.slab_h} cm</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Área</span><span className="font-mono">{results.geometry.area_m2.toFixed(2)} m²</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Volumen H°</span><span className="font-mono">{results.geometry.volume_m3.toFixed(2)} m³</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">d efectivo</span><span className="font-mono">{results.depth.d.toFixed(1)} cm</span></div>
                    </div>
                  </Card>

                  <Card className="p-5">
                    <h4 className="font-semibold text-slate-700 mb-3">Tensiones y Momentos</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">σ suelo</span><span className="font-mono font-semibold">{results.soil.q.toFixed(3)} kg/cm²</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Utilización suelo</span><span className={`font-mono ${results.soil.utilization > 100 ? 'text-red-600' : 'text-emerald-600'}`}>{results.soil.utilization.toFixed(1)}%</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Vano min</span><span className="font-mono">{results.spans.lmin.toFixed(0)} cm</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">α Czerny (ax/ay)</span><span className="font-mono">{results.czerny.ax.toFixed(4)} / {results.czerny.ay.toFixed(4)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Mx · My</span><span className="font-mono">{results.moments.Mx.toFixed(2)} / {results.moments.My.toFixed(2)} tn·m/m</span></div>
                    </div>
                  </Card>
                </div>

                {/* Reinforcement */}
                <Card className="p-5">
                  <h4 className="font-semibold text-slate-700 mb-4">Armadura</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Dirección X (paralelas a X)</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">As req.</span><span className="font-mono">{results.reinforcement.As_x_req.toFixed(2)} cm²/m</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">As mín.</span><span className="font-mono">{results.reinforcement.As_min.toFixed(2)} cm²/m</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">As diseño</span><span className="font-mono font-bold">{results.reinforcement.As_x.toFixed(2)} cm²/m</span></div>
                        <div className="mt-2 px-3 py-2 bg-slate-100 rounded-lg font-mono text-sm font-semibold text-slate-800">
                          {results.reinforcement.bars_x.description}
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Dirección Y (paralelas a Y)</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">As req.</span><span className="font-mono">{results.reinforcement.As_y_req.toFixed(2)} cm²/m</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">As mín.</span><span className="font-mono">{results.reinforcement.As_min.toFixed(2)} cm²/m</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">As diseño</span><span className="font-mono font-bold">{results.reinforcement.As_y.toFixed(2)} cm²/m</span></div>
                        <div className="mt-2 px-3 py-2 bg-slate-100 rounded-lg font-mono text-sm font-semibold text-slate-800">
                          {results.reinforcement.bars_y.description}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Punching */}
                <Card className="p-5">
                  <h4 className="font-semibold text-slate-700 mb-3">Punzonado (columna interior)</h4>
                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="font-mono font-bold">{(results.punching.N_col/1000).toFixed(1)} tn</div>
                      <div className="text-xs text-slate-500 mt-1">N por columna</div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="font-mono font-bold">{results.punching.b0.toFixed(0)} cm</div>
                      <div className="text-xs text-slate-500 mt-1">Perímetro b₀</div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="font-mono font-bold">{(results.punching.Vc/1000).toFixed(1)} tn</div>
                      <div className="text-xs text-slate-500 mt-1">Vc (capacidad)</div>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${results.checks.punching_ok ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      <div className={`font-mono font-bold ${results.checks.punching_ok ? 'text-emerald-700' : 'text-red-700'}`}>
                        {results.punching.utilization.toFixed(0)}%
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Utilización</div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}