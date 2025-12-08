import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

export const LandingHeader = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Award className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">CertiChain</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">
              Home
            </Link>
            <Link to="/pricing" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">
              Pricing
            </Link>
            <Link to="/login">
              <Button variant="ghost" className="text-slate-700 hover:text-blue-600">
                Log In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl">
                Sign Up
              </Button>
            </Link>
          </nav>
          
          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <nav className="flex flex-col gap-4 mt-8">
                <Link to="/" className="text-lg font-medium text-slate-700 hover:text-blue-600 transition-colors">
                  Home
                </Link>
                <Link to="/pricing" className="text-lg font-medium text-slate-700 hover:text-blue-600 transition-colors">
                  Pricing
                </Link>
                <Link to="/login">
                  <Button variant="ghost" className="w-full justify-start text-slate-700 hover:text-blue-600">
                    Log In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                    Sign Up
                  </Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
