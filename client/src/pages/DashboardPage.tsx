import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Repeat,
  AlertCircle,
  FileCheck2,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { StatCard } from '../components/common/StatCard';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Table } from '../components/common/Table';
import {
  SEED_STATS,
  SEED_LOANS,
  SEED_REQUESTS,
} from '../services/seedData';
import type { Loan, RequestItem } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const activeLoans = SEED_LOANS.slice(0, 4);
  const pendingRequests = SEED_REQUESTS.filter((r) => r.status === 'PENDING');

  const loanColumns = [
    {
      key: 'loanId',
      header: 'Loan ID',
      render: (loan: Loan) => <span className="font-mono text-xs font-semibold text-indigo-400">{loan.loanId}</span>,
    },
    {
      key: 'book',
      header: 'Book Title',
      render: (loan: Loan) => (
        <div>
          <div className="font-medium text-slate-100">{loan.book?.title}</div>
          <div className="text-[11px] font-mono text-slate-400">{loan.book?.isbn}</div>
        </div>
      ),
    },
    {
      key: 'member',
      header: 'Member',
      render: (loan: Loan) => (
        <div>
          <div className="text-slate-200">{loan.member?.name}</div>
          <div className="text-[11px] font-mono text-slate-500">{loan.member?.memberId}</div>
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (loan: Loan) => <span className="font-mono text-xs text-slate-300">{loan.dueDate}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (loan: Loan) => (
        <Badge
          variant={
            loan.status === 'ACTIVE'
              ? 'success'
              : loan.status === 'OVERDUE'
              ? 'danger'
              : 'default'
          }
        >
          {loan.status}
        </Badge>
      ),
    },
  ];

  const requestColumns = [
    {
      key: 'requestId',
      header: 'Request ID',
      render: (req: RequestItem) => <span className="font-mono text-xs text-indigo-400">{req.requestId}</span>,
    },
    {
      key: 'book',
      header: 'Requested Book',
      render: (req: RequestItem) => <span className="font-medium text-slate-200">{req.book?.title}</span>,
    },
    {
      key: 'member',
      header: 'Member',
      render: (req: RequestItem) => <span>{req.member?.name}</span>,
    },
    {
      key: 'requestDate',
      header: 'Date',
      render: (req: RequestItem) => <span className="font-mono text-xs text-slate-400">{req.requestDate}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (req: RequestItem) => (
        <Badge variant={req.status === 'PENDING' ? 'warning' : 'success'}>
          {req.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Welcome, {user?.name}
            </h1>
            <Badge variant="purple" size="sm">
              {role}
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            LibraFlow Graph Library System — Academic Demo Campus Central
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {role !== 'member' && (
            <Button
              size="sm"
              leftIcon={<Repeat className="w-3.5 h-3.5" />}
              onClick={() => navigate('/circulation')}
            >
              Issue / Return
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
            onClick={() => navigate('/discovery')}
          >
            Graph Discovery
          </Button>
        </div>
      </div>

      {/* Honest Boundary Notice */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <span>
          <strong className="text-slate-300">Phase 6 UI Foundation:</strong> Displaying structured seed records matching Neo4j schema (<code className="text-indigo-300">seed.cypher</code>). Phase 7 connects the live reactive queries to the Express server.
        </span>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Catalog Volumes"
          value={SEED_STATS.totalBooks}
          subtitle={`${SEED_STATS.availableCopies} available on shelf`}
          icon={<BookOpen className="w-5 h-5" />}
          colorScheme="indigo"
          onClick={() => navigate('/books')}
        />
        <StatCard
          label="Active Borrowings"
          value={SEED_STATS.activeLoans}
          subtitle="4 active student loans"
          icon={<Repeat className="w-5 h-5" />}
          colorScheme="emerald"
          onClick={() => navigate('/loans')}
        />
        <StatCard
          label="Overdue Volumes"
          value={SEED_STATS.overdueLoans}
          subtitle="1 book past due date"
          icon={<AlertCircle className="w-5 h-5" />}
          colorScheme="rose"
          onClick={() => navigate('/loans')}
        />
        <StatCard
          label="Pending Requests"
          value={SEED_STATS.pendingRequests}
          subtitle="2 awaiting staff review"
          icon={<FileCheck2 className="w-5 h-5" />}
          colorScheme="amber"
          onClick={() => navigate('/requests')}
        />
      </div>

      {/* Tables section: Active Loans and Member Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Active Circulation Log"
          subtitle="Recently issued books currently with students"
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => navigate('/loans')}
            >
              View All
            </Button>
          }
        >
          <Table
            columns={loanColumns}
            data={activeLoans}
            keyExtractor={(l) => l.loanId}
          />
        </Card>

        <Card
          title="Pending Borrow Requests"
          subtitle="Student borrow requests awaiting librarian approval"
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => navigate('/requests')}
            >
              Review Queue
            </Button>
          }
        >
          <Table
            columns={requestColumns}
            data={pendingRequests}
            keyExtractor={(r) => r.requestId}
          />
        </Card>
      </div>

      {/* Quick Launch & Graph Shortcut */}
      <Card
        title="Quick Circulation Desk"
        subtitle="Common workflows mapped directly to DA2 Oracle & Neo4j transactions"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => navigate('/books')}
            className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-indigo-500/50 hover:bg-slate-900/40 transition-all cursor-pointer group"
          >
            <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-800/60 w-fit text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200">Search Catalogue</h4>
            <p className="text-xs text-slate-400 mt-1">
              Filter by genre, ISBN, authors, and real-time available copies.
            </p>
          </div>

          <div
            onClick={() => navigate('/circulation')}
            className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-emerald-500/50 hover:bg-slate-900/40 transition-all cursor-pointer group"
          >
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 w-fit text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
              <Repeat className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200">Process Loans</h4>
            <p className="text-xs text-slate-400 mt-1">
              Issue books with atomic copy decrement and process returns with fines.
            </p>
          </div>

          <div
            onClick={() => navigate('/discovery')}
            className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-violet-500/50 hover:bg-slate-900/40 transition-all cursor-pointer group"
          >
            <div className="p-2.5 rounded-lg bg-violet-950/60 border border-violet-800/60 w-fit text-violet-400 mb-3 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200">Graph Discovery</h4>
            <p className="text-xs text-slate-400 mt-1">
              Explore interconnected relationships, author graphs, and co-borrowings.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
