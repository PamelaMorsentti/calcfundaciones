import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calculator, RotateCcw } from 'lucide-react';

const DEFAULT_VALUES = {
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
  steel_fy: 4200
};

export default function FoundationForm({ 
  foundation, 
  onChange, 
  onCalculate, 
  onReset,
  isCalculating = false 
}) {
  const data = foundation || DEFAULT_VALUES;
  const isVerification = data.calculation_mode === "verification";

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handleNumericChange = (field, value) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      handleChange(field, num);
    }
  };

  return (
    <div className="space-y-6">
      {/* Identificación */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">Identificación</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-slate-500">Nombre / ID</Label>
            <Input
              value={data.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Ej: B1, Z-01"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Tipo de Base</Label>
            <Select value={data.type} onValueChange={(v) => handleChange("type", v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="centered">Centrada</SelectItem>
                <SelectItem value="edge">Medianera</SelectItem>
                <SelectItem value="corner">Esquina</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-xs text-slate-500">Modo de Cálculo</Label>
          <Select value={data.calculation_mode} onValueChange={(v) => handleChange("calculation_mode", v)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="design">Diseño (calcular dimensiones)</SelectItem>
              <SelectItem value="verification">Verificación (dimensiones conocidas)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cargas */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">Cargas Verticales</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-slate-500">N - Carga columna (kg)</Label>
            <Input
              type="number"
              value={data.column_load_N || ""}
              onChange={(e) => handleNumericChange("column_load_N", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">P - Carga total (kg)</Label>
            <Input
              type="number"
              value={data.total_load_P || ""}
              onChange={(e) => handleNumericChange("total_load_P", e.target.value)}
              className="mt-1"
            />
            <p className="text-[10px] text-slate-400 mt-1">Incluye peso propio estimado</p>
          </div>
        </div>
      </div>

      {/* Momentos en base de columna (Excentricidad) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-sm font-semibold text-slate-700">Momentos en Columna</h3>
          <span className="text-[10px] text-slate-400">Viento / Sismo (opcional)</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-slate-500">Mx_col (kg·cm)</Label>
            <Input
              type="number"
              value={data.Mx_col || ""}
              onChange={(e) => handleNumericChange("Mx_col", e.target.value)}
              placeholder="0"
              className="mt-1"
            />
            <p className="text-[10px] text-slate-400 mt-1">Momento sobre eje X</p>
          </div>
          <div>
            <Label className="text-xs text-slate-500">My_col (kg·cm)</Label>
            <Input
              type="number"
              value={data.My_col || ""}
              onChange={(e) => handleNumericChange("My_col", e.target.value)}
              placeholder="0"
              className="mt-1"
            />
            <p className="text-[10px] text-slate-400 mt-1">Momento sobre eje Y</p>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 bg-slate-50 rounded p-2">
          Con momentos, el cálculo usa distribución trapecial de presiones (Mejora ISE 1.3)
        </p>
      </div>

      {/* Geometría Columna */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">Columna</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-slate-500">cx (cm)</Label>
            <Input
              type="number"
              value={data.column_cx || ""}
              onChange={(e) => handleNumericChange("column_cx", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">cy (cm)</Label>
            <Input
              type="number"
              value={data.column_cy || ""}
              onChange={(e) => handleNumericChange("column_cy", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Geometría Base */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
          Dimensiones Base {!isVerification && <span className="text-xs font-normal text-slate-400">(opcional)</span>}
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-xs text-slate-500">A - Ancho (cm)</Label>
            <Input
              type="number"
              value={data.base_width_A || ""}
              onChange={(e) => handleNumericChange("base_width_A", e.target.value)}
              className="mt-1"
              placeholder={!isVerification ? "Auto" : ""}
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">B - Largo (cm)</Label>
            <Input
              type="number"
              value={data.base_length_B || ""}
              onChange={(e) => handleNumericChange("base_length_B", e.target.value)}
              className="mt-1"
              placeholder={!isVerification ? "Auto" : ""}
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">H - Altura (cm)</Label>
            <Input
              type="number"
              value={data.base_height_H || ""}
              onChange={(e) => handleNumericChange("base_height_H", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        {!isVerification && (
          <p className="text-[10px] text-slate-400">
            Deje A y B vacíos para cálculo automático, o ingrese dimensiones estimadas
          </p>
        )}
      </div>

      {/* Materiales */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">Materiales y Suelo</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-slate-500">σadm terreno (kg/cm²)</Label>
            <Input
              type="number"
              step="0.1"
              value={data.soil_capacity || ""}
              onChange={(e) => handleNumericChange("soil_capacity", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Recubrimiento (cm)</Label>
            <Input
              type="number"
              step="0.5"
              value={data.cover || ""}
              onChange={(e) => handleNumericChange("cover", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">f'c hormigón (kg/cm²)</Label>
            <Input
              type="number"
              value={data.concrete_fc || ""}
              onChange={(e) => handleNumericChange("concrete_fc", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">fy acero (kg/cm²)</Label>
            <Input
              type="number"
              value={data.steel_fy || ""}
              onChange={(e) => handleNumericChange("steel_fy", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4">
        <Button 
          onClick={onCalculate}
          disabled={isCalculating}
          className="flex-1 bg-slate-900 hover:bg-slate-800"
        >
          <Calculator className="w-4 h-4 mr-2" />
          {isCalculating ? "Calculando..." : "Calcular"}
        </Button>
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}