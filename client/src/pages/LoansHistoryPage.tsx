import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  AlertCircle,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Table } from '../components/common/Table';
import { EmptyState } from '../components/common/EmptyState';
import { Alert } from '../components/common/Alert';
import { api } from '../services/api';
import type { Loan, OverdueLoan } from '../types';

export const LoansHistoryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryMemberId = searchParams.get('memberId');

  const [loans, setLoans] = useState<Loan[]>([]);
  const [overdueLoans, setOverdueLoans] = useState<OverdueLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState(queryMemberId || '');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'OVERDUE' | 'RETURNED'>('ALL');

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loansRes, overdueRes] = await Promise.all([
        api.loans.list({
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          limit: 100,
        }),
        api.loans.overdue(),
      ]);

      if (loansRes.success && loansRes.data) {
        setLoans(Array.isArray(loansRes.data) ? loansRes.data : loansRes.data.items || []);
      } else {
        setError(loansRes.error || 'Failed to fetch loan audit trail.');
      }

      if (overdueRes.success && overdueRes.data) {
        setOverdueLoans(Array.isArray(overdueRes.data) ? overdueRes.data : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error retrieving loans history.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const filteredLoans = loans.filter((loan) => {
    const term = search.toLowerCase();
    const matchId = loan.loanId.toLowerCase().includes(term);
    const matchBook = Boolean(loan.book?.title && loan.book.title.toLowerCase().includes(term));
    const matchMemberName = Boolean(loan.member?.name && loan.member.name.toLowerCase().includes(term));
    const matchMemberId = Boolean(loan.member?.memberId && loan.member.memberId.toLowerCase().includes(term));

    return matchId || matchBook || matchMemberName || matchMemberId;
  });

  const overdueCount = overdueLoans.length;

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
          <div className="font-medium text-slate-100">{l.book?.title || 'Unknown Title'}</div>
          <div className="text-[11px] font-mono text-slate-500">{l.book?.isbn || 'No ISBN'}</div>
        </div>
      ),
    },
    {
      key: 'member',
      header: 'Borrower',
      render: (l: Loan) => (
        <div>
          <div className="text-slate-200">{l.member?.name || 'Unknown Borrower'}</div>
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
      render: (l: Loan) => {
        const isOverdue = l.status === 'OVERDUE' || overdueLoans.some((o) => o.loanId === l.loanId);
        const fine = l.fineAmount || 0;
        return (
          <div className="space-y-1">
            <Badge
              variant={
                l.status === 'ACTIVE'
                  ? 'success'
                  : isOverdue
                  ? 'danger'
                  : 'default'
              }
            >
              {isOverdue && l.status !== 'RETURNED' ? 'OVERDUE' : l.status}
            </Badge>
            {isOverdue && l.status !== 'RETURNED' && fine > 0 && (
              <div className="text-[11px] font-mono font-semibold text-rose-400">
                ${fine.toFixed(2)} Fine
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'issuedBy',
      header: 'Librarian Staff',
      render: (l: Loan) => (
        <span className="text-xs text-slate-400">{l.issuedBy?.name || l.issuedBy?.employeeId || 'Staff'}</span>
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
              onClick={() => navigate(`/circulation?loanId=${l.loanId}`)}
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
              <span>{overdueCount} Overdue Records Flagged</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchLoans}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <Alert type="error" title="Loans Service Warning" onClose={() => setError(null)}>
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={fetchLoans} className="ml-4">
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
              placeholder="Search by loan ID (L001), book title, or borrower..."
              leftIcon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="sm:col-span-4">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'OVERDUE' | 'RETURNED')}
              options={[
                { value: 'ALL', label: 'All Circulation Records' },
                { value: 'ACTIVE', label: 'Active Loans' },
                { value: 'OVERDUE', label: 'Overdue Loans' },
                { value: 'RETURNED', label: 'Returned Books' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Table or States */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 border border-slate-800 rounded-2xl bg-slate-900/40">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
          <p className="text-sm">Retrieving loan audit records from backend...</p>
        </div>
      ) : filteredLoans.length === 0 ? (
        <EmptyState
          title="No Loan Records Found"
          description={
            search || statusFilter !== 'ALL'
              ? 'No circulation records match your search criteria.'
              : 'There are no loan transactions recorded in the database yet.'
          }
          actionLabel="Circulate a Book"
          onAction={() => navigate('/circulation')}
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
