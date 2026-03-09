import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Plus, 
  Building2, 
  Calculator,
  FileText,
  Settings,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Zap,
  Scale,
  LayoutGrid,
  History,
  Lightbulb,
  BarChart2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ReportGenerator from '../components/reports/ReportGenerator';
import PrintableReport from '../components/reports/PrintableReport';
import FoundationTable from '../components/reports/FoundationTable';
import SeismicPanel from '../components/seismic/SeismicPanel';
import NormativeBenchmark from '../components/reports/NormativeBenchmark';
import ProjectTimeline from '../components/history/ProjectTimeline';
import SmartSuggestions from '../components/suggestions/SmartSuggestions';
import { ReinforcementComparisonChart, UtilizationRadarChart } from '../components/reports/ReinforcementChart';

const TYPE_LABELS = {
  centered: 'Centrada',
  edge: 'Medianera',
  corner: 'Esquina'
};

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-100', label: 'Pendiente' },
  calculated: { icon: Calculator, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Calculada' },
  verified: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100', label: 'Verificada' },
  failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100', label: 'No Verifica' }
};

export default function ProjectDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId
  });

  const { data: foundations = [], isLoading: loadingFoundations } = useQuery({
    queryKey: ['foundations', projectId],
    queryFn: () => base44.entities.Foundation.filter({ project_id: projectId }),
    enabled: !!projectId
  });

  // Para sugerencias inteligentes: todas las bases de otros proyectos
  const { data: allFoundations = [] } = useQuery({
    queryKey: ['allFoundations'],
    queryFn: () => base44.entities.Foundation.list(),
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Foundation.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['foundations', projectId] })
  });

  if (loadingProject) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <AlertTriangle className="w-16 h-16 text-amber-400 mb-4" />
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Proyecto no encontrado</h2>
        <Link to={createPageUrl('Projects')}>
          <Button variant="outline">Volver a Proyectos</Button>
        </Link>
      </div>
    );
  }

  const stats = {
    total: foundations.length,
    verified: foundations.filter(f => f.status === 'verified').length,
    failed: foundations.filter(f => f.status === 'failed').length,
    pending: foundations.filter(f => f.status === 'pending' || !f.status).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to={createPageUrl('Projects')}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Proyectos
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
              <p className="text-slate-500 mt-1">
                {project.client && `${project.client} • `}
                {project.location && project.location}
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={foundations.length === 0}>
                    <Download className="w-4 h-4 mr-2" />
                    Generar Reporte
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Generar Reporte del Proyecto</DialogTitle>
                  </DialogHeader>
                  <ReportGenerator 
                    project={project}
                    foundations={foundations}
                    onClose={() => setIsReportDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              <Link to={createPageUrl(`SlabCalculator?projectId=${projectId}`)}>
                <Button variant="outline">
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Nueva Losa
                </Button>
              </Link>
              <Link to={createPageUrl(`FoundationCalculator?projectId=${projectId}`)}>
                <Button className="bg-slate-900 hover:bg-slate-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Base
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
            <div className="text-sm text-slate-500">Total Bases</div>
          </Card>
          <Card className="p-4">
            <div className="text-3xl font-bold text-emerald-600">{stats.verified}</div>
            <div className="text-sm text-slate-500">Verificadas</div>
          </Card>
          <Card className="p-4">
            <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-slate-500">No Verifican</div>
          </Card>
          <Card className="p-4">
            <div className="text-3xl font-bold text-slate-400">{stats.pending}</div>
            <div className="text-sm text-slate-500">Pendientes</div>
          </Card>
        </div>

        <Tabs defaultValue="foundations" className="space-y-6">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="foundations" className="gap-2">
              <Building2 className="w-4 h-4" />
              Bases ({foundations.length})
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <FileText className="w-4 h-4" />
              Tabla Resumen
            </TabsTrigger>
            <TabsTrigger value="seismic" className="gap-2">
              <Zap className="w-4 h-4" />
              Sísmica
            </TabsTrigger>
            <TabsTrigger value="benchmark" className="gap-2">
              <Scale className="w-4 h-4" />
              Benchmark
            </TabsTrigger>
            <TabsTrigger value="charts" className="gap-2">
              <BarChart2 className="w-4 h-4" />
              Gráficos
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <History className="w-4 h-4" />
              Historial
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="gap-2">
              <Lightbulb className="w-4 h-4" />
              Sugerencias
            </TabsTrigger>
            <TabsTrigger value="info" className="gap-2">
              <Settings className="w-4 h-4" />
              Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="foundations">
            {loadingFoundations ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3].map(i => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                  </Card>
                ))}
              </div>
            ) : foundations.length === 0 ? (
              <Card className="p-12 text-center">
                <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No hay bases calculadas</h3>
                <p className="text-slate-400 mb-6">Agregue la primera base a este proyecto</p>
                <Link to={createPageUrl(`FoundationCalculator?projectId=${projectId}`)}>
                  <Button className="bg-slate-900">
                    <Plus className="w-4 h-4 mr-2" />
                    Calcular Primera Base
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {foundations.map(foundation => {
                  const statusConfig = STATUS_CONFIG[foundation.status || 'pending'];
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <Link 
                      key={foundation.id}
                      to={createPageUrl(`FoundationCalculator?projectId=${projectId}&foundationId=${foundation.id}`)}
                    >
                      <Card className="p-5 hover:shadow-lg transition-all border-slate-200 hover:border-slate-300 group">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`p-2 rounded-lg ${statusConfig.bg}`}>
                            <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault();
                              if (confirm('¿Eliminar esta base?')) {
                                deleteMutation.mutate(foundation.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-slate-800 mb-1">
                          {foundation.name || 'Sin nombre'}
                        </h3>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            {TYPE_LABELS[foundation.type] || foundation.type}
                          </Badge>
                          <Badge className={statusConfig.bg + ' ' + statusConfig.color}>
                            {statusConfig.label}
                          </Badge>
                        </div>

                        {foundation.results?.dimensions && (
                          <div className="text-sm text-slate-500 space-y-1">
                            <div>
                              Dimensiones: {foundation.results.dimensions.A} x {foundation.results.dimensions.B} cm
                            </div>
                            <div>
                              Carga: {(foundation.total_load_P / 1000).toFixed(1)} ton
                            </div>
                          </div>
                        )}
                        
                        {!foundation.results?.dimensions && (
                          <div className="text-sm text-slate-400">
                            N: {foundation.column_load_N?.toLocaleString()} kg
                          </div>
                        )}
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="table">
            {foundations.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No hay datos para mostrar</h3>
                <p className="text-slate-400">Calcule al menos una base para ver la tabla resumen</p>
              </Card>
            ) : (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Tabla Resumen de Bases</h3>
                <FoundationTable foundations={foundations} />
              </Card>
            )}
          </TabsContent>

          <TabsContent value="seismic">
            <SeismicPanel projectId={projectId} />
          </TabsContent>

          <TabsContent value="benchmark">
            <NormativeBenchmark foundations={foundations} project={project} />
          </TabsContent>

          {/* 8.1 Gráficos comparativos */}
          <TabsContent value="charts">
            {foundations.filter(f => f.results?.reinforcement).length === 0 ? (
              <Card className="p-12 text-center">
                <BarChart2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">Sin datos de armadura</h3>
                <p className="text-slate-400">Calcule al menos una base para ver los gráficos</p>
              </Card>
            ) : (
              <div className="space-y-6">
                <ReinforcementComparisonChart foundations={foundations} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {foundations.filter(f => f.results?.checks).map(f => (
                    <UtilizationRadarChart key={f.id} foundation={f} />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* 8.2 Línea de tiempo */}
          <TabsContent value="timeline">
            <ProjectTimeline foundations={foundations} project={project} />
          </TabsContent>

          {/* 8.3 Sugerencias inteligentes */}
          <TabsContent value="suggestions">
            <SmartSuggestions
              foundations={foundations}
              allFoundations={allFoundations}
              project={project}
            />
          </TabsContent>

          <TabsContent value="info">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Información del Proyecto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-slate-500">Nombre</div>
                    <div className="font-medium">{project.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Cliente</div>
                    <div className="font-medium">{project.client || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Ubicación</div>
                    <div className="font-medium">{project.location || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Ingeniero</div>
                    <div className="font-medium">{project.engineer || '-'}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-slate-500">Normativa</div>
                    <div className="font-medium">{project.normative || 'CIRSOC 201-2005'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">σ adm terreno</div>
                    <div className="font-medium">{project.soil_bearing_capacity || 2} kg/cm²</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">f'c hormigón</div>
                    <div className="font-medium">{project.concrete_strength || 210} kg/cm²</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">fy acero</div>
                    <div className="font-medium">{project.steel_yield || 4200} kg/cm²</div>
                  </div>
                </div>
              </div>
              {project.notes && (
                <div className="mt-6 pt-6 border-t">
                  <div className="text-sm text-slate-500 mb-2">Notas</div>
                  <div className="text-slate-700">{project.notes}</div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reporte imprimible (oculto en pantalla) */}
        <PrintableReport 
          project={project}
          foundations={foundations}
          includeGraphics={true}
        />
      </div>
    </div>
  );
}