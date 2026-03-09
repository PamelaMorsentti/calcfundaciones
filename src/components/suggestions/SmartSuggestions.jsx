import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Genera sugerencias inteligentes comparando el proyecto actual
 * con todos los proyectos existentes que tienen datos similares.
 */
function computeSuggestions(foundations, allFoundations, project) {
  const suggestions = [];
  if (!foundations.length) return suggestions;

  // ── 1. Estadísticas del proyecto actual ────────────────────────────────
  const verified = foundations.filter(f => f.status === 'verified');
  const failed = foundations.filter(f => f.status === 'failed');
  const withResults = foundations.filter(f => f.results?.reinforcement);

  const avgAs_x = withResults.length
    ? withResults.reduce((s, f) => s + (f.results.reinforcement.As_x || 0), 0) / withResults.length
    : null;

  const avgUtil = withResults.length
    ? withResults.reduce((s, f) => s + (f.results?.stresses?.utilization || 0), 0) / withResults.length
    : null;

  // ── 2. Bases similares de OTROS proyectos ─────────────────────────────
  const similar = allFoundations.filter(f =>
    f.project_id !== project.id &&
    f.status === 'verified' &&
    f.results?.dimensions &&
    f.concrete_fc === (project.concrete_strength || 210) &&
    f.steel_fy === (project.steel_yield || 4200)
  );

  // Dimensiones promedio de bases similares verificadas
  if (similar.length >= 2) {
    const avgA = similar.reduce((s, f) => s + (f.results.dimensions.A || 0), 0) / similar.length;
    const avgH = similar.reduce((s, f) => s + (f.base_height_H || 0), 0) / similar.length;
    suggestions.push({
      type: 'info',
      icon: TrendingUp,
      title: 'Dimensiones típicas para materiales similares',
      body: `En ${similar.length} bases verificadas con f'c=${project.concrete_strength || 210} kg/cm² y fy=${project.steel_yield || 4200} kg/cm², la dimensión promedio en planta es ${Math.round(avgA)} cm y la altura promedio es ${Math.round(avgH)} cm.`,
    });
  }

  // ── 3. Alta tasa de fallo ──────────────────────────────────────────────
  if (failed.length > 0 && foundations.length > 1) {
    const failRate = (failed.length / foundations.length) * 100;
    if (failRate >= 50) {
      suggestions.push({
        type: 'warning',
        icon: AlertCircle,
        title: `${Math.round(failRate)}% de bases no verifican`,
        body: 'Considera revisar la tensión admisible del terreno o incrementar la altura H globalmente. Usar el "Ajuste Automático" en cada base puede resolver los problemas de verificación rápidamente.',
      });
    }
  }

  // ── 4. Baja utilización del suelo ─────────────────────────────────────
  if (avgUtil !== null && avgUtil < 40 && verified.length > 1) {
    suggestions.push({
      type: 'info',
      icon: Lightbulb,
      title: 'Bases sobredimensionadas en planta',
      body: `La utilización promedio del suelo es ${avgUtil.toFixed(1)}%, muy por debajo del óptimo (70–90%). Considera usar el Motor de Optimización para reducir materiales y costo.`,
    });
  }

  // ── 5. Alta utilización del suelo ─────────────────────────────────────
  if (avgUtil !== null && avgUtil > 90) {
    suggestions.push({
      type: 'warning',
      icon: AlertCircle,
      title: 'Utilización del suelo cercana al límite',
      body: `La utilización promedio es ${avgUtil.toFixed(1)}%. Cualquier sobrecarga no considerada podría superar la tensión admisible. Verifica los factores de mayoración aplicados.`,
    });
  }

  // ── 6. Bases sin calcular ──────────────────────────────────────────────
  const pending = foundations.filter(f => f.status === 'pending' || !f.status);
  if (pending.length > 0) {
    suggestions.push({
      type: 'action',
      icon: Calculator,
      title: `${pending.length} base${pending.length > 1 ? 's' : ''} sin calcular`,
      body: `Las bases ${pending.map(f => f.name || 'Sin nombre').join(', ')} aún no tienen resultados. Ingresa a cada una para ejecutar el cálculo.`,
    });
  }

  // ── 7. Armadura elevada para la mayoría de bases ──────────────────────
  if (avgAs_x !== null && avgAs_x > 30 && withResults.length >= 2) {
    suggestions.push({
      type: 'info',
      icon: Lightbulb,
      title: 'Armadura significativa — considerar losa de cimentación',
      body: `Con un promedio de ${avgAs_x.toFixed(1)} cm² por base, puede ser más económico unificar las bases en una losa de cimentación. Usa el módulo "Nueva Losa" para evaluarlo.`,
    });
  }

  return suggestions;
}

const TYPE_STYLE = {
  info:    { border: 'border-blue-200',   bg: 'bg-blue-50',   icon: 'text-blue-500',   badge: 'bg-blue-100 text-blue-700'   },
  warning: { border: 'border-amber-200',  bg: 'bg-amber-50',  icon: 'text-amber-500',  badge: 'bg-amber-100 text-amber-700' },
  action:  { border: 'border-slate-200',  bg: 'bg-slate-50',  icon: 'text-slate-500',  badge: 'bg-slate-100 text-slate-700' },
  success: { border: 'border-emerald-200',bg: 'bg-emerald-50',icon: 'text-emerald-500',badge: 'bg-emerald-100 text-emerald-700' },
};

const TYPE_LABEL = { info: 'Sugerencia', warning: 'Atención', action: 'Acción', success: 'Bien' };

// Icono Calculator importado manualmente (lucide)
function Calculator({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/>
      <line x1="16" y1="10" x2="16" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/>
      <line x1="8" y1="10" x2="8" y2="10"/><line x1="16" y1="14" x2="16" y2="14"/>
      <line x1="12" y1="14" x2="12" y2="14"/><line x1="8" y1="14" x2="8" y2="14"/>
      <line x1="16" y1="18" x2="16" y2="18"/><line x1="12" y1="18" x2="12" y2="18"/>
      <line x1="8" y1="18" x2="8" y2="18"/>
    </svg>
  );
}

export default function SmartSuggestions({ foundations, allFoundations = [], project }) {
  const suggestions = useMemo(
    () => computeSuggestions(foundations, allFoundations, project),
    [foundations, allFoundations, project]
  );

  if (suggestions.length === 0) {
    return (
      <Card className="p-10 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
        <p className="text-slate-500 text-sm font-medium">Todo en orden</p>
        <p className="text-slate-400 text-xs mt-1">No hay sugerencias pendientes para este proyecto.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          Sugerencias Inteligentes
        </h3>
        <Badge variant="outline" className="text-xs">{suggestions.length} sugerencia{suggestions.length !== 1 ? 's' : ''}</Badge>
      </div>

      {suggestions.map((s, i) => {
        const style = TYPE_STYLE[s.type] || TYPE_STYLE.info;
        const Icon = s.icon;
        return (
          <Card key={i} className={`p-4 border ${style.border} ${style.bg}`}>
            <div className="flex items-start gap-3">
              <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${style.icon}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                    {TYPE_LABEL[s.type]}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{s.body}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}