import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Building2, 
  Calculator, 
  FolderOpen, 
  ArrowRight,
  Layers,
  FileText,
  Shield,
  Ruler
} from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Calculator,
      title: "Cálculo de Bases",
      description: "Diseño y verificación de zapatas aisladas centradas, medianeras y de esquina"
    },
    {
      icon: Layers,
      title: "Vigas sobre Lecho Elástico",
      description: "Análisis de vigas de fundación con modelo de Winkler"
    },
    {
      icon: Shield,
      title: "Múltiples Normativas",
      description: "CIRSOC 201-2005, CIRSOC 1982, ACI 318, Eurocode 2"
    },
    {
      icon: FileText,
      title: "Reportes Completos",
      description: "Generación de informes con gráficos, tablas y memorias de cálculo"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOGM5Ljk0MSAwIDE4LTguMDU5IDE4LTE4cy04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNHMxNCA2LjI2OCAxNCAxNHMtNi4yNjggMTQtMTQgMTR6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4wMiIvPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-300 text-sm font-medium">Software de Ingeniería Estructural</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-6">
              Cálculo de
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Fundaciones
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12">
              Diseño y verificación de bases aisladas según normativas argentinas vigentes. 
              Gestione múltiples proyectos con reportes profesionales.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={createPageUrl('Projects')}>
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 h-14 text-lg">
                  <FolderOpen className="w-5 h-5 mr-2" />
                  Mis Proyectos
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to={createPageUrl('FoundationCalculator')}>
                <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 h-14 text-lg">
                  <Calculator className="w-5 h-5 mr-2" />
                  Cálculo Rápido
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Herramientas Profesionales
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Todo lo que necesita para el cálculo estructural de fundaciones
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 border-slate-200 hover:shadow-lg transition-shadow group">
                <div className="p-3 bg-slate-100 rounded-xl w-fit mb-4 group-hover:bg-emerald-100 transition-colors">
                  <feature.icon className="w-6 h-6 text-slate-600 group-hover:text-emerald-600 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-500 text-sm">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Access Section */}
      <div className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Link to={createPageUrl('FoundationCalculator')}>
              <Card className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white hover:shadow-2xl transition-all group">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Bases Aisladas</h3>
                    <p className="text-slate-400 mb-6">
                      Cálculo de zapatas centradas, medianeras y de esquina con verificaciones completas
                    </p>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <span>Comenzar cálculo</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                  <div className="p-4 bg-white/10 rounded-2xl">
                    <Ruler className="w-10 h-10 text-emerald-400" />
                  </div>
                </div>
              </Card>
            </Link>

            <Link to={createPageUrl('ElasticBeam')}>
              <Card className="p-8 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white hover:shadow-2xl transition-all group">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Vigas sobre Lecho Elástico</h3>
                    <p className="text-emerald-100 mb-6">
                      Análisis de vigas de fundación con modelo de balasto de Winkler
                    </p>
                    <div className="flex items-center gap-2 text-white">
                      <span>Comenzar análisis</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                  <div className="p-4 bg-white/20 rounded-2xl">
                    <Layers className="w-10 h-10 text-white" />
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500 text-sm">
            Basado en normativas CIRSOC vigentes en República Argentina
          </p>
        </div>
      </footer>
    </div>
  );
}