import React, { useState, useEffect } from 'react';
import { Menu, Activity, Shield, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { probeBackendHealth } from '../../services/api';
import type { UserRole } from '../../types';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, role, switchRole } = useAuth();
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const res = await probeBackendHealth();
      if (!mounted) return;
      if (res.server && res.database) {
        setDbStatus('connected');
      } else {
        setDbStatus('offline');
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const roles: { id: UserRole; label: string; desc: string }[] = [
    { id: 'admin', label: 'Administrator', desc: 'Full control & staff management' },
    { id: 'employee', label: 'Staff Librarian', desc: 'Circulation desk & approvals' },
    { id: 'member', label: 'Student Member', desc: 'Catalogue & borrow requests' },
  ];

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile hamburger & breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 lg:hidden cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="text-slate-200 font-semibold">LibraFlow</span>
          <span>/</span>
          <span className="text-indigo-400 uppercase">{role} portal</span>
        </div>
      </div>

      {/* Right: Health probe, Persona switcher & User profile */}
      <div className="flex items-center gap-3">
        {/* Backend & DB Health Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
            dbStatus === 'connected'
              ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300'
              : dbStatus === 'checking'
              ? 'bg-slate-900 border-slate-700 text-slate-400'
              : 'bg-amber-950/40 border-amber-800/50 text-amber-300'
          }`}
          title={
            dbStatus === 'connected'
              ? 'Backend API and Neo4j database are live'
              : dbStatus === 'checking'
              ? 'Checking backend connection...'
              : 'Backend currently offline — UI operating in Phase 6 standalone mode'
          }
        >
          <Activity
            className={`w-3.5 h-3.5 ${
              dbStatus === 'connected'
                ? 'text-emerald-400 animate-pulse'
                : dbStatus === 'checking'
                ? 'text-slate-400 animate-spin'
                : 'text-amber-400'
            }`}
          />
          <span className="hidden md:inline">
            {dbStatus === 'connected'
              ? 'Neo4j Live'
              : dbStatus === 'checking'
              ? 'Connecting...'
              : 'Standalone Mode'}
          </span>
        </div>

        {/* Role Switcher Menu */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-200 transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span className="capitalize font-medium">{role}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isRoleDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsRoleDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-xl shadow-black/50 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800/60">
                  Switch Persona (Demo)
                </div>
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      switchRole(r.id);
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex flex-col gap-0.5 hover:bg-slate-800/70 transition-colors cursor-pointer ${
                      role === r.id ? 'bg-indigo-600/10 text-indigo-300 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <span>{r.label}</span>
                    <span className="text-[10px] text-slate-500 font-normal">{r.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800/80">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-medium text-slate-200 leading-tight">
              {user?.name || 'User'}
            </div>
            <div className="text-[10px] text-slate-400 font-mono leading-tight">
              {user?.userId}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
