import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Repeat,
  AlertCircle,
  FileCheck2,
  ArrowRight,
  Sparkles,
  RefreshCw,
  ServerOff,
  Database,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { StatCard } from '../components/common/StatCard';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Table } from '../components/common/Table';
import { Alert } from '../components/common/Alert';
import { EmptyState } from '../components/common/EmptyState';
import { api } from '../services/api';
import type { Loan, RequestItem, DashboardStats } from '../types';

type ConnectionState =
  | 'INITIALIZING'
  | 'CONNECTED'
  | 'BACKEND_OFFLINE'
  | 'DB_OFFLINE'
  | 'REQUEST_ERROR'
  | 'EMPTY_DATABASE';

interface ConnectionInfo {
  state: ConnectionState;
  title: string;
  message: string;
  troubleshoot?: string;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    state: 'INITIALIZING',
    title: '',
    message: '',
  });

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [pendingRequests, setPendingRequests] = useState<RequestItem[]>([]);

  const fetchDashboardData = async () => {
    setIsLoading(true);

    // 1. Probe infrastructure health first to distinguish failure modes
    const health = await api.health.probe();

    if (!health.server) {
      setStats(null);
      setActiveLoans([]);
      setPendingRequests([]);
      setConnectionInfo({
        state: 'BACKEND_OFFLINE',
        title: 'Backend Server Offline',
        message: 'The LibraFlow Express API server is not running on port 5000.',
        troubleshoot: 'Start the backend server in a terminal: cd server && npm run dev',
      });
      setIsLoading(false);
      return;
    }

    if (!health.database) {
      setStats(null);
      setActiveLoans([]);
      setPendingRequests([]);
      setConnectionInfo({
        state: 'DB_OFFLINE',
        title: 'Neo4j Database Unavailable',
        message: health.error || 'The backend server is running on port 5000, but Neo4j is unreachable at bolt://localhost:7687.',
        troubleshoot: 'Start Neo4j (via "neo4j start" or start the instance in Neo4j Desktop). Ensure credentials in server/.env match your database.',
      });
      setIsLoading(false);
      return;
    }

    // 2. Both backend and database are reachable, fetch domain data
    try {
      const [statsRes, loansRes, requestsRes] = await Promise.all([
        api.admin.stats(),
        api.loans.list({ status: 'ACTIVE', limit: 5 }),
        api.requests.list({ status: 'PENDING', limit: 5 }),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
        setActiveLoans(loansRes.data?.items || []);
        setPendingRequests(requestsRes.data?.items || []);

        const totalBooks = statsRes.data.totalBooks ?? statsRes.data.booksCount ?? 0;
        const totalMembers = statsRes.data.totalMembers ?? statsRes.data.membersCount ?? 0;

        if (totalBooks === 0 && totalMembers === 0) {
          setConnectionInfo({
            state: 'EMPTY_DATABASE',
            title: 'Neo4j Connected — Database Empty',
            message: 'Database connection is active, but no catalog volumes or member accounts exist.',
            troubleshoot: 'Execute database/seed.cypher in Neo4j Browser or run the seed script to import initial records.',
          });
        } else {
          setConnectionInfo({
            state: 'CONNECTED',
            title: 'Systems Operational',
            message: 'Backend and Neo4j graph database connected.',
          });
        }
      } else {
        const errorMsg =
          statsRes.error ||
          loansRes.error ||
          requestsRes.error ||
          'Failed to query dashboard datasets from database';
        setStats(null);
        setConnectionInfo({
          state: 'REQUEST_ERROR',
          title: 'Database Query Failed',
          message: errorMsg,
          troubleshoot: 'Check database schema, constraints, and server logs for Cypher execution details.',
        });
      }
    } catch (err) {
      setStats(null);
      setConnectionInfo({
        state: 'REQUEST_ERROR',
        title: 'Network Communication Error',
        message: err instanceof Error ? err.message : 'Unknown network failure occurred',
        troubleshoot: 'Verify CORS policies and API route endpoints.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const loanColumns = [
    {
      key: 'loanId',
      header: 'Loan ID',
      render: (loan: Loan) => (
        <span className="font-mono text-xs font-semibold text-indigo-400">{loan.loanId}</span>
      ),
    },
    {
      key: 'book',
      header: 'Book Title',
      render: (loan: Loan) => (
        <div>
          <div className="font-medium text-slate-100">{loan.book?.title || 'Unknown Title'}</div>
          <div className="text-[11px] font-mono text-slate-400">{loan.book?.isbn}</div>
        </div>
      ),
    },
    {
      key: 'member',
      header: 'Member',
      render: (loan: Loan) => (
        <div>
          <div className="text-slate-200">{loan.member?.name || 'Unknown Member'}</div>
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
      render: (req: RequestItem) => (
        <span className="font-mono text-xs text-indigo-400">{req.requestId}</span>
      ),
    },
    {
      key: 'book',
      header: 'Requested Book',
      render: (req: RequestItem) => (
        <span className="font-medium text-slate-200">{req.book?.title || 'Untitled'}</span>
      ),
    },
    {
      key: 'member',
      header: 'Member',
      render: (req: RequestItem) => <span>{req.member?.name || req.member?.memberId}</span>,
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
            {connectionInfo.state === 'CONNECTED' && (
              <Badge variant="success" size="sm">
                Live Neo4j Graph
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400">
            LibraFlow Graph Library System — Academic Demo Campus Central
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={fetchDashboardData}
            disabled={isLoading}
          >
            Refresh Live Data
          </Button>
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

      {/* Differentiated System Status Banners */}
      {connectionInfo.state === 'BACKEND_OFFLINE' && (
        <Alert
          type="error"
          title={connectionInfo.title}
          onClose={() => setConnectionInfo((prev) => ({ ...prev, state: 'INITIALIZING' }))}
        >
          <div className="space-y-2">
            <p className="text-sm">{connectionInfo.message}</p>
            {connectionInfo.troubleshoot && (
              <p className="text-xs font-mono text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                Troubleshooting: {connectionInfo.troubleshoot}
              </p>
            )}
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" variant="secondary" onClick={fetchDashboardData}>
                Retry Connection
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/settings')}>
                System Settings
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {connectionInfo.state === 'DB_OFFLINE' && (
        <Alert
          type="warning"
          title={connectionInfo.title}
          onClose={() => setConnectionInfo((prev) => ({ ...prev, state: 'INITIALIZING' }))}
        >
          <div className="space-y-2">
            <p className="text-sm">{connectionInfo.message}</p>
            {connectionInfo.troubleshoot && (
              <p className="text-xs font-mono text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                Troubleshooting: {connectionInfo.troubleshoot}
              </p>
            )}
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" variant="secondary" onClick={fetchDashboardData}>
                Retry Connection
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/settings')}>
                Diagnostic Controls
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {connectionInfo.state === 'REQUEST_ERROR' && (
        <Alert
          type="error"
          title={connectionInfo.title}
          onClose={() => setConnectionInfo((prev) => ({ ...prev, state: 'INITIALIZING' }))}
        >
          <div className="space-y-2">
            <p className="text-sm">{connectionInfo.message}</p>
            {connectionInfo.troubleshoot && (
              <p className="text-xs text-slate-300">{connectionInfo.troubleshoot}</p>
            )}
            <div className="pt-1">
              <Button size="sm" variant="secondary" onClick={fetchDashboardData}>
                Retry Query
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {connectionInfo.state === 'EMPTY_DATABASE' && (
        <Alert
          type="info"
          title={connectionInfo.title}
        >
          <div className="space-y-2">
            <p className="text-sm">{connectionInfo.message}</p>
            {connectionInfo.troubleshoot && (
              <p className="text-xs font-mono text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                Setup Step: {connectionInfo.troubleshoot}
              </p>
            )}
          </div>
        </Alert>
      )}

      {/* Stat Cards Grid */}
      {isLoading && !stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Catalog Volumes"
            value={stats.totalBooks ?? stats.booksCount ?? 0}
            subtitle={`${stats.availableCopies ?? 0} available on shelf`}
            icon={<BookOpen className="w-5 h-5" />}
            colorScheme="indigo"
            onClick={() => navigate('/books')}
          />
          <StatCard
            label="Active Borrowings"
            value={stats.activeLoans ?? stats.activeLoansCount ?? 0}
            subtitle={`${stats.activeLoans ?? stats.activeLoansCount ?? 0} active physical loans`}
            icon={<Repeat className="w-5 h-5" />}
            colorScheme="emerald"
            onClick={() => navigate('/loans')}
          />
          <StatCard
            label="Overdue Volumes"
            value={stats.overdueLoans ?? stats.overdueLoansCount ?? 0}
            subtitle={`${stats.overdueLoans ?? stats.overdueLoansCount ?? 0} loans past due date`}
            icon={<AlertCircle className="w-5 h-5" />}
            colorScheme="rose"
            onClick={() => navigate('/loans?status=OVERDUE')}
          />
          <StatCard
            label="Pending Requests"
            value={stats.pendingRequests ?? stats.requestsCount ?? 0}
            subtitle={`${stats.pendingRequests ?? stats.requestsCount ?? 0} awaiting staff review`}
            icon={<FileCheck2 className="w-5 h-5" />}
            colorScheme="amber"
            onClick={() => navigate('/requests?status=PENDING')}
          />
        </div>
      ) : (
        <EmptyState
          icon={
            connectionInfo.state === 'BACKEND_OFFLINE' ? (
              <ServerOff className="w-8 h-8 text-rose-400" />
            ) : connectionInfo.state === 'DB_OFFLINE' ? (
              <Database className="w-8 h-8 text-amber-400" />
            ) : (
              <ServerOff className="w-8 h-8 text-slate-500" />
            )
          }
          title={connectionInfo.title || 'Metrics Unavailable'}
          description={
            connectionInfo.message ||
            'Could not load statistics from database. Verify backend and Neo4j connectivity.'
          }
          action={
            <Button size="sm" onClick={fetchDashboardData} disabled={isLoading}>
              Retry Loading Stats
            </Button>
          }
        />
      )}

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
            isLoading={isLoading && activeLoans.length === 0}
            emptyMessage="No active borrowing records found in database."
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
            isLoading={isLoading && pendingRequests.length === 0}
            emptyMessage="No pending requests in the review queue."
          />
        </Card>
      </div>

      {/* Quick Launch & Graph Shortcut */}
      <Card
        title="Circulation & Catalog Desks"
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
