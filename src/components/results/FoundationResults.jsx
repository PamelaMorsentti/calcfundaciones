import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { formatNumber } from '../calculations/FoundationCalculator';

export default function FoundationResults({ results, onApplySuggestion }) {
  if (!results) return null;

  const StatusBadge = ({ ok, label }) => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
    }`}>
      {ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Estado General */}
      <div className={`p-4 rounded-xl ${
        results.checks?.all_ok 
          ? 'bg-emerald-50 border border-emerald-200' 
          : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center gap-3">
          {results.checks?.all_ok 
            ? <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            : <XCircle className="w-6 h-6 text-red-600" />
          }
          <div>
            <h3 className={`font-semibold ${results.checks?.all_ok ? 'text-emerald-800' : 'text-red-800'}`}>
              {results.checks?.all_ok ? 'Base Verificada Correctamente' : 'Base No Verifica'}
            </h3>
            <p className={`text-sm ${results.checks?.all_ok ? 'text-emerald-600' : 'text-red-600'}`}>
              {results.checks?.all_ok 
                ? 'Todas las verificaciones son satisfactorias' 
                : 'Algunas verificaciones no cumplen con la normativa'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Sugerencias cuando no verifica */}
      {!results.checks?.all_ok && results.suggestions && results.suggestions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-amber-800 mb-3">Sugerencias de Ajuste</h4>
              <div className="space-y-3">
                {results.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start justify-between gap-3 p-3 bg-white rounded-lg">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span className="text-sm text-amber-700">{suggestion.message}</span>
                    </div>
                    {onApplySuggestion && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-300 text-amber-700 hover:bg-amber-100 shrink-0"
                        onClick={() => onApplySuggestion(suggestion)}
                      >
                        Aplicar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dimensiones */}
      <div className="bg-slate-50 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Dimensiones Resultantes
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-800">{results.dimensions?.A}</p>
            <p className="text-xs text-slate-500">A (cm)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-800">{results.dimensions?.B}</p>
            <p className="text-xs text-slate-500">B (cm)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-800">
              {(results.dimensions?.A * results.dimensions?.B / 10000).toFixed(2)}
            </p>
            <p className="text-xs text-slate-500">Área (m²)</p>
          </div>
        </div>
      </div>

      {/* Tensiones */}
      <div className="bg-slate-50 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Tensiones del Terreno
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Tensión actuante (σ)</span>
            <span className="font-mono font-semibold">{formatNumber(results.stresses?.sigma)} kg/cm²</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Tensión admisible (σadm)</span>
            <span className="font-mono font-semibold">{formatNumber(results.stresses?.sigma_adm)} kg/cm²</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                results.stresses?.utilization <= 100 ? 'bg-emerald-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(results.stresses?.utilization || 0, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Utilización</span>
            <span className={`font-semibold ${
              results.stresses?.utilization <= 100 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {formatNumber(results.stresses?.utilization, 1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Momentos */}
      <div className="bg-slate-50 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Momentos Flectores
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500">Mx (kg·cm/cm)</p>
            <p className="font-mono font-semibold text-lg">{formatNumber(results.stresses?.Mx)}</p>
            <p className="text-xs text-slate-400">Volado: {formatNumber(results.stresses?.vx, 1)} cm</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">My (kg·cm/cm)</p>
            <p className="font-mono font-semibold text-lg">{formatNumber(results.stresses?.My)}</p>
            <p className="text-xs text-slate-400">Volado: {formatNumber(results.stresses?.vy, 1)} cm</p>
          </div>
        </div>
      </div>

      {/* Armadura */}
      <div className="bg-slate-50 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Armadura Requerida
        </h4>
        <div className="space-y-4">
          {[
            { label: 'Armadura en X', as: results.reinforcement?.As_x, bars: results.reinforcement?.bars_x, sec: results.reinforcement?.section_x, color: 'text-red-600' },
            { label: 'Armadura en Y', as: results.reinforcement?.As_y, bars: results.reinforcement?.bars_y, sec: results.reinforcement?.section_y, color: 'text-blue-600' },
          ].map(({ label, as, bars, sec, color }) => {
            const stateLabel = { 'tension-controlled': '✓ Controlada por tracción', 'transition': '⚠ Zona de transición', 'compression-controlled': '✗ Controlada por compresión', 'zero': '' }[sec?.state] || '';
            const stateColor = { 'tension-controlled': 'text-emerald-600', 'transition': 'text-amber-600', 'compression-controlled': 'text-red-600', 'zero': '' }[sec?.state] || '';
            return (
              <div key={label} className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{label}</p>
                    <p className="text-xs text-slate-500">As = {formatNumber(as)} cm²</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${color}`}>{bars?.description}</p>
                    <p className="text-xs text-slate-400">Provisto: {formatNumber(bars?.area_provided)} cm²</p>
                  </div>
                </div>
                {sec && sec.state !== 'zero' && (
                  <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100 text-xs">
                    <span className={`font-semibold ${stateColor}`}>{stateLabel}</span>
                    <span className="text-slate-400">β₁ = {sec.beta1?.toFixed(3)}</span>
                    <span className="text-slate-400">a = {formatNumber(sec.a, 1)} cm</span>
                    <span className="text-slate-400">εt = {sec.et?.toFixed(4)}</span>
                    {sec.is_over_reinforced && <span className="text-red-600 font-bold">⚠ Sobre-reforzada</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Excentricidad (si hay momentos) */}
      {results.stresses?.has_eccentricity && (
        <div className="bg-violet-50 rounded-xl p-4 border border-violet-200">
          <h4 className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-3">
            Excentricidad de Carga
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-violet-500">ex (eje X)</span>
              <p className="font-mono font-semibold">{formatNumber(results.stresses?.ex, 1)} cm</p>
            </div>
            <div>
              <span className="text-violet-500">ey (eje Y)</span>
              <p className="font-mono font-semibold">{formatNumber(results.stresses?.ey, 1)} cm</p>
            </div>
            <div>
              <span className="text-violet-500">σ máxima</span>
              <p className="font-mono font-semibold">{formatNumber(results.stresses?.sigma, 3)} kg/cm²</p>
            </div>
            <div>
              <span className="text-violet-500">σ mínima</span>
              <p className={`font-mono font-semibold ${results.stresses?.sigma_min < 0 ? 'text-red-600' : ''}`}>
                {formatNumber(results.stresses?.sigma_min, 3)} kg/cm²
              </p>
            </div>
          </div>
          {!results.stresses?.kern_ok && (
            <p className="mt-2 text-xs text-red-600 font-semibold">
              ⚠ Tracción bajo la zapata. Verifique núcleo central o aumente dimensiones.
            </p>
          )}
        </div>
      )}

      {/* Verificaciones */}
      <div className="bg-slate-50 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Verificaciones
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <StatusBadge ok={results.checks?.soil_ok} label="Tensión del suelo" />
          <StatusBadge ok={results.checks?.punching?.ok} label="Punzonado" />
          <StatusBadge ok={results.checks?.shear_x?.ok} label="Corte en X" />
          <StatusBadge ok={results.checks?.shear_y?.ok} label="Corte en Y" />
          {results.checks?.development_x !== undefined && (
            <StatusBadge ok={results.checks?.development_x} label="Anclaje barras X" />
          )}
          {results.checks?.development_y !== undefined && (
            <StatusBadge ok={results.checks?.development_y} label="Anclaje barras Y" />
          )}
        </div>
        
        {results.checks?.punching && (
          <div className="mt-4 p-3 bg-white rounded-lg text-sm">
            <p className="text-slate-600">
              <strong>Punzonado:</strong> Vu = {formatNumber(results.checks.punching.Vu)} kg / 
              Vc = {formatNumber(results.checks.punching.Vc)} kg 
              ({formatNumber(results.checks.punching.ratio, 1)}%)
            </p>
          </div>
        )}
      </div>

      {/* Longitud de Anclaje */}
      {results.development_length && (
        <div className="bg-slate-50 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Longitud de Anclaje y Desarrollo
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 font-semibold mb-1">Armadura en X (Ø{results.development_length.db_x * 10}mm)</p>
              <p className="text-slate-600">ld recta: <span className="font-mono font-semibold">{formatNumber(results.development_length.ld_x, 1)} cm</span></p>
              <p className="text-slate-600">ld gancho: <span className="font-mono font-semibold">{formatNumber(results.development_length.ld_hook_x, 1)} cm</span></p>
              <p className="text-slate-600">Disponible: <span className="font-mono font-semibold">{formatNumber(results.development_length.l_avail_x, 1)} cm</span></p>
              <p className={`mt-1 text-xs font-semibold ${results.development_length.anchor_ok_x ? 'text-emerald-600' : 'text-red-600'}`}>
                {results.development_length.detail_x === 'straight' ? '✓ Barra recta' 
                  : results.development_length.detail_x === 'hook' ? '✓ Requiere gancho 90°' 
                  : '✗ Longitud insuficiente'}
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 font-semibold mb-1">Armadura en Y (Ø{results.development_length.db_y * 10}mm)</p>
              <p className="text-slate-600">ld recta: <span className="font-mono font-semibold">{formatNumber(results.development_length.ld_y, 1)} cm</span></p>
              <p className="text-slate-600">ld gancho: <span className="font-mono font-semibold">{formatNumber(results.development_length.ld_hook_y, 1)} cm</span></p>
              <p className="text-slate-600">Disponible: <span className="font-mono font-semibold">{formatNumber(results.development_length.l_avail_y, 1)} cm</span></p>
              <p className={`mt-1 text-xs font-semibold ${results.development_length.anchor_ok_y ? 'text-emerald-600' : 'text-red-600'}`}>
                {results.development_length.detail_y === 'straight' ? '✓ Barra recta' 
                  : results.development_length.detail_y === 'hook' ? '✓ Requiere gancho 90°' 
                  : '✗ Longitud insuficiente'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}