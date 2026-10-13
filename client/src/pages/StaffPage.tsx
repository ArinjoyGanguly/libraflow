import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Mail, Building2, Plus, Shield } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { SEED_EMPLOYEES, SEED_ADMINS, SEED_LIBRARIES } from '../services/seedData';
import type { Employee, Admin } from '../types';

export const StaffPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'employees' | 'admins'>('employees');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const employeeColumns = [
    {
      key: 'employeeId',
      header: 'Staff ID',
      render: (e: Employee) => (
        <span className="font-mono text-xs font-semibold text-sky-400">{e.employeeId}</span>
      ),
    },
    {
      key: 'name',
      header: 'Staff Name & Position',
      render: (e: Employee) => (
        <div>
          <div className="font-medium text-slate-100">{e.name}</div>
          <div className="text-xs text-slate-400">{e.position}</div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Contact Info',
      render: (e: Employee) => (
        <div className="text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-slate-500" />
            <span>{e.email}</span>
          </div>
          <div className="text-slate-500 text-[11px] mt-0.5">{e.phone}</div>
        </div>
      ),
    },
    {
      key: 'libraryId',
      header: 'Branch Assignment',
      render: (e: Employee) => {
        const lib = SEED_LIBRARIES.find((l) => l.libraryId === e.libraryId);
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{lib ? lib.name : e.libraryId}</span>
          </div>
        );
      },
    },
    {
      key: 'role',
      header: 'Role',
      render: () => <Badge variant="info">Employee</Badge>,
    },
  ];

  const adminColumns = [
    {
      key: 'adminId',
      header: 'Admin ID',
      render: (a: Admin) => (
        <span className="font-mono text-xs font-semibold text-indigo-400">{a.adminId}</span>
      ),
    },
    {
      key: 'name',
      header: 'Administrator Name',
      render: (a: Admin) => (
        <div>
          <div className="font-medium text-slate-100">{a.name}</div>
          <div className="text-xs text-slate-500">Database & System Superuser</div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'System Email',
      render: (a: Admin) => (
        <div className="text-xs text-slate-300 flex items-center gap-1.5">
          <Mail className="w-3 h-3 text-slate-500" />
          <span>{a.email}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Authority Level',
      render: () => <Badge variant="purple">System Admin</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Staff & System Administrators
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Librarians and system operators authorized to manage circulation and catalog records
          </p>
        </div>

        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Staff Member
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'employees'
              ? 'bg-indigo-600 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Staff Librarians ({SEED_EMPLOYEES.length})
        </button>
        <button
          onClick={() => setActiveTab('admins')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'admins'
              ? 'bg-indigo-600 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          Administrators ({SEED_ADMINS.length})
        </button>
      </div>

      {/* Tables */}
      {activeTab === 'employees' ? (
        <Table
          columns={employeeColumns}
          data={SEED_EMPLOYEES}
          keyExtractor={(e) => e.employeeId}
        />
      ) : (
        <Table
          columns={adminColumns}
          data={SEED_ADMINS}
          keyExtractor={(a) => a.adminId}
        />
      )}

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Staff Member"
        subtitle="Registers an authorized employee or administrator account"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setIsAddModalOpen(false);
                alert('Staff credentials validated for Phase 7 API onboarding.');
              }}
            >
              Save Staff Member
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input label="Staff Name" placeholder="e.g. Meera Krishnan" required />
          <Input label="Staff Email" type="email" placeholder="meera.k@libraflow.edu" required />
          <Input label="Position / Title" placeholder="Assistant Librarian" />
          <Select
            label="Branch Assignment"
            options={SEED_LIBRARIES.map((l) => ({ value: l.libraryId, label: l.name }))}
          />
        </div>
      </Modal>
    </div>
  );
};
