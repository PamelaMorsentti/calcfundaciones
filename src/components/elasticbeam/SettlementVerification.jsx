import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, TrendingDown } from 'lucide-react';

const ADM_SETTLEMENT_MM = 25; // mm — límite típico CIRSOC/ACI para estructuras normales
const ADM_DIFF_SETTLEMENT_MM = 20; // mm — asentamiento diferencial admisible

export default function SettlementVerification({ results, columns, beamWidth }) {
  if (!results?.points?.length) return null;

  const { maxValues, points } = results;

  // Asentamiento máximo (deflexión máxima de la viga = asentamiento del suelo)
  const max_defl_cm = maxValues.deflection || 0;
  const max_defl_mm = max_defl_cm * 10;

  // Asentamientos en cada columna
  const col_settlements = (columns || []).map(col => {
    const xTarget = col.x; // m
    let closest = points[0];
    let minDist = Infinity;
    for (const pt of points) {
      const d = Math.abs(pt.x - xTarget);
      if (d < minDist) { minDist = d; closest = pt; }
    }
    // Para vigas finitas, se guarda la deflexión; para analíticas usamos presión/C
    const defl_cm = closest.deflection ?? (closest.pressure / (results.input?.C || 3));
    return { ...col, settlement_mm: Math.abs(defl_cm) * 10, x: xTarget };
  });

  // Asentamiento diferencial máximo
  const settlements = col_settlements.map(c => c.settlement_mm);
  const max_s = Math.max(...settlements, 0);
  const min_s = Math.min(...settlements, 0);
  const diff_settlement = max_s - (min_s >= 0 ? min_s : 0);

  const s_ok = max_defl_mm <= ADM_SETTLEMENT_MM;
  const diff_ok = diff_settlement <= ADM_DIFF_SETTLEMENT_MM;

  // Verificación estructural básica
  const Mu = maxValues.moment; // kg·cm
  const Vu = maxValues.shear;  // kg

  const b_cm = (beamWidth || 0.4) * 100;
  const fc = results.input?.fc || 210;    // kg/cm²
  const fy = results.input?.fy || 4200;   // kg/cm²
  const cover = results.input?.cover || 7.5;
  const h_cm = (results.input?.height || 0.6) * 100;
  const d = h_cm - cover - 1;

  // Armadura requerida (método simplificado)
  const phi_flex = 0.90, phi_shear = 0.75;
  const As_req = Mu > 0 ? Mu / (phi_flex * fy * 0.9 * d) : 0;
  const As_min = 0.0018 * b_cm * d;
  const As_design = Math.max(As_req, As_min);

  // Capacidad de corte del hormigón
  const Vc = phi_shear * 0.53 * Math.sqrt(fc) * b_cm * d / 1000; // kg
  const shear_ok = Vu <= Vc * 1000;

  // Propuesta de barras para As_design
  const DIAMETERS = [10, 12, 16, 20, 25, 32];
  let barsProposal = null;
  for (const dia of DIAMETERS) {
    const Ab = Math.PI * Math.pow(dia / 20, 2); // cm²
    const n = Math.ceil(As_design / Ab);
    if (n <= 8) { barsProposal = { n, dia, total: n * Ab }; break; }
  }

  const StatusBadge = ({ ok, label }) => ok
    ? <Badge className="bg-emerald-100 text-emerald-700 gap-1"><CheckCircle2 className="w-3 h-3"/>{label}</Badge>
    : <Badge className="bg-red-100 text-red-700 gap-1"><XCircle className="w-3 h-3"/>{label}</Badge>;

  return (
    <div className="space-y-4">
      {/* Asentamientos */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-4 h-4 text-blue-500" />
          <h4 className="text-sm font-semibold text-slate-800">Verificación de Asentamientos</h4>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`p-3 rounded-lg ${s_ok ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <div className="text-xs text-slate-500 mb-1">Asentamiento máximo</div>
            <div className={`text-xl font-bold ${s_ok ? 'text-emerald-700' : 'text-red-700'}`}>
              {max_defl_mm.toFixed(1)} mm
            </div>
            <div className="text-xs text-slate-400">Límite: {ADM_SETTLEMENT_MM} mm</div>
            <div className="mt-1"><StatusBadge ok={s_ok} label={s_ok ? 'OK' : 'Excede límite'} /></div>
          </div>
          <div className={`p-3 rounded-lg ${diff_ok ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <div className="text-xs text-slate-500 mb-1">Asent. diferencial</div>
            <div className={`text-xl font-bold ${diff_ok ? 'text-emerald-700' : 'text-red-700'}`}>
              {diff_settlement.toFixed(1)} mm
            </div>
            <div className="text-xs text-slate-400">Límite: {ADM_DIFF_SETTLEMENT_MM} mm</div>
            <div className="mt-1"><StatusBadge ok={diff_ok} label={diff_ok ? 'OK' : 'Excede límite'} /></div>
          </div>
        </div>

        {col_settlements.length > 0 && (
          <div>
            <div className="text-xs font-medium text-slate-600 mb-2">Asentamiento por columna</div>
            <div className="space-y-2">
              {col_settlements.map((c, i) => {
                const ratio = max_s > 0 ? c.settlement_mm / max_s : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-12 font-mono">{c.name}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full transition-all"
                        style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-slate-700 w-16 text-right">
                      {c.settlement_mm.toFixed(2)} mm
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Verificación Estructural */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h4 className="text-sm font-semibold text-slate-800">Verificación Estructural de la Viga</h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Mu máx.</div>
            <div className="text-base font-bold text-slate-800">{(Mu / 100000).toFixed(2)} t·m</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Vu máx.</div>
            <div className="text-base font-bold text-slate-800">{(Vu / 1000).toFixed(2)} ton</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">As req.</div>
            <div className="text-base font-bold text-slate-800">{As_design.toFixed(2)} cm²</div>
          </div>
          <div className={`p-3 rounded-lg ${shear_ok ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <div className="text-xs text-slate-500">Corte</div>
            <div className={`text-base font-bold ${shear_ok ? 'text-emerald-700' : 'text-red-700'}`}>
              {shear_ok ? 'OK' : 'No OK'}
            </div>
            <div className="text-xs text-slate-400">Vc = {(Vc).toFixed(1)} ton</div>
          </div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs font-semibold text-blue-800 mb-1">Armadura Longitudinal Propuesta</div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm font-mono font-bold text-blue-900">
                {barsProposal ? `${barsProposal.n}Ø${barsProposal.dia} = ${barsProposal.total.toFixed(2)} cm²` : `As = ${As_design.toFixed(2)} cm²`}
              </span>
            </div>
            <div className="text-xs text-blue-600">
              As min = {As_min.toFixed(2)} cm²
            </div>
          </div>
          <div className="text-xs text-blue-500 mt-1">
            Disposición: cara inferior (momento positivo) + cara superior (zonas con momento negativo)
          </div>
        </div>
      </Card>
    </div>
  );
}