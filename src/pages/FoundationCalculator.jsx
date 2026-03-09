import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Save, 
  Building2,
  BarChart3,
  FileText,
  Scale,
  Box,
  Gauge,
  FileDown,
  Sparkles
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateFoundationDXF, downloadDXF } from '../components/export/DXFExporter';
import { optimizeFoundation, DEFAULT_COST_PARAMS } from '../components/calculations/OptimizationEngine';
import FoundationForm from '../components/forms/FoundationForm';
import FoundationResults from '../components/results/FoundationResults';
import FoundationDrawing from '../components/graphics/FoundationDrawing';
import UtilizationChart from '../components/results/UtilizationChart';
import Foundation3D from '../components/graphics/Foundation3D';
import { calculateFoundation, autoAdjustFoundation, NORMATIVES } from '../components/calculations/FoundationCalculator';

const DEFAULT_FOUNDATION = {
  name: "",
  type: "centered",
  calculation_mode: "design",
  column_load_N: 50000,
  total_load_P: 55000,
  column_cx: 30,
  column_cy: 30,
  base_width_A: 200,
  base_length_B: 200,
  base_height_H: 50,
  cover: 7.5,
  soil_capacity: 2,
  concrete_fc: 210,
  steel_fy: 4200,
  Mx_col: 0,
  My_col: 0
};

