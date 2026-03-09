import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, GripVertical } from 'lucide-react';

export default function ColumnLoadManager({ columns, onChange }) {
  const add = () =>
    onChange([...columns, { name: `C${columns.length + 1}`, x: columns.length * 3, N: 30000, cx: 30, cy: 30 }]);

  const remove = (i) => onChange(columns.filter((_, idx) => idx !== i));

  const update = (i, field, raw) => {
    const val = field === 'name' ? raw : parseFloat(raw) || 0;
    onChange(columns.map((c, idx) => idx === i ? { ...c, [field]: val } : c));
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800">Columnas y Cargas</h3>
        <Button variant="outline" size="sm" onClick={add}>
          <Plus className="w-4 h-4 mr-1" />
          Agregar Columna
        </Button>
      </div>

      {columns.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-4">
          Agregue al menos una columna
        </p>
      )}

      <div className="space-y-3">
        {columns.map((col, i) => (
          <div key={i} className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />
              <span className="text-xs font-semibold text-slate-600 flex-1">Columna {i + 1}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(i)}>
                <Trash2 className="w-3 h-3 text-red-400" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-slate-500">Nombre</Label>
                <Input
                  value={col.name}
                  onChange={e => update(i, 'name', e.target.value)}
                  className="h-8 text-xs mt-0.5"
                />
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Posición x (m)</Label>
                <Input
                  type="number" step="0.1" value={col.x}
                  onChange={e => update(i, 'x', e.target.value)}
                  className="h-8 text-xs mt-0.5"
                />
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Carga N (kg)</Label>
                <Input
                  type="number" step="1000" value={col.N}
                  onChange={e => update(i, 'N', e.target.value)}
                  className="h-8 text-xs mt-0.5"
                />
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">cx × cy (cm)</Label>
                <div className="flex gap-1 mt-0.5">
                  <Input
                    type="number" step="5" value={col.cx}
                    onChange={e => update(i, 'cx', e.target.value)}
                    className="h-8 text-xs"
                  />
                  <span className="self-center text-slate-400 text-xs">×</span>
                  <Input
                    type="number" step="5" value={col.cy}
                    onChange={e => update(i, 'cy', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {columns.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex justify-between text-xs text-slate-500">
            <span>{columns.length} columna{columns.length !== 1 ? 's' : ''}</span>
            <span className="font-semibold text-slate-700">
              ΣN = {(columns.reduce((s, c) => s + c.N, 0) / 1000).toFixed(1)} ton
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}