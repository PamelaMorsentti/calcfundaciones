import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import { formatNumber } from '../calculations/FoundationCalculator';

export default function FoundationTable({ foundations }) {
  const exportToCSV = () => {
    const headers = [
      'Base',
      'Tipo',
      'N (kg)',
      'P (kg)',
      'cx (cm)',
      'cy (cm)',
      'A (cm)',
      'B (cm)',
      'H (cm)',
      'σ act (kg/cm²)',
      'σ adm (kg/cm²)',
      'Util %',
      'Mx (kg·cm/cm)',
      'My (kg·cm/cm)',
      'As X (cm²)',
      'As Y (cm²)',
      'Arm X',
      'Arm Y',
      'Punzonado',
      'Corte X',
      'Corte Y',
      'Estado'
    ];

    const rows = foundations.map(f => [
      f.name || '',
      f.type || '',
      f.column_load_N || '',
      f.total_load_P || '',
      f.column_cx || '',
      f.column_cy || '',
      f.results?.dimensions?.A || f.base_width_A || '',
      f.results?.dimensions?.B || f.base_length_B || '',
      f.base_height_H || '',
      f.results?.stresses?.sigma?.toFixed(3) || '',
      f.results?.stresses?.sigma_adm?.toFixed(3) || '',
      f.results?.stresses?.utilization?.toFixed(1) || '',
      f.results?.stresses?.Mx?.toFixed(2) || '',
      f.results?.stresses?.My?.toFixed(2) || '',
      f.results?.reinforcement?.As_x?.toFixed(2) || '',
      f.results?.reinforcement?.As_y?.toFixed(2) || '',
      f.results?.reinforcement?.bars_x?.description || '',
      f.results?.reinforcement?.bars_y?.description || '',
      f.results?.checks?.punching?.ok ? 'OK' : 'NO',
      f.results?.checks?.shear_x?.ok ? 'OK' : 'NO',
      f.results?.checks?.shear_y?.ok ? 'OK' : 'NO',
      f.status || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bases_detallado.csv`;
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={exportToCSV} variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar Tabla a CSV
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">Base</TableHead>
              <TableHead className="font-semibold">Tipo</TableHead>
              <TableHead className="font-semibold text-right">N (kg)</TableHead>
              <TableHead className="font-semibold text-right">A×B (cm)</TableHead>
              <TableHead className="font-semibold text-right">H (cm)</TableHead>
              <TableHead className="font-semibold text-right">σ (kg/cm²)</TableHead>
              <TableHead className="font-semibold text-right">Util %</TableHead>
              <TableHead className="font-semibold">Arm X</TableHead>
              <TableHead className="font-semibold">Arm Y</TableHead>
              <TableHead className="font-semibold text-center">Verif</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {foundations.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.name || '-'}</TableCell>
                <TableCell className="text-xs">{f.type}</TableCell>
                <TableCell className="text-right">{f.column_load_N?.toLocaleString()}</TableCell>
                <TableCell className="text-right text-xs">
                  {f.results?.dimensions?.A || f.base_width_A} × {f.results?.dimensions?.B || f.base_length_B}
                </TableCell>
                <TableCell className="text-right">{f.base_height_H}</TableCell>
                <TableCell className="text-right">
                  {f.results?.stresses?.sigma ? formatNumber(f.results.stresses.sigma, 3) : '-'}
                </TableCell>
                <TableCell className="text-right">
                  {f.results?.stresses?.utilization ? (
                    <span className={f.results.stresses.utilization > 100 ? 'text-red-600 font-semibold' : ''}>
                      {formatNumber(f.results.stresses.utilization, 1)}%
                    </span>
                  ) : '-'}
                </TableCell>
                <TableCell className="text-xs">
                  {f.results?.reinforcement?.bars_x?.description || '-'}
                </TableCell>
                <TableCell className="text-xs">
                  {f.results?.reinforcement?.bars_y?.description || '-'}
                </TableCell>
                <TableCell className="text-center">
                  {f.results?.checks?.all_ok ? (
                    <span className="text-green-600 font-semibold">✓</span>
                  ) : f.status === 'failed' ? (
                    <span className="text-red-600 font-semibold">✗</span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-slate-500">
        Total: {foundations.length} bases • 
        Verificadas: {foundations.filter(f => f.status === 'verified').length} • 
        Fallidas: {foundations.filter(f => f.status === 'failed').length}
      </div>
    </div>
  );
}