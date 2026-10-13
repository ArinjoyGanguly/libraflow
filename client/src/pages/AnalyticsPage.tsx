import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  RefreshCw,
  Layers,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { EmptyState } from '../components/common/EmptyState';
import { api } from '../services/api';
import type {
  Book,
  Loan,
  DashboardStats,
  AnalyticsResult,
} from '../types';

export const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResult | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [books, setBooks] = useState<Book[]>([]);

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, statsRes, loansRes, booksRes] = await Promise.all([
        api.analytics.dashboard(),
        api.admin.stats(),
        api.loans.list({ limit: 100 }),
        api.books.list({ limit: 100 }),
      ]);

      if (analyticsRes.success && analyticsRes.data) {
        setAnalyticsData(analyticsRes.data);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (loansRes.success && loansRes.data) {
        setLoans(Array.isArray(loansRes.data) ? loansRes.data : loansRes.data.items || []);
      }
      if (booksRes.success && booksRes.data) {
        setBooks(Array.isArray(booksRes.data) ? booksRes.data : booksRes.data.items || []);
      }

      if (!analyticsRes.success && !statsRes.success) {
        setError(analyticsRes.error || statsRes.error || 'Failed to load library analytics.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error loading analytics records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Dynamic Calculation 1: Circulation Status Breakdown from real loans
  const activeCount =
    loans.filter((l) => l.status === 'ACTIVE').length ||
    stats?.activeLoansCount ||
    stats?.activeLoans ||
    0;
  const overdueCount =
    analyticsData?.overdueSnapshot?.totalOverdue ??
    (loans.filter((l) => l.status === 'OVERDUE').length ||
      stats?.overdueLoansCount ||
      stats?.overdueLoans ||
      0);
  const returnedCount = loans.filter((l) => l.status === 'RETURNED').length || 0;

  const loanDistributionData = [
    { name: 'Active', count: activeCount, fill: '#10b981' },
    { name: 'Overdue', count: overdueCount, fill: '#f43f5e' },
    { name: 'Returned', count: returnedCount, fill: '#64748b' },
  ].filter((d) => d.count > 0 || loans.length === 0);

  // Genre Borrow Distribution from Cypher analytics or fallback
  const GENRE_COLORS = ['#6366f1', '#8b5cf6', '#0ea5e9', '#ec4899', '#14b8a6', '#f59e0b', '#10b981'];

  const genreDistributionData =
    analyticsData?.genreStats && analyticsData.genreStats.length > 0
      ? analyticsData.genreStats.map((g, idx) => ({
          name: g.genre,
          value: g.borrowCount,
          uniqueTitles: g.uniqueTitles,
          color: GENRE_COLORS[idx % GENRE_COLORS.length],
        }))
      : (() => {
          const counts: Record<string, number> = {};
          books.forEach((b) => {
            const genre = b.genre || 'General';
            counts[genre] = (counts[genre] || 0) + (b.totalCopies || 1);
          });
          return Object.entries(counts).map(([name, value], idx) => ({
            name,
            value,
            uniqueTitles: 1,
            color: GENRE_COLORS[idx % GENRE_COLORS.length],
          }));
        })();

  // Popular Books Chart Data
  const popularBooksChartData = (analyticsData?.popularBooks || []).slice(0, 6).map((b) => ({
    title: b.title.length > 15 ? `${b.title.substring(0, 15)}...` : b.title,
    fullTitle: b.title,
    borrows: b.totalBorrows,
    available: b.currentlyAvailable,
    genre: b.genre,
  }));

  const hasAnyData =
    (analyticsData &&
      (analyticsData.popularBooks.length > 0 ||
        analyticsData.genreStats.length > 0 ||
        analyticsData.libraryStock.length > 0)) ||
    loans.length > 0 ||
    books.length > 0 ||
    (stats && ((stats.booksCount ?? 0) > 0 || (stats.totalBooks ?? 0) > 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Library Analytics & Circulation Reports
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time analytics aggregated directly from active backend endpoints and Neo4j Cypher queries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="purple">Live Server Data</Badge>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchAnalyticsData}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <Alert type="error" title="Analytics Service Notice" onClose={() => setError(null)}>
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={fetchAnalyticsData} className="ml-4">
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 border border-slate-800 rounded-2xl bg-slate-900/40">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-400" />
          <p className="text-sm font-medium">Aggregating live library metrics from backend...</p>
        </div>
      ) : !hasAnyData ? (
        <EmptyState
          title="No Analytics Data Available"
          description="The database currently contains no circulation or catalog records to chart."
        />
      ) : (
        <>
          {/* Summary Stat Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Total Catalog Titles</span>
              <p className="text-2xl font-bold font-mono text-white mt-1">
                {stats?.totalBooks ?? stats?.booksCount ?? books.length}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Active Members</span>
              <p className="text-2xl font-bold font-mono text-indigo-400 mt-1">
                {stats?.totalMembers ?? stats?.membersCount ?? 0}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Active Circulation</span>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{activeCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Overdue Compliance</span>
                {overdueCount > 0 && (
                  <Badge variant="danger" size="sm">
                    {overdueCount} Overdue
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-bold font-mono text-rose-400 mt-1">{overdueCount}</p>
              {analyticsData?.overdueSnapshot?.avgDaysOverdue ? (
                <span className="text-[10px] text-slate-400">
                  Avg {analyticsData.overdueSnapshot.avgDaysOverdue} days overdue
                </span>
              ) : null}
            </div>
          </div>

          {/* Popular Books Leaderboard (BarChart + Leaderboard) */}
          {analyticsData?.popularBooks && analyticsData.popularBooks.length > 0 && (
            <Card
              title="Most Borrowed Books (Leaderboard)"
              subtitle="Ranked by total borrow transactions recorded in Cypher graph"
              headerAction={
                <Badge variant="purple" size="sm">
                  Top {analyticsData.popularBooks.length} Titles
                </Badge>
              }
            >
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={popularBooksChartData} margin={{ top: 15, right: 15, left: -15, bottom: 25 }}>
                      <XAxis
                        dataKey="title"
                        stroke="#64748b"
                        fontSize={10}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(val) => [`${val} Borrows`, 'Total Loans']}
                        labelFormatter={(_, payload) =>
                          payload[0]?.payload?.fullTitle || ''
                        }
                      />
                      <Bar dataKey="borrows" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="lg:col-span-2 space-y-2.5 overflow-y-auto max-h-64 pr-1">
                  {analyticsData.popularBooks.map((book, idx) => (
                    <div
                      key={book.bookId}
                      className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            idx === 0
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : idx === 1
                              ? 'bg-slate-400/20 text-slate-300 border border-slate-400/40'
                              : idx === 2
                              ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <p className="font-semibold text-white truncate">{book.title}</p>
                          <span className="text-[10px] text-slate-400">{book.author}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pl-2">
                        <span className="font-mono font-bold text-indigo-400">
                          {book.totalBorrows} borrows
                        </span>
                        <p className="text-[10px] text-emerald-400">
                          {book.currentlyAvailable} avail
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Circulation Status Breakdown */}
            <Card
              title="Circulation Lifecycle Distribution"
              subtitle="Breakdown of live loans across Active, Overdue, and Returned statuses"
            >
              {loans.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                  No loan transactions recorded yet.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={loanDistributionData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        itemStyle={{ color: '#f8fafc' }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {loanDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="flex items-center justify-center gap-6 mt-2 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Active ({activeCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  <span>Overdue ({overdueCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />
                  <span>Returned ({returnedCount})</span>
                </div>
              </div>
            </Card>

            {/* Catalog Volume Distribution by Genre */}
            <Card
              title="Circulation Activity by Genre"
              subtitle="Borrow distribution and unique titles classified by literary genre"
            >
              {genreDistributionData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                  No book inventory classified yet.
                </div>
              ) : (
                <>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genreDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {genreDistributionData.map((entry, index) => (
                            <Cell key={`pie-cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          formatter={(val) => [`${val} Borrows`, 'Activity']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-xs text-slate-400">
                    {genreDistributionData.map((g) => (
                      <div key={g.name} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: g.color }} />
                        <span>
                          {g.name} ({g.value} borrows)
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>

            {/* Top Active Borrowers */}
            {analyticsData?.topBorrowers && analyticsData.topBorrowers.length > 0 && (
              <Card
                title="Top Active Readers (Patron Activity)"
                subtitle="Members with highest borrowing volume and compliance status"
                headerAction={
                  <Badge variant="purple" size="sm">
                    {analyticsData.topBorrowers.length} Patrons
                  </Badge>
                }
              >
                <div className="space-y-2.5">
                  {analyticsData.topBorrowers.map((borrower, i) => (
                    <div
                      key={borrower.memberId}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-indigo-900/40 text-indigo-400 flex items-center justify-center font-bold">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{borrower.name}</p>
                          <span className="text-[10px] font-mono text-slate-500">
                            ID: {borrower.memberId}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="purple" size="sm">
                          {borrower.totalBorrows} Books Read
                        </Badge>
                        {borrower.totalFinesPaid > 0 && (
                          <p className="text-[10px] text-amber-400 mt-0.5">
                            Fines: ${borrower.totalFinesPaid}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Overdue Snapshot Summary */}
            {analyticsData?.overdueSnapshot && (
              <Card
                title="Circulation Health & Risk Assessment"
                subtitle="Live overdue status, active fines, and return compliance"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center gap-2 text-rose-400 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider">
                        Delinquency Metric
                      </h4>
                    </div>
                    <p className="text-2xl font-bold font-mono text-white">
                      {analyticsData.overdueSnapshot.totalOverdue}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Loans overdue beyond return threshold
                    </p>
                    <div className="mt-3 text-[11px] text-rose-300 font-mono">
                      Average Delinquency: {analyticsData.overdueSnapshot.avgDaysOverdue} days
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider">
                        Outstanding Fines
                      </h4>
                    </div>
                    <p className="text-2xl font-bold font-mono text-white">
                      ${analyticsData.overdueSnapshot.totalActiveFines}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Total uncollected penalty fees
                    </p>
                    <div className="mt-3 text-[11px] text-slate-400">
                      Auto-computed by daily overdue interest
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Campus Branch Holdings Report */}
            {analyticsData?.libraryStock && analyticsData.libraryStock.length > 0 && (
              <div className="lg:col-span-2">
                <Card
                  title="Campus Library Stock & Staff Allocation (Q18 Report)"
                  subtitle="Holdings, copies, and assigned librarians across physical campuses"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {analyticsData.libraryStock.map((lib) => (
                      <div
                        key={lib.libraryId}
                        className="p-4 rounded-xl bg-slate-950/60 border border-slate-800"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-indigo-400" />
                            <h4 className="text-sm font-semibold text-white">{lib.libraryName}</h4>
                          </div>
                          <Badge variant="outline" size="sm">
                            {lib.city}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800/60">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Titles</span>
                            <strong className="text-white font-mono">{lib.bookCount}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Stock</span>
                            <strong className="text-emerald-400 font-mono">
                              {lib.totalAvailable}/{lib.totalStock}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Staff</span>
                            <strong className="text-indigo-400 font-mono">{lib.staffCount}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
