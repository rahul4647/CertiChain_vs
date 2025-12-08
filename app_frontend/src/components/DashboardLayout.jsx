import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Award, LayoutDashboard, FileText, Users, Settings, LogOut, Menu, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'My Groups', icon: Users, href: '/dashboard/my-groups' },
    { name: 'Certificates', icon: FileText, href: '/dashboard/certificates' },
    { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
  ];
  
  const isActive = (href) => location.pathname === href;
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
            
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-900">CertiChain</span>
            </Link>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 hover:bg-slate-100">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-600 text-white font-semibold">JD</AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-slate-900 font-medium">John Doe</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-slate-200 transition-transform duration-300 z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <nav className="p-4 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive(item.href)
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h4 className="font-bold text-slate-900 mb-2">Upgrade to Pro</h4>
            <p className="text-sm text-slate-600 mb-3">Unlock unlimited certificates and advanced features</p>
            <Link to="/pricing">
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                Upgrade Now
              </Button>
            </Link>ā
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="pt-16 lg:pl-64">
        <div className="p-8">
          {children}
        </div>
      </main>
      
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
export default DashboardLayout;

