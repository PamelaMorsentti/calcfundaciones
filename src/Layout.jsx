import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Building2, 
  FolderOpen, 
  Calculator, 
  Layers, 
  LayoutGrid,
  Menu,
  Home
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Inicio', page: 'Home', icon: Home },
  { name: 'Proyectos', page: 'Projects', icon: FolderOpen },
  { name: 'Bases', page: 'FoundationCalculator', icon: Calculator },
  { name: 'Losas', page: 'SlabCalculator', icon: LayoutGrid },
  { name: 'Vigas Elásticas', page: 'ElasticBeam', icon: Layers }
];

export default function Layout({ children, currentPageName }) {
  // Don't show navbar on Home page
  if (currentPageName === 'Home') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-lg hidden sm:block">
                CalcFundaciones
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link key={item.page} to={createPageUrl(item.page)}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={`gap-2 ${isActive ? 'bg-slate-100' : ''}`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {NAV_ITEMS.map((item) => (
                    <Link key={item.page} to={createPageUrl(item.page)}>
                      <DropdownMenuItem className="gap-2 cursor-pointer">
                        <item.icon className="w-4 h-4" />
                        {item.name}
                      </DropdownMenuItem>
                    </Link>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main>
        {children}
      </main>
    </div>
  );
}