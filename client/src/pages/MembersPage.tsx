import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  UserPlus,
  ShieldAlert,
  History,
  Mail,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { Alert } from '../components/common/Alert';
import { api } from '../services/api';
import type { Member, Loan, CreateMemberInput } from '../types';

export const MembersPage: React.FC = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberLoans, setMemberLoans] = useState<Loan[]>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);

  // Deletion modal
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notifications
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [newMember, setNewMember] = useState<CreateMemberInput>({
    memberId: 'M005',
    name: '',
    email: '',
    phone: '',
    address: '',
    status: 'ACTIVE',
  });

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params: Record<string, unknown> = {
      page,
      limit: 10,
    };
    if (search.trim()) params.search = search.trim();
    if (statusFilter !== 'ALL') params.status = statusFilter;

    try {
      const res = await api.members.list(params);
      if (res.success && res.data) {
        setMembers(res.data.items || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      } else {
        setError(res.error || 'Failed to retrieve members.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network failure.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleOpenMemberProfile = async (m: Member) => {
    setSelectedMember(m);
    setIsLoadingLoans(true);
    try {
      const res = await api.members.loans(m.memberId);
      if (res.success && res.data) {
        setMemberLoans(res.data);
      } else {
        setMemberLoans([]);
      }
    } catch {
      setMemberLoans([]);
    } finally {
      setIsLoadingLoans(false);
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email || !newMember.memberId) return;

    setIsSubmittingAdd(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await api.members.create(newMember);
      if (res.success) {
        setActionSuccess(`Member "${newMember.name}" (${newMember.memberId}) registered successfully.`);
        setIsAddModalOpen(false);
        setNewMember({
          memberId: `M00${members.length + 2}`,
          name: '',
          email: '',
          phone: '',
          address: '',
          status: 'ACTIVE',
        });
        fetchMembers();
      } else {
        setActionError(res.error || 'Failed to register member.');
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Network error during registration.');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await api.members.delete(memberToDelete.memberId);
      if (res.success) {
        setActionSuccess(`Member "${memberToDelete.name}" (${memberToDelete.memberId}) successfully deleted.`);
        setMemberToDelete(null);
        fetchMembers();
      } else {
        setActionError(res.error || 'Failed to delete member.');
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Network error.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'memberId',
      header: 'Member ID',
      render: (m: Member) => (
        <span className="font-mono text-xs font-semibold text-indigo-400">{m.memberId}</span>
      ),
    },
    {
      key: 'name',
      header: 'Full Name & Email',
      render: (m: Member) => (
        <div>
          <div className="font-medium text-slate-100">{m.name}</div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
            <Mail className="w-3 h-3 text-slate-500" />
            <span>{m.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Contact & Address',
      render: (m: Member) => (
        <div className="text-xs text-slate-400">
          <div>{m.phone || '—'}</div>
          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{m.address || '—'}</div>
        </div>
      ),
    },
    {
      key: 'joinDate',
      header: 'Joined',
      render: (m: Member) => (
        <span className="text-xs font-mono text-slate-400">{m.joinDate}</span>
      ),
    },
    {
      key: 'activeLoansCount',
      header: 'Active Loans',
      render: (m: Member) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-200">
          {m.activeLoansCount ?? 0} borrowed
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (m: Member) => (
        <Badge variant={m.status === 'ACTIVE' ? 'success' : 'danger'}>
          {m.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: (m: Member) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/loans?memberId=${m.memberId}`)}
            title="View borrowing history"
          >
            <History className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenMemberProfile(m)}
          >
            Profile
          </Button>
          <button
            onClick={() => setMemberToDelete(m)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Delete member"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Registered Members
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Student and faculty library accounts, borrowing limits, and standing statuses
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={() => fetchMembers()}
          >
            Refresh
          </Button>
          <Button
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Register Member
          </Button>
        </div>
      </div>

      {actionSuccess && (
        <Alert type="success" onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}

      {actionError && (
        <Alert type="error" title="Member Operation Rejected" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {error && (
        <Alert type="warning" title="Backend Connection Notice" onClose={() => setError(null)}>
          <div className="space-y-2">
            <p>{error}</p>
            <div className="pt-1">
              <Button size="sm" variant="secondary" onClick={() => fetchMembers()}>
                Retry API Request
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <Card className="!p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-8">
            <Input
              placeholder="Search by member ID, student name, or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="sm:col-span-4">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'SUSPENDED');
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active Members' },
                { value: 'SUSPENDED', label: 'Suspended (Fines/Hold)' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Members Table */}
      {isLoading && members.length === 0 ? (
        <div className="h-48 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse flex items-center justify-center text-xs text-slate-500">
          Loading members from server...
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-slate-500" />}
          title="No Members Found"
          description="Try modifying your search criteria or resetting filters."
        />
      ) : (
        <>
          <Table
            columns={columns}
            data={members}
            keyExtractor={(m) => m.memberId}
            isLoading={isLoading}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                Showing {members.length} of {total} members (Page {page} of {totalPages})
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Member Details Modal */}
      {selectedMember && (
        <Modal
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          title={`Member Profile: ${selectedMember.name}`}
          subtitle={`ID: ${selectedMember.memberId} • Status: ${selectedMember.status}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const mId = selectedMember.memberId;
                  setSelectedMember(null);
                  navigate(`/loans?memberId=${mId}`);
                }}
                leftIcon={<History className="w-3.5 h-3.5" />}
              >
                Full Loan Ledger
              </Button>
              <Button size="sm" onClick={() => setSelectedMember(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {selectedMember.status === 'SUSPENDED' && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
                <span>
                  Member account is <strong>SUSPENDED</strong>. The backend transaction guard rejects borrow attempts (HTTP 403 Forbidden).
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-mono uppercase">Email Address</span>
                <p className="text-xs font-semibold text-slate-200 mt-0.5">{selectedMember.email}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-mono uppercase">Phone Number</span>
                <p className="text-xs font-semibold text-slate-200 mt-0.5">{selectedMember.phone || '—'}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Campus Address</span>
              <p className="text-xs font-semibold text-slate-200 mt-0.5">{selectedMember.address || '—'}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Borrowing History from Server</span>
              {isLoadingLoans ? (
                <p className="text-slate-400">Loading loans...</p>
              ) : memberLoans.length === 0 ? (
                <p className="text-slate-500">No active or historical loans recorded for this member.</p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {memberLoans.map((l) => (
                    <div key={l.loanId} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                      <div>
                        <span className="font-semibold text-slate-200">{l.book?.title}</span>
                        <span className="text-[10px] text-slate-500 ml-2 font-mono">Due: {l.dueDate}</span>
                      </div>
                      <Badge variant={l.status === 'ACTIVE' ? 'success' : l.status === 'OVERDUE' ? 'danger' : 'default'} size="sm">
                        {l.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Student Member"
        subtitle="Submits POST /api/members with auto-hashing"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              isLoading={isSubmittingAdd}
              onClick={handleCreateMember}
            >
              Confirm Registration
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateMember} className="space-y-3">
          <Input
            label="Member ID"
            value={newMember.memberId}
            onChange={(e) => setNewMember({ ...newMember, memberId: e.target.value })}
            required
            helperText="Unique primary identifier (e.g. M005)"
          />
          <Input
            label="Full Name"
            placeholder="e.g. Vikram Seth"
            value={newMember.name}
            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="vikram.s@student.edu"
            value={newMember.email}
            onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
            required
          />
          <Input
            label="Phone Number"
            placeholder="+91-98765-00000"
            value={newMember.phone || ''}
            onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
          />
          <Input
            label="Campus Address"
            placeholder="Room 204, North Block"
            value={newMember.address || ''}
            onChange={(e) => setNewMember({ ...newMember, address: e.target.value })}
          />
          <Select
            label="Initial Account Status"
            value={newMember.status || 'ACTIVE'}
            onChange={(e) => setNewMember({ ...newMember, status: e.target.value as 'ACTIVE' | 'SUSPENDED' })}
            options={[
              { value: 'ACTIVE', label: 'ACTIVE (Permitted to borrow)' },
              { value: 'SUSPENDED', label: 'SUSPENDED (Borrowing blocked)' },
            ]}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {memberToDelete && (
        <Modal
          isOpen={!!memberToDelete}
          onClose={() => setMemberToDelete(null)}
          title="Confirm Member Account Removal"
          subtitle={`Member ID: ${memberToDelete.memberId}`}
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => setMemberToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isDeleting}
                onClick={handleDeleteMember}
              >
                Delete Member
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-950/30 border border-rose-800/50 text-rose-300">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <p className="font-semibold text-rose-200">Referential Integrity Protection</p>
                <p className="mt-1">
                  Are you sure you want to delete member <strong>"{memberToDelete.name}"</strong> ({memberToDelete.memberId})?
                  The backend rejects deletion if any active physical loans exist.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
