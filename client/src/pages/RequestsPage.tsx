import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCheck2,
  Plus,
  Search,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Table } from '../components/common/Table';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { Alert } from '../components/common/Alert';
import { api } from '../services/api';
import type { RequestItem, RequestStatus, Book, Member } from '../types';

export const RequestsPage: React.FC = () => {
  const { user } = useAuth();

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | RequestStatus>('ALL');

  // Submit Request Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [notes, setNotes] = useState('');

  // In-flight Action tracking
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, booksRes, membersRes] = await Promise.all([
        api.requests.list({
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          limit: 100,
        }),
        api.books.list({ limit: 100 }),
        api.members.list({ limit: 100 }),
      ]);

      if (reqRes.success && reqRes.data) {
        setRequests(Array.isArray(reqRes.data) ? reqRes.data : reqRes.data.items || []);
      } else {
        setError(reqRes.error || 'Failed to fetch member borrow requests.');
      }

      if (booksRes.success && booksRes.data) {
        const bkList = Array.isArray(booksRes.data) ? booksRes.data : booksRes.data.items || [];
        setBooks(bkList);
        if (bkList.length > 0 && !selectedBookId) {
          setSelectedBookId(bkList[0].bookId);
        }
      }

      if (membersRes.success && membersRes.data) {
        const memList = Array.isArray(membersRes.data) ? membersRes.data : membersRes.data.items || [];
        setMembers(memList);
        if (memList.length > 0 && !selectedMemberId) {
          setSelectedMemberId(user?.userId || memList[0].memberId);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error retrieving member requests.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, selectedBookId, selectedMemberId, user?.userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (reqId: string) => {
    setActionInProgressId(reqId);
    setActionAlert(null);
    try {
      const res = await api.requests.update(reqId, {
        status: 'APPROVED',
        employeeId: user?.userId || 'E01',
        notes: 'Approved at circulation desk.',
      });

      if (res.success && res.data) {
        const updatedReq = res.data;
        setRequests((prev) =>
          prev.map((r) => (r.requestId === reqId ? updatedReq : r))
        );
        setActionAlert({
          type: 'success',
          msg: `Request ${reqId} has been APPROVED by the server. Reservation ready for loan checkout.`,
        });
      } else {
        setActionAlert({
          type: 'error',
          msg: res.error || `Server failed to approve request ${reqId}.`,
        });
      }
    } catch (err) {
      setActionAlert({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Network error during request approval.',
      });
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleReject = async (reqId: string) => {
    setActionInProgressId(reqId);
    setActionAlert(null);
    try {
      const res = await api.requests.update(reqId, {
        status: 'REJECTED',
        employeeId: user?.userId || 'E01',
        notes: 'Rejected: Volume unavailable or borrowing cap reached.',
      });

      if (res.success && res.data) {
        const updatedReq = res.data;
        setRequests((prev) =>
          prev.map((r) => (r.requestId === reqId ? updatedReq : r))
        );
        setActionAlert({
          type: 'success',
          msg: `Request ${reqId} has been REJECTED by the server.`,
        });
      } else {
        setActionAlert({
          type: 'error',
          msg: res.error || `Server failed to reject request ${reqId}.`,
        });
      }
    } catch (err) {
      setActionAlert({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Network error during request rejection.',
      });
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const memId = selectedMemberId || user?.userId;
    if (!memId || !selectedBookId) {
      setSubmitError('Please select both a member and a requested book.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.requests.create({
        memberId: memId,
        bookId: selectedBookId,
        notes: notes || undefined,
      });

      if (res.success && res.data) {
        const createdReq = res.data;
        setRequests((prev) => [createdReq, ...prev]);
        setIsSubmitModalOpen(false);
        setNotes('');
        setActionAlert({
          type: 'success',
          msg: `Borrow request ${res.data.requestId} successfully registered on the server.`,
        });
      } else {
        setSubmitError(res.error || 'Server rejected request creation.');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Network error submitting request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const term = search.toLowerCase();
    const matchId = r.requestId.toLowerCase().includes(term);
    const matchBook = Boolean(r.book?.title && r.book.title.toLowerCase().includes(term));
    const matchMember = Boolean(r.member?.name && r.member.name.toLowerCase().includes(term));

    return matchId || matchBook || matchMember;
  });

  const columns = [
    {
      key: 'requestId',
      header: 'Request ID',
      render: (r: RequestItem) => (
        <span className="font-mono text-xs font-semibold text-indigo-400">{r.requestId}</span>
      ),
    },
    {
      key: 'book',
      header: 'Requested Volume',
      render: (r: RequestItem) => (
        <div>
          <div className="font-medium text-slate-100">{r.book?.title || 'Unknown Title'}</div>
          <div className="text-[11px] font-mono text-slate-500">{r.book?.isbn || 'No ISBN'}</div>
        </div>
      ),
    },
    {
      key: 'member',
      header: 'Requesting Member',
      render: (r: RequestItem) => (
        <div>
          <div className="text-slate-200">{r.member?.name || 'Student Member'}</div>
          <div className="text-[11px] font-mono text-slate-500">{r.member?.memberId}</div>
        </div>
      ),
    },
    {
      key: 'requestDate',
      header: 'Submission Date',
      render: (r: RequestItem) => (
        <span className="font-mono text-xs text-slate-400">{r.requestDate}</span>
      ),
    },
    {
      key: 'notes',
      header: 'Reason / Notes',
      render: (r: RequestItem) => (
        <span className="text-xs text-slate-300 italic">{r.notes || 'No remarks'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r: RequestItem) => (
        <Badge
          variant={
            r.status === 'PENDING'
              ? 'warning'
              : r.status === 'APPROVED'
              ? 'success'
              : 'danger'
          }
        >
          {r.status}
        </Badge>
      ),
    },
    {
      key: 'processedBy',
      header: 'Staff Review',
      render: (r: RequestItem) => (
        <div className="text-xs text-slate-400">
          {r.processedBy ? (
            <span>{r.processedBy.name || r.processedBy.employeeId}</span>
          ) : (
            <span className="text-slate-600">—</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: (r: RequestItem) => {
        const isPending = r.status === 'PENDING';
        const isActing = actionInProgressId === r.requestId;

        if (!isPending) return null;

        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="text-emerald-400 border-emerald-500/40 hover:bg-emerald-950/40 h-7 px-2 text-xs"
              onClick={() => handleApprove(r.requestId)}
              disabled={isActing}
              isLoading={isActing}
              leftIcon={<Check className="w-3.5 h-3.5" />}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-rose-400 border-rose-500/40 hover:bg-rose-950/40 h-7 px-2 text-xs"
              onClick={() => handleReject(r.requestId)}
              disabled={isActing}
              isLoading={isActing}
              leftIcon={<X className="w-3.5 h-3.5" />}
            >
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-indigo-400" />
            Member Book Requests & Reservations
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Process hold requests, manage acquisitions interest, and grant book reservations
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
              setSubmitError(null);
              setIsSubmitModalOpen(true);
            }}
          >
            Submit Hold Request
          </Button>
        </div>
      </div>

      {/* Global Alerts */}
      {actionAlert && (
        <Alert
          type={actionAlert.type}
          title={actionAlert.type === 'success' ? 'Request Updated' : 'Action Failed'}
          onClose={() => setActionAlert(null)}
        >
          {actionAlert.msg}
        </Alert>
      )}

      {error && (
        <Alert type="error" title="Backend Requests Notice" onClose={() => setError(null)}>
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={fetchData} className="ml-4">
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <Card className="!p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-8">
            <Input
              placeholder="Search by request ID, book title, or member name..."
              leftIcon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="sm:col-span-4">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | RequestStatus)}
              options={[
                { value: 'ALL', label: 'All Requests' },
                { value: 'PENDING', label: 'Pending Review' },
                { value: 'APPROVED', label: 'Approved Holds' },
                { value: 'REJECTED', label: 'Rejected Requests' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Table or States */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 border border-slate-800 rounded-2xl bg-slate-900/40">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
          <p className="text-sm">Fetching member requests from server...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          title="No Requests Found"
          description={
            search || statusFilter !== 'ALL'
              ? 'No borrow requests match your search criteria.'
              : 'There are no active book requests in the queue.'
          }
          actionLabel="Submit Hold Request"
          onAction={() => setIsSubmitModalOpen(true)}
        />
      ) : (
        <Table
          columns={columns}
          data={filteredRequests}
          keyExtractor={(r) => r.requestId}
        />
      )}

      {/* New Request Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => !isSubmitting && setIsSubmitModalOpen(false)}
        title="Submit Book Reservation Request"
        subtitle="Submits a (:Request) node linked to member and book"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSubmitModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateRequest}
              isLoading={isSubmitting}
              disabled={isSubmitting || !selectedBookId}
            >
              Submit Request
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateRequest} className="space-y-3">
          {submitError && (
            <Alert type="error" title="Submission Failed" onClose={() => setSubmitError(null)}>
              {submitError}
            </Alert>
          )}

          {members.length > 0 && (
            <Select
              label="Requesting Member"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              options={members.map((m) => ({
                value: m.memberId,
                label: `${m.name} (${m.memberId})`,
              }))}
            />
          )}

          <Select
            label="Requested Book"
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
            options={books.map((b) => ({
              value: b.bookId,
              label: `${b.title} (${b.bookId}) — [${b.availableCopies} available]`,
            }))}
          />

          <Input
            label="Notes / Justification"
            placeholder="e.g. Required for final year DBMS research project"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};
