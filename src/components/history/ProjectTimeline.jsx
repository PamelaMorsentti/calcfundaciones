import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, CheckCircle2, XCircle, Calculator, Edit3, Trash2, Plus
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_CONFIG = {
  pending:    { icon: Clock,          color: 'text-slate-400',  bg: 'bg-slate-100',   label: 'Pendiente' },
  calculated: { icon: Calculator,     color: 'text-blue-500',   bg: 'bg-blue-100',    label: 'Calculada' },
  verified:   { icon: CheckCircle2,   color: 'text-emerald-500',bg: 'bg-emerald-100', label: 'Verificada' },
  failed:     { icon: XCircle,        color: 'text-red-500',    bg: 'bg-red-100',     label: 'No verifica' },
};

function buildEvents(foundations) {
  const events = [];

  foundations.forEach(f => {
    // Creación
    if (f.created_date) {
      events.push({
        id: `${f.id}-created`,
        date: new Date(f.created_date),
        type: 'created',
        foundation: f,
        icon: Plus,
        color: 'text-slate-600',
        bg: 'bg-slate-100',
        title: `Base "${f.name}" creada`,
        detail: f.type === 'centered' ? 'Centrada' : f.type === 'edge' ? 'Medianera' : 'Esquina',
      });
    }

    // Última actualización (si difiere de creación)
    if (f.updated_date && f.updated_date !== f.created_date) {
      const statusCfg = STATUS_CONFIG[f.status] || STATUS_CONFIG.pending;
      const Icon = f.status === 'verified' ? CheckCircle2
                 : f.status === 'failed'   ? XCircle
                 : Edit3;
      events.push({
        id: `${f.id}-updated`,
        date: new Date(f.updated_date),
        type: 'updated',
        foundation: f,
        icon: Icon,
        color: statusCfg.color,
        bg: statusCfg.bg,
        title: `Base "${f.name}" actualizada`,
        detail: statusCfg.label,
        dims: f.results?.dimensions
          ? `${f.results.dimensions.A}×${f.results.dimensions.B} cm, H=${f.base_height_H} cm`
          : null,
      });
    }
  });

  return events.sort((a, b) => b.date - a.date);
}

export default function ProjectTimeline({ foundations, project }) {
  const events = useMemo(() => buildEvents(foundations), [foundations]);

  if (events.length === 0) {
    return (
      <Card className="p-10 text-center">
        <Clock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">No hay eventos registrados aún.</p>
        <p className="text-slate-300 text-xs mt-1">Los eventos aparecerán cuando calcule o modifique bases.</p>
      </Card>
    );
  }

  // Agrupar por día
  const grouped = events.reduce((acc, ev) => {
    const day = format(ev.date, 'yyyy-MM-dd');
    if (!acc[day]) acc[day] = { label: format(ev.date, "EEEE d 'de' MMMM yyyy", { locale: es }), events: [] };
    acc[day].events.push(ev);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800">Historial de Cambios</h3>
        <Badge variant="outline" className="text-xs">{events.length} evento{events.length !== 1 ? 's' : ''}</Badge>
      </div>

      {Object.entries(grouped).map(([day, group]) => (
        <div key={day}>
          {/* Separador de día */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium text-slate-500 capitalize">{group.label}</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="relative">
            {/* Línea vertical */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />

            <div className="space-y-4">
              {group.events.map(ev => {
                const Icon = ev.icon;
                return (
                  <div key={ev.id} className="flex gap-4 pl-2">
                    {/* Nodo */}
                    <div className={`relative z-10 flex-shrink-0 w-6 h-6 rounded-full ${ev.bg} flex items-center justify-center mt-1`}>
                      <Icon className={`w-3 h-3 ${ev.color}`} />
                    </div>

                    {/* Contenido */}
                    <Card className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{ev.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{ev.detail}</p>
                          {ev.dims && (
                            <p className="text-xs text-blue-600 font-mono mt-1">{ev.dims}</p>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {formatDistanceToNow(ev.date, { addSuffix: true, locale: es })}
                        </span>
                      </div>

                      {/* Datos de armadura si hay resultados */}
                      {ev.foundation.results?.reinforcement && ev.type === 'updated' && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex gap-4 text-xs text-slate-500">
                          <span>
                            As X: <strong className="text-slate-700">
                              {ev.foundation.results.reinforcement.bars_x?.description || '-'}
                            </strong>
                          </span>
                          <span>
                            As Y: <strong className="text-slate-700">
                              {ev.foundation.results.reinforcement.bars_y?.description || '-'}
                            </strong>
                          </span>
                        </div>
                      )}
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}