export default function FoundationCalculator() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId');
  const foundationId = urlParams.get('foundationId');
  const queryClient = useQueryClient();

  const [foundation, setFoundation] = useState(DEFAULT_FOUNDATION);
  const [results, setResults] = useState(null);
  const [selectedNormative, setSelectedNormative] = useState('CIRSOC_2005');
  const [isCalculating, setIsCalculating] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const liveTimerRef = useRef(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optResult, setOptResult] = useState(null);
  const [showOptDialog, setShowOptDialog] = useState(false);

  // Load project
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId
  });

  // Load existing foundation if editing
  const { data: existingFoundation } = useQuery({
    queryKey: ['foundation', foundationId],
    queryFn: async () => {
      const foundations = await base44.entities.Foundation.filter({ id: foundationId });
      return foundations[0];
    },
    enabled: !!foundationId
  });

  // Set foundation data when editing
  useEffect(() => {
    if (existingFoundation) {
      setFoundation({
        ...DEFAULT_FOUNDATION,
        ...existingFoundation
      });
      if (existingFoundation.results) {
        setResults(existingFoundation.results);
      }
    }
  }, [existingFoundation]);

  // Set project defaults
  useEffect(() => {
    if (project && !foundationId) {
      setFoundation(prev => ({
        ...prev,
        soil_capacity: project.soil_bearing_capacity || prev.soil_capacity,
        concrete_fc: project.concrete_strength || prev.concrete_fc,
        steel_fy: project.steel_yield || prev.steel_fy
      }));
      if (project.normative) {
        setSelectedNormative(project.normative);
      }
    }
  }, [project, foundationId]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (foundationId) {
        return base44.entities.Foundation.update(foundationId, data);
      } else {
        return base44.entities.Foundation.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foundations', projectId] });
    }
  });

  const handleCalculate = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      const calcResults = calculateFoundation({
        type: foundation.type,
        mode: foundation.calculation_mode,
        N: foundation.column_load_N,
        P: foundation.total_load_P,
        cx: foundation.column_cx,
        cy: foundation.column_cy,
        A: foundation.base_width_A,
        B: foundation.base_length_B,
        H: foundation.base_height_H,
        cover: foundation.cover,
        sigma_adm: foundation.soil_capacity,
        fc: foundation.concrete_fc,
        fy: foundation.steel_fy,
        Mx_col: foundation.Mx_col || 0,
        My_col: foundation.My_col || 0
      }, selectedNormative);

      setResults(calcResults);
      setIsCalculating(false);
    }, 500);
  };

  const handleAutoAdjust = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      const adjustResult = autoAdjustFoundation({
        type: foundation.type,
        mode: foundation.calculation_mode,
        N: foundation.column_load_N,
        P: foundation.total_load_P,
        cx: foundation.column_cx,
        cy: foundation.column_cy,
        A: foundation.base_width_A || 150,
        B: foundation.base_length_B || 150,
        H: foundation.base_height_H,
        cover: foundation.cover,
        sigma_adm: foundation.soil_capacity,
        fc: foundation.concrete_fc,
        fy: foundation.steel_fy,
        Mx_col: foundation.Mx_col || 0,
        My_col: foundation.My_col || 0
      }, selectedNormative);

      if (adjustResult.success) {
        setFoundation(prev => ({
          ...prev,
          base_width_A: adjustResult.finalData.A,
          base_length_B: adjustResult.finalData.B,
          base_height_H: adjustResult.finalData.H
        }));
        setResults(adjustResult.results);
      } else {
        setResults(adjustResult.results);
      }
      
      setIsCalculating(false);
    }, 500);
  };

  const handleApplySuggestion = (suggestion) => {
    const updated = { ...foundation };
    
    if (suggestion.suggested_A) updated.base_width_A = suggestion.suggested_A;
    if (suggestion.suggested_B) updated.base_length_B = suggestion.suggested_B;
    if (suggestion.suggested_H) updated.base_height_H = suggestion.suggested_H;
    
    setFoundation(updated);
    
    // Recalcular automáticamente
    setTimeout(() => {
      handleCalculate();
    }, 100);
  };

  // Live calculation: re-run whenever A, B, H change (debounced 150ms)
  useEffect(() => {
    if (!liveMode || !results) return;
    clearTimeout(liveTimerRef.current);
    liveTimerRef.current = setTimeout(() => {
      const calc = calculateFoundation({
        type: foundation.type,
        mode: foundation.calculation_mode,
        N: foundation.column_load_N,
        P: foundation.total_load_P,
        cx: foundation.column_cx,
        cy: foundation.column_cy,
        A: foundation.base_width_A,
        B: foundation.base_length_B,
        H: foundation.base_height_H,
        cover: foundation.cover,
        sigma_adm: foundation.soil_capacity,
        fc: foundation.concrete_fc,
        fy: foundation.steel_fy,
        Mx_col: foundation.Mx_col || 0,
        My_col: foundation.My_col || 0
      }, selectedNormative);
      setResults(calc);
    }, 150);
    return () => clearTimeout(liveTimerRef.current);
  }, [foundation.base_width_A, foundation.base_length_B, foundation.base_height_H, liveMode]);

  const handleIncrementalAdjust = (field, increment) => {
    setFoundation(prev => ({
      ...prev,
      [field]: Math.ceil((prev[field] + increment) / 5) * 5
    }));
  };

  const handleSave = async () => {
    const data = {
      ...foundation,
      project_id: projectId,
      results: results,
      status: results?.status || 'pending'
    };
    await saveMutation.mutateAsync(data);
  };

  const handleExportDXF = () => {
    const dxf = generateFoundationDXF(foundation, results, project?.name || '');
    const fname = `${project?.name || 'proyecto'}_${foundation.name || 'base'}.dxf`.replace(/\s+/g, '_');
    downloadDXF(dxf, fname);
  };

  const handleOptimize = () => {
    setOptimizing(true);
    setShowOptDialog(true);
    setTimeout(() => {
      const opt = optimizeFoundation({
        N: foundation.column_load_N,
        P: foundation.total_load_P,
        cx: foundation.column_cx,
        cy: foundation.column_cy,
        Mx_col: foundation.Mx_col || 0,
        My_col: foundation.My_col || 0,
        cover: foundation.cover,
        sigma_adm: foundation.soil_capacity,
        fc: foundation.concrete_fc,
        fy: foundation.steel_fy,
        type: foundation.type,
      }, selectedNormative, DEFAULT_COST_PARAMS);
      setOptResult(opt);
      setOptimizing(false);
    }, 800);
  };

  const handleApplyOptimal = () => {
    if (!optResult?.success) return;
    const { A, B, H } = optResult.optimal;
    setFoundation(prev => ({ ...prev, base_width_A: A, base_length_B: B, base_height_H: H }));
    setResults(optResult.results);
    setShowOptDialog(false);
  };

  const handleReset = () => {
    if (project) {
      setFoundation({
        ...DEFAULT_FOUNDATION,
        soil_capacity: project.soil_bearing_capacity || DEFAULT_FOUNDATION.soil_capacity,
        concrete_fc: project.concrete_strength || DEFAULT_FOUNDATION.concrete_fc,
        steel_fy: project.steel_yield || DEFAULT_FOUNDATION.steel_fy
      });
    } else {
      setFoundation(DEFAULT_FOUNDATION);
    }
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to={projectId ? createPageUrl(`ProjectDetail?id=${projectId}`) : createPageUrl('Projects')}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {project ? `Volver a ${project.name}` : 'Volver'}
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                {foundationId ? 'Editar Base' : 'Calcular Base'}
              </h1>
              <p className="text-slate-500 mt-1">
                Cálculo y verificación de zapatas aisladas
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <Label className="text-xs text-slate-500">Normativa</Label>
                <Select value={selectedNormative} onValueChange={setSelectedNormative}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NORMATIVES).map(([key, norm]) => (
                      <SelectItem key={key} value={key}>
                        {norm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {results && (
                <div className="flex gap-2">
                  <Button onClick={handleOptimize} variant="outline" disabled={optimizing}>
                    <Sparkles className="w-4 h-4 mr-1" />
                    Optimizar
                  </Button>
                  <Button onClick={handleExportDXF} variant="outline">
                    <FileDown className="w-4 h-4 mr-1" />
                    DXF
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="bg-slate-900 hover:bg-slate-800"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Panel */}
          <div className="lg:col-span-4">
            <Card className="p-6 sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-slate-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">Datos de Entrada</h2>
              </div>
              <FoundationForm
                foundation={foundation}
                onChange={setFoundation}
                onCalculate={handleCalculate}
                onReset={handleReset}
                isCalculating={isCalculating}
              />
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-8">
            {!results ? (
              <Card className="p-12 text-center">
                <Scale className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">
                  Ingrese los datos y presione Calcular
                </h3>
                <p className="text-slate-400">
                  Los resultados del cálculo aparecerán aquí
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Ajuste Rápido cuando no verifica */}
                {!results.checks?.all_ok && (
                  <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-amber-900 mb-1">Ajuste de Dimensiones</h4>
                        <p className="text-sm text-amber-700">
                          La base no verifica. Ajuste manualmente o use ajuste automático.
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          onClick={() => setLiveMode(v => !v)}
                          variant={liveMode ? "default" : "outline"}
                          size="sm"
                          className={liveMode ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                        >
                          {liveMode ? '⚡ Live ON' : '⚡ Live OFF'}
                        </Button>
                        <Button
                          onClick={handleAutoAdjust}
                          disabled={isCalculating}
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                          size="sm"
                        >
                          Ajuste Auto
                        </Button>
                      </div>
                    </div>

                    {/* Controles manuales */}
                    <div className="mt-4 pt-4 border-t border-amber-200">
                      <p className="text-xs text-amber-700 mb-3 font-medium">
                        Ajuste Manual {liveMode && <span className="text-blue-600">(Tiempo Real ⚡)</span>}:
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs text-amber-700">A: {foundation.base_width_A} cm</Label>
                          <div className="flex gap-1 mt-1">
                            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs"
                              onClick={() => handleIncrementalAdjust('base_width_A', -10)}>-10</Button>
                            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs"
                              onClick={() => handleIncrementalAdjust('base_width_A', 10)}>+10</Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-amber-700">B: {foundation.base_length_B} cm</Label>
                          <div className="flex gap-1 mt-1">
                            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs"
                              onClick={() => handleIncrementalAdjust('base_length_B', -10)}>-10</Button>
                            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs"
                              onClick={() => handleIncrementalAdjust('base_length_B', 10)}>+10</Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-amber-700">H: {foundation.base_height_H} cm</Label>
                          <div className="flex gap-1 mt-1">
                            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs"
                              onClick={() => handleIncrementalAdjust('base_height_H', -5)}>-5</Button>
                            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs"
                              onClick={() => handleIncrementalAdjust('base_height_H', 5)}>+5</Button>
                          </div>
                        </div>
                      </div>
                      {!liveMode && (
                        <Button onClick={handleCalculate} variant="outline" size="sm" className="w-full mt-3">
                          Recalcular con Ajustes
                        </Button>
                      )}
                    </div>
                  </Card>
                )}

                <Tabs defaultValue="results" className="space-y-6">
                   <TabsList className="bg-slate-100">
                     <TabsTrigger value="results" className="gap-2">
                       <BarChart3 className="w-4 h-4" />
                       Resultados
                     </TabsTrigger>
                     <TabsTrigger value="utilization" className="gap-2">
                       <Gauge className="w-4 h-4" />
                       Utilización
                     </TabsTrigger>
                     <TabsTrigger value="drawing" className="gap-2">
                       <FileText className="w-4 h-4" />
                       Planos
                     </TabsTrigger>
                     <TabsTrigger value="3d" className="gap-2">
                       <Box className="w-4 h-4" />
                       3D
                     </TabsTrigger>
                   </TabsList>

                   <TabsContent value="results">
                     <Card className="p-6">
                       <FoundationResults 
                         results={results}
                         onApplySuggestion={handleApplySuggestion}
                       />
                     </Card>
                   </TabsContent>

                   <TabsContent value="utilization">
                     <Card className="p-6">
                       <UtilizationChart results={results} />
                     </Card>
                   </TabsContent>

                   <TabsContent value="drawing">
                     <Card className="p-6">
                       <FoundationDrawing 
                         foundation={foundation}
                         results={results}
                         showReinforcement={true}
                       />
                     </Card>
                   </TabsContent>

                   <TabsContent value="3d">
                     <Card className="p-6">
                       <Foundation3D foundation={foundation} results={results} />
                     </Card>
                   </TabsContent>
                 </Tabs>
                 </div>
                 )}
                 </div>
                 </div>
                 </div>

                 {/* Dialog optimización */}
                 <Dialog open={showOptDialog} onOpenChange={setShowOptDialog}>
                 <DialogContent className="max-w-lg">
                 <DialogHeader>
                 <DialogTitle className="flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-indigo-600" /> Diseño Óptimo
                 </DialogTitle>
                 </DialogHeader>
                 {optimizing ? (
                 <div className="py-8 text-center">
                 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4" />
                 <p className="text-slate-600">Buscando la solución más económica...</p>
                 <p className="text-xs text-slate-400 mt-1">Grid search + refinamiento fino</p>
                 </div>
                 ) : optResult ? (
                 <div className="space-y-4">
                 {optResult.success ? (
                 <>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: 'A óptimo', value: `${optResult.optimal.A} cm` },
                      { label: 'B óptimo', value: `${optResult.optimal.B} cm` },
                      { label: 'H óptimo', value: `${optResult.optimal.H} cm` },
                    ].map(m => (
                      <div key={m.label} className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-xl font-bold text-indigo-700">{m.value}</div>
                        <div className="text-xs text-slate-500 mt-1">{m.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="text-lg font-bold text-indigo-800 mb-2">
                      Costo estimado: USD {optResult.optimal.cost.toFixed(0)}
                    </div>
                    <div className="text-sm text-indigo-600 space-y-1">
                      <div>Hormigón: {optResult.optimal.cost_breakdown.concrete_m3.toFixed(3)} m³ · USD {optResult.optimal.cost_breakdown.concrete_cost.toFixed(0)}</div>
                      <div>Acero: {optResult.optimal.cost_breakdown.steel_kg.toFixed(1)} kg · USD {optResult.optimal.cost_breakdown.steel_cost.toFixed(0)}</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 text-center">{optResult.iterations} combinaciones evaluadas</p>
                  <Button onClick={handleApplyOptimal} className="w-full bg-indigo-600 hover:bg-indigo-700">
                    Aplicar Dimensiones Óptimas
                  </Button>
                 </>
                 ) : (
                 <div className="py-6 text-center text-red-600">
                  <p className="font-semibold">{optResult.message}</p>
                  <p className="text-sm text-slate-500 mt-2">Ajuste los parámetros o amplíe el rango de búsqueda</p>
                 </div>
                 )}
                 </div>
                 ) : null}
                 </DialogContent>
                 </Dialog>
                 </div>
                 );
                 }