import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, MapPin, Phone, Mail, BookOpen, Users, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { EmptyState } from '../components/common/EmptyState';
import { Alert } from '../components/common/Alert';
import { api } from '../services/api';
import type { Library, CreateLibraryInput } from '../types';

export const LibrariesPage: React.FC = () => {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Branch Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newLib, setNewLib] = useState<CreateLibraryInput>({
    libraryId: '',
    name: '',
    address: '',
    city: 'Bengaluru',
    phone: '',
    email: '',
  });

  // Delete Branch Modal
  const [deleteTarget, setDeleteTarget] = useState<Library | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLibraries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.libraries.list({ limit: 100 });
      if (res.success && res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.items || [];
        setLibraries(items);
        if (items.length > 0) {
          const nextIndex = items.length + 1;
          setNewLib((prev) => ({
            ...prev,
            libraryId: prev.libraryId || `LIB0${nextIndex}`,
          }));
        }
      } else {
        setError(res.error || 'Failed to fetch library branches from backend.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error reaching library endpoints.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLibraries();
  }, [fetchLibraries]);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newLib.libraryId.trim() || !newLib.name.trim() || !newLib.address.trim() || !newLib.city.trim()) {
      setFormError('Branch ID, Name, Address, and City are required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.libraries.create(newLib);
      if (res.success && res.data) {
        const createdLib = res.data;
        setLibraries((prev) => [...prev, createdLib]);
        setIsAddModalOpen(false);
        setNewLib({
          libraryId: `LIB0${libraries.length + 2}`,
          name: '',
          address: '',
          city: 'Bengaluru',
          phone: '',
          email: '',
        });
      } else {
        setFormError(res.error || 'Server rejected branch creation.');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error executing branch creation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await api.libraries.delete(deleteTarget.libraryId);
      if (res.success) {
        setLibraries((prev) => prev.filter((l) => l.libraryId !== deleteTarget.libraryId));
        setDeleteTarget(null);
      } else {
        alert(`Failed to delete branch: ${res.error}`);
      }
    } catch (err) {
      alert(`Network error during deletion: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            Library Branches & Campuses
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical campus branch locations managing book holdings and staff allocations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchLibraries}
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
            Add New Branch
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <Alert type="error" title="Branch Service Notice" onClose={() => setError(null)}>
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={fetchLibraries} className="ml-4">
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Branches Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 border border-slate-800 rounded-2xl bg-slate-900/40">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
          <p className="text-sm">Fetching campus branch locations from server...</p>
        </div>
      ) : libraries.length === 0 ? (
        <EmptyState
          title="No Branches Found"
          description="No physical campus branches are registered in the system."
          actionLabel="Register First Branch"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {libraries.map((lib) => (
            <Card
              key={lib.libraryId}
              title={
                <div className="flex items-center gap-2">
                  <span>{lib.name}</span>
                  <Badge variant="purple" size="sm">
                    {lib.libraryId}
                  </Badge>
                </div>
              }
              subtitle={`${lib.city} Campus Division`}
              footer={
                <div className="flex items-center justify-between w-full text-xs text-slate-400">
                  <span className="font-mono">Holdings Node: (:Library)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-medium">Operational</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 p-1 h-auto"
                      onClick={() => setDeleteTarget(lib)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              }
            >
              <div className="space-y-4">
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{lib.address}, {lib.city}</span>
                  </div>
                  {lib.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{lib.phone}</span>
                    </div>
                  )}
                  {lib.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{lib.email}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800/60">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-base font-bold font-mono text-white">
                        {lib.booksCount ?? 0}
                      </div>
                      <div className="text-[11px] text-slate-400">Physical Titles</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-950/60 text-sky-400 border border-sky-800/60">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-base font-bold font-mono text-white">
                        {lib.employeesCount ?? 0}
                      </div>
                      <div className="text-[11px] text-slate-400">Assigned Staff</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Branch Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !isSubmitting && setIsAddModalOpen(false)}
        title="Add Campus Branch"
        subtitle="Creates a (:Library) node with relational bindings"
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
              onClick={handleCreateBranch}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Register Branch
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateBranch} className="space-y-3">
          {formError && (
            <Alert type="error" title="Validation Failed" onClose={() => setFormError(null)}>
              {formError}
            </Alert>
          )}

          <Input
            label="Branch ID"
            placeholder="e.g. LIB03"
            value={newLib.libraryId}
            onChange={(e) => setNewLib({ ...newLib, libraryId: e.target.value })}
            required
          />
          <Input
            label="Branch Name"
            placeholder="e.g. South Campus Science Library"
            value={newLib.name}
            onChange={(e) => setNewLib({ ...newLib, name: e.target.value })}
            required
          />
          <Input
            label="Street Address"
            placeholder="e.g. 45 Outer Ring Road"
            value={newLib.address}
            onChange={(e) => setNewLib({ ...newLib, address: e.target.value })}
            required
          />
          <Input
            label="City"
            value={newLib.city}
            onChange={(e) => setNewLib({ ...newLib, city: e.target.value })}
            required
          />
          <Input
            label="Telephone"
            placeholder="+91-80-22001300"
            value={newLib.phone || ''}
            onChange={(e) => setNewLib({ ...newLib, phone: e.target.value })}
          />
          <Input
            label="Branch Email"
            type="email"
            placeholder="branch@libraflow.edu"
            value={newLib.email || ''}
            onChange={(e) => setNewLib({ ...newLib, email: e.target.value })}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        title="Confirm Branch Deletion"
        subtitle="This action permanently deletes the library branch node from the graph"
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
              Delete Branch
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            Are you sure you want to remove <strong className="text-white">{deleteTarget?.name}</strong> ({deleteTarget?.libraryId})?
          </p>
          <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              Deleting this branch will unlink books and employees assigned to this campus.
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
};
