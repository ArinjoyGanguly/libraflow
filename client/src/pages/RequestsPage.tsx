import React, { useState } from 'react';
import {
  FileCheck2,
  Plus,
  Search,
  Check,
  X,
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
import { SEED_REQUESTS, SEED_BOOKS } from '../services/seedData';
import type { RequestItem, RequestStatus } from '../types';

export const RequestsPage: React.FC = () => {
  const { user, role } = useAuth();

  const [requests, setRequests] = useState<RequestItem[]>(SEED_REQUESTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | RequestStatus>('ALL');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  // New Request Form
  const [selectedBookId, setSelectedBookId] = useState(SEED_BOOKS[0]?.bookId || 'B001');
  const [notes, setNotes] = useState('');

  const filteredRequests = requests.filter((r) => {
    const matchSearch =
      r.requestId.toLowerCase().includes(search.toLowerCase()) ||
      (r.book?.title && r.book.title.toLowerCase().includes(search.toLowerCase())) ||
      (r.member?.name && r.member.name.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleApprove = (reqId: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.requestId === reqId
          ? {
              ...r,
              status: 'APPROVED',
              processedBy: { employeeId: 'E01', name: 'Ramesh Sharma' },
              notes: 'Approved at circulation desk.',
            }
          : r
      )
    );
    setActionAlert(`Request ${reqId} APPROVED by staff. Book reservation ready for physical checkout.`);
  };

  const handleReject = (reqId: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.requestId === reqId
          ? {
              ...r,
              status: 'REJECTED',
              processedBy: { employeeId: 'E01', name: 'Ramesh Sharma' },
              notes: 'Rejected by staff: Volume copy unavailable or student reached borrowing cap.',
            }
          : r
      )
    );
    setActionAlert(`Request ${reqId} REJECTED.`);
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const targetBook = SEED_BOOKS.find((b) => b.bookId === selectedBookId);
    const newReq: RequestItem = {
      requestId: `REQ00${requests.length + 1}`,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      notes: notes || 'Student borrow reservation',
      member: {
        memberId: user?.userId || 'M001',
        name: user?.name || 'Aarav Patel',
        email: user?.email || 'student@libraflow.edu',
      },
      book: {
        bookId: targetBook?.bookId || 'B001',
        title: targetBook?.title || 'Unknown',
        isbn: targetBook?.isbn || 'N/A',
      },
    };

    setRequests([newReq, ...requests]);
    setIsSubmitModalOpen(false);
    setActionAlert(`Borrow request ${newReq.requestId} submitted for librarian review.`);
  };

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
          <div className="font-medium text-slate-100">{r.book?.title}</div>
          <div className="text-[11px] font-mono text-slate-500">{r.book?.isbn}</div>
        </div>
      ),
    },
    {
      key: 'member',
      header: 'Requesting Member',
      render: (r: RequestItem) => (
        <div>
          <div className="text-slate-200">{r.member?.name}</div>
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
        <div className="text-xs text-slate-400 max-w-xs truncate" title={r.notes}>
          {r.notes || '—'}
        </div>
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
      key: 'actions',
      header: 'Staff Decision',
      align: 'right' as const,
      render: (r: RequestItem) => {
        if (r.status !== 'PENDING') {
          return (
            <span className="text-[11px] font-mono text-slate-500">
              Processed by {r.processedBy?.name || 'Staff'}
            </span>
          );
        }

        if (role === 'member') {
          return <span className="text-xs text-amber-400">Under Review</span>;
        }

        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleApprove(r.requestId)}
              className="!bg-emerald-600 hover:!bg-emerald-500 !px-2.5"
              title="Approve borrow request"
            >
              <Check className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleReject(r.requestId)}
              className="!px-2.5"
              title="Reject borrow request"
            >
              <X className="w-3.5 h-3.5" />
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
            Member Borrow Requests
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Student volume reservation pipeline mirroring Oracle DA2 Send_Request entity
          </p>
        </div>

        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsSubmitModalOpen(true)}
        >
          Submit Borrow Request
        </Button>
      </div>

      {actionAlert && (
        <Alert
          type="info"
          onClose={() => setActionAlert(null)}
          title="Workflow State Updated"
        >
          {actionAlert}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <Card className="!p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-8">
            <Input
              placeholder="Search by request ID (REQ001), book, or student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="sm:col-span-4">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | RequestStatus)}
              options={[
                { value: 'ALL', label: 'All Request Statuses' },
                { value: 'PENDING', label: 'Pending Review' },
                { value: 'APPROVED', label: 'Approved Requests' },
                { value: 'REJECTED', label: 'Rejected Requests' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={<FileCheck2 className="w-8 h-8 text-slate-500" />}
          title="No Requests in Queue"
          description="No borrow requests match your current search or status filter."
        />
      ) : (
        <Table
          columns={columns}
          data={filteredRequests}
          keyExtractor={(r) => r.requestId}
        />
      )}

      {/* Submit Request Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Book Borrow Request"
        subtitle="Reserve a volume for checkout at your campus library desk"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateRequest}>
              Submit Request
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Select Book to Reserve"
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
            options={SEED_BOOKS.map((b) => ({
              value: b.bookId,
              label: `${b.title} (${b.availableCopies} available)`,
            }))}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Reason / Semester Need
            </label>
            <textarea
              className="w-full bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              rows={3}
              placeholder="e.g. Required reading for semester project submission"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
