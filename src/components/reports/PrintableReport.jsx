import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import FoundationDrawing from '../graphics/FoundationDrawing';
import { formatNumber } from '../calculations/FoundationCalculator';

export default function PrintableReport({ project, foundations, includeGraphics = true }) {
  return (
    <div className="print-only bg-white p-8 space-y-8">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 2cm;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .page-break { page-break-after: always; }
        }
        @media screen {
          .print-only { display: none; }
        }
      `}</style>

      {/* Portada */}
      <div className="text-center space-y-6 page-break">
        <div className="text-4xl font-bold text-slate-900 mb-4">
          CÁLCULO DE FUNDACIONES
        </div>
        <div className="text-2xl font-semibold text-slate-700">
          {project.name}
        </div>
        <div className="space-y-2 text-slate-600 mt-8">
          {project.client && (
            <div>
              <span className="font-medium">Cliente:</span> {project.client}
            </div>
          )}
          {project.location && (
            <div>
              <span className="font-medium">Ubicación:</span> {project.location}
            </div>
          )}
          {project.engineer && (
            <div>
              <span className="font-medium">Ingeniero:</span> {project.engineer}
            </div>
          )}
          <div>
            <span className="font-medium">Fecha:</span> {format(new Date(), 'dd MMMM yyyy', { locale: es })}
          </div>
          <div>
            <span className="font-medium">Normativa:</span> {project.normative || 'CIRSOC 201-2005'}
          </div>
        </div>
      </div>

      {/* Datos del Proyecto */}
      <div className="page-break">
        <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b-2 border-slate-300 pb-2">
          1. DATOS DEL PROYECTO
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-semibold text-slate-700">Tensión admisible del terreno:</div>
            <div>{project.soil_bearing_capacity || 2} kg/cm²</div>
          </div>
          <div>
            <div className="font-semibold text-slate-700">Resistencia del hormigón (f'c):</div>
            <div>{project.concrete_strength || 210} kg/cm²</div>
          </div>
          <div>
            <div className="font-semibold text-slate-700">Tensión de fluencia del acero (fy):</div>
            <div>{project.steel_yield || 4200} kg/cm²</div>
          </div>
          <div>
            <div className="font-semibold text-slate-700">Cantidad de bases:</div>
            <div>{foundations.length}</div>
          </div>
        </div>
        {project.notes && (
          <div className="mt-4">
            <div className="font-semibold text-slate-700">Observaciones:</div>
            <div className="text-slate-600">{project.notes}</div>
          </div>
        )}
      </div>

      {/* Resumen de Bases */}
      <div className="page-break">
        <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b-2 border-slate-300 pb-2">
          2. RESUMEN DE BASES
        </h2>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 p-2 text-left">Base</th>
              <th className="border border-slate-300 p-2">Tipo</th>
              <th className="border border-slate-300 p-2">N (kg)</th>
              <th className="border border-slate-300 p-2">A×B (cm)</th>
              <th className="border border-slate-300 p-2">H (cm)</th>
              <th className="border border-slate-300 p-2">Arm. X</th>
              <th className="border border-slate-300 p-2">Arm. Y</th>
              <th className="border border-slate-300 p-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {foundations.map((f, idx) => (
              <tr key={idx}>
                <td className="border border-slate-300 p-2 font-medium">{f.name}</td>
                <td className="border border-slate-300 p-2 text-center">{f.type}</td>
                <td className="border border-slate-300 p-2 text-right">
                  {f.column_load_N?.toLocaleString()}
                </td>
                <td className="border border-slate-300 p-2 text-center">
                  {f.results?.dimensions?.A || f.base_width_A} × {f.results?.dimensions?.B || f.base_length_B}
                </td>
                <td className="border border-slate-300 p-2 text-center">{f.base_height_H}</td>
                <td className="border border-slate-300 p-2 text-center text-xs">
                  {f.results?.reinforcement?.bars_x?.description || '-'}
                </td>
                <td className="border border-slate-300 p-2 text-center text-xs">
                  {f.results?.reinforcement?.bars_y?.description || '-'}
                </td>
                <td className="border border-slate-300 p-2 text-center">
                  {f.status === 'verified' ? '✓' : f.status === 'failed' ? '✗' : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detalle de cada base */}
      {foundations.map((foundation, idx) => (
        <div key={foundation.id} className="page-break">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b-2 border-slate-300 pb-2">
            {idx + 3}. BASE {foundation.name}
          </h2>

          <div className="space-y-6">
            {/* Datos de Entrada */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">3.1. Datos de Entrada</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-slate-600">Tipo de Base:</div>
                  <div>{foundation.type}</div>
                </div>
                <div>
                  <div className="font-medium text-slate-600">Carga N:</div>
                  <div>{foundation.column_load_N?.toLocaleString()} kg</div>
                </div>
                <div>
                  <div className="font-medium text-slate-600">Carga Total P:</div>
                  <div>{foundation.total_load_P?.toLocaleString()} kg</div>
                </div>
                <div>
                  <div className="font-medium text-slate-600">Columna cx:</div>
                  <div>{foundation.column_cx} cm</div>
                </div>
                <div>
                  <div className="font-medium text-slate-600">Columna cy:</div>
                  <div>{foundation.column_cy} cm</div>
                </div>
                <div>
                  <div className="font-medium text-slate-600">Altura H:</div>
                  <div>{foundation.base_height_H} cm</div>
                </div>
              </div>
            </div>

            {/* Resultados */}
            {foundation.results && (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">3.2. Dimensiones</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-slate-600">Ancho A:</div>
                      <div className="text-lg">{foundation.results.dimensions?.A} cm</div>
                    </div>
                    <div>
                      <div className="font-medium text-slate-600">Largo B:</div>
                      <div className="text-lg">{foundation.results.dimensions?.B} cm</div>
                    </div>
                    <div>
                      <div className="font-medium text-slate-600">Área:</div>
                      <div className="text-lg">
                        {((foundation.results.dimensions?.A * foundation.results.dimensions?.B) / 10000).toFixed(2)} m²
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">3.3. Tensiones</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-slate-600">σ actuante:</div>
                      <div>{formatNumber(foundation.results.stresses?.sigma)} kg/cm²</div>
                    </div>
                    <div>
                      <div className="font-medium text-slate-600">σ admisible:</div>
                      <div>{formatNumber(foundation.results.stresses?.sigma_adm)} kg/cm²</div>
                    </div>
                    <div>
                      <div className="font-medium text-slate-600">Utilización:</div>
                      <div>{formatNumber(foundation.results.stresses?.utilization, 1)}%</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">3.4. Armadura</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-slate-600">Armadura en X:</div>
                      <div className="text-lg font-semibold text-red-600">
                        {foundation.results.reinforcement?.bars_x?.description}
                      </div>
                      <div className="text-xs text-slate-500">
                        As = {formatNumber(foundation.results.reinforcement?.As_x)} cm²
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-slate-600">Armadura en Y:</div>
                      <div className="text-lg font-semibold text-blue-600">
                        {foundation.results.reinforcement?.bars_y?.description}
                      </div>
                      <div className="text-xs text-slate-500">
                        As = {formatNumber(foundation.results.reinforcement?.As_y)} cm²
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">3.5. Verificaciones</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={foundation.results.checks?.soil_ok ? 'text-green-600' : 'text-red-600'}>
                        {foundation.results.checks?.soil_ok ? '✓' : '✗'}
                      </span>
                      <span>Tensión del terreno</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={foundation.results.checks?.punching?.ok ? 'text-green-600' : 'text-red-600'}>
                        {foundation.results.checks?.punching?.ok ? '✓' : '✗'}
                      </span>
                      <span>Punzonado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={foundation.results.checks?.shear_x?.ok ? 'text-green-600' : 'text-red-600'}>
                        {foundation.results.checks?.shear_x?.ok ? '✓' : '✗'}
                      </span>
                      <span>Corte en X</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={foundation.results.checks?.shear_y?.ok ? 'text-green-600' : 'text-red-600'}>
                        {foundation.results.checks?.shear_y?.ok ? '✓' : '✗'}
                      </span>
                      <span>Corte en Y</span>
                    </div>
                  </div>
                </div>

                {/* Gráficos */}
                {includeGraphics && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">3.6. Gráficos</h3>
                    <FoundationDrawing
                      foundation={foundation}
                      results={foundation.results}
                      showReinforcement={true}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}