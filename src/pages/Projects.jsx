import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Folder, 
  Building2, 
  Calendar, 
  MapPin, 
  User,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  FileText
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_LABELS = {
  draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-700' },
  in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completado', color: 'bg-emerald-100 text-emerald-700' },
  archived: { label: 'Archivado', color: 'bg-amber-100 text-amber-700' }
};

const NORMATIVE_LABELS = {
  CIRSOC_2005: 'CIRSOC 201-2005',
  CIRSOC_1982: 'CIRSOC 201-1982',
  ACI_318: 'ACI 318-19',
  EUROCODE_2: 'Eurocode 2'
};

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date')
  });

  const { data: foundations = [] } = useQuery({
    queryKey: ['foundations'],
    queryFn: () => base44.entities.Foundation.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsDialogOpen(false);
      setEditingProject(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsDialogOpen(false);
      setEditingProject(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] })
  });

  const filteredProjects = projects.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFoundationCount = (projectId) => {
    return foundations.filter(f => f.project_id === projectId).length;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Convert numeric fields
    if (data.soil_bearing_capacity) data.soil_bearing_capacity = parseFloat(data.soil_bearing_capacity);
    if (data.concrete_strength) data.concrete_strength = parseFloat(data.concrete_strength);
    if (data.steel_yield) data.steel_yield = parseFloat(data.steel_yield);

    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (project) => {
    setEditingProject(project);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Proyectos</h1>
            <p className="text-slate-500 mt-1">Gestione sus proyectos de cálculo estructural</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingProject(null);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900 hover:bg-slate-800">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Proyecto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Nombre del Proyecto *</Label>
                    <Input 
                      name="name" 
                      required 
                      defaultValue={editingProject?.name}
                      placeholder="Ej: Edificio Torre Norte"
                    />
                  </div>
                  <div>
                    <Label>Cliente</Label>
                    <Input 
                      name="client" 
                      defaultValue={editingProject?.client}
                      placeholder="Nombre del cliente"
                    />
                  </div>
                  <div>
                    <Label>Ingeniero</Label>
                    <Input 
                      name="engineer" 
                      defaultValue={editingProject?.engineer}
                      placeholder="Ing. responsable"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Ubicación</Label>
                    <Input 
                      name="location" 
                      defaultValue={editingProject?.location}
                      placeholder="Ciudad, Provincia"
                    />
                  </div>
                  <div>
                    <Label>Normativa</Label>
                    <Select name="normative" defaultValue={editingProject?.normative || "CIRSOC_2005"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CIRSOC_2005">CIRSOC 201-2005</SelectItem>
                        <SelectItem value="CIRSOC_1982">CIRSOC 201-1982</SelectItem>
                        <SelectItem value="ACI_318">ACI 318-19</SelectItem>
                        <SelectItem value="EUROCODE_2">Eurocode 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Select name="status" defaultValue={editingProject?.status || "draft"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Borrador</SelectItem>
                        <SelectItem value="in_progress">En Progreso</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="archived">Archivado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>σ adm terreno (kg/cm²)</Label>
                    <Input 
                      name="soil_bearing_capacity" 
                      type="number" 
                      step="0.1"
                      defaultValue={editingProject?.soil_bearing_capacity || 2}
                    />
                  </div>
                  <div>
                    <Label>f'c hormigón (kg/cm²)</Label>
                    <Input 
                      name="concrete_strength" 
                      type="number"
                      defaultValue={editingProject?.concrete_strength || 210}
                    />
                  </div>
                  <div>
                    <Label>fy acero (kg/cm²)</Label>
                    <Input 
                      name="steel_yield" 
                      type="number"
                      defaultValue={editingProject?.steel_yield || 4200}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Notas</Label>
                    <Textarea 
                      name="notes" 
                      defaultValue={editingProject?.notes}
                      placeholder="Observaciones adicionales..."
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
                    {editingProject ? 'Guardar Cambios' : 'Crear Proyecto'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar proyectos..."
            className="pl-10 bg-white"
          />
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-slate-100 rounded w-2/3"></div>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <Folder className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">No hay proyectos</h3>
            <p className="text-slate-400 mb-6">Cree su primer proyecto para comenzar</p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-slate-900">
              <Plus className="w-4 h-4 mr-2" />
              Crear Proyecto
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <Link 
                key={project.id} 
                to={createPageUrl(`ProjectDetail?id=${project.id}`)}
                className="block"
              >
                <Card className="p-6 hover:shadow-lg transition-all duration-300 border-slate-200 hover:border-slate-300 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-slate-900 transition-colors">
                      <Building2 className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.preventDefault();
                          openEditDialog(project);
                        }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.preventDefault();
                            if (confirm('¿Eliminar este proyecto?')) {
                              deleteMutation.mutate(project.id);
                            }
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-slate-900">
                    {project.name}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-slate-500 mb-4">
                    {project.client && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        <span>{project.client}</span>
                      </div>
                    )}
                    {project.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{project.location}</span>
                      </div>
                    )}
                    {project.created_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{format(new Date(project.created_date), "d MMM yyyy", { locale: es })}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <Badge className={STATUS_LABELS[project.status || 'draft'].color}>
                      {STATUS_LABELS[project.status || 'draft'].label}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <FileText className="w-4 h-4" />
                      <span>{getFoundationCount(project.id)} bases</span>
                    </div>
                  </div>

                  {project.normative && (
                    <div className="mt-3 text-xs text-slate-400">
                      Normativa: {NORMATIVE_LABELS[project.normative]}
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}