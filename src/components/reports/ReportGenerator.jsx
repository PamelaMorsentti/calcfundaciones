import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  FileDown, 
  FileSpreadsheet, 
  FileText,
  CheckSquare,
  Square,
  Printer
} from 'lucide-react';
import { formatNumber } from '../calculations/FoundationCalculator';

export default function ReportGenerator({ project, foundations, onClose }) {
  const [selectedFoundations, setSelectedFoundations] = useState(
    foundations.map(f => f.id)
  );
  const [includeGraphics, setIncludeGraphics] = useState(true);
  const [includeCalculations, setIncludeCalculations] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleFoundation = (id) => {
    setSelectedFoundations(prev => 
      prev.includes(id) 
        ? prev.filter(fid => fid !== id)
        : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedFoundations.length === foundations.length) {
      setSelectedFoundations([]);
    } else {
      setSelectedFoundations(foundations.map(f => f.id));
    }
  };

  const selectedItems = foundations.filter(f => selectedFoundations.includes(f.id));

  const handleExportCSV = () => {
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
      'σ terreno (kg/cm²)',
      'f\'c (kg/cm²)',
      'fy (kg/cm²)',
      'Estado',
      'Armadura X',
      'Armadura Y'
    ];

    const rows = selectedItems.map(f => [
      f.name,
      f.type,
      f.column_load_N,
      f.total_load_P,
      f.column_cx,
      f.column_cy,
      f.results?.dimensions?.A || f.base_width_A,
      f.results?.dimensions?.B || f.base_length_B,
      f.base_height_H,
      f.soil_capacity,
      f.concrete_fc,
      f.steel_fy,
      f.status,
      f.results?.reinforcement?.bars_x?.description || '-',
      f.results?.reinforcement?.bars_y?.description || '-'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${project.name}_bases.csv`;
    link.click();
  };

  const handleExportJSON = () => {
    const data = {
      project: {
        name: project.name,
        client: project.client,
        location: project.location,
        engineer: project.engineer,
        normative: project.normative,
        date: new Date().toISOString()
      },
      foundations: selectedItems.map(f => ({
        name: f.name,
        type: f.type,
        input: {
          column_load_N: f.column_load_N,
          total_load_P: f.total_load_P,
          column_cx: f.column_cx,
          column_cy: f.column_cy,
          base_width_A: f.results?.dimensions?.A || f.base_width_A,
          base_length_B: f.results?.dimensions?.B || f.base_length_B,
          base_height_H: f.base_height_H,
          soil_capacity: f.soil_capacity,
          concrete_fc: f.concrete_fc,
          steel_fy: f.steel_fy
        },
        results: f.results,
        status: f.status
      }))
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${project.name}_bases.json`;
    link.click();
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const { base44 } = await import('@/api/base44Client');
      const result = await base44.functions.generatePDFReport({
        project,
        foundations: selectedItems,
        includeGraphics,
        includeCalculations
      });
      
      if (result.success) {
        // Abrir el archivo generado
        window.open(result.fileUrl, '_blank');
        alert(result.message);
      }
    } catch (error) {
      alert('Error al generar PDF: ' + (error.message || 'Verifique que las funciones de backend estén habilitadas'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateExcel = async () => {
    setIsGenerating(true);
    try {
      const { base44 } = await import('@/api/base44Client');
      const result = await base44.functions.generateExcelReport({
        project,
        foundations: selectedItems
      });
      
      if (result.success) {
        // Descargar el archivo
        const link = document.createElement('a');
        link.href = result.fileUrl;
        link.download = result.fileName;
        link.click();
      }
    } catch (error) {
      alert('Error al generar Excel: ' + (error.message || 'Verifique que las funciones de backend estén habilitadas'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Opciones de Reporte */}
      <Card className="p-4">
        <h3 className="font-semibold text-slate-800 mb-4">Opciones del Reporte</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox 
              id="graphics" 
              checked={includeGraphics}
              onCheckedChange={setIncludeGraphics}
            />
            <Label htmlFor="graphics" className="text-sm cursor-pointer">
              Incluir gráficos y diagramas
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox 
              id="calculations" 
              checked={includeCalculations}
              onCheckedChange={setIncludeCalculations}
            />
            <Label htmlFor="calculations" className="text-sm cursor-pointer">
              Incluir memoria de cálculo detallada
            </Label>
          </div>
        </div>
      </Card>

      {/* Selección de Bases */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Bases a Incluir</h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={toggleAll}
            className="gap-2"
          >
            {selectedFoundations.length === foundations.length ? (
              <>
                <CheckSquare className="w-4 h-4" />
                Deseleccionar Todas
              </>
            ) : (
              <>
                <Square className="w-4 h-4" />
                Seleccionar Todas
              </>
            )}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
          {foundations.map(foundation => (
            <div 
              key={foundation.id}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Checkbox
                id={foundation.id}
                checked={selectedFoundations.includes(foundation.id)}
                onCheckedChange={() => toggleFoundation(foundation.id)}
              />
              <Label 
                htmlFor={foundation.id}
                className="flex-1 cursor-pointer text-sm"
              >
                <div className="font-medium text-slate-800">
                  {foundation.name || 'Sin nombre'}
                </div>
                <div className="text-xs text-slate-500">
                  {foundation.type} • {foundation.status}
                </div>
              </Label>
            </div>
          ))}
        </div>
        
        <div className="mt-3 text-sm text-slate-500">
          {selectedFoundations.length} de {foundations.length} bases seleccionadas
        </div>
      </Card>

      {/* Botones de Exportación */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Button
          onClick={handleExportCSV}
          disabled={selectedFoundations.length === 0}
          variant="outline"
          className="gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          CSV
        </Button>
        
        <Button
          onClick={handleExportJSON}
          disabled={selectedFoundations.length === 0}
          variant="outline"
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          JSON
        </Button>

        <Button
          onClick={handlePrint}
          disabled={selectedFoundations.length === 0}
          variant="outline"
          className="gap-2"
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </Button>

        <Button
          onClick={handleGeneratePDF}
          disabled={selectedFoundations.length === 0 || isGenerating}
          variant="outline"
          className="gap-2"
        >
          <FileDown className="w-4 h-4" />
          {isGenerating ? 'Generando...' : 'PDF'}
        </Button>

        <Button
          onClick={handleGenerateExcel}
          disabled={selectedFoundations.length === 0 || isGenerating}
          variant="outline"
          className="gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          {isGenerating ? 'Generando...' : 'Excel'}
        </Button>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
        <strong>Nota:</strong> Para usar PDF/Excel, habilite Backend Functions en Dashboard → Settings → Backend Functions → Enable.
      </div>
    </div>
  );
}