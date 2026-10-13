import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Table } from '../components/common/Table';
import { EmptyState } from '../components/common/EmptyState';
import { SEED_LOANS } from '../services/seedData';
import type { Loan } from '../types';

export const LoansHistoryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryMemberId = searchParams.get('memberId');

  const [search, setSearch] = useState(queryMemberId || '');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'OVERDUE' | 'RETURNED'>('ALL');

  const filteredLoans = SEED_LOANS.filter((loan) => {
    const matchSearch =
      loan.loanId.toLowerCase().includes(search.toLowerCase()) ||
      (loan.book?.title && loan.book.title.toLowerCase().includes(search.toLowerCase())) ||
      (loan.member?.name && loan.member.name.toLowerCase().includes(search.toLowerCase())) ||
      (loan.member?.memberId && loan.member.memberId.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === 'ALL' || loan.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const overdueCount = SEED_LOANS.filter((l) => l.status === 'OVERDUE').length;

  const columns = [
    {
      key: 'loanId',
      header: 'Loan ID',
      render: (l: Loan) => (
        <span className="font-mono text-xs font-semibold text-indigo-400">{l.loanId}</span>
      ),
    },
    {
      key: 'book',
      header: 'Volume Title',
      render: (l: Loan) => (
        <div>
          <div className="font-medium text-slate-100">{l.book?.title}</div>
          <div className="text-[11px] font-mono text-slate-500">{l.book?.isbn}</div>
        </div>
      ),
    },
    {
      key: 'member',
      header: 'Borrower',
      render: (l: Loan) => (
        <div>
          <div className="text-slate-200">{l.member?.name}</div>
          <div className="text-[11px] font-mono text-slate-500">{l.member?.memberId}</div>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Issue / Due / Return',
      render: (l: Loan) => (
        <div className="text-xs font-mono text-slate-400 space-y-0.5">
          <div>Issued: {l.issueDate}</div>
          <div>Due: {l.dueDate}</div>
          {l.returnDate && <div className="text-emerald-400">Returned: {l.returnDate}</div>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Circulation Status',
      render: (l: Loan) => (
        <div className="space-y-1">
          <Badge
            variant={
              l.status === 'ACTIVE'
                ? 'success'
                : l.status === 'OVERDUE'
                ? 'danger'
                : 'default'
            }
          >
            {l.status}
          </Badge>
          {l.status === 'OVERDUE' && (
            <div className="text-[11px] font-mono font-semibold text-rose-400">
              18d late (${l.fineAmount.toFixed(2)})
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'issuedBy',
      header: 'Librarian Staff',
      render: (l: Loan) => (
        <span className="text-xs text-slate-400">{l.issuedBy?.name || 'Staff'}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: (l: Loan) => (
        <div>
          {l.status !== 'RETURNED' && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => navigate('/circulation')}
            >
              Return
            </Button>
          )}
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
            <History className="w-5 h-5 text-indigo-400" />
            Borrowing History & Overdue Records
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit trail of physical loans, active circulation, and overdue compliance tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          {overdueCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{overdueCount} Overdue Volume Detected</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="!p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-8">
            <Input
              placeholder="Search by loan ID (L001), book title, or borrower..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="sm:col-span-4">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'OVERDUE' | 'RETURNED')}
              options={[
                { value: 'ALL', label: 'All Circulation Statuses' },
                { value: 'ACTIVE', label: 'Active Loans' },
                { value: 'OVERDUE', label: 'Overdue Loans Only' },
                { value: 'RETURNED', label: 'Returned Volumes' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Loans Table */}
      {filteredLoans.length === 0 ? (
        <EmptyState
          icon={<History className="w-8 h-8 text-slate-500" />}
          title="No Circulation Records Found"
          description="No loans matched your active search query or filter selection."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <Table
          columns={columns}
          data={filteredLoans}
          keyExtractor={(l) => l.loanId}
        />
      )}
    </div>
  );
};
