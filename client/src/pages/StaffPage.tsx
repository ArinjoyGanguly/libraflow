import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, UserCheck, Mail, Building2, Plus, Shield, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { EmptyState } from '../components/common/EmptyState';
import { Alert } from '../components/common/Alert';
import { api } from '../services/api';
import type { Employee, Admin, Library, CreateEmployeeInput, CreateAdminInput } from '../types';

export const StaffPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'employees' | 'admins'>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // New Employee form
  const [empForm, setEmpForm] = useState<CreateEmployeeInput>({
    name: '',
    email: '',
    phone: '',
    position: 'Assistant Librarian',
    libraryId: '',
  });

  // New Admin form
  const [adminForm, setAdminForm] = useState<CreateAdminInput>({
    name: '',
    email: '',
    password: '',
  });

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'employee' | 'admin'; id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, adminRes, libRes] = await Promise.all([
        api.employees.list({ limit: 100 }),
        api.admins.list({ limit: 100 }),
        api.libraries.list({ limit: 100 }),
      ]);

      if (empRes.success && empRes.data) {
        setEmployees(Array.isArray(empRes.data) ? empRes.data : empRes.data.items || []);
      }
      if (adminRes.success && adminRes.data) {
        setAdmins(Array.isArray(adminRes.data) ? adminRes.data : adminRes.data.items || []);
      }
      if (libRes.success && libRes.data) {
        const libs = Array.isArray(libRes.data) ? libRes.data : libRes.data.items || [];
        setLibraries(libs);
        if (libs.length > 0 && !empForm.libraryId) {
          setEmpForm((prev) => ({ ...prev, libraryId: libs[0].libraryId }));
        }
      }

      if (!empRes.success && !adminRes.success) {
        setError(empRes.error || adminRes.error || 'Failed to fetch staff records from backend.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error communicating with staff endpoints.');
    } finally {
      setLoading(false);
    }
  }, [empForm.libraryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (activeTab === 'employees') {
        if (!empForm.name.trim() || !empForm.email.trim()) {
          setFormError('Staff name and email are required.');
          setIsSubmitting(false);
          return;
        }

        const res = await api.employees.create(empForm);
        if (res.success && res.data) {
          const createdEmp = res.data;
          setEmployees((prev) => [createdEmp, ...prev]);
          setIsAddModalOpen(false);
          setEmpForm({
            name: '',
            email: '',
            phone: '',
            position: 'Assistant Librarian',
            libraryId: libraries[0]?.libraryId || '',
          });
        } else {
          setFormError(res.error || 'Server rejected employee creation.');
        }
      } else {
        if (!adminForm.name.trim() || !adminForm.email.trim()) {
          setFormError('Admin name and email are required.');
          setIsSubmitting(false);
          return;
        }

        const res = await api.admins.create(adminForm);
        if (res.success && res.data) {
          const createdAdmin = res.data;
          setAdmins((prev) => [createdAdmin, ...prev]);
          setIsAddModalOpen(false);
          setAdminForm({ name: '', email: '', password: '' });
        } else {
          setFormError(res.error || 'Server rejected administrator creation.');
        }
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error executing create request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'employee') {
        const res = await api.employees.delete(deleteTarget.id);
        if (res.success) {
          setEmployees((prev) => prev.filter((e) => e.employeeId !== deleteTarget.id));
          setDeleteTarget(null);
        } else {
          alert(`Failed to delete employee: ${res.error}`);
        }
      } else {
        const res = await api.admins.delete(deleteTarget.id);
        if (res.success) {
          setAdmins((prev) => prev.filter((a) => a.adminId !== deleteTarget.id));
          setDeleteTarget(null);
        } else {
          alert(`Failed to delete admin: ${res.error}`);
        }
      }
    } catch (err) {
      alert(`Network error during deletion: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsDeleting(false);
    }
  };

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
          <div className="text-xs text-slate-400">{e.position || 'Staff'}</div>
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
          {e.phone && <div className="text-slate-500 text-[11px] mt-0.5">{e.phone}</div>}
        </div>
      ),
    },
    {
      key: 'libraryId',
      header: 'Branch Assignment',
      render: (e: Employee) => {
        const lib = libraries.find((l) => l.libraryId === e.libraryId);
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{lib ? lib.name : e.libraryId || 'Unassigned'}</span>
          </div>
        );
      },
    },
    {
      key: 'role',
      header: 'Role',
      render: () => <Badge variant="info">Employee</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: (e: Employee) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
          onClick={() => setDeleteTarget({ type: 'employee', id: e.employeeId, name: e.name })}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      ),
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
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: (a: Admin) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
          onClick={() => setDeleteTarget({ type: 'admin', id: a.adminId, name: a.name })}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      ),
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setFormError(null);
              setIsAddModalOpen(true);
            }}
          >
            {activeTab === 'employees' ? 'Add Employee' : 'Add Administrator'}
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <Alert
          type="error"
          title="Backend Connection Notice"
          onClose={() => setError(null)}
        >
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={fetchData} className="ml-4">
              Retry
            </Button>
          </div>
        </Alert>
      )}

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
          Staff Librarians ({employees.length})
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
          Administrators ({admins.length})
        </button>
      </div>

      {/* Tables or Loading / Empty States */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 border border-slate-800 rounded-2xl bg-slate-900/40">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
          <p className="text-sm">Fetching authorized staff records from server...</p>
        </div>
      ) : activeTab === 'employees' ? (
        employees.length === 0 ? (
          <EmptyState
            title="No Staff Librarians Found"
            description="No employee records are currently registered in the database."
            actionLabel="Register First Employee"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <Table
            columns={employeeColumns}
            data={employees}
            keyExtractor={(e) => e.employeeId}
          />
        )
      ) : admins.length === 0 ? (
        <EmptyState
          title="No Administrators Found"
          description="No administrator records are currently registered in the database."
          actionLabel="Register First Administrator"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <Table
          columns={adminColumns}
          data={admins}
          keyExtractor={(a) => a.adminId}
        />
      )}

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !isSubmitting && setIsAddModalOpen(false)}
        title={activeTab === 'employees' ? 'Register Staff Librarian' : 'Register System Administrator'}
        subtitle={`Creates an authorized ${activeTab === 'employees' ? '(:Employee)' : '(:Admin)'} node`}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateStaff}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Save Account
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateStaff} className="space-y-3">
          {formError && (
            <Alert type="error" title="Validation Failed" onClose={() => setFormError(null)}>
              {formError}
            </Alert>
          )}

          {activeTab === 'employees' ? (
            <>
              <Input
                label="Full Name"
                placeholder="e.g. Meera Krishnan"
                value={empForm.name}
                onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                required
              />
              <Input
                label="Work Email"
                type="email"
                placeholder="meera.k@libraflow.edu"
                value={empForm.email}
                onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                required
              />
              <Input
                label="Phone Number"
                placeholder="+91-9876543210"
                value={empForm.phone || ''}
                onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
              />
              <Input
                label="Position / Title"
                placeholder="Assistant Librarian"
                value={empForm.position || ''}
                onChange={(e) => setEmpForm({ ...empForm, position: e.target.value })}
              />
              {libraries.length > 0 && (
                <Select
                  label="Branch Assignment"
                  value={empForm.libraryId || ''}
                  onChange={(e) => setEmpForm({ ...empForm, libraryId: e.target.value })}
                  options={libraries.map((l) => ({ value: l.libraryId, label: `${l.name} (${l.libraryId})` }))}
                />
              )}
            </>
          ) : (
            <>
              <Input
                label="Administrator Name"
                placeholder="e.g. Vikramaditya Rao"
                value={adminForm.name}
                onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                required
              />
              <Input
                label="System Email"
                type="email"
                placeholder="admin@libraflow.edu"
                value={adminForm.email}
                onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                required
              />
              <Input
                label="Initial Password (Optional)"
                type="password"
                placeholder="••••••••"
                value={adminForm.password || ''}
                onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
              />
            </>
          )}
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        title="Confirm Account Removal"
        subtitle="This action permanently deletes the staff record from the database"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
              disabled={isDeleting}
            >
              Delete Record
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            Are you sure you want to remove <strong className="text-white">{deleteTarget?.name}</strong> ({deleteTarget?.id})?
          </p>
          <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              If this account has processed loan or request audits, foreign key constraints or Cypher cascades may apply.
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
};
