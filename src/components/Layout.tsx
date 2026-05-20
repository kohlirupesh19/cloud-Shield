import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  LineChart, 
  Shield, 
  Scale, 
  Bell, 
  FileText, 
  Settings,
  Search,
  User,
  Building2,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Data quality', path: '/quality', icon: LineChart },
  { name: 'Security & access', path: '/security', icon: Shield },
  { name: 'Data governance', path: '/governance', icon: Scale },
  { name: 'Alerts', path: '/alerts', icon: Bell },
  { name: 'Reports', path: '/reports', icon: FileText },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-sidebar h-screen fixed left-0 top-0 flex flex-col border-r border-precision border-outline-variant bg-surface-container-lowest z-50">
        <div className="px-6 py-8">
          <div className="flex items-center gap-2 mb-8">
            <Shield className="text-primary w-8 h-8 fill-primary/10" />
            <div>
              <h1 className="text-title-lg font-title-lg font-bold text-primary leading-tight">CloudShield</h1>
              <p className="text-[10px] text-outline font-label-caps tracking-widest uppercase">Gov Data Governance</p>
            </div>
          </div>
          
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-main font-body-main transition-colors",
                    isActive 
                      ? "bg-secondary-fixed text-on-secondary-fixed-variant border-l-2 border-primary font-medium" 
                      : "text-on-surface-variant hover:bg-surface-container-low"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive && "fill-primary/10 text-primary")} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="mt-auto border-t border-precision border-outline-variant p-4 space-y-4">
          <div className="flex flex-col relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={cn(
                "flex items-center justify-between px-2 py-2 rounded-lg transition-colors text-left w-full",
                isUserMenuOpen ? "bg-surface-container-low" : "hover:bg-surface-container-low"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-body-main font-semibold text-on-surface">Admin User</p>
                  <p className="text-[11px] text-outline">Super Admin</p>
                </div>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-outline transition-transform", isUserMenuOpen && "rotate-180")} />
            </button>

            {isUserMenuOpen && (
              <div className="absolute bottom-[110%] left-0 w-full mb-2 bg-surface-container-lowest border border-precision border-outline-variant shadow-lg rounded-xl overflow-hidden py-1 z-50">
                <Link
                  to="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-body-main text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <Settings className="w-4 h-4 text-on-surface-variant" />
                  Settings
                </Link>
                <div className="h-[1px] bg-outline-variant/30 my-1 mx-2"></div>
                <button 
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-body-main text-error hover:bg-error-container/50 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 px-2 text-outline">
            <Building2 className="w-[18px] h-[18px]" />
            <span className="text-[11px] font-label-caps">GOVERNMENT OF INDIA</span>
          </div>
        </div>
      </aside>

      {/* Topbar */}
      <header className="h-topbar w-[calc(100%-var(--spacing-sidebar))] ml-sidebar fixed top-0 z-40 bg-surface-container-lowest flex justify-between items-center px-container-margin border-b border-precision border-outline-variant">
        <div className="flex items-center gap-6">
          <div className="relative w-64 lg:w-96">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search datasets, audits, or logs..." 
              className="w-full bg-surface-container-low border border-precision border-outline-variant rounded-lg pl-9 pr-4 py-1.5 text-body-main placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors relative">
            <Bell className="w-5 h-5 text-outline" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="ml-sidebar pt-topbar min-h-screen bg-background">
        <motion.div
           initial={{ opacity: 0, y: 5 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
