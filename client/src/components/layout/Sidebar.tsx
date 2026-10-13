import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Building2,
  Repeat,
  History,
  FileCheck2,
  Sparkles,
  BarChart3,
  Settings,
  ShieldCheck,
  BookPlus,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../common/Badge';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role } = useAuth();

  const navItems = [
    {
      group: 'OVERVIEW',
      items: [
        { label: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'Books Catalogue', path: '/books', icon: <BookOpen className="w-4 h-4" /> },
        { label: 'Graph Discovery', path: '/discovery', icon: <Sparkles className="w-4 h-4 text-indigo-400" /> },
      ],
    },
    {
      group: 'CIRCULATION',
      items: [
        ...(role !== 'member'
          ? [{ label: 'Issue & Return Desk', path: '/circulation', icon: <Repeat className="w-4 h-4" /> }]
          : []),
        { label: 'Loan History & Overdue', path: '/loans', icon: <History className="w-4 h-4" /> },
        { label: 'Borrow Requests', path: '/requests', icon: <FileCheck2 className="w-4 h-4" /> },
      ],
    },
    {
      group: 'ADMINISTRATION',
      items: [
        ...(role !== 'member'
          ? [
              { label: 'Add New Book', path: '/books/new', icon: <BookPlus className="w-4 h-4" /> },
              { label: 'Members Directory', path: '/members', icon: <Users className="w-4 h-4" /> },
            ]
          : []),
        ...(role === 'admin'
          ? [
              { label: 'Staff & Admins', path: '/staff', icon: <ShieldCheck className="w-4 h-4" /> },
              { label: 'Library Branches', path: '/libraries', icon: <Building2 className="w-4 h-4" /> },
              { label: 'Reports & Analytics', path: '/analytics', icon: <BarChart3 className="w-4 h-4" /> },
            ]
          : []),
        { label: 'System Settings', path: '/settings', icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];

  const roleBadgeVariant =
    role === 'admin' ? 'purple' : role === 'employee' ? 'info' : 'success';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-900/30">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Libra<span className="text-indigo-400">Flow</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Graph DBMS Core</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Persona Indicator */}
        <div className="px-6 py-3 bg-slate-900/50 border-b border-slate-800/60 flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Active Role
          </span>
          <Badge variant={roleBadgeVariant} size="sm">
            {role}
          </Badge>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navItems.map((group) => (
            <div key={group.group}>
              <div className="px-3 mb-2 text-[10px] font-bold font-mono tracking-wider text-slate-500 uppercase">
                {group.group}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => onClose()}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
                      }`
                    }
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>DA3 Project</span>
            <span className="text-slate-400">v0.6.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